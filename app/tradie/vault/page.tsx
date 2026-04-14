'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TradieVaultPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }
      setUser(session.user)
      setProfile(prof)

      // Load all jobs with scope agreements, quotes, and uploaded docs
      const { data: qrs } = await supabase.from('quote_requests').select('job_id').eq('tradie_id', session.user.id)
      const jobIds = (qrs || []).map((q: any) => q.job_id)

      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*, client:profiles!jobs_client_id_fkey(full_name), scope_agreements(*), quotes(*), vault_documents(*)')
          .in('id', jobIds)
          .order('created_at', { ascending: false })
        setJobs(jobsData || [])
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading vault...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#1C2B32', borderBottom:'1px solid rgba(216,228,225,0.08)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/tradie/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <a href="/tradie/dashboard" style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)', textDecoration:'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background:'#1C2B32', padding:'32px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,82,42,0.12), transparent 55%)' }} />
        <div style={{ maxWidth:'860px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(216,228,225,0.4)', marginBottom:'6px' }}>Trade Document Vault</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', marginBottom:'4px' }}>YOUR DOCUMENTS</h1>
          <p style={{ fontSize:'13px', color:'#D4522A', fontWeight:300 }}>Scope agreements, quotes and compliance documents — organised by job</p>
        </div>
      </div>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px 24px' }}>
        {jobs.length === 0 ? (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'40px', textAlign:'center' as const }}>
            <p style={{ fontSize:'15px', color:'#4A5E64' }}>No documents yet — they will appear here once jobs progress to agreement stage.</p>
          </div>
        ) : jobs.map((job: any) => {
          const scope = job.scope_agreements?.[0]
          const quote = job.quotes?.[0]
          const docs = job.vault_documents || []
          const hasContent = scope || quote || docs.length > 0
          if (!hasContent) return null

          return (
            <div key={job.id} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ background:'#1C2B32', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:0 }}>{job.title}</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:'2px 0 0' }}>{job.trade_category} · {job.suburb} · {job.client?.full_name}</p>
                </div>
                <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:'rgba(216,228,225,0.1)', color:'rgba(216,228,225,0.6)', border:'1px solid rgba(216,228,225,0.15)' }}>{job.status}</span>
              </div>

              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                {scope && (
                  <a href="/agreement" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)', textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'20px' }}>📄</span>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Scope Agreement</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'2px 0 0' }}>
                          {scope.client_signed_at && scope.tradie_signed_at ? '✓ Fully signed · ' + new Date(scope.tradie_signed_at).toLocaleDateString('en-AU') : 'Partially signed'}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize:'12px', color:'#6B4FA8' }}>View →</span>
                  </a>
                )}

                {quote && (
                  <a href={'/tradie/job?id=' + job.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)', textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'20px' }}>💰</span>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>Quote v{quote.version}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'2px 0 0' }}>${Number(quote.total_price).toLocaleString()} · {new Date(quote.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:'12px', color:'#C07830' }}>View →</span>
                  </a>
                )}

                {docs.map((doc: any) => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'white', borderRadius:'10px', border:'1px solid rgba(28,43,50,0.08)', textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'20px' }}>📎</span>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:0 }}>{doc.name || doc.doc_type || 'Document'}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:'2px 0 0' }}>{new Date(doc.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:'12px', color:'#2E7D60' }}>Download →</span>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
