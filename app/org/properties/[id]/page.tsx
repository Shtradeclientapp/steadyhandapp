'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', matching: 'Matching', shortlisted: 'Shortlisted',
  assess: 'Consult', compare: 'Compare', agreement: 'Agreement',
  delivery: 'Build', signoff: 'Complete', warranty: 'Protect', complete: 'Done',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#9AA5AA', matching: '#2E7D60', shortlisted: '#2E6A8F',
  assess: '#9B6B9B', compare: '#7B5EA7', agreement: '#6B4FA8',
  delivery: '#C07830', signoff: '#D4522A', warranty: '#1A6B5A', complete: '#2E7D60',
}

export default function PropertyDetailPage() {
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs'|'vault'|'contacts'>('jobs')
  const [vaultDocs, setVaultDocs] = useState<any[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadError, setUploadError] = useState<string|null>(null)
  const [docForm, setDocForm] = useState({ title:'', document_type:'compliance', notes:'' })
  const [showUpload, setShowUpload] = useState(false)
  const [sharing, setSharing] = useState<string|null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareSuccess, setShareSuccess] = useState<string|null>(null)
  const [tenantForm, setTenantForm] = useState({ name:'', email:'', phone:'' })
  const [savingTenant, setSavingTenant] = useState(false)
  const [tenantSaved, setTenantSaved] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const id = (params?.id as string) || window.location.pathname.split('/').pop()
      const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single()
      setProperty(prop)
      if (prop?.tenant_name) setTenantForm({ name: prop.tenant_name || '', email: prop.tenant_email || '', phone: prop.tenant_phone || '' })
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('property_id', id)
        .order('updated_at', { ascending: false })
      setJobs(jobsData || [])
      if (jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map((j: any) => j.id)
        const { data: propDocs } = await supabase
          .from('vault_documents')
          .select('*, job:jobs(title, status, tradie:tradie_profiles(business_name))')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
        const { data: directDocs } = await supabase
          .from('property_documents')
          .select('*')
          .eq('property_id', id)
          .order('created_at', { ascending: false })
        setVaultDocs([...(propDocs || []).map((d: any) => ({ ...d, _source: 'job' })), ...(directDocs || []).map((d: any) => ({ ...d, _source: 'direct' }))])
      } else {
        const { data: directDocs } = await supabase.from('property_documents').select('*').eq('property_id', id).order('created_at', { ascending: false })
        setVaultDocs((directDocs || []).map((d: any) => ({ ...d, _source: 'direct' })))
      }
      setLoading(false)
    })
  }, [])

  const uploadDoc = async () => {
    if (!fileRef.current?.files?.[0] || !docForm.title || !property) { setUploadingDoc(false); return }
    setUploadingDoc(true)
    setUploadError(null)
    const supabase = createClient()
    const file = fileRef.current.files[0]
    const ext = file.name.split('.').pop()
    const filePath = 'property-docs/' + property.id + '/' + Date.now() + '.' + ext
    const { error: upErr } = await supabase.storage.from('Documents').upload(filePath, file)
    if (upErr) { setUploadError('Upload failed: ' + upErr.message); setUploadingDoc(false); return }
    const { data: signed } = await supabase.storage.from('Documents').createSignedUrl(filePath, 60 * 60 * 24 * 365)
    await supabase.from('property_documents').insert({
      property_id: property.id,
      org_id: property.org_id,
      title: docForm.title,
      document_type: docForm.document_type,
      notes: docForm.notes || null,
      file_url: signed?.signedUrl || '',
      uploaded_by: profile?.id,
    })
    const { data: fresh } = await supabase.from('property_documents').select('*').eq('property_id', property.id).order('created_at', { ascending: false })
    setVaultDocs(prev => {
      const jobDocs = prev.filter((d: any) => d._source === 'job')
      return [...jobDocs, ...(fresh || []).map((d: any) => ({ ...d, _source: 'direct' }))]
    })
    setDocForm({ title:'', document_type:'compliance', notes:'' })
    if (fileRef.current) fileRef.current.value = ''
    setShowUpload(false)
    setUploadingDoc(false)
  }

  const shareDoc = async (doc: any) => {
    if (!shareEmail.trim()) { setSharing(null); return }
    setSharing(doc.id)
    const supabase = createClient()
    const { data: recipient } = await supabase.from('profiles').select('id').eq('email', shareEmail.trim().toLowerCase()).single()
    if (!recipient) { setSharing(null); setUploadError('No Steadyhand account found for that email.'); return }
    await supabase.from('property_document_shares').upsert({
      document_id: doc.id,
      shared_with: recipient.id,
      shared_by: profile?.id,
      property_id: property.id,
      permission: 'view',
    }, { onConflict: 'document_id,shared_with' })
    await supabase.from('notifications').insert({
      user_id: recipient.id,
      message: 'Your property manager shared a document with you: ' + doc.title,
    })
    setShareSuccess(doc.id)
    setSharing(null)
    setShareEmail('')
    setTimeout(() => setShareSuccess(null), 3000)
  }

  const saveTenant = async () => {
    if (!property) { setSavingTenant(false); return }
    setSavingTenant(true)
    const supabase = createClient()
    await supabase.from('properties').update({
      tenant_name: tenantForm.name || null,
      tenant_email: tenantForm.email || null,
      tenant_phone: tenantForm.phone || null,
    }).eq('id', property.id)
    setTenantSaved(true)
    setTimeout(() => setTenantSaved(false), 2000)
    setSavingTenant(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p>
    </div>
  )

  if (!property) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Property not found.</p>
    </div>
  )

  const activeJobs = jobs.filter(j => !['complete', 'cancelled'].includes(j.status))
  const totalSpend = jobs.filter(j => j.agreed_price).reduce((sum, j) => sum + Number(j.agreed_price), 0)

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background:'#0A0A0A', padding:'36px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(46,125,96,0.2), transparent 55%)' }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>
            {property.property_type?.replace('_', ' ')} · {property.suburb}
          </p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(18px, 3vw, 26px)', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'8px' }}>
            {property.address?.toUpperCase()}
          </h1>
          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' as const }}>
            {property.owner_name && <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>Owner: {property.owner_name}</span>}
            <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>{activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}</span>
            {totalSpend > 0 && <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>Total spend: ${totalSpend.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex' }}>
        {(['jobs', 'vault', 'contacts'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            style={{ padding:'14px 20px', border:'none', borderBottom: activeTab === tab ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? '#0A0A0A' : '#7A9098' }}>
            {tab === 'jobs' ? 'Job history' : tab === 'vault' ? 'Property vault' : 'Owner & tenant'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 24px' }}>

        {activeTab === 'jobs' && (
          <>
            {property.notes && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px 16px', marginBottom:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', marginBottom:'4px' }}>NOTES</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>{property.notes}</p>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>JOB HISTORY</h2>
              <a href={'/request?property_id=' + property.id}>
                <button type="button" style={{ background:'#D4522A', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  + New job request
                </button>
              </a>
            </div>
            {jobs.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'14px' }}>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'16px' }}>No jobs for this property yet.</p>
                <a href={'/request?property_id=' + property.id}>
                  <button type="button" style={{ background:'#0A0A0A', color:'white', padding:'11px 24px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                    Create first job request →
                  </button>
                </a>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {jobs.map(job => (
                  <a key={job.id} href={'/dashboard/' + job.id} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderLeft:'3px solid ' + (STATUS_COLOR[job.status] || '#9AA5AA'), borderRadius:'11px', padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const }}>
                      <div>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', margin:'0 0 3px' }}>{job.title}</p>
                        <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{job.trade_category} · {job.tradie?.business_name || 'No tradie yet'}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
                        {job.agreed_price && <span style={{ fontSize:'14px', fontWeight:500, color:'#0A0A0A' }}>${Number(job.agreed_price).toLocaleString()}</span>}
                        <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'100px', background:(STATUS_COLOR[job.status] || '#9AA5AA') + '18', border:'1px solid ' + (STATUS_COLOR[job.status] || '#9AA5AA') + '40', color:STATUS_COLOR[job.status] || '#9AA5AA', fontWeight:500 }}>
                          {STATUS_LABEL[job.status] || job.status}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'vault' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 4px' }}>PROPERTY VAULT</h2>
                <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>All compliance certs, scope agreements, warranty certificates and documents for this property</p>
              </div>
              <button type="button" onClick={() => setShowUpload(s => !s)}
                style={{ background:'#0A0A0A', color:'white', padding:'8px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                + Upload document
              </button>
            </div>
            {showUpload && (
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'14px' }}>UPLOAD DOCUMENT</p>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                  <input type="text" placeholder="Document title" value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                  <select value={docForm.document_type} onChange={e => setDocForm(f => ({ ...f, document_type: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }}>
                    {['compliance','warranty','scope_agreement','insurance','permit','inspection','lease','correspondence','other'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
                    ))}
                  </select>
                  <textarea placeholder="Notes (optional)" value={docForm.notes} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const }} />
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ fontSize:'13px', color:'#4A5E64' }} />
                  {uploadError && <p style={{ fontSize:'12px', color:'#D4522A', margin:0 }}>⚠ {uploadError}</p>}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setShowUpload(false)}
                      style={{ background:'transparent', color:'#7A9098', padding:'9px 16px', borderRadius:'7px', fontSize:'12px', border:'1px solid rgba(28,43,50,0.15)', cursor:'pointer' }}>Cancel</button>
                    <button type="button" onClick={uploadDoc} disabled={uploadingDoc || !docForm.title}
                      style={{ flex:1, background: uploadingDoc || !docForm.title ? 'rgba(28,43,50,0.2)' : '#0A0A0A', color:'white', padding:'9px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                      {uploadingDoc ? 'Uploading...' : 'Upload →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {vaultDocs.length === 0 ? (
              <div style={{ textAlign:'center' as const, padding:'40px', background:'#E8F0EE', borderRadius:'14px' }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>📁</p>
                <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px', fontWeight:500 }}>No documents yet</p>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>Compliance certificates, scope agreements and warranty documents from completed jobs will appear here automatically.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                {vaultDocs.map((doc: any) => (
                  <div key={doc.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'11px', padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom: sharing === doc.id ? '12px' : '0' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap' as const }}>
                          <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{doc.title}</p>
                          <span style={{ fontSize:'10px', background:'rgba(28,43,50,0.06)', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'4px', padding:'1px 6px', color:'#7A9098' }}>
                            {doc.document_type?.replace(/_/g,' ')}
                          </span>
                          {doc._source === 'job' && doc.job?.tradie?.business_name && (
                            <span style={{ fontSize:'10px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'4px', padding:'1px 6px' }}>
                              {doc.job.tradie.business_name}
                            </span>
                          )}
                        </div>
                        {doc.notes && <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{doc.notes}</p>}
                        <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'3px 0 0' }}>{new Date(doc.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer"
                            style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'6px', padding:'5px 10px' }}>
                            Open →
                          </a>
                        )}
                        <button type="button" onClick={() => setSharing(sharing === doc.id ? null : doc.id)}
                          style={{ fontSize:'12px', color:'#6B4FA8', background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'6px', padding:'5px 10px', cursor:'pointer' }}>
                          Share
                        </button>
                      </div>
                    </div>
                    {sharing === doc.id && (
                      <div style={{ display:'flex', gap:'8px', alignItems:'center', paddingTop:'10px', borderTop:'1px solid rgba(28,43,50,0.08)' }}>
                        <input type="email" placeholder="Share with email address"
                          value={shareEmail} onChange={e => setShareEmail(e.target.value)}
                          style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(107,79,168,0.25)', borderRadius:'7px', fontSize:'12px', background:'#F4F8F7', color:'#0A0A0A', outline:'none' }} />
                        {shareSuccess === doc.id ? (
                          <span style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500 }}>✓ Shared</span>
                        ) : (
                          <button type="button" onClick={() => shareDoc(doc)}
                            style={{ background:'#6B4FA8', color:'white', padding:'8px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:500, border:'none', cursor:'pointer' }}>
                            Send →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'20px' }}>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', background:'rgba(28,43,50,0.03)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>OWNER</p>
              </div>
              <div style={{ padding:'16px 18px' }}>
                {property.owner_name ? (
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
                    <p style={{ fontSize:'15px', fontWeight:600, color:'#0A0A0A', margin:0 }}>{property.owner_name}</p>
                    {property.owner_email && <a href={'mailto:' + property.owner_email} style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none' }}>{property.owner_email}</a>}
                    {property.owner_phone && <a href={'tel:' + property.owner_phone} style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none' }}>📞 {property.owner_phone}</a>}
                  </div>
                ) : (
                  <p style={{ fontSize:'13px', color:'#9AA5AA', fontStyle:'italic' }}>No owner recorded.</p>
                )}
              </div>
            </div>
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', background:'rgba(28,43,50,0.03)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>TENANT</p>
              </div>
              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                <input type="text" placeholder="Tenant name" value={tenantForm.name} onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                <input type="email" placeholder="Tenant email" value={tenantForm.email} onChange={e => setTenantForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                <input type="tel" placeholder="Tenant phone" value={tenantForm.phone} onChange={e => setTenantForm(f => ({ ...f, phone: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const }} />
                <button type="button" onClick={saveTenant} disabled={savingTenant}
                  style={{ background: tenantSaved ? '#2E7D60' : '#0A0A0A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer', opacity: savingTenant ? 0.7 : 1 }}>
                  {tenantSaved ? '✓ Saved' : savingTenant ? 'Saving...' : 'Save tenant details'}
                </button>
              </div>
            </div>
            <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'12px', padding:'16px 18px' }}>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#2E7D60', margin:'0 0 4px' }}>Tenant maintenance requests</p>
              <p style={{ fontSize:'12px', color:'#4A5E64', margin:'0 0 10px', lineHeight:'1.6' }}>Share this link with your tenant to let them submit maintenance requests directly into Steadyhand.</p>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#F4F8F7', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'7px', padding:'8px 12px' }}>
                <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/request?property_id={property.id}&source=tenant
                </p>
                <button type="button" onClick={() => navigator.clipboard?.writeText((typeof window !== 'undefined' ? window.location.origin : '') + '/request?property_id=' + property.id + '&source=tenant')}
                  style={{ fontSize:'11px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'5px', padding:'4px 10px', cursor:'pointer', flexShrink:0 }}>
                  Copy link
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
