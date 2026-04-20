'use client'
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
  const propertyId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : ''

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const id = window.location.pathname.split('/').pop()
      const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single()
      setProperty(prop)
      if (prop?.tenant_name) setTenantForm({ name: prop.tenant_name || '', email: prop.tenant_email || '', phone: prop.tenant_phone || '' })
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('property_id', id)
        .order('updated_at', { ascending: false })
      setJobs(jobsData || [])
      // Load all vault docs for this property (auto-filed from jobs + manually uploaded)
      const { data: docs } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('job_title', prop?.address || '') // fallback
        .order('created_at', { ascending: false })
      // Better: load by job_ids for this property
      if (jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map((j: any) => j.id)
        const { data: propDocs } = await supabase
          .from('vault_documents')
          .select('*, job:jobs(title, status, tradie:tradie_profiles(business_name))')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
        // Also load docs directly filed against this property
        const { data: directDocs } = await supabase
          .from('property_documents')
          .select('*')
          .eq('property_id', id)
          .order('created_at', { ascending: false })
        setVaultDocs([...(propDocs || []).map((d: any) => ({ ...d, _source: 'job' })), ...(directDocs || []).map((d: any) => ({ ...d, _source: 'direct' }))])
      } else {
        const { data: directDocs } = await supabase
          .from('property_documents')
          .select('*')
          .eq('property_id', id)
          .order('created_at', { ascending: false })
        setVaultDocs((directDocs || []).map((d: any) => ({ ...d, _source: 'direct' })))
      }
      setLoading(false)
    })
  }, [])

  const uploadDoc = async () => {
    if (!fileRef.current?.files?.[0] || !docForm.title || !property) return
    setUploadingDoc(true); setUploadError(null)
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
    if (!shareEmail.trim()) return
    setSharing(doc.id)
    const supabase = createClient()
    // Find user by email
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
      message: (org_name || 'Your property manager') + ' shared a document with you: ' + doc.title,
    })
    setShareSuccess(doc.id)
    setSharing(null)
    setShareEmail('')
    setTimeout(() => setShareSuccess(null), 3000)
  }

  const saveTenant = async () => {
    if (!property) return
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Loading...</p>
    </div>
  )

  if (!property) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#C8D5D2' }}>
      <p style={{ color: '#4A5E64', fontFamily: 'sans-serif' }}>Property not found.</p>
    </div>
  )

  const activeJobs = jobs.filter(j => !['complete', 'cancelled'].includes(j.status))
  const totalSpend = jobs.filter(j => j.agreed_price).reduce((sum, j) => sum + Number(j.agreed_price), 0)
  const org_name = property?.org_name || ''

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background: '#0A0A0A', padding: '36px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(46,125,96,0.2), transparent 55%)' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(216,228,225,0.4)', marginBottom: '6px' }}>
            {property.property_type?.replace('_', ' ')} · {property.suburb}
          </p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: 'clamp(18px, 3vw, 26px)', color: 'rgba(216,228,225,0.9)', letterSpacing: '1px', marginBottom: '8px' }}>
            {property.address?.toUpperCase()}
          </h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
            {property.owner_name && <span style={{ fontSize: '13px', color: 'rgba(216,228,225,0.5)' }}>Owner: {property.owner_name}</span>}
            <span style={{ fontSize: '13px', color: 'rgba(216,228,225,0.5)' }}>{activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}</span>
            {totalSpend > 0 && <span style={{ fontSize: '13px', color: 'rgba(216,228,225,0.5)' }}>Total spend: ${totalSpend.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:'#E8F0EE', borderBottom:'1px solid rgba(28,43,50,0.1)', display:'flex' }}>
        {[
          { key:'jobs', label:'Job history' },
          { key:'vault', label:'Property vault' },
          { key:'contacts', label:'Owner & tenant' },
        ].map((t: any) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            style={{ padding:'14px 20px', border:'none', borderBottom: activeTab === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? '#0A0A0A' : '#7A9098' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {property.notes && activeTab === 'jobs' && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', letterSpacing: '0.5px', marginBottom: '4px' }}>NOTES</p>
            <p style={{ fontSize: '13px', color: '#4A5E64', margin: 0 }}>{property.notes}</p>
          </div>
        )}

        {activeTab === 'jobs' && (<>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#0A0A0A', letterSpacing: '0.5px', margin: 0 }}>JOB HISTORY</h2>
          <a href={'/request?property_id=' + property.id}>
            <button type="button" style={{ background: '#D4522A', color: 'white', padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              + New job request
            </button>
          </a>
        </div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '40px', background: '#E8F0EE', borderRadius: '14px' }}>
            <p style={{ fontSize: '14px', color: '#4A5E64', marginBottom: '16px' }}>No jobs for this property yet.</p>
            <a href={'/request?property_id=' + property.id}>
              <button type="button" style={{ background: '#0A0A0A', color: 'white', padding: '11px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                Create first job request →
              </button>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {jobs.map(job => (
              <a key={job.id} href={'/dashboard/' + job.id} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderLeft: '3px solid ' + (STATUS_COLOR[job.status] || '#9AA5AA'), borderRadius: '11px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#0A0A0A', margin: '0 0 3px' }}>{job.title}</p>
                    <p style={{ fontSize: '12px', color: '#7A9098', margin: 0 }}>{job.trade_category} · {job.tradie?.business_name || 'No tradie yet'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {job.agreed_price && <span style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>${Number(job.agreed_price).toLocaleString()}</span>}
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: (STATUS_COLOR[job.status] || '#9AA5AA') + '18', border: '1px solid ' + (STATUS_COLOR[job.status] || '#9AA5AA') + '40', color: STATUS_COLOR[job.status] || '#9AA5AA', fontWeight: 500 }}>
                      {STATUS_LABEL[job.status] || job.status}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
