'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerJobsPage() {
  const [worker, setWorker] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*, tradie:tradie_profiles(business_name)').eq('id', session.user.id).single()
      if (!prof || prof.role !== 'worker') { window.location.href = '/dashboard'; return }
      setWorker(prof)

      // Load today's assignments + upcoming
      const { data: workerRec } = await supabase.from('tradie_workers').select('id').eq('profile_id', session.user.id).single()
      if (workerRec) {
        const { data: asgn } = await supabase
          .from('job_worker_assignments')
          .select('*, job:jobs(id, title, trade_category, suburb, address, description, status, client:profiles!jobs_client_id_fkey(full_name, phone), site_assessments(tradie_internal_notes, tradie_materials_notes, tradie_labour_notes, tradie_site_brief, consult_date))')
          .eq('worker_id', workerRec.id)
          .gte('assigned_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('assigned_date', { ascending: true })
        setAssignments(asgn || [])
        if (asgn && asgn.length > 0) setSelectedJob(asgn[0])
      }
      setLoading(false)
    })
  }, [])

  const uploadPhoto = async () => {
    if (!fileRef.current?.files?.[0] || !selectedJob) return
    setUploading(true)
    const supabase = createClient()
    const file = fileRef.current.files[0]
    const ext = file.name.split('.').pop()
    const path = 'worker-photos/' + selectedJob.job.id + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('Job Photos').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('Job Photos').getPublicUrl(path)
      setUploadedPhotos(prev => [...prev, publicUrl])
      // Notify tradie
      try {
        await supabase.from('notifications').insert({
          user_id: selectedJob.job.tradie_id,
          message: (worker?.full_name || 'A worker') + ' uploaded a photo for ' + selectedJob.job.title,
          job_id: selectedJob.job.id,
        })
      } catch (_e) {}
    }
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
  }

  const saveNote = async () => {
    if (!note.trim() || !selectedJob) return
    setSavingNote(true)
    const supabase = createClient()
    await supabase.from('job_messages').insert({
      job_id: selectedJob.job.id,
      sender_id: worker?.id,
      body: '📋 Worker note from ' + (worker?.full_name || 'worker') + ': ' + note,
    }).catch(() => {})
    setNote('')
    setNoteSaved(true)
    setSavingNote(false)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const today = new Date().toDateString()
  const todayJobs = assignments.filter(a => new Date(a.assigned_date).toDateString() === today)
  const upcomingJobs = assignments.filter(a => new Date(a.assigned_date).toDateString() !== today && new Date(a.assigned_date) >= new Date())

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64' }}>Loading your jobs...</p></div>

  const assessment = selectedJob?.job?.site_assessments?.[0]
  const mapsUrl = selectedJob ? 'https://maps.google.com/?q=' + encodeURIComponent([selectedJob.job.address, selectedJob.job.suburb, 'WA', 'Australia'].filter(Boolean).join(' ')) : ''

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif', paddingBottom:'32px' }}>

      {/* Header */}
      <div style={{ background:'#0A0A0A', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#D4522A', letterSpacing:'2px', margin:0 }}>STEADYHAND</p>
        <div style={{ textAlign:'right' as const }}>
          <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.7)', margin:0 }}>{worker?.full_name || 'Worker'}</p>
          <p style={{ fontSize:'11px', color:'rgba(216,228,225,0.35)', margin:0 }}>{worker?.tradie?.business_name}</p>
        </div>
      </div>

      {/* Today banner */}
      <div style={{ background:'#141414', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.35)', margin:0 }}>
          {new Date().toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'16px' }}>

        {/* No jobs */}
        {assignments.length === 0 && (
          <div style={{ background:'#E8F0EE', borderRadius:'12px', padding:'32px', textAlign:'center' as const, marginTop:'16px' }}>
            <p style={{ fontSize:'32px', marginBottom:'12px' }}>📋</p>
            <p style={{ fontSize:'15px', fontWeight:500, color:'#0A0A0A', marginBottom:'6px' }}>No jobs assigned yet</p>
            <p style={{ fontSize:'13px', color:'#7A9098' }}>Your employer will assign jobs to you here. Check back soon.</p>
          </div>
        )}

        {/* Today's jobs */}
        {todayJobs.length > 0 && (
          <div style={{ marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 10px' }}>TODAY</p>
            {todayJobs.map(a => (
              <div key={a.id} onClick={() => setSelectedJob(a)}
                style={{ background: selectedJob?.id === a.id ? '#0A0A0A' : '#E8F0EE', border:'1px solid ' + (selectedJob?.id === a.id ? 'transparent' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', padding:'14px 16px', marginBottom:'8px', cursor:'pointer' }}>
                <p style={{ fontSize:'14px', fontWeight:600, color: selectedJob?.id === a.id ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:'0 0 3px' }}>{a.job?.title}</p>
                <p style={{ fontSize:'12px', color: selectedJob?.id === a.id ? 'rgba(216,228,225,0.45)' : '#7A9098', margin:0 }}>{a.job?.trade_category} · {a.job?.suburb}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming */}
        {upcomingJobs.length > 0 && (
          <div style={{ marginBottom:'20px' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 10px' }}>UPCOMING</p>
            {upcomingJobs.map(a => (
              <div key={a.id} onClick={() => setSelectedJob(a)}
                style={{ background: selectedJob?.id === a.id ? '#0A0A0A' : '#E8F0EE', border:'1px solid ' + (selectedJob?.id === a.id ? 'transparent' : 'rgba(28,43,50,0.1)'), borderRadius:'12px', padding:'14px 16px', marginBottom:'8px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:600, color: selectedJob?.id === a.id ? 'rgba(216,228,225,0.9)' : '#0A0A0A', margin:'0 0 3px' }}>{a.job?.title}</p>
                    <p style={{ fontSize:'12px', color: selectedJob?.id === a.id ? 'rgba(216,228,225,0.45)' : '#7A9098', margin:0 }}>{a.job?.suburb}</p>
                  </div>
                  <span style={{ fontSize:'12px', color: selectedJob?.id === a.id ? 'rgba(216,228,225,0.5)' : '#7A9098', flexShrink:0 }}>
                    {new Date(a.assigned_date).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected job detail */}
        {selectedJob && (
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginTop:'4px' }}>

            {/* Job header */}
            <div style={{ background:'#0A0A0A', padding:'16px 18px' }}>
              <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.35)', margin:'0 0 4px' }}>Job brief</p>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:'0 0 4px' }}>{selectedJob.job?.title}</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', margin:0 }}>{selectedJob.job?.trade_category} · {selectedJob.job?.suburb}</p>
            </div>

            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column' as const, gap:'14px' }}>

              {/* Address + Maps */}
              <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'12px 14px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 6px' }}>Address</p>
                <p style={{ fontSize:'13px', color:'#0A0A0A', margin:'0 0 8px' }}>{[selectedJob.job?.address, selectedJob.job?.suburb].filter(Boolean).join(', ') || selectedJob.job?.suburb || 'See notes'}</p>
                <a href={mapsUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  📍 Open in Google Maps →
                </a>
              </div>

              {/* Client first name + phone only */}
              {selectedJob.job?.client && (
                <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'12px 14px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 6px' }}>Client</p>
                  <p style={{ fontSize:'13px', color:'#0A0A0A', margin:'0 0 4px' }}>{selectedJob.job.client.full_name?.split(' ')[0]}</p>
                  {selectedJob.job.client.phone && (
                    <a href={'tel:' + selectedJob.job.client.phone} style={{ fontSize:'13px', color:'#D4522A', textDecoration:'none' }}>{selectedJob.job.client.phone}</a>
                  )}
                </div>
              )}

              {/* Site brief */}
              {(assessment?.tradie_site_brief || assessment?.tradie_materials_notes || assessment?.tradie_labour_notes) && (
                <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'12px 14px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 10px' }}>Site brief</p>
                  {assessment.tradie_site_brief && (
                    <div style={{ marginBottom:'10px' }}>
                      <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'0 0 4px' }}>Notes for workers</p>
                      <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.65', margin:0, whiteSpace:'pre-wrap' as const }}>{assessment.tradie_site_brief}</p>
                    </div>
                  )}
                  {assessment.tradie_materials_notes && (
                    <div style={{ marginBottom:'10px' }}>
                      <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'0 0 4px' }}>Materials</p>
                      <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.65', margin:0, whiteSpace:'pre-wrap' as const }}>{assessment.tradie_materials_notes}</p>
                    </div>
                  )}
                  {assessment.tradie_labour_notes && (
                    <div>
                      <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'0 0 4px' }}>Labour sequence</p>
                      <p style={{ fontSize:'13px', color:'#0A0A0A', lineHeight:'1.65', margin:0, whiteSpace:'pre-wrap' as const }}>{assessment.tradie_labour_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Photo upload */}
              <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'12px 14px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 10px' }}>Submit photos</p>
                {uploadedPhotos.length > 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'6px', marginBottom:'10px' }}>
                    {uploadedPhotos.map((url, i) => (
                      <img key={i} src={url} alt={'Photo ' + (i+1)} style={{ width:'100%', aspectRatio:'1', objectFit:'cover' as const, borderRadius:'6px' }} />
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'8px', display:'block', width:'100%' }} />
                <button type="button" onClick={uploadPhoto} disabled={uploading}
                  style={{ width:'100%', background: uploading ? 'rgba(28,43,50,0.2)' : '#0A0A0A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  {uploading ? 'Uploading...' : '📷 Upload photo'}
                </button>
              </div>

              {/* Field note */}
              <div style={{ background:'rgba(28,43,50,0.04)', borderRadius:'10px', padding:'12px 14px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', textTransform:'uppercase' as const, letterSpacing:'0.5px', margin:'0 0 8px' }}>Field note to boss</p>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Found additional damage behind wall. Need to discuss before proceeding..."
                  rows={3} style={{ width:'100%', padding:'10px 12px', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#0A0A0A', outline:'none', resize:'vertical' as const, fontFamily:'sans-serif', boxSizing:'border-box' as const, marginBottom:'8px' }} />
                <button type="button" onClick={saveNote} disabled={savingNote || !note.trim()}
                  style={{ width:'100%', background: noteSaved ? '#2E7D60' : savingNote || !note.trim() ? 'rgba(28,43,50,0.2)' : '#0A0A0A', color:'white', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                  {noteSaved ? '✓ Note sent' : savingNote ? 'Sending...' : 'Send note →'}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
