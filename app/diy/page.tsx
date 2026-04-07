'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AREAS = ['Kitchen', 'Bathroom', 'Living room', 'Bedroom', 'Garden', 'Garage', 'Laundry', 'Outdoor', 'Roof', 'Other']

const WA_CHECKLIST = [
  { category: 'Before you start', items: [
    'Obtain owner-builder permit from WA Building Commission',
    'Confirm you meet the 6-year rule (no previous owner-builder permit in last 6 years)',
    'Arrange owner-builder insurance (mandatory for projects over $20,000)',
    'Lodge building permit application with local council',
    'Obtain approved building plans from a registered building designer',
    'Confirm site survey and setbacks comply with local planning scheme',
  ]},
  { category: 'During construction', items: [
    'Display building permit on site',
    'Engage licensed contractors for regulated work (electrical, plumbing, gas)',
    'Obtain certificates of compliance from each licensed contractor',
    'Book mandatory inspections at required stages',
    'Document all variations to approved plans',
    'Maintain site safety — WorkSafe WA requirements',
  ]},
  { category: 'Inspections', items: [
    'Footing inspection before pouring concrete',
    'Frame inspection before lining',
    'Wet area waterproofing inspection',
    'Final inspection before occupation',
    'Certificate of construction compliance issued',
  ]},
  { category: 'Completion', items: [
    'Obtain occupancy permit from local council',
    'Collect all certificates of compliance from trades',
    'Register completion with WA Building Commission',
    'Note: You cannot sell the property for 7 years without disclosure',
    'Update home insurance to reflect completed works',
  ]},
]

