'use client'
import { useEffect, useState, useRef } from 'react'
import { useSupabase } from '@/lib/hooks'
import { NavHeader } from '@/components/ui/NavHeader'

const DOC_TYPES = [
  { value: 'scope',       label: 'Scope agreement',       icon: '📄', color: '#2E6A8F' },
  { value: 'milestone',   label: 'Milestone record',      icon: '✅', color: '#2E7D60' },
  { value: 'compliance',  label: 'Compliance certificate',icon: '🔒', color: '#6B4FA8' },
  { value: 'warranty',    label: 'Warranty certificate',  icon: '🛡', color: '#D4522A' },
  { value: 'receipt',     label: 'Receipt / invoice',     icon: '💳', color: '#C07830' },
  { value: 'permit',      label: 'Permit / approval',     icon: '📋', color: '#2E7D60' },
  { value: 'insurance',   label: 'Insurance document',    icon: '🏠', color: '#2E6A8F' },
  { value: 'consult',     label: 'Consult record',        icon: '📝', color: '#9B6B9B' },
  { value: 'uploaded',    label: 'Other document',        icon: '📎', color: '#7A9098' },
]

const FOLDERS = [
  { key: 'all',        label: 'All documents',    icon: '🗃' },
  { key: 'scope',      label: 'Scope agreements', icon: '📄' },
  { key: 'milestone',  label: 'Milestones',       icon: '✅' },
  { key: 'warranty',   label: 'Warranty',         icon: '🛡' },
  { key: 'compliance', label: 'Compliance',       icon: '🔒' },
  { key: 'consult',    label: 'Consult records',  icon: '📝' },
  { key: 'receipt',    label: 'Receipts',         icon: '💳' },
  { key: 'uploaded',   label: 'My uploads',       icon: '📎' },
]

