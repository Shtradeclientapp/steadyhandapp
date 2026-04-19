'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/ui/NavHeader'

export default function WorkersPage() {
  const [profile, setProfile] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', email:'', phone:'' })
  const [inviting, setInviting] = useState(false)
  const [invited, setInvited] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [assignForm, setAssignForm] = useState({ workerId:'', jobId:'', date: new Date().toISOString().split('T')[0], notes:'' })
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('id, email, full_name, role, tradie:tradie_profiles(business_name, id, worker_seats_included, worker_seats_extra, subscription_tier)').eq('id', session.user.id).single()
      if (!prof || prof.role !== 'tradie') { window.location.href = '/dashboard'; return }
      setProfile(prof)

      const [{ data: w }, { data: j }, { data: a }] = await Promise.all([
        supabase.from('tradie_workers').select('*').eq('tradie_id', (Array.isArray(prof.tradie) ? prof.tradie[0]?.id : prof.tradie?.id)).order('created_at', { ascending: false }),
        supabase.from('jobs').select('id, title, suburb, status').eq('tradie_id', (Array.isArray(prof.tradie) ? prof.tradie[0]?.id : prof.tradie?.id)).in('status', ['agreement','delivery','assess','quote']).order('created_at', { ascending: false }),
        supabase.from('job_worker_assignments').select('*, worker:tradie_workers(name), job:jobs(title, suburb)').in('job_id', []).order('assigned_date', { ascending: true }),
      ])
      setWorkers(w || [])
      setJobs(j || [])

      // Load assignments for all workers
      if (w && w.length > 0) {
        const { data: asgn } = await supabase.from('job_worker_assignments')
          .select('*, worker:tradie_workers(name), job:jobs(title, suburb)')
          .in('worker_id', w.map((x:any) => x.id))
          .gte('assigned_date', new Date().toISOString().split('T')[0])
          .order('assigned_date', { ascending: true })
        setAssignments(asgn || [])
      }
      setLoading(false)
    })
  }, [])

  const seatsAllowed = (profile?.tradie?.worker_seats_included || 0) + (profile?.tradie?.worker_seats_extra || 0)
  const activeWorkers = workers.filter((w:any) => w.status === 'active').length

  const inviteWorker = async () => {
    if (!form.email) return
    if (activeWorkers >= seatsAllowed) { setError('You have reached your worker seat limit. Email support@steadyhandtrade.app to add more seats.'); return }
    setInviting(true)
    setError(null)
    const res = await fetch('/api/worker-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_name: form.name,
        worker_email: form.email,
        worker_phone: form.phone,
        tradie_id: profile?.tradie?.id,
        business_name: profile?.tradie?.business_name,
      }),
    })
    const data = await res.json()
    if (data.worker) {
      setWorkers(prev => [data.worker, ...prev])
      setInvited(true)
      setForm({ name:'', email:'', phone:'' })
      setTimeout(() => setInvited(false), 3000)
    } else {
      setError(data.error || 'Failed to send invitation')
    }
    setInviting(false)
  }

  const assignWorker = async () => {
    if (!assignForm.workerId || !assignForm.jobId) return
    setAssigning(true)
    const supabase = createClient()
    const { data } = await supabase.from('job_worker_assignments').insert({
      worker_id: assignForm.workerId,
      job_id: assignForm.jobId,
      assigned_date: assignForm.date,
      notes: assignForm.notes || null,
    }).select('*, worker:tradie_workers(name), job:jobs(title, suburb)').single()
    if (data) {
      setAssignments(prev => [...prev, data])
      setAssigned(true)
      setAssignForm(f => ({ ...f, notes:'' }))
      setTimeout(() => setAssigned(false), 2000)
    }
    setAssigning(false)
  }

  const removeWorker = async (id: string) => {
    if (!confirm('Remove this worker from your team?')) return
    const supabase = createClient()
    await supabase.from('tradie_workers').update({ status: 'removed' }).eq('id', id)
    setWorkers(prev => prev.filter(w => w.id !== id))
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', boxSizing:'border-box' as const, fontFamily:'sans-serif' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={profile} isTradie={true} backLabel="← Dashboard" backHref="/tradie/dashboard" />

      <div style={{ background:'#0A0A0A', padding:'28px 24px' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Field team</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'24px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 4px' }}>WORKERS</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>
            Invite workers to see their assigned jobs and site briefs. They cannot access client details, quotes or financials.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', alignItems:'start' }}>

        {/* Left — invite + worker list */}
        <div>
          {/* Seat status */}
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>Worker seats</p>
              <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{activeWorkers} of {seatsAllowed} seats used · {profile?.tradie?.subscription_tier || 'basic'} plan</p>
            </div>
            {seatsAllowed === 0 && (
              <a href="mailto:support@steadyhandtrade.app?subject=Additional worker seats&body=Hi, I would like to add more worker seats to my account." 
                style={{ fontSize:'12px', color:'#D4522A', fontWeight:500, textDecoration:'none' }}>Contact us to add seats →</a>
            )}
          </div>

          {/* Invite form */}
          {seatsAllowed > 0 && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>INVITE A WORKER</p>
              </div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                <div><label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Name</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Worker name" style={inp} /></div>
                <div><label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="worker@example.com" style={inp} /></div>
                <div><label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Phone (optional)</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="04xx xxx xxx" style={inp} /></div>
                {error && <p style={{ fontSize:'12px', color:'#D4522A', margin:0 }}>{error}</p>}
                {invited && <p style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Invitation sent</p>}
                <button type="button" onClick={inviteWorker} disabled={inviting || !form.email}
                  style={{ background: inviting || !form.email ? 'rgba(28,43,50,0.2)' : '#0A0A0A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  {inviting ? 'Sending...' : 'Send invitation →'}
                </button>
              </div>
            </div>
          )}

          {/* Worker list */}
          {workers.length > 0 && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>YOUR TEAM</p>
              </div>
              <div style={{ padding:'8px' }}>
                {workers.filter((w:any) => w.status !== 'removed').map((w:any) => (
                  <div key={w.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:'8px', borderBottom:'1px solid rgba(28,43,50,0.06)', gap:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'13px', color:'rgba(216,228,225,0.7)' }}>{(w.name || w.email).charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 1px' }}>{w.name || w.email}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{w.email}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background: w.status === 'active' ? 'rgba(46,125,96,0.1)' : 'rgba(192,120,48,0.1)', color: w.status === 'active' ? '#2E7D60' : '#C07830', border:'1px solid ' + (w.status === 'active' ? 'rgba(46,125,96,0.25)' : 'rgba(192,120,48,0.25)') }}>
                        {w.status === 'active' ? 'Active' : 'Invited'}
                      </span>
                      <button type="button" onClick={() => removeWorker(w.id)} style={{ fontSize:'11px', color:'#9AA5AA', background:'none', border:'1px solid rgba(28,43,50,0.15)', borderRadius:'5px', padding:'3px 8px', cursor:'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — assign workers to jobs */}
        <div>
          {workers.filter((w:any) => w.status === 'active').length > 0 && jobs.length > 0 && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>ASSIGN TO JOB</p>
              </div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Worker</label>
                  <select value={assignForm.workerId} onChange={e => setAssignForm(f => ({ ...f, workerId: e.target.value }))} style={inp}>
                    <option value="">Select worker</option>
                    {workers.filter((w:any) => w.status === 'active').map((w:any) => <option key={w.id} value={w.id}>{w.name || w.email}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Job</label>
                  <select value={assignForm.jobId} onChange={e => setAssignForm(f => ({ ...f, jobId: e.target.value }))} style={inp}>
                    <option value="">Select job</option>
                    {jobs.map((j:any) => <option key={j.id} value={j.id}>{j.title} — {j.suburb}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Date</label>
                  <input type="date" value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:500, color:'#0A0A0A', display:'block', marginBottom:'4px' }}>Notes (optional)</label>
                  <textarea value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions for this assignment" rows={2} style={{ ...inp, resize:'none' as const }} />
                </div>
                {assigned && <p style={{ fontSize:'12px', color:'#2E7D60', fontWeight:500, margin:0 }}>✓ Assigned</p>}
                <button type="button" onClick={assignWorker} disabled={assigning || !assignForm.workerId || !assignForm.jobId}
                  style={{ background: assigning || !assignForm.workerId || !assignForm.jobId ? 'rgba(28,43,50,0.2)' : '#2E7D60', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  {assigning ? 'Assigning...' : 'Assign worker →'}
                </button>
              </div>
            </div>
          )}

          {/* Upcoming assignments */}
          {assignments.length > 0 && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>UPCOMING ASSIGNMENTS</p>
              </div>
              <div style={{ padding:'8px' }}>
                {assignments.map((a:any) => (
                  <div key={a.id} style={{ padding:'10px 12px', borderBottom:'1px solid rgba(28,43,50,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:'0 0 2px' }}>{a.worker?.name}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{a.job?.title} · {new Date(a.assigned_date).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })}</p>
                    </div>
                    <span style={{ fontSize:'11px', color:'#2E6A8F', background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'100px', padding:'2px 8px', flexShrink:0 }}>{a.job?.suburb}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