export default function DIYPage() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'trades'|'tasks'|'budget'|'compliance'>('overview')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewExpense, setShowNewExpense] = useState(false)
  const [newProject, setNewProject] = useState({ title:'', description:'', address:'', permit_number:'', project_type:'owner_builder', budget_estimate:'', estimated_completion:'', builder_registration:'' })
  const [newTask, setNewTask] = useState('')
  const [newExpense, setNewExpense] = useState({ description:'', amount:'', date:'' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const { data: proj } = await supabase.from('diy_projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      setProjects(proj || [])
      if (proj && proj.length > 0) {
        setActiveProject(proj[0].id)
        const ids = proj.map((p: any) => p.id)
        const { data: t } = await supabase.from('diy_tasks').select('*').in('project_id', ids).order('created_at', { ascending: true })
        setTasks(t || [])
        const { data: e } = await supabase.from('diy_expenses').select('*').in('project_id', ids).order('date', { ascending: false })
        setExpenses(e || [])
        const { data: cl } = await supabase.from('ob_checklist_items').select('*').in('project_id', ids)
        setChecklist(cl || [])
      }
      setLoading(false)
    })
  }, [])

  const createProject = async () => {
    if (!newProject.title) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: proj } = await supabase.from('diy_projects').insert({
      user_id: session?.user.id,
      title: newProject.title,
      description: newProject.description || null,
      address: newProject.address || null,
      permit_number: newProject.permit_number || null,
      project_type: newProject.project_type,
      budget_estimate: newProject.budget_estimate ? Number(newProject.budget_estimate) : null,
      estimated_completion: newProject.estimated_completion || null,
      builder_registration: newProject.builder_registration || null,
      status: 'active',
    }).select().single()
    if (proj) {
      // Pre-populate WA compliance checklist
      if (newProject.project_type === 'owner_builder') {
        const items = WA_CHECKLIST.flatMap(cat =>
          cat.items.map(item => ({ project_id: proj.id, category: cat.category, item }))
        )
        await supabase.from('ob_checklist_items').insert(items)
        const { data: cl } = await supabase.from('ob_checklist_items').select('*').eq('project_id', proj.id)
        setChecklist(prev => [...prev, ...(cl || [])])
      }
      setProjects(prev => [proj, ...prev])
      setActiveProject(proj.id)
      setActiveTab('overview')
      setShowNewProject(false)
      setNewProject({ title:'', description:'', address:'', permit_number:'', project_type:'owner_builder', budget_estimate:'', estimated_completion:'', builder_registration:'' })
    }
  }

  const addTask = async () => {
    if (!newTask.trim() || !activeProject) return
    const supabase = createClient()
    const { data: task } = await supabase.from('diy_tasks').insert({ project_id: activeProject, label: newTask.trim() }).select().single()
    if (task) { setTasks(prev => [...prev, task]); setNewTask(''); setShowNewTask(false) }
  }

  const toggleTask = async (id: string, completed: boolean) => {
    const supabase = createClient()
    await supabase.from('diy_tasks').update({ completed: !completed }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
  }

  const deleteTask = async (id: string) => {
    const supabase = createClient()
    await supabase.from('diy_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !activeProject) return
    const supabase = createClient()
    const { data: exp } = await supabase.from('diy_expenses').insert({
      project_id: activeProject,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString().split('T')[0],
    }).select().single()
    if (exp) {
      setExpenses(prev => [exp, ...prev])
      const total = expenses.filter(e => e.project_id === activeProject).reduce((s, e) => s + Number(e.amount), 0) + Number(newExpense.amount)
      await supabase.from('diy_projects').update({ budget_actual: total }).eq('id', activeProject)
      setProjects(prev => prev.map(p => p.id === activeProject ? { ...p, budget_actual: total } : p))
      setNewExpense({ description:'', amount:'', date:'' })
      setShowNewExpense(false)
    }
  }

  const toggleChecklist = async (id: string, completed: boolean) => {
    const supabase = createClient()
    await supabase.from('ob_checklist_items').update({ completed: !completed }).eq('id', id)
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completed: !completed } : c))
  }

  const convertToJob = (project: any) => {
    const params = new URLSearchParams({
      title: project.title,
      description: project.description || '',
      address: project.address || '',
    })
    window.location.href = '/request?' + params.toString()
  }

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('diy_projects').update({ status }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const getProjectTasks = (id: string) => tasks.filter(t => t.project_id === id)
  const getProjectExpenses = (id: string) => expenses.filter(e => e.project_id === id)
  const getProjectChecklist = (id: string) => checklist.filter(c => c.project_id === id)

  const inp = { width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif', boxSizing:'border-box' as const }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div>

  const activeProj = projects.find(p => p.id === activeProject)
  const projExpenses = activeProj ? getProjectExpenses(activeProj.id) : []
  const projTasks = activeProj ? getProjectTasks(activeProj.id) : []
  const projChecklist = activeProj ? getProjectChecklist(activeProj.id) : []
  const totalSpent = projExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const checklistDone = projChecklist.filter(c => c.completed).length
  const checklistTotal = projChecklist.length

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px' }}>BUILD JOURNAL</div>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'260px 1fr', gap:'24px', alignItems:'start' }}>

        {/* LEFT — Project list */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'1px', margin:0 }}>MY BUILDS</h2>
            <button type="button" onClick={() => setShowNewProject(true)} style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>+ New</button>
          </div>

          {showNewProject && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'12px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'12px' }}>NEW BUILD</p>
              <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'12px' }}>
                <input placeholder="Project name *" value={newProject.title} onChange={e => setNewProject(f => ({ ...f, title: e.target.value }))} style={inp} />
                <input placeholder="Site address" value={newProject.address} onChange={e => setNewProject(f => ({ ...f, address: e.target.value }))} style={inp} />
                <select value={newProject.project_type} onChange={e => setNewProject(f => ({ ...f, project_type: e.target.value }))} style={inp}>
                  <option value="owner_builder">Owner-builder</option>
                  <option value="renovation">Renovation</option>
                  <option value="diy">DIY project</option>
                </select>
                <input placeholder="Permit number" value={newProject.permit_number} onChange={e => setNewProject(f => ({ ...f, permit_number: e.target.value }))} style={inp} />
                <input placeholder="Builder registration no." value={newProject.builder_registration} onChange={e => setNewProject(f => ({ ...f, builder_registration: e.target.value }))} style={inp} />
                <input type="number" placeholder="Total budget ($)" value={newProject.budget_estimate} onChange={e => setNewProject(f => ({ ...f, budget_estimate: e.target.value }))} style={inp} />
                <input type="date" placeholder="Target completion" value={newProject.estimated_completion} onChange={e => setNewProject(f => ({ ...f, estimated_completion: e.target.value }))} style={inp} />
                <textarea placeholder="Description / notes" value={newProject.description} onChange={e => setNewProject(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize:'vertical' as const }} />
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ background:'transparent', color:'#1C2B32', border:'1px solid rgba(28,43,50,0.25)', borderRadius:'8px', padding:'9px 14px', fontSize:'12px', cursor:'pointer' }}>Cancel</button>
                <button type="button" onClick={createProject} disabled={!newProject.title} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'9px', fontSize:'12px', fontWeight:500, cursor:'pointer', opacity: !newProject.title ? 0.5 : 1 }}>Create build</button>
              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {projects.length === 0 && !showNewProject && (
              <div style={{ textAlign:'center' as const, padding:'32px 16px', background:'#E8F0EE', borderRadius:'12px', border:'1px solid rgba(28,43,50,0.1)' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px', opacity:0.4 }}>🏗</div>
                <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'4px' }}>No builds yet</p>
                <p style={{ fontSize:'12px', color:'#9AA5AA' }}>Click + New to start tracking your build project</p>
              </div>
            )}
            {projects.map(proj => {
              const pTasks = getProjectTasks(proj.id)
              const done = pTasks.filter(t => t.completed).length
              const pChecklist = getProjectChecklist(proj.id)
              const clDone = pChecklist.filter(c => c.completed).length
              const isActive = activeProject === proj.id
              return (
                <div key={proj.id} onClick={() => { setActiveProject(proj.id); setActiveTab('overview') }}
                  style={{ background: isActive ? '#1C2B32' : '#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px', cursor:'pointer' }}>
                  <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color: isActive ? 'rgba(216,228,225,0.9)' : '#1C2B32', marginBottom:'3px' }}>{proj.title}</div>
                  {proj.address && <div style={{ fontSize:'11px', color: isActive ? 'rgba(216,228,225,0.45)' : '#7A9098', marginBottom:'6px' }}>{proj.address}</div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'100px', background: proj.status === 'complete' ? 'rgba(46,125,96,0.15)' : 'rgba(212,82,42,0.12)', color: proj.status === 'complete' ? '#2E7D60' : '#D4522A', textTransform:'capitalize' as const }}>{proj.project_type?.replace('_',' ')}</span>
                    <span style={{ fontSize:'10px', color: isActive ? 'rgba(216,228,225,0.4)' : '#9AA5AA' }}>{clDone}/{pChecklist.length} compliance</span>
                  </div>
                  {pTasks.length > 0 && (
                    <div style={{ height:'3px', background:'rgba(28,43,50,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', background: isActive ? '#D4522A' : '#2E7D60', width:(done/pTasks.length*100)+'%', transition:'width 0.3s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Project detail */}
        <div>
          {!activeProj ? (
            <div style={{ textAlign:'center' as const, padding:'64px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px', opacity:0.3 }}>🏗</div>
              <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:500, marginBottom:'8px' }}>Select or create a build</p>
              <p style={{ fontSize:'13px', color:'#7A9098' }}>Track your build project from permit to completion — all your trades, costs, tasks and compliance in one place.</p>
            </div>
          ) : (
            <>
              {/* Project hero */}
              <div style={{ background:'#1C2B32', borderRadius:'14px', padding:'22px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const, marginBottom:'16px' }}>
                    <div>
                      <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>{activeProj.title}</h2>
                      {activeProj.address && <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', marginBottom:'2px' }}>📍 {activeProj.address}</p>}
                      {activeProj.permit_number && <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)' }}>Permit: {activeProj.permit_number}</p>}
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexShrink:0, flexWrap:'wrap' as const }}>
                      <select value={activeProj.status} onChange={e => updateStatus(activeProj.id, e.target.value)}
                        style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'rgba(216,228,225,0.8)', fontSize:'12px', outline:'none', cursor:'pointer' }}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="complete">Complete</option>
                      </select>
                      <button type="button" onClick={() => convertToJob(activeProj)}
                        style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>
                        + Add trade package →
                      </button>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
                    {[
                      { label:'Budget', value: activeProj.budget_estimate ? '$'+Number(activeProj.budget_estimate).toLocaleString() : '—' },
                      { label:'Spent', value: '$'+totalSpent.toLocaleString(), alert: activeProj.budget_estimate && totalSpent > Number(activeProj.budget_estimate) },
                      { label:'Tasks done', value: projTasks.filter(t => t.completed).length+'/'+projTasks.length },
                      { label:'Compliance', value: checklistDone+'/'+checklistTotal },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', marginBottom:'2px' }}>{s.label}</div>
                        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color: (s as any).alert ? '#D4522A' : 'rgba(216,228,225,0.85)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)', marginBottom:'20px' }}>
                {([
                  { id:'overview', label:'Overview' },
                  { id:'trades', label:'Trade packages' },
                  { id:'tasks', label:'Tasks', count: projTasks.length },
                  { id:'budget', label:'Budget', count: projExpenses.length },
                  { id:'compliance', label:'Compliance', count: checklistTotal > 0 ? checklistDone+'/'+checklistTotal : undefined },
                ] as const).map(t => (
                  <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                    style={{ padding:'9px 16px', border:'none', borderBottom: activeTab === t.id ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'12px', fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#1C2B32' : '#7A9098', display:'flex', alignItems:'center', gap:'5px' }}>
                    {t.label}
                    {(t as any).count !== undefined && <span style={{ fontSize:'10px', background: activeTab === t.id ? '#D4522A' : 'rgba(28,43,50,0.1)', color: activeTab === t.id ? 'white' : '#7A9098', padding:'1px 5px', borderRadius:'100px' }}>{(t as any).count}</span>}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>Project details</p>
                    {[
                      { label:'Type', value: activeProj.project_type?.replace('_',' ') },
                      { label:'Permit', value: activeProj.permit_number || '—' },
                      { label:'Builder reg.', value: activeProj.builder_registration || '—' },
                      { label:'Target completion', value: activeProj.estimated_completion ? new Date(activeProj.estimated_completion).toLocaleDateString('en-AU') : '—' },
                    ].map(d => (
                      <div key={d.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(28,43,50,0.06)', fontSize:'13px' }}>
                        <span style={{ color:'#7A9098' }}>{d.label}</span>
                        <span style={{ color:'#1C2B32', fontWeight:500, textTransform:'capitalize' as const }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px' }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>Progress snapshot</p>
                    {[
                      { label:'Tasks completed', value: projTasks.filter(t=>t.completed).length+' of '+projTasks.length, pct: projTasks.length > 0 ? projTasks.filter(t=>t.completed).length/projTasks.length : 0, color:'#2E7D60' },
                      { label:'Compliance items', value: checklistDone+' of '+checklistTotal, pct: checklistTotal > 0 ? checklistDone/checklistTotal : 0, color:'#6B4FA8' },
                      { label:'Budget used', value: activeProj.budget_estimate ? Math.round(totalSpent/Number(activeProj.budget_estimate)*100)+'%' : '—', pct: activeProj.budget_estimate ? Math.min(totalSpent/Number(activeProj.budget_estimate), 1) : 0, color: totalSpent > Number(activeProj.budget_estimate||0) ? '#D4522A' : '#C07830' },
                    ].map(s => (
                      <div key={s.label} style={{ marginBottom:'12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
                          <span style={{ color:'#4A5E64' }}>{s.label}</span>
                          <span style={{ color:'#1C2B32', fontWeight:500 }}>{s.value}</span>
                        </div>
                        <div style={{ height:'4px', background:'rgba(28,43,50,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:(s.pct*100)+'%', background:s.color, borderRadius:'2px', transition:'width 0.3s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {activeProj.description && (
                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px', gridColumn:'1/-1' }}>
                      <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'8px' }}>Notes</p>
                      <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>{activeProj.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Trades tab */}
              {activeTab === 'trades' && (
                <div>
                  <div style={{ background:'rgba(46,106,143,0.08)', border:'1px solid rgba(46,106,143,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                    <p style={{ fontSize:'13px', color:'#2E6A8F', fontWeight:500, marginBottom:'4px' }}>How trade packages work</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                      Each trade package is a full Steadyhand job — with a scope agreement, milestone payments, and warranty tracking. Click below to create a new job request pre-linked to this build.
                    </p>
                  </div>
                  <button type="button" onClick={() => convertToJob(activeProj)}
                    style={{ width:'100%', background:'#D4522A', color:'white', padding:'13px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', marginBottom:'16px' }}>
                    + Add trade package (new job request) →
                  </button>
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'24px', textAlign:'center' as const }}>
                    <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.4 }}>🔧</div>
                    <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px' }}>No trade packages yet</p>
                    <p style={{ fontSize:'13px', color:'#7A9098' }}>Each time you hire a tradie through Steadyhand for this build, it will appear here with its full job record.</p>
                  </div>
                </div>
              )}

              {/* Tasks tab */}
              {activeTab === 'tasks' && (
                <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
                  <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500, margin:0 }}>Tasks ({projTasks.filter(t=>t.completed).length}/{projTasks.length})</p>
                    <button type="button" onClick={() => setShowNewTask(true)} style={{ fontSize:'12px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>+ Add task</button>
                  </div>
                  {showNewTask && (
                    <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', gap:'8px' }}>
                      <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Task description..." style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                      <button type="button" onClick={addTask} style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', cursor:'pointer' }}>Add</button>
                      <button type="button" onClick={() => { setShowNewTask(false); setNewTask('') }} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 10px', fontSize:'13px', cursor:'pointer' }}>×</button>
                    </div>
                  )}
                  {projTasks.length === 0 && !showNewTask && (
                    <div style={{ padding:'32px', textAlign:'center' as const, color:'#7A9098', fontSize:'13px' }}>No tasks yet — add one above</div>
                  )}
                  {projTasks.map(task => (
                    <div key={task.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                      <div onClick={() => toggleTask(task.id, task.completed)}
                        style={{ width:'18px', height:'18px', borderRadius:'4px', border:'1.5px solid '+(task.completed?'#2E7D60':'rgba(28,43,50,0.25)'), background:task.completed?'#2E7D60':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:'11px', color:'white' }}>
                        {task.completed?'✓':''}
                      </div>
                      <span style={{ flex:1, fontSize:'13px', color:task.completed?'#7A9098':'#1C2B32', textDecoration:task.completed?'line-through':'none' }}>{task.label}</span>
                      <button type="button" onClick={() => deleteTask(task.id)} style={{ background:'none', border:'none', color:'rgba(212,82,42,0.4)', cursor:'pointer', fontSize:'14px', padding:'0 4px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Budget tab */}
              {activeTab === 'budget' && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
                    {[
                      { label:'Total budget', value: activeProj.budget_estimate ? '$'+Number(activeProj.budget_estimate).toLocaleString() : '—', color:'#1C2B32' },
                      { label:'Total spent', value: '$'+totalSpent.toLocaleString(), color: activeProj.budget_estimate && totalSpent > Number(activeProj.budget_estimate) ? '#D4522A' : '#2E7D60' },
                      { label:'Remaining', value: activeProj.budget_estimate ? '$'+(Number(activeProj.budget_estimate)-totalSpent).toLocaleString() : '—', color:'#4A5E64' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'16px' }}>
                        <p style={{ fontSize:'11px', color:'#7A9098', marginBottom:'6px' }}>{s.label}</p>
                        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:s.color, margin:0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
                    <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500, margin:0 }}>Expense log</p>
                      <button type="button" onClick={() => setShowNewExpense(true)} style={{ fontSize:'12px', color:'#C07830', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>+ Add expense</button>
                    </div>
                    {showNewExpense && (
                      <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 130px', gap:'8px', marginBottom:'8px' }}>
                          <input placeholder="Description" value={newExpense.description} onChange={e => setNewExpense(f => ({ ...f, description: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                          <input type="number" placeholder="$" value={newExpense.amount} onChange={e => setNewExpense(f => ({ ...f, amount: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                          <input type="date" value={newExpense.date} onChange={e => setNewExpense(f => ({ ...f, date: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                        </div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button type="button" onClick={addExpense} disabled={!newExpense.description||!newExpense.amount} style={{ flex:1, background:'#C07830', color:'white', border:'none', borderRadius:'8px', padding:'8px', fontSize:'13px', cursor:'pointer', opacity:!newExpense.description||!newExpense.amount?0.5:1 }}>Add expense</button>
                          <button type="button" onClick={() => setShowNewExpense(false)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', cursor:'pointer' }}>×</button>
                        </div>
                      </div>
                    )}
                    {projExpenses.length === 0 && !showNewExpense && (
                      <div style={{ padding:'32px', textAlign:'center' as const, color:'#7A9098', fontSize:'13px' }}>No expenses logged yet</div>
                    )}
                    {projExpenses.map(exp => (
                      <div key={exp.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                        <div>
                          <div style={{ fontSize:'13px', color:'#1C2B32', fontWeight:500 }}>{exp.description}</div>
                          <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>{new Date(exp.date).toLocaleDateString('en-AU')}</div>
                        </div>
                        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#C07830' }}>${Number(exp.amount).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance tab */}
              {activeTab === 'compliance' && (
                <div>
                  <div style={{ background:'rgba(107,79,168,0.08)', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                    <p style={{ fontSize:'13px', color:'#6B4FA8', fontWeight:500, marginBottom:'4px' }}>WA Owner-Builder Compliance Checklist</p>
                    <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.6', margin:0 }}>
                      Based on WA Building Commission requirements. Tick items as you complete them — this creates your compliance record. Always verify current requirements with the Building Commission directly.
                    </p>
                  </div>
                  {projChecklist.length === 0 ? (
                    <div style={{ textAlign:'center' as const, padding:'32px', background:'#E8F0EE', borderRadius:'12px', color:'#7A9098', fontSize:'13px' }}>
                      Compliance checklist is pre-populated for build projects when you create them.
                    </div>
                  ) : (
                    WA_CHECKLIST.map(cat => {
                      const catItems = projChecklist.filter(c => c.category === cat.category)
                      const catDone = catItems.filter(c => c.completed).length
                      return (
                        <div key={cat.category} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'12px' }}>
                          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', background: catDone === catItems.length && catItems.length > 0 ? 'rgba(46,125,96,0.08)' : 'rgba(28,43,50,0.03)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <p style={{ fontSize:'12px', fontWeight:600, color: catDone === catItems.length && catItems.length > 0 ? '#2E7D60' : '#1C2B32', margin:0 }}>{cat.category}</p>
                            <span style={{ fontSize:'11px', color:'#7A9098' }}>{catDone}/{catItems.length}</span>
                          </div>
                          {catItems.map(item => (
                            <div key={item.id} onClick={() => toggleChecklist(item.id, item.completed)}
                              style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.05)', cursor:'pointer' }}>
                              <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:'1.5px solid '+(item.completed?'#2E7D60':'rgba(28,43,50,0.25)'), background:item.completed?'#2E7D60':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px', fontSize:'11px', color:'white' }}>
                                {item.completed?'✓':''}
                              </div>
                              <span style={{ fontSize:'13px', color:item.completed?'#7A9098':'#1C2B32', textDecoration:item.completed?'line-through':'none', lineHeight:'1.5' }}>{item.item}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