export default function VaultPage() {
  const supabase = useSupabase()
  const [profile, setProfile]           = useState<any>(null)
  const [docs, setDocs]                 = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [folder, setFolder]             = useState('all')
  const [selectedDoc, setSelectedDoc]   = useState<any>(null)
  const [viewerUrl, setViewerUrl]       = useState<string|null>(null)
  const [loadingUrl, setLoadingUrl]     = useState(false)
  const [annotation, setAnnotation]     = useState('')
  const [savingNote, setSavingNote]     = useState(false)
  const [noteSaved, setNoteSaved]       = useState(false)
  const [showUpload, setShowUpload]     = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string|null>(null)
  const [search, setSearch]             = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File|null>(null)
  const [form, setForm] = useState({ title:'', document_type:'uploaded', notes:'', expiry_date:'', issued_date:'', tradie_name:'' })

  useEffect(() => {
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

  const openDoc = async (doc: any) => {
    setSelectedDoc(doc)
    setAnnotation(doc.notes || '')
    setViewerUrl(null)
    if (doc.file_url) {
      setLoadingUrl(true)
      // Try to get a signed URL if it looks like a storage path
      // Use server-side signed URL for all storage URLs (handles both full URLs and bare paths)
      if (doc.file_url.includes('supabase') || !doc.file_url.startsWith('http')) {
        const res = await fetch('/api/vault/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: doc.file_url }),
        })
        const { signed_url } = await res.json()
        setViewerUrl(signed_url || doc.file_url)
      } else {
        setViewerUrl(doc.file_url)
      }
      setLoadingUrl(false)
    }
  }

  const saveNote = async () => {
    if (!selectedDoc) return
    setSavingNote(true)
    await supabase.from('vault_documents').update({ notes: annotation }).eq('id', selectedDoc.id)
    setDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, notes: annotation } : d))
    setSelectedDoc((d: any) => ({ ...d, notes: annotation }))
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
    setSavingNote(false)
  }

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await supabase.from('vault_documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    if (selectedDoc?.id === id) setSelectedDoc(null)
  }

  const uploadDoc = async () => {
    if (!form.title || !profile) return
    setUploading(true)
    setUploadError(null)
    let file_url = null
    let file_name = null
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const path = profile.id + '/' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('Documents').upload(path, selectedFile)
      if (error) {
        setUploadError('Upload failed — check that the Documents storage bucket exists and has an upload policy.')
        setUploading(false)
        return
      }
      file_url = path
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
    setForm({ title:'', document_type:'uploaded', notes:'', expiry_date:'', issued_date:'', tradie_name:'' })
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowUpload(false)
    setUploading(false)
  }

  const filtered = docs.filter(d => {
    const matchFolder = folder === 'all' || d.document_type === folder
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.tradie_name?.toLowerCase().includes(search.toLowerCase()) || d.job_title?.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  const counts: Record<string,number> = { all: docs.length }
  docs.forEach(d => { counts[d.document_type] = (counts[d.document_type] || 0) + 1 })

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'7px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box', fontFamily:'sans-serif' }

  if (loading) return (
    <div style={{ background:'#C8D5D2', minHeight:'100vh' }}>
      <NavHeader profile={null} isTradie={false} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading vault...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background:'#C8D5D2', minHeight:'100vh', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={false} />

      {/* Top bar */}
      <div style={{ background:'white', borderBottom:'1px solid rgba(28,43,50,0.08)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#1C2B32', letterSpacing:'1px', margin:'0 0 2px' }}>DOCUMENT VAULT</h1>
          <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{docs.length} document{docs.length !== 1 ? 's' : ''} · scope agreements, warranties, consult records and certificates</p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width:'220px' }} />
          <button type="button" onClick={() => setShowUpload(!showUpload)}
            style={{ background:'#1C2B32', color:'white', padding:'9px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
            + Upload
          </button>
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', padding:'20px 24px' }}>
          <div style={{ maxWidth:'780px', margin:'0 auto' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'14px' }}>Add document to vault</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Electrical scope — Subiaco" style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Type</label>
                <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))} style={inp}>
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Trade business</label>
                <input type="text" value={form.tradie_name} onChange={e => setForm(f => ({ ...f, tradie_name: e.target.value }))} placeholder="e.g. Smith Electrical" style={inp} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Issue date</label>
                <input type="date" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Expiry date</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>File (optional)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ fontSize:'12px', color:'#4A5E64', width:'100%' }} />
              </div>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'#4A5E64', marginBottom:'4px' }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                placeholder="Any relevant context or notes about this document..."
                style={{ ...inp, resize:'vertical', minHeight:'60px' }} />
            </div>
            {uploadError && <p style={{ fontSize:'12px', color:'#D4522A', marginBottom:'8px' }}>{uploadError}</p>}
            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={uploadDoc} disabled={!form.title || uploading}
                style={{ background:'#1C2B32', color:'white', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: !form.title || uploading ? 0.5 : 1 }}>
                {uploading ? 'Saving...' : 'Save to vault →'}
              </button>
              <button type="button" onClick={() => setShowUpload(false)}
                style={{ background:'none', color:'#7A9098', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three-panel layout */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:'calc(100vh - 130px)' }}>

        {/* ── File tree sidebar ── */}
        <div style={{ background:'white', borderRight:'1px solid rgba(28,43,50,0.08)', padding:'16px 0' }}>
          {FOLDERS.map(f => (
            <button key={f.key} type="button" onClick={() => { setFolder(f.key); setSelectedDoc(null) }}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'8px 16px', background: folder === f.key ? '#E8F0EE' : 'transparent', border:'none', borderLeft: folder === f.key ? '3px solid #1C2B32' : '3px solid transparent', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:'13px', color: folder === f.key ? '#1C2B32' : '#4A5E64', fontWeight: folder === f.key ? 600 : 400 }}>
                {f.icon} {f.label}
              </span>
              {counts[f.key] > 0 && (
                <span style={{ fontSize:'11px', color:'#7A9098', background:'rgba(28,43,50,0.06)', borderRadius:'100px', padding:'1px 7px' }}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}

          <div style={{ borderTop:'1px solid rgba(28,43,50,0.08)', marginTop:'12px', padding:'12px 16px' }}>
            <p style={{ fontSize:'11px', color:'#9AA5AA', lineHeight:'1.6', margin:0 }}>
              Documents are auto-filed here when jobs complete — scope agreements, milestone records, consult notes and warranty certificates.
            </p>
          </div>
        </div>

        {/* ── Main content + viewer ── */}
        <div style={{ display:'grid', gridTemplateColumns: selectedDoc ? '1fr 420px' : '1fr', minHeight:0 }}>

          {/* Document list */}
          <div style={{ padding:'20px', overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ background:'#E8F0EE', borderRadius:'14px', padding:'48px', textAlign:'center' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.3 }}>🗃</div>
                <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:500, marginBottom:'6px' }}>
                  {search ? 'No documents match your search' : folder === 'all' ? 'Your vault is empty' : 'No documents in this folder yet'}
                </p>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'16px' }}>
                  Completed jobs automatically deposit scope agreements, milestone records and warranty certificates here.
                </p>
                <button type="button" onClick={() => setShowUpload(true)}
                  style={{ background:'#0A0A0A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  + Add document
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {filtered.map(doc => {
                  const dt = DOC_TYPES.find(t => t.value === doc.document_type) || DOC_TYPES[DOC_TYPES.length - 1]
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                  const isExpiringSoon = doc.expiry_date && !isExpired && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  const isSelected = selectedDoc?.id === doc.id
                  return (
                    <div key={doc.id}
                      onClick={() => openDoc(doc)}
                      style={{ background: isSelected ? 'white' : '#E8F0EE', border:'1px solid ' + (isSelected ? '#1C2B32' : isExpired ? 'rgba(212,82,42,0.3)' : isExpiringSoon ? 'rgba(192,120,48,0.3)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', padding:'12px 16px', cursor:'pointer', transition:'all 0.1s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:dt.color + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>
                          {dt.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'2px' }}>
                            <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{doc.title}</p>
                            {isExpired && <span style={{ fontSize:'9px', color:'#D4522A', background:'rgba(212,82,42,0.08)', borderRadius:'4px', padding:'1px 6px', fontWeight:600 }}>EXPIRED</span>}
                            {isExpiringSoon && <span style={{ fontSize:'9px', color:'#C07830', background:'rgba(192,120,48,0.08)', borderRadius:'4px', padding:'1px 6px', fontWeight:600 }}>EXPIRING</span>}
                            {!doc.file_url && <span style={{ fontSize:'9px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', borderRadius:'4px', padding:'1px 6px' }}>Record</span>}
                            {doc.file_url && <span style={{ fontSize:'9px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', borderRadius:'4px', padding:'1px 6px' }}>File</span>}
                          </div>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                            {dt.label}
                            {doc.tradie_name ? ' · ' + doc.tradie_name : ''}
                            {doc.job_title ? ' · ' + doc.job_title : ''}
                            {doc.issued_date ? ' · ' + new Date(doc.issued_date).toLocaleDateString('en-AU') : ''}
                          </p>
                        </div>
                        <button type="button" onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }}
                          style={{ fontSize:'16px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', padding:'2px 6px', flexShrink:0 }}>
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Document viewer + annotation panel ── */}
          {selectedDoc && (
            <div style={{ background:'white', borderLeft:'1px solid rgba(28,43,50,0.08)', display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
              {/* Viewer header */}
              <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selectedDoc.title}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>
                    {DOC_TYPES.find(t => t.value === selectedDoc.document_type)?.label}
                    {selectedDoc.tradie_name ? ' · ' + selectedDoc.tradie_name : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedDoc(null)}
                  style={{ fontSize:'18px', color:'#9AA5AA', background:'none', border:'none', cursor:'pointer', padding:'0 4px', marginLeft:'8px' }}>×</button>
              </div>

              {/* File viewer */}
              <div style={{ flex:1, overflow:'hidden', background:'#F4F8F7', position:'relative', minHeight:'300px' }}>
                {loadingUrl && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                    <p style={{ fontSize:'13px', color:'#7A9098' }}>Loading document...</p>
                  </div>
                )}
                {!loadingUrl && !selectedDoc.file_url && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'24px', textAlign:'center' }}>
                    <div style={{ fontSize:'32px', marginBottom:'10px', opacity:0.4 }}>📋</div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'#4A5E64', marginBottom:'6px' }}>Steadyhand record</p>
                    <p style={{ fontSize:'12px', color:'#7A9098', lineHeight:'1.6', marginBottom:'16px' }}>
                      This document was auto-filed from your job. No separate file is attached — the record exists in your job history.
                    </p>
                    {selectedDoc.job_id && (selectedDoc.document_type === 'scope' || selectedDoc.document_type === 'warranty') && (
                      <a href={'/api/pdf/' + selectedDoc.document_type + '?job_id=' + selectedDoc.job_id} target="_blank" rel="noreferrer"
                        style={{ fontSize:'13px', color:'white', background:'#1C2B32', padding:'8px 16px', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>
                        ↓ Download PDF
                      </a>
                    )}
                  </div>
                )}
                {!loadingUrl && viewerUrl && (() => {
                  const ext = (viewerUrl.split('?')[0].split('.').pop() || '').toLowerCase()
                  if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
                    return <img src={viewerUrl} alt={selectedDoc.title} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'16px', boxSizing:'border-box' }} />
                  }
                  return (
                    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
                      <iframe src={viewerUrl} style={{ flex:1, border:'none', width:'100%' }} title={selectedDoc.title} />
                      <div style={{ padding:'8px 12px', borderTop:'1px solid rgba(28,43,50,0.08)', display:'flex', gap:'8px' }}>
                        <a href={viewerUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', padding:'5px 10px', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', background:'rgba(46,106,143,0.06)' }}>
                          Open in new tab →
                        </a>
                        <a href={viewerUrl} download={selectedDoc.file_name || selectedDoc.title}
                          style={{ fontSize:'12px', color:'#2E7D60', textDecoration:'none', padding:'5px 10px', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', background:'rgba(46,125,96,0.06)' }}>
                          ↓ Download
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Metadata */}
              <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(28,43,50,0.08)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {[
                    ['Trade business', selectedDoc.tradie_name],
                    ['Job', selectedDoc.job_title],
                    ['Issued', selectedDoc.issued_date ? new Date(selectedDoc.issued_date).toLocaleDateString('en-AU') : null],
                    ['Expires', selectedDoc.expiry_date ? new Date(selectedDoc.expiry_date).toLocaleDateString('en-AU') : null],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={String(k)}>
                      <p style={{ fontSize:'10px', color:'#9AA5AA', margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'0.3px' }}>{k}</p>
                      <p style={{ fontSize:'12px', color:'#1C2B32', margin:0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annotation */}
              <div style={{ padding:'14px 16px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#4A5E64', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 8px' }}>Notes & annotations</p>
                <textarea value={annotation} onChange={e => setAnnotation(e.target.value)}
                  placeholder="Add notes about this document — reminders, context, or follow-up actions..."
                  rows={4}
                  style={{ ...inp, resize:'vertical', marginBottom:'8px' }} />
                <button type="button" onClick={saveNote} disabled={savingNote}
                  style={{ background:'#1C2B32', color:'white', padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer', opacity: savingNote ? 0.7 : 1 }}>
                  {noteSaved ? '✓ Saved' : savingNote ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
