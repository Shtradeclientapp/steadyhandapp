'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AREAS = ['Kitchen', 'Bathroom', 'Living room', 'Bedroom', 'Garden', 'Garage', 'Laundry', 'Outdoor', 'Roof', 'Other']

export default function DIYPage() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<string|null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState<string|null>(null)
  const [showNewExpense, setShowNewExpense] = useState<string|null>(null)
  const [newProject, setNewProject] = useState({ title:'', description:'', area:'', budget_estimate:'', target_date:'' })
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
      area: newProject.area || null,
      budget_estimate: newProject.budget_estimate ? Number(newProject.budget_estimate) : null,
      target_date: newProject.target_date || null,
    }).select().single()
    if (proj) {
      setProjects(prev => [proj, ...prev])
      setActiveProject(proj.id)
      setShowNewProject(false)
      setNewProject({ title:'', description:'', area:'', budget_estimate:'', target_date:'' })
    }
  }

  const addTask = async (projectId: string) => {
    if (!newTask.trim()) return
    const supabase = createClient()
    const { data: task } = await supabase.from('diy_tasks').insert({ project_id: projectId, label: newTask.trim() }).select().single()
    if (task) { setTasks(prev => [...prev, task]); setNewTask(''); setShowNewTask(null) }
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

  const addExpense = async (projectId: string) => {
    if (!newExpense.description || !newExpense.amount) return
    const supabase = createClient()
    const { data: exp } = await supabase.from('diy_expenses').insert({
      project_id: projectId,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString().split('T')[0],
    }).select().single()
    if (exp) {
      setExpenses(prev => [exp, ...prev])
      const total = expenses.filter(e => e.project_id === projectId).reduce((s, e) => s + Number(e.amount), 0) + Number(newExpense.amount)
      await supabase.from('diy_projects').update({ budget_actual: total }).eq('id', projectId)
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, budget_actual: total } : p))
      setNewExpense({ description:'', amount:'', date:'' })
      setShowNewExpense(null)
    }
  }

  const convertToJob = (project: any) => {
    const params = new URLSearchParams({
      title: project.title,
      description: project.description || '',
      area: project.area || '',
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

  const inp = { width:'100%', padding:'10px 13px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'14px', background:'#F4F8F7', color:'#1C2B32', outline:'none', fontFamily:'sans-serif' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}><p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Loading...</p></div>

  const activeProj = projects.find(p => p.id === activeProject)

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/dashboard" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px' }}>OWNER-BUILDER HUB</div>
        <a href="/dashboard" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'280px 1fr', gap:'24px', alignItems:'start' }} className="diy-grid">

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#1C2B32', letterSpacing:'1px' }}>MY PROJECTS</h2>
            <button type="button" onClick={() => setShowNewProject(true)} style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>+ New</button>
          </div>

          {showNewProject && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px', marginBottom:'14px' }}>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'12px' }}>NEW PROJECT</p>
              <input placeholder="Project title *" value={newProject.title} onChange={e => setNewProject(f => ({ ...f, title: e.target.value }))} style={{ ...inp, marginBottom:'8px' }} />
              <textarea placeholder="Description" value={newProject.description} onChange={e => setNewProject(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize:'vertical' as const, marginBottom:'8px' }} />
              <select value={newProject.area} onChange={e => setNewProject(f => ({ ...f, area: e.target.value }))} style={{ ...inp, marginBottom:'8px' }}>
                <option value="">Select area...</option>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                <input type="number" placeholder="Budget ($)" value={newProject.budget_estimate} onChange={e => setNewProject(f => ({ ...f, budget_estimate: e.target.value }))} style={inp} />
                <input type="date" value={newProject.target_date} onChange={e => setNewProject(f => ({ ...f, target_date: e.target.value }))} style={inp} />
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button type="button" onClick={() => setShowNewProject(false)} style={{ background:'transparent', color:'#1C2B32', border:'1px solid rgba(28,43,50,0.25)', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                <button type="button" onClick={createProject} disabled={!newProject.title} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'9px', fontSize:'13px', fontWeight:500, cursor:'pointer', opacity: !newProject.title ? 0.5 : 1 }}>Create project</button>
              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {projects.length === 0 && !showNewProject && (
              <div style={{ textAlign:'center', padding:'32px 16px', background:'#E8F0EE', borderRadius:'12px', border:'1px solid rgba(28,43,50,0.1)' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px', opacity:0.4 }}>🏠</div>
                <p style={{ fontSize:'13px', color:'#7A9098' }}>No DIY projects yet</p>
                <p style={{ fontSize:'12px', color:'#7A9098', marginTop:'4px' }}>Click + New to start one</p>
              </div>
            )}
            {projects.map(proj => {
              const projTasks = getProjectTasks(proj.id)
              const done = projTasks.filter(t => t.completed).length
              const isActive = activeProject === proj.id
              return (
                <div key={proj.id} onClick={() => setActiveProject(proj.id)}
                  style={{ background: isActive ? '#1C2B32' : '#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color: isActive ? 'rgba(216,228,225,0.9)' : '#1C2B32', letterSpacing:'0.3px', marginBottom:'4px' }}>{proj.title}</div>
                  {proj.area && <div style={{ fontSize:'11px', color: isActive ? 'rgba(216,228,225,0.45)' : '#7A9098', marginBottom:'6px' }}>{proj.area}</div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:'11px', color: isActive ? 'rgba(216,228,225,0.5)' : '#7A9098' }}>{done}/{projTasks.length} tasks</div>
                    <span style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'100px', background: proj.status === 'complete' ? 'rgba(46,125,96,0.15)' : proj.status === 'paused' ? 'rgba(192,120,48,0.15)' : 'rgba(212,82,42,0.12)', color: proj.status === 'complete' ? '#2E7D60' : proj.status === 'paused' ? '#C07830' : '#D4522A', textTransform:'capitalize' as const }}>{proj.status}</span>
                  </div>
                  {projTasks.length > 0 && (
                    <div style={{ marginTop:'8px', height:'3px', background:'rgba(28,43,50,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', background: isActive ? '#D4522A' : '#2E7D60', width: (done/projTasks.length*100) + '%', transition:'width 0.3s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          {!activeProj ? (
            <div style={{ textAlign:'center', padding:'64px', background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)' }}>
              <div style={{ fontSize:'48px', marginBottom:'16px', opacity:0.3 }}>🔨</div>
              <p style={{ fontSize:'15px', color:'#4A5E64', fontWeight:500 }}>Select or create a project</p>
            </div>
          ) : (
            <>
              <div style={{ background:'#1C2B32', borderRadius:'14px', padding:'22px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 0%, rgba(212,82,42,0.18), transparent 50%)' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' as const, marginBottom:'12px' }}>
                    <div>
                      <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'rgba(216,228,225,0.9)', letterSpacing:'1px', marginBottom:'4px' }}>{activeProj.title}</h2>
                      {activeProj.area && <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)' }}>{activeProj.area}</p>}
                      {activeProj.description && <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.6)', marginTop:'6px', lineHeight:'1.5' }}>{activeProj.description}</p>}
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexShrink:0, flexWrap:'wrap' as const }}>
                      <select value={activeProj.status} onChange={e => updateStatus(activeProj.id, e.target.value)}
                        style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'rgba(216,228,225,0.8)', fontSize:'12px', outline:'none', cursor:'pointer' }}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="complete">Complete</option>
                      </select>
                      <button type="button" onClick={() => convertToJob(activeProj)}
                        style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontWeight:500, whiteSpace:'nowrap' as const }}>
                        Add a trade package →
                      </button>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'24px', flexWrap:'wrap' as const }}>
                    {activeProj.budget_estimate && (
                      <div>
                        <div style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', marginBottom:'2px' }}>Budget</div>
                        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'rgba(216,228,225,0.85)' }}>${Number(activeProj.budget_estimate).toLocaleString()}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', marginBottom:'2px' }}>Spent</div>
                      <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color: Number(activeProj.budget_actual) > Number(activeProj.budget_estimate || 0) ? '#D4522A' : 'rgba(216,228,225,0.85)' }}>
                        ${Number(activeProj.budget_actual || 0).toLocaleString()}
                      </div>
                    </div>
                    {activeProj.target_date && (
                      <div>
                        <div style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', marginBottom:'2px' }}>Target date</div>
                        <div style={{ fontSize:'14px', color:'rgba(216,228,225,0.75)' }}>{new Date(activeProj.target_date).toLocaleDateString('en-AU')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>Tasks ({getProjectTasks(activeProj.id).filter(t => t.completed).length}/{getProjectTasks(activeProj.id).length})</p>
                  <button type="button" onClick={() => setShowNewTask(activeProj.id)} style={{ fontSize:'12px', color:'#2E7D60', background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>+ Add task</button>
                </div>
                {showNewTask === activeProj.id && (
                  <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', gap:'8px' }}>
                    <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask(activeProj.id)} placeholder="Task description..." style={{ flex:1, padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                    <button type="button" onClick={() => addTask(activeProj.id)} style={{ background:'#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', cursor:'pointer' }}>Add</button>
                    <button type="button" onClick={() => { setShowNewTask(null); setNewTask('') }} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 10px', fontSize:'13px', cursor:'pointer' }}>×</button>
                  </div>
                )}
                {getProjectTasks(activeProj.id).length === 0 && showNewTask !== activeProj.id && (
                  <div style={{ padding:'24px', textAlign:'center', color:'#7A9098', fontSize:'13px' }}>No tasks yet — add one above</div>
                )}
                {getProjectTasks(activeProj.id).map(task => (
                  <div key={task.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div onClick={() => toggleTask(task.id, task.completed)}
                      style={{ width:'18px', height:'18px', borderRadius:'4px', border:'1.5px solid ' + (task.completed ? '#2E7D60' : 'rgba(28,43,50,0.25)'), background: task.completed ? '#2E7D60' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:'11px', color:'white' }}>
                      {task.completed ? '✓' : ''}
                    </div>
                    <span style={{ flex:1, fontSize:'13px', color: task.completed ? '#7A9098' : '#1C2B32', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.label}</span>
                    <button type="button" onClick={() => deleteTask(task.id)} style={{ background:'none', border:'none', color:'rgba(212,82,42,0.4)', cursor:'pointer', fontSize:'14px', padding:'0 4px', flexShrink:0 }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#7A9098', fontWeight:500 }}>Expenses</p>
                  <button type="button" onClick={() => setShowNewExpense(activeProj.id)} style={{ fontSize:'12px', color:'#C07830', background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>+ Add expense</button>
                </div>
                {showNewExpense === activeProj.id && (
                  <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px', marginBottom:'8px' }}>
                      <input placeholder="Description" value={newExpense.description} onChange={e => setNewExpense(f => ({ ...f, description: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                      <input type="number" placeholder="$" value={newExpense.amount} onChange={e => setNewExpense(f => ({ ...f, amount: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none', width:'80px' }} />
                      <input type="date" value={newExpense.date} onChange={e => setNewExpense(f => ({ ...f, date: e.target.value }))} style={{ padding:'8px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button type="button" onClick={() => addExpense(activeProj.id)} disabled={!newExpense.description || !newExpense.amount} style={{ flex:1, background:'#C07830', color:'white', border:'none', borderRadius:'8px', padding:'8px', fontSize:'13px', cursor:'pointer', opacity: !newExpense.description || !newExpense.amount ? 0.5 : 1 }}>Add expense</button>
                      <button type="button" onClick={() => setShowNewExpense(null)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', cursor:'pointer' }}>×</button>
                    </div>
                  </div>
                )}
                {getProjectExpenses(activeProj.id).length === 0 && showNewExpense !== activeProj.id && (
                  <div style={{ padding:'24px', textAlign:'center', color:'#7A9098', fontSize:'13px' }}>No expenses logged yet</div>
                )}
                {getProjectExpenses(activeProj.id).map(exp => (
                  <div key={exp.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <div>
                      <div style={{ fontSize:'13px', color:'#1C2B32', fontWeight:500 }}>{exp.description}</div>
                      <div style={{ fontSize:'11px', color:'#7A9098', marginTop:'2px' }}>{new Date(exp.date).toLocaleDateString('en-AU')}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#C07830' }}>${Number(exp.amount).toLocaleString()}</div>
                  </div>
                ))}
                {getProjectExpenses(activeProj.id).length > 0 && (
                  <div style={{ padding:'12px 18px', background:'rgba(28,43,50,0.03)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'13px', color:'#7A9098', fontWeight:500 }}>Total spent</span>
                    <span style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32' }}>${getProjectExpenses(activeProj.id).reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
