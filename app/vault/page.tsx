'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

const DOC_TYPES = [
  { value: 'scope', label: 'Scope agreement', icon: '📄', color: '#2E6A8F' },
  { value: 'milestone', label: 'Milestone record', icon: '✅', color: '#2E7D60' },
  { value: 'compliance', label: 'Compliance certificate', icon: '🔒', color: '#6B4FA8' },
  { value: 'warranty', label: 'Warranty certificate', icon: '🛡', color: '#D4522A' },
  { value: 'receipt', label: 'Receipt / invoice', icon: '💳', color: '#C07830' },
  { value: 'permit', label: 'Permit / approval', icon: '📋', color: '#2E7D60' },
  { value: 'insurance', label: 'Insurance document', icon: '🏠', color: '#2E6A8F' },
  { value: 'uploaded', label: 'Other document', icon: '📎', color: '#7A9098' },
]

export default function VaultPage() {
  const [profile, setProfile] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string|null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents'|'templates'>('documents')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', document_type: 'uploaded', notes: '', expiry_date: '', issued_date: '', tradie_name: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const { data: vaultDocs } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setDocs(vaultDocs || [])
      setLoading(false)
    })
  }, [])

  const uploadDoc = async () => {
    if (!form.title || !profile) return
    setUploading(true)
    const supabase = createClient()
    let file_url = null
    let file_name = null
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const path = 'vault/' + profile.id + '/' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('Documents').upload(path, selectedFile)
      if (error) {
        setUploadError('File upload failed — the Documents bucket may be missing or have no upload policy. Check Supabase Storage settings.')
        setUploading(false)
        return
      }
      // Use signed URL for private bucket (1 year expiry)
      const { data: signedData } = await supabase.storage.from('Documents').createSignedUrl(path, 60 * 60 * 24 * 365)
      file_url = signedData?.signedUrl || null
      file_name = selectedFile.name
    }
    const { data: doc } = await supabase.from('vault_documents').insert({
      user_id: profile.id,
      title: form.title,
      document_type: form.document_type,
      notes: form.notes || null,
      expiry_date: form.expiry_date || null,
      issued_date: form.issued_date || null,
      tradie_name: form.tradie_name || null,
      file_url,
      file_name,
    }).select().single()
    if (doc) setDocs(prev => [doc, ...prev])
    setForm({ title: '', document_type: 'uploaded', notes: '', expiry_date: '', issued_date: '', tradie_name: '' })
    setSelectedFile(null)
    setShowUpload(false)
    setUploading(false)
  }

  const deleteDoc = async (id: string) => {
    if (!confirm('Remove this document from your vault?')) return
    const supabase = createClient()
    await supabase.from('vault_documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const filteredDocs = filter === 'all' ? docs : docs.filter(d => d.document_type === filter)
  const expiringSoon = docs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(d.expiry_date) > new Date())
  const expired = docs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date())

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading vault...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false} />
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'8px' }}>
              <span style={{ fontSize:'11px', color:'#6B4FA8', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Home vault</span>
            </div>
            <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1.5px', marginBottom:'4px' }}>DOCUMENT VAULT</h1>
            <p style={{ fontSize:'14px', color:'#4A5E64', fontWeight:300, lineHeight:'1.7', marginBottom:'20px' }}>Your permanent home record — scope agreements, warranties, certificates and receipts.</p>

            {/* Explainer */}
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'8px' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:0 }}>WHAT GETS STORED HERE</p>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', marginBottom:'16px' }}>
                  Every Steadyhand job generates a set of documents — the written record of what was agreed, inspected, built and warranted. These aren&apos;t just files. They are the lasting evidence of the dialogue that happened before, during and after the work: the consult notes both parties signed off on, the scope agreement that defined what was included, the milestone records that confirmed completion, and the warranty certificate that protects you after the tradie leaves.
                </p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', marginBottom:'16px' }}>
                  Most homeowners lose this paper trail. It gets emailed once and never filed. When something goes wrong — or when you sell the property — there is nothing to show. The Document Vault changes that. It accumulates automatically as you use Steadyhand, and you can add your own documents from jobs done outside the platform too.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {[
                    { icon:'📋', stage:'Consult', desc:'Site visit notes — what was observed, agreed and flagged before quoting began.' },
                    { icon:'📄', stage:'Contract', desc:'Signed scope agreement — the written record of what the tradie committed to deliver.' },
                    { icon:'✅', stage:'Build', desc:'Milestone records — completion confirmed at each stage of the work.' },
                    { icon:'🛡', stage:'Protected', desc:'Warranty certificate — your formal protection after the job is signed off.' },
                  ].map(item => (
                    <div key={item.stage} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'10px', background:'rgba(28,43,50,0.03)', borderRadius:'8px', border:'1px solid rgba(28,43,50,0.06)' }}>
                      <span style={{ fontSize:'18px', flexShrink:0 }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32', margin:'0 0 2px' }}>{item.stage}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0, lineHeight:'1.5' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setShowUpload(!showUpload)}
            style={{ background:'#1C2B32', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', flexShrink:0 }}>
            + Add document
          </button>
        </div>

        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div style={{ marginBottom:'20px', display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {expired.length > 0 && (
              <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'10px', padding:'12px 16px' }}>
                <p style={{ fontSize:'13px', color:'#D4522A', fontWeight:500, margin:0 }}>\u26a0 {expired.length} document{expired.length > 1 ? 's have' : ' has'} expired — {expired.map(d => d.title).join(', ')}</p>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'10px', padding:'12px 16px' }}>
                <p style={{ fontSize:'13px', color:'#C07830', fontWeight:500, margin:0 }}>\u23f1 {expiringSoon.length} document{expiringSoon.length > 1 ? 's expire' : ' expires'} within 30 days</p>
              </div>
            )}
          </div>
        )}

        {showUpload && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'16px' }}>ADD DOCUMENT</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Document title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Walsh Plumbing — hot water compliance certificate"
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Document type *</label>
                  <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }}>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Trade business</label>
                  <input value={form.tradie_name} onChange={e => setForm(f => ({ ...f, tradie_name: e.target.value }))}
                    placeholder="e.g. Walsh Plumbing"
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Issue date</label>
                  <input type="date" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Expiry date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Any additional notes..."
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:500, color:'#1C2B32', display:'block', marginBottom:'4px' }}>Upload file (optional)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ fontSize:'13px', color:'#4A5E64' }} />
                {selectedFile && <p style={{ fontSize:'11px', color:'#2E7D60', marginTop:'4px' }}>\u2713 {selectedFile.name}</p>}
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" onClick={() => setShowUpload(false)}
                  style={{ background:'transparent', color:'#1C2B32', padding:'10px 16px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.2)', cursor:'pointer' }}>Cancel</button>
                <button type="button" onClick={uploadDoc} disabled={!form.title || uploading}
                  style={{ flex:1, background:'#1C2B32', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:!form.title || uploading ? 'not-allowed' : 'pointer', opacity:!form.title || uploading ? 0.5 : 1 }}>
                  {uploading ? 'Saving...' : 'Save to vault \u2192'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' as const }}>
          {[{ value:'all', label:'All' }, ...DOC_TYPES].map(t => (
            <button key={t.value} type="button" onClick={() => setFilter(t.value)}
              style={{ padding:'5px 12px', borderRadius:'100px', fontSize:'12px', fontWeight:filter === t.value ? 600 : 400, background:filter === t.value ? '#1C2B32' : 'rgba(28,43,50,0.06)', color:filter === t.value ? 'white' : '#4A5E64', border:'1px solid ' + (filter === t.value ? '#1C2B32' : 'rgba(28,43,50,0.1)'), cursor:'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'48px', textAlign:'center' as const }}>
            <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.3 }}>\U0001f5c4</div>
            <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:500, marginBottom:'6px' }}>
              {filter === 'all' ? 'Your vault is empty' : 'No ' + (DOC_TYPES.find(t => t.value === filter)?.label.toLowerCase() || '') + ' documents yet'}
            </p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'16px' }}>
              Completed Steadyhand jobs automatically deposit scope agreements, milestone records and warranty certificates here.
            </p>
            <button type="button" onClick={() => setShowUpload(true)}
              style={{ background:'#1C2B32', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
              + Add your first document
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {filteredDocs.map(doc => {
              const docType = DOC_TYPES.find(t => t.value === doc.document_type) || DOC_TYPES[DOC_TYPES.length - 1]
              const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
              const isExpiringSoon = doc.expiry_date && !isExpired && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              return (
                <div key={doc.id} style={{ background:'#E8F0EE', border:'1px solid ' + (isExpired ? 'rgba(212,82,42,0.3)' : isExpiringSoon ? 'rgba(192,120,48,0.3)' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', flex:1 }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:docType.color + '18', border:'1px solid ' + docType.color + '30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                        {docType.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap' as const }}>
                          <p style={{ fontSize:'14px', fontWeight:500, color:'#1C2B32', margin:0 }}>{doc.title}</p>
                          <span style={{ fontSize:'10px', color:docType.color, background:docType.color + '12', border:'1px solid ' + docType.color + '25', borderRadius:'4px', padding:'1px 7px', fontWeight:600 }}>{docType.label}</span>
                          {isExpired && <span style={{ fontSize:'10px', color:'#D4522A', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'4px', padding:'1px 7px', fontWeight:600 }}>EXPIRED</span>}
                          {isExpiringSoon && <span style={{ fontSize:'10px', color:'#C07830', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'4px', padding:'1px 7px', fontWeight:600 }}>EXPIRING SOON</span>}
                        </div>
                        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' as const }}>
                          {doc.tradie_name && <span style={{ fontSize:'12px', color:'#7A9098' }}>{doc.tradie_name}</span>}
                          {doc.issued_date && <span style={{ fontSize:'12px', color:'#7A9098' }}>Issued {new Date(doc.issued_date).toLocaleDateString('en-AU')}</span>}
                          {doc.expiry_date && <span style={{ fontSize:'12px', color:isExpired ? '#D4522A' : isExpiringSoon ? '#C07830' : '#7A9098' }}>Expires {new Date(doc.expiry_date).toLocaleDateString('en-AU')}</span>}
                          {doc.job_title && <span style={{ fontSize:'12px', color:'#7A9098' }}>Job: {doc.job_title}</span>}
                        </div>
                        {doc.notes && <p style={{ fontSize:'12px', color:'#4A5E64', marginTop:'6px', lineHeight:'1.5' }}>{doc.notes}</p>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer"
                          style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', padding:'5px 10px' }}>
                          View \u2192
                        </a>
                      )}
                      <button type="button" onClick={() => deleteDoc(doc.id)}
                        style={{ fontSize:'12px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', padding:'4px' }}>\xd7</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {docs.length > 0 && (
          <div style={{ marginTop:'24px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
            {[
              { label:'Total documents', value:docs.length },
              { label:'With files', value:docs.filter(d => d.file_url).length },
              { label:'Expiring soon', value:expiringSoon.length, alert:expiringSoon.length > 0 },
            ].map(s => (
              <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', textAlign:'center' as const }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:(s as any).alert ? '#C07830' : '#1C2B32', margin:'0 0 3px' }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

          )}
      </div>
    </div>
  )
}
