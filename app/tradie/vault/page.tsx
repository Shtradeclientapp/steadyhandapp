'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/lib/hooks'
import { NavHeader } from '@/components/ui/NavHeader'

const DOC_TYPES = [
  { value: 'licence', label: 'Licence / registration', icon: '🪪', color: '#2E6A8F' },
  { value: 'insurance', label: 'Insurance certificate', icon: '🛡', color: '#2E7D60' },
  { value: 'compliance', label: 'Certificate of compliance', icon: '✅', color: '#6B4FA8' },
  { value: 'scope_agreement', label: 'Scope agreement', icon: '📋', color: '#9B6B9B' },
  { value: 'quote', label: 'Quote', icon: '💰', color: '#C07830' },
  { value: 'photo', label: 'Site photo', icon: '📷', color: '#4A5E64' },
  { value: 'warranty', label: 'Warranty certificate', icon: '🛡', color: '#D4522A' },
  { value: 'uploaded', label: 'Other document', icon: '📎', color: '#7A9098' },
]

export default function TradieVaultPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [signedUrl, setSignedUrl] = useState<string|null>(null)
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'mine'|'shared'|'upload'>('mine')
  const [form, setForm] = useState({ title: '', document_type: 'licence', notes: '', expiry_date: '', issued_date: '', job_id: '' })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string|null>(null)
  const [annotationText, setAnnotationText] = useState('')
  const [savingAnnotation, setSavingAnnotation] = useState(false)
  const [annotationSaved, setAnnotationSaved] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareJobId, setShareJobId] = useState('')
  const [shareSuccess, setShareSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = useSupabase()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }
      setUser(session.user)
      setProfile(prof)

      // Load tradie's own vault documents
      const { data: myDocs, error: vaultErr } = await supabase
        .from('vault_documents')
        .select('*, job:jobs(title, trade_category, suburb)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (vaultErr) console.error('Vault load error:', vaultErr.message)
      setDocs(myDocs || [])

      // Load documents shared with this tradie
      const { data: shares } = await supabase
        .from('vault_document_shares')
        .select('*, document:vault_documents(*, job:jobs(title, trade_category, suburb))')
        .eq('tradie_id', session.user.id)
      setSharedWithMe((shares || []).map((s: any) => ({ ...s.document, _shared: true, _share_id: s.id, _permission: s.permission })))

      // Load jobs for sharing selector
      const { data: qrs } = await supabase.from('quote_requests').select('job_id').eq('tradie_id', session.user.id)
      const jobIds = (qrs || []).map((q: any) => q.job_id)
      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase.from('jobs').select('id, title, client_id, client:profiles!jobs_client_id_fkey(full_name)').in('id', jobIds)
        setJobs(jobsData || [])
      }
      setLoading(false)
    })
  }, [])

  const selectDoc = async (doc: any) => {
    setSelectedDoc(doc)
    setAnnotationText(doc.notes || '')
    setAnnotationSaved(false)
    setShareSuccess(false)
    setSignedUrl(null)
    if (doc.file_url) {
      setLoadingSignedUrl(true)
      try {
        const res = await fetch('/api/vault/signed-url', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ file_url: doc.file_url }) })
        const data = await res.json()
        setSignedUrl(data.signed_url || doc.file_url)
      } catch { setSignedUrl(doc.file_url) }
      setLoadingSignedUrl(false)
    }
  }

  const uploadDoc = async () => {
    if (!fileRef.current?.files?.[0] || !form.title.trim()) { setUploadError('Please add a title and select a file.'); return }
    setUploading(true)
    setUploadError(null)
    const file = fileRef.current.files[0]
    const ext = file.name.split('.').pop()
    const path = `tradie/${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('Documents').upload(path, file)
    if (upErr) { setUploadError('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: signedData } = await supabase.storage.from('Documents').createSignedUrl(path, 60 * 60 * 24 * 365)
    const publicUrl = signedData?.signedUrl || ''
    await supabase.from('vault_documents').insert({
      user_id: user.id,
      job_id: form.job_id || null,
      title: form.title,
      document_type: form.document_type,
      file_url: publicUrl,
      notes: form.notes,
      expiry_date: form.expiry_date || null,
      issued_date: form.issued_date || null,
    })
    const { data: myDocs } = await supabase.from('vault_documents').select('*, job:jobs(title, trade_category, suburb)').eq('user_id', user.id).order('created_at', { ascending: false })
    setDocs(myDocs || [])
    setForm({ title: '', document_type: 'licence', notes: '', expiry_date: '', issued_date: '', job_id: '' })
    if (fileRef.current) fileRef.current.value = ''
    setActiveTab('mine')
    setUploading(false)
  }

  const saveAnnotation = async () => {
    if (!selectedDoc) return
    setSavingAnnotation(true)
    await supabase.from('vault_documents').update({ notes: annotationText }).eq('id', selectedDoc.id)
    setAnnotationSaved(true)
    setSavingAnnotation(false)
    setTimeout(() => setAnnotationSaved(false), 2000)
  }

  const shareWithClient = async () => {
    if (!selectedDoc || !shareJobId) return
    setSharing(true)
    const job = jobs.find((j: any) => j.id === shareJobId)
    if (!job) { setSharing(false); return }
    await supabase.from('vault_document_shares').upsert({
      vault_document_id: selectedDoc.id,
      tradie_id: user.id,
      job_id: shareJobId,
      shared_with: job.client_id,
      shared_by: user.id,
      document_title: selectedDoc.title,
      permission: 'view',
    }, { onConflict: 'vault_document_id,tradie_id,job_id' })
    // Notify client
    await supabase.from('notifications').insert({
      user_id: job.client_id,
      message: (profile?.tradie?.business_name || 'Your tradie') + ' shared a document with you: ' + selectedDoc.title,
      job_id: shareJobId,
    })
    setShareSuccess(true)
    setSharing(false)
  }

  const filteredDocs = filter === 'all' ? docs : docs.filter((d: any) => d.document_type === filter)
  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', marginBottom:'12px', boxSizing:'border-box' as const }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading vault...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={true} backLabel="← Dashboard" backHref="/tradie/dashboard" />

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'28px 24px' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Trade Document Vault</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'26px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 4px' }}>YOUR DOCUMENTS</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Licences, compliance certificates, scope agreements and job records — all in one place.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto', display:'flex' }}>
          {[
            { key:'mine', label:'My documents (' + docs.length + ')' },
            { key:'shared', label:'Shared with me (' + sharedWithMe.length + ')' },
            { key:'upload', label:'+ Upload' },
          ].map((t: any) => (
            <button key={t.key} type="button" onClick={() => { setActiveTab(t.key); setSelectedDoc(null) }}
              style={{ padding:'12px 20px', border:'none', borderBottom: activeTab === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? '#0A0A0A' : '#7A9098' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'24px', display: selectedDoc ? 'grid' : 'block', gridTemplateColumns: selectedDoc ? '1fr 360px' : undefined, gap:'20px', alignItems:'start' }}>

        {/* ── My documents tab ── */}
        {activeTab === 'mine' && (
          <div>
            {/* Filter pills */}
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const, marginBottom:'16px' }}>
              {[{ value:'all', label:'All' }, ...DOC_TYPES].map((t: any) => (
                <button key={t.value} type="button" onClick={() => setFilter(t.value)}
                  style={{ fontSize:'11px', padding:'4px 12px', borderRadius:'100px', border:'1px solid ' + (filter === t.value ? '#0A0A0A' : 'rgba(28,43,50,0.2)'), background: filter === t.value ? '#0A0A0A' : 'transparent', color: filter === t.value ? 'white' : '#4A5E64', cursor:'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {filteredDocs.length === 0 ? (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'40px', textAlign:'center' as const }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>📁</p>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No documents yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'20px' }}>Upload your licence, insurance, compliance certificates and job documents.</p>
                <button type="button" onClick={() => setActiveTab('upload')}
                  style={{ background:'#0A0A0A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  Upload first document →
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {filteredDocs.map((doc: any) => {
                  const docType = DOC_TYPES.find(t => t.value === doc.document_type) || DOC_TYPES[DOC_TYPES.length - 1]
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                  const expiringSoon = doc.expiry_date && !isExpired && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  return (
                    <div key={doc.id} onClick={() => selectDoc(doc)}
                      style={{ background: selectedDoc?.id === doc.id ? 'white' : '#E8F0EE', border: selectedDoc?.id === doc.id ? '1.5px solid #D4522A' : isExpired ? '1px solid rgba(212,82,42,0.3)' : '1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>
                        <span style={{ fontSize:'20px', flexShrink:0 }}>{docType.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{doc.title}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                            {docType.label}
                            {doc.job?.title && ' · ' + doc.job.title}
                            {doc.expiry_date && ' · ' + (isExpired ? '⚠ Expired' : expiringSoon ? '⚠ Expiring soon' : 'Expires ' + new Date(doc.expiry_date).toLocaleDateString('en-AU'))}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize:'11px', color: isExpired ? '#D4522A' : docType.color, background: docType.color + '15', border:'1px solid ' + docType.color + '30', borderRadius:'100px', padding:'2px 8px', flexShrink:0 }}>
                        {isExpired ? 'Expired' : expiringSoon ? 'Expiring' : 'Active'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Shared with me tab ── */}
        {activeTab === 'shared' && (
          <div>
            {sharedWithMe.length === 0 ? (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'40px', textAlign:'center' as const }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>🤝</p>
                <p style={{ fontSize:'15px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No shared documents yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>When a client shares a document with you from their vault, it will appear here.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {sharedWithMe.map((doc: any) => {
                  const docType = DOC_TYPES.find(t => t.value === doc.document_type) || DOC_TYPES[DOC_TYPES.length - 1]
                  return (
                    <div key={doc.id} onClick={() => selectDoc(doc)}
                      style={{ background: selectedDoc?.id === doc.id ? 'white' : '#E8F0EE', border: selectedDoc?.id === doc.id ? '1.5px solid #D4522A' : '1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <span style={{ fontSize:'20px' }}>{docType.icon}</span>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{doc.title}</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Shared by client{doc.job?.title ? ' · ' + doc.job.title : ''}</p>
                        </div>
                      </div>
                      <span style={{ fontSize:'11px', color:'#2E6A8F', background:'rgba(46,106,143,0.1)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'2px 8px' }}>View only</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Upload tab ── */}
        {activeTab === 'upload' && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.03)' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>UPLOAD DOCUMENT</p>
            </div>
            <div style={{ padding:'20px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Document title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Public liability insurance 2026" style={inp} />

              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Document type</label>
              <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))} style={inp}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Linked job (optional)</label>
              <select value={form.job_id} onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))} style={inp}>
                <option value="">Not linked to a specific job</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Issue date</label>
                  <input type="date" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Expiry date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} style={inp} />
                </div>
              </div>

              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any relevant notes about this document..." rows={2}
                style={{ ...inp, resize:'none' as const }} />

              <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'5px' }}>File</label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ width:'100%', fontSize:'13px', color:'#4A5E64', marginBottom:'16px' }} />

              {uploadError && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px' }}>{uploadError}</p>}

              <button type="button" onClick={uploadDoc} disabled={uploading || !form.title.trim()}
                style={{ width:'100%', background: uploading || !form.title.trim() ? 'rgba(28,43,50,0.3)' : '#0A0A0A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                {uploading ? 'Uploading...' : 'Upload document →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Document viewer panel ── */}
        {selectedDoc && (
          <div style={{ position:'sticky' as const, top:'80px', background:'white', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ background:'#0A0A0A', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'13px', fontWeight:500, color:'rgba(216,228,225,0.9)', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{selectedDoc.title}</p>
                <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.4)', margin:0 }}>{selectedDoc.document_type}</p>
              </div>
              <button type="button" onClick={() => setSelectedDoc(null)} style={{ background:'none', border:'none', color:'rgba(216,228,225,0.4)', cursor:'pointer', fontSize:'18px', flexShrink:0 }}>×</button>
            </div>

            {/* File preview */}
            <div style={{ background:'#F4F8F7', minHeight:'200px', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
              {loadingSignedUrl ? (
                <p style={{ color:'#7A9098', fontSize:'13px' }}>Loading...</p>
              ) : !selectedDoc.file_url ? (
                <p style={{ color:'#7A9098', fontSize:'13px' }}>No file attached</p>
              ) : signedUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                <img src={signedUrl} alt={selectedDoc.title} style={{ maxWidth:'100%', borderRadius:'8px' }} />
              ) : signedUrl?.match(/\.pdf/i) ? (
                <iframe src={signedUrl} style={{ width:'100%', height:'300px', border:'none', borderRadius:'8px' }} title={selectedDoc.title} />
              ) : (
                <div style={{ textAlign:'center' as const }}>
                  <p style={{ fontSize:'32px', marginBottom:'8px' }}>📎</p>
                  <a href={signedUrl || selectedDoc.file_url} target="_blank" rel="noreferrer"
                    style={{ background:'#0A0A0A', color:'white', padding:'8px 16px', borderRadius:'8px', textDecoration:'none', fontSize:'13px' }}>
                    Download →
                  </a>
                </div>
              )}
            </div>

            <div style={{ padding:'16px', display:'flex', flexDirection:'column' as const, gap:'12px' }}>
              {/* Details */}
              {(selectedDoc.issued_date || selectedDoc.expiry_date) && (
                <div style={{ fontSize:'12px', color:'#4A5E64' }}>
                  {selectedDoc.issued_date && <p style={{ margin:'0 0 4px' }}>Issued: {new Date(selectedDoc.issued_date).toLocaleDateString('en-AU')}</p>}
                  {selectedDoc.expiry_date && <p style={{ margin:0, color: new Date(selectedDoc.expiry_date) < new Date() ? '#D4522A' : '#4A5E64' }}>Expires: {new Date(selectedDoc.expiry_date).toLocaleDateString('en-AU')}</p>}
                </div>
              )}

              {/* Annotations */}
              {!selectedDoc._shared && (
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', marginBottom:'6px', textTransform:'uppercase' as const }}>Notes</p>
                  <textarea value={annotationText} onChange={e => setAnnotationText(e.target.value)}
                    placeholder="Add notes about this document..."
                    style={{ width:'100%', minHeight:'80px', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'12px', color:'#0A0A0A', background:'#F4F8F7', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
                  <button type="button" onClick={saveAnnotation} disabled={savingAnnotation}
                    style={{ width:'100%', marginTop:'6px', background: annotationSaved ? '#2E7D60' : '#0A0A0A', color:'white', padding:'8px', borderRadius:'8px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    {annotationSaved ? '✓ Saved' : savingAnnotation ? 'Saving...' : 'Save notes'}
                  </button>
                </div>
              )}

              {/* Share with client */}
              {!selectedDoc._shared && jobs.length > 0 && (
                <div style={{ borderTop:'1px solid rgba(28,43,50,0.08)', paddingTop:'12px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', marginBottom:'8px', textTransform:'uppercase' as const }}>Share with client</p>
                  <select value={shareJobId} onChange={e => setShareJobId(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'12px', background:'#F4F8F7', color:'#0A0A0A', marginBottom:'8px', boxSizing:'border-box' as const }}>
                    <option value="">Select a job to share with...</option>
                    {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} — {j.client?.full_name}</option>)}
                  </select>
                  {shareSuccess ? (
                    <p style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Shared with client</p>
                  ) : (
                    <button type="button" onClick={shareWithClient} disabled={sharing || !shareJobId}
                      style={{ width:'100%', background: sharing || !shareJobId ? 'rgba(28,43,50,0.2)' : '#2E6A8F', color:'white', padding:'8px', borderRadius:'8px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      {sharing ? 'Sharing...' : 'Share document →'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
