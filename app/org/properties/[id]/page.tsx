'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', matching: 'Matching', shortlisted: 'Shortlisted',
  assess: 'Consult', compare: 'Compare', agreement: 'Contract',
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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const id = window.location.pathname.split('/').pop()
      const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single()
      setProperty(prop)
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, tradie:tradie_profiles(business_name)')
        .eq('property_id', id)
        .order('updated_at', { ascending: false })
      setJobs(jobsData || [])
      setLoading(false)
    })
  }, [])

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

  return (
    <div style={{ minHeight: '100vh', background: '#C8D5D2', fontFamily: 'sans-serif' }}>
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(200,213,210,0.95)', borderBottom: '1px solid rgba(28,43,50,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px' }}>STEADYHAND</span>
        <a href="/org/dashboard" style={{ fontSize: '13px', color: '#4A5E64', textDecoration: 'none' }}>← Back to dashboard</a>
      </nav>

      <div style={{ background: '#1C2B32', padding: '36px 0', position: 'relative', overflow: 'hidden' }}>
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {property.notes && (
          <div style={{ background: '#E8F0EE', border: '1px solid rgba(28,43,50,0.1)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#7A9098', letterSpacing: '0.5px', marginBottom: '4px' }}>NOTES</p>
            <p style={{ fontSize: '13px', color: '#4A5E64', margin: 0 }}>{property.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', letterSpacing: '0.5px', margin: 0 }}>JOB HISTORY</h2>
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
              <button type="button" style={{ background: '#1C2B32', color: 'white', padding: '11px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
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
                    <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: '#1C2B32', margin: '0 0 3px' }}>{job.title}</p>
                    <p style={{ fontSize: '12px', color: '#7A9098', margin: 0 }}>{job.trade_category} · {job.tradie?.business_name || 'No tradie yet'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {job.agreed_price && <span style={{ fontSize: '14px', fontWeight: 500, color: '#1C2B32' }}>${Number(job.agreed_price).toLocaleString()}</span>}
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
