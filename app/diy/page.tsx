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
  const [childJobs, setChildJobs] = useState<any[]>([])
  const [wizardStep, setWizardStep] = useState(0)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [vaultDocs, setVaultDocs] = useState<any[]>([])
  const [savingPermit, setSavingPermit] = useState(false)
  const [occupancyInput, setOccupancyInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'sequence'|'trades'|'tasks'|'budget'|'compliance'>('overview')
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
        // Fetch child jobs linked to these projects
        const { data: cj } = await supabase
          .from('jobs')
          .select('id, title, status, trade_category, suburb, created_at, diy_project_id')
          .in('diy_project_id', ids)
          .order('created_at', { ascending: false })
        setChildJobs(cj || [])
        // Fetch vault compliance docs for these projects
        const { data: vd } = await supabase
          .from('vault_documents')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('document_type', 'compliance')
        setVaultDocs(vd || [])
      }
      setLoading(false)
    })
  }, [])

  const [creatingProject, setCreatingProject] = useState(false)

  const createProject = async () => {
    if (!newProject.title || creatingProject) return
    setCreatingProject(true)
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
    setCreatingProject(false)
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Delete this project and all its data? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('ob_checklist_items').delete().eq('project_id', projectId)
    await supabase.from('diy_tasks').delete().eq('project_id', projectId)
    await supabase.from('diy_expenses').delete().eq('project_id', projectId)
    await supabase.from('diy_projects').delete().eq('id', projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (activeProject === projectId) {
      const remaining = projects.filter(p => p.id !== projectId)
      setActiveProject(remaining[0]?.id || null)
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
    params.set('diy_project_id', project.id)
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
            <button type="button" onClick={() => { setShowNewProject(true); setWizardStep(0) }} style={{ background:'#D4522A', color:'white', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontWeight:500 }}>+ New</button>
          </div>

          {showNewProject && (
            <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px', marginBottom:'14px' }}>
              {/* Progress bar */}
              <div style={{ display:'flex', gap:'4px', marginBottom:'16px' }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i <= wizardStep ? '#D4522A' : 'rgba(28,43,50,0.12)', transition:'background 0.2s' }} />
                ))}
              </div>

              {/* Step 0 — Project type */}
              {wizardStep === 0 && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>What kind of project is this?</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'14px', lineHeight:'1.5' }}>This determines what guidance and compliance checklists Steadyhand prepares for you.</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'14px' }}>
                    {[
                      { value:'owner_builder', label:'Owner-builder', desc:'I have or am getting an owner-builder permit from the WA Building Commission' },
                      { value:'renovation', label:'Renovation / extension', desc:'Major work with multiple trades — no owner-builder permit required' },
                      { value:'diy', label:'Home project', desc:'Smaller project — some DIY, some tradies' },
                    ].map(opt => (
                      <div key={opt.value} onClick={() => setNewProject(f => ({ ...f, project_type: opt.value }))}
                        style={{ padding:'12px 14px', borderRadius:'8px', border:'1.5px solid ' + (newProject.project_type === opt.value ? '#D4522A' : 'rgba(28,43,50,0.15)'), background: newProject.project_type === opt.value ? 'rgba(212,82,42,0.06)' : 'white', cursor:'pointer' }}>
                        <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{opt.label}</p>
                        <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setWizardStep(1)} style={{ width:'100%', background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Continue →</button>
                </div>
              )}

              {/* Step 1 — Name + address */}
              {wizardStep === 1 && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>Name and site address</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'14px', lineHeight:'1.5' }}>Give your project a name you will recognise. The address is used to tag all documents and trade packages.</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'14px' }}>
                    <div>
                      <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Project name *</label>
                      <input placeholder="e.g. Subiaco extension 2026" value={newProject.title} onChange={e => setNewProject(f => ({ ...f, title: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Site address</label>
                      <input placeholder="e.g. 14 Example St, Subiaco WA 6008" value={newProject.address} onChange={e => setNewProject(f => ({ ...f, address: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setWizardStep(0)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', cursor:'pointer', color:'#1C2B32' }}>← Back</button>
                    <button type="button" onClick={() => setWizardStep(2)} disabled={!newProject.title} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer', opacity:!newProject.title?0.5:1 }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 2 — Budget + timeline */}
              {wizardStep === 2 && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>Budget and timeline</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'14px', lineHeight:'1.5' }}>Used to track spending and trigger timely reminders. You can update these at any time.</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'14px' }}>
                    <div>
                      <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Total budget estimate ($)</label>
                      <input type="number" placeholder="e.g. 150000" value={newProject.budget_estimate} onChange={e => setNewProject(f => ({ ...f, budget_estimate: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Target completion date</label>
                      <input type="date" value={newProject.estimated_completion} onChange={e => setNewProject(f => ({ ...f, estimated_completion: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setWizardStep(1)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', cursor:'pointer', color:'#1C2B32' }}>← Back</button>
                    <button type="button" onClick={() => setWizardStep(3)} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 3 — Permit details */}
              {wizardStep === 3 && (
                <div>
                  {newProject.project_type === 'owner_builder' ? (
                    <>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>Owner-builder permit details</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'8px', lineHeight:'1.5' }}>If you have received your owner-builder approval, enter the details here. If not, leave blank — Steadyhand will remind you.</p>
                      <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px' }}>
                        <p style={{ fontSize:'11px', color:'#6B4FA8', margin:0, lineHeight:'1.5' }}>
                          Owner-builder approval is issued by the Building Services Board (WA). <a href="https://www.buildingcommission.wa.gov.au/owner-builders" target="_blank" rel="noreferrer" style={{ color:'#6B4FA8' }}>Learn more →</a>
                        </p>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'14px' }}>
                        <div>
                          <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Owner-builder approval number</label>
                          <input placeholder="Leave blank if not yet received" value={newProject.permit_number} onChange={e => setNewProject(f => ({ ...f, permit_number: e.target.value }))} style={inp} />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'#7A9098', display:'block', marginBottom:'3px' }}>Builder registration number (if applicable)</label>
                          <input placeholder="e.g. BR12345" value={newProject.builder_registration} onChange={e => setNewProject(f => ({ ...f, builder_registration: e.target.value }))} style={inp} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding:'16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', marginBottom:'14px' }}>
                      <p style={{ fontSize:'13px', color:'#2E7D60', fontWeight:500, margin:'0 0 4px' }}>No permit required</p>
                      <p style={{ fontSize:'12px', color:'#4A5E64', margin:0 }}>For renovations and home projects, no owner-builder permit is needed. Steadyhand will still track your compliance checklist for licensed trade work.</p>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setWizardStep(2)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', cursor:'pointer', color:'#1C2B32' }}>← Back</button>
                    <button type="button" onClick={() => setWizardStep(4)} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 4 — Description + AI summary */}
              {wizardStep === 4 && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'4px' }}>Describe your project</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', marginBottom:'12px', lineHeight:'1.5' }}>
                    {newProject.project_type === 'owner_builder'
                      ? 'This becomes the basis of your project plan summary — required for your owner-builder permit application. Steadyhand can draft it for you.'
                      : 'A brief description helps Steadyhand generate better trade package suggestions and reminders.'}
                  </p>
                  <textarea placeholder="e.g. Single-storey rear extension to existing brick house. New kitchen, living and dining area approximately 60m2. Includes demolition, new slab, framing, electrical, plumbing, roofing, plastering and painting."
                    value={newProject.description} onChange={e => setNewProject(f => ({ ...f, description: e.target.value }))}
                    rows={5} style={{ ...inp, resize:'vertical' as const, marginBottom:'10px' }} />
                  {newProject.project_type === 'owner_builder' && newProject.description && (
                    <button type="button" onClick={async () => {
                      setGeneratingSummary(true)
                      try {
                        const res = await fetch('/api/ob-summary', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ description: newProject.description, address: newProject.address, title: newProject.title }),
                        })
                        const { summary } = await res.json()
                        if (summary) setNewProject(f => ({ ...f, description: summary }))
                      } finally { setGeneratingSummary(false) }
                    }} disabled={generatingSummary}
                      style={{ width:'100%', background:'rgba(107,79,168,0.08)', color:'#6B4FA8', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'8px', padding:'9px', fontSize:'12px', fontWeight:500, cursor:'pointer', marginBottom:'10px', opacity: generatingSummary ? 0.6 : 1 }}>
                      {generatingSummary ? 'Drafting...' : '✦ Draft project plan summary with AI'}
                    </button>
                  )}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setWizardStep(3)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', cursor:'pointer', color:'#1C2B32' }}>← Back</button>
                    <button type="button" onClick={() => setWizardStep(5)} style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 5 — Review and create */}
              {wizardStep === 5 && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#1C2B32', marginBottom:'14px' }}>Review your project</p>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'0', marginBottom:'16px', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'8px', overflow:'hidden' }}>
                    {[
                      { label:'Type', value: newProject.project_type.replace('_',' ') },
                      { label:'Name', value: newProject.title },
                      { label:'Address', value: newProject.address || '—' },
                      { label:'Budget', value: newProject.budget_estimate ? '$' + Number(newProject.budget_estimate).toLocaleString() : '—' },
                      { label:'Completion', value: newProject.estimated_completion ? new Date(newProject.estimated_completion).toLocaleDateString('en-AU') : '—' },
                      { label:'Permit no.', value: newProject.permit_number || '—' },
                    ].map((r, i) => (
                      <div key={r.label} style={{ display:'flex', padding:'9px 12px', borderBottom: i < 5 ? '1px solid rgba(28,43,50,0.06)' : 'none', fontSize:'12px' }}>
                        <span style={{ color:'#7A9098', minWidth:'90px' }}>{r.label}</span>
                        <span style={{ color:'#1C2B32', fontWeight:500, textTransform:'capitalize' as const }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  {newProject.project_type === 'owner_builder' && (
                    <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px' }}>
                      <p style={{ fontSize:'12px', color:'#2E7D60', margin:0 }}>✓ WA owner-builder compliance checklist will be pre-populated for this project.</p>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button type="button" onClick={() => setWizardStep(4)} style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', cursor:'pointer', color:'#1C2B32' }}>← Back</button>
                    <button type="button" onClick={createProject} disabled={creatingProject} style={{ flex:1, background:'#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer', opacity:creatingProject?0.6:1 }}>Create project →</button>
                  </div>
                  <button type="button" onClick={() => { setShowNewProject(false); setWizardStep(0) }} style={{ width:'100%', background:'transparent', border:'none', color:'#7A9098', fontSize:'12px', cursor:'pointer', marginTop:'8px', padding:'4px' }}>Cancel</button>
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
            {projects.length === 0 && !showNewProject && (
              <div style={{ background:'#E8F0EE', borderRadius:'12px', border:'1px solid rgba(28,43,50,0.1)', overflow:'hidden' }}>
                <div style={{ padding:'20px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'#1C2B32' }}>
                  <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'rgba(216,228,225,0.85)', letterSpacing:'0.5px', margin:'0 0 6px' }}>BUILD JOURNAL</p>
                  <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.5)', margin:0, lineHeight:'1.6' }}>Track every trade, cost, task and compliance item for your build project — all in one place.</p>
                </div>
                <div style={{ padding:'16px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'10px' }}>Example projects</p>
                  {[
                    { icon:'🏠', title:'Second storey addition', type:'Owner builder', desc:'Managing trades, permits and compliance for a major home extension' },
                    { icon:'🔧', title:'Kitchen renovation', type:'Home project', desc:'Coordinating plumber, electrician and tiler for a full kitchen refit' },
                    { icon:'🌿', title:'Landscaping and fencing', type:'Home project', desc:'Multiple trade packages across a large outdoor renovation' },
                  ].map((ex, i) => (
                    <div key={i} style={{ padding:'10px 12px', borderRadius:'8px', border:'1px solid rgba(28,43,50,0.08)', marginBottom:'8px', background:'white', opacity:0.7 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                        <span style={{ fontSize:'16px' }}>{ex.icon}</span>
                        <span style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32' }}>{ex.title}</span>
                        <span style={{ fontSize:'10px', background:'rgba(212,82,42,0.08)', color:'#D4522A', padding:'1px 6px', borderRadius:'4px' }}>{ex.type}</span>
                      </div>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 0 24px', lineHeight:'1.5' }}>{ex.desc}</p>
                    </div>
                  ))}
                  <button type="button" onClick={() => setShowNewProject(true)}
                    style={{ width:'100%', marginTop:'8px', background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer' }}>
                    + Start your first build journal
                  </button>
                </div>
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
            <div style={{ background:'#E8F0EE', borderRadius:'14px', border:'1px solid rgba(28,43,50,0.1)', overflow:'hidden' }}>
              <div style={{ padding:'24px', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>🏗</div>
                <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'8px' }}>YOUR BUILD JOURNAL</h2>
                <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.7', marginBottom:0 }}>
                  The Build Journal is for homeowners and owner-builders managing complex projects with multiple trades. Create a project to track your permits, tasks, budget, compliance requirements and trade packages — all in one place.
                </p>
              </div>
              <div style={{ padding:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'12px' }}>What you can track</p>
                {[
                  { icon:'📋', title:'Trade packages', desc:'Convert any trade into a Steadyhand job request — get quotes, sign a scope, and track milestones.' },
                  { icon:'✅', title:'Tasks and compliance', desc:'WA owner-builder compliance checklist pre-populated. Tick off items as you go.' },
                  { icon:'💰', title:'Budget and expenses', desc:'Log every expense and see your budget at a glance. Alerts when you go over.' },
                  { icon:'📄', title:'Permit and registration', desc:'Store your permit number, builder registration and key dates in one place.' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(28,43,50,0.06)' }}>
                    <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{item.title}</p>
                      <p style={{ fontSize:'12px', color:'#7A9098', margin:0, lineHeight:'1.5' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                      {activeProj.permit_date && (() => {
                        const expiry = new Date(activeProj.permit_date)
                        expiry.setMonth(expiry.getMonth() + 6)
                        const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000*60*60*24))
                        if (daysLeft > 30 || daysLeft <= 0) return null
                        return <p style={{ fontSize:'11px', color:'#D4522A', background:'rgba(212,82,42,0.15)', borderRadius:'4px', padding:'3px 8px', display:'inline-block', marginTop:'4px' }}>⚠ Owner-builder approval expires in {daysLeft} days — ensure your building permit is issued.</p>
                      })()}
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
                  { id:'sequence', label:'Build sequence' },
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

              {/* Sequence tab */}
              {activeTab === 'sequence' && (() => {
                const projJobs = childJobs.filter(j => j.diy_project_id === activeProj.id)

                const STAGES = [
                  {
                    n: 1, label: 'Demolition / site prep', trades: ['demolition','excavation','site'],
                    dependsOn: 'Building permit issued',
                    enables: 'Foundation and slab work',
                    color: '#7A9098',
                  },
                  {
                    n: 2, label: 'Slab / footings', trades: ['concret','slab','footing','foundation'],
                    dependsOn: 'Site cleared',
                    enables: 'Frame stage — book framer 2–3 weeks after pour',
                    color: '#C07830',
                  },
                  {
                    n: 3, label: 'Frame / structure', trades: ['frame','struct','carpent','timber'],
                    dependsOn: 'Slab approved',
                    enables: 'Rough-in electrical, plumbing, roofing',
                    color: '#D4522A',
                  },
                  {
                    n: 4, label: 'Rough-in (electrical + plumbing)', trades: ['electr','plumb','gas'],
                    dependsOn: 'Frame inspection passed',
                    enables: 'Insulation, wall linings, roofing',
                    color: '#6B4FA8',
                  },
                  {
                    n: 5, label: 'Lock-up (roofing, windows, doors)', trades: ['roof','window','door','lock','glaz'],
                    dependsOn: 'Rough-in inspected',
                    enables: 'Internal fit-out, tiling, plastering',
                    color: '#2E6A8F',
                  },
                  {
                    n: 6, label: 'Fix-out / fit-out', trades: ['tile','plaster','paint','floor','cabinet','joiner'],
                    dependsOn: 'Lock-up complete',
                    enables: 'Final electrical / plumbing, painting',
                    color: '#2E7D60',
                  },
                  {
                    n: 7, label: 'Practical completion', trades: ['final','inspect','certif'],
                    dependsOn: 'All trades complete',
                    enables: 'Final inspection, occupancy permit',
                    color: '#1A6B5A',
                  },
                ]

                const STATUS_LABEL: Record<string,string> = {
                  matching:'Matching', shortlisted:'Shortlisted', assess:'Consult', consult:'Consult',
                  quotes:'Quoting', agreement:'Agreement', delivery:'In progress',
                  signoff:'Sign-off', warranty:'Warranty', complete:'Complete',
                }

                return (
                  <div>
                    <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px' }}>
                      <p style={{ fontSize:'12px', color:'#D4522A', fontWeight:500, margin:'0 0 3px' }}>Build sequence — WA residential</p>
                      <p style={{ fontSize:'11px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>Each stage depends on the one before it. Steadyhand maps your trade packages to the right stage and flags sequencing conflicts. Trade packages you add will appear here automatically.</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'0' }}>
                      {STAGES.map((stage, idx) => {
                        // Match child jobs to this stage by trade category
                        const stageJobs = projJobs.filter(j =>
                          stage.trades.some(t => (j.trade_category || '').toLowerCase().includes(t))
                        )
                        const isComplete = stageJobs.length > 0 && stageJobs.every(j => j.status === 'complete' || j.status === 'warranty')
                        const isActive = stageJobs.some(j => ['delivery','signoff','agreement'].includes(j.status))
                        const hasJobs = stageJobs.length > 0

                        return (
                          <div key={stage.n} style={{ display:'flex', gap:'0', alignItems:'stretch' }}>
                            {/* Left spine */}
                            <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', width:'32px', flexShrink:0 }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background: isComplete ? '#2E7D60' : isActive ? stage.color : hasJobs ? 'rgba(28,43,50,0.12)' : 'rgba(28,43,50,0.06)', border:'2px solid ' + (isComplete ? '#2E7D60' : isActive ? stage.color : 'rgba(28,43,50,0.15)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color: isComplete || isActive ? 'white' : '#7A9098', flexShrink:0, zIndex:1 }}>
                                {isComplete ? '✓' : stage.n}
                              </div>
                              {idx < STAGES.length - 1 && (
                                <div style={{ width:'2px', flex:1, background: isComplete ? '#2E7D60' : 'rgba(28,43,50,0.1)', minHeight:'16px' }} />
                              )}
                            </div>
                            {/* Stage content */}
                            <div style={{ flex:1, paddingLeft:'12px', paddingBottom: idx < STAGES.length - 1 ? '16px' : '0' }}>
                              <div style={{ background: isActive ? stage.color + '08' : isComplete ? 'rgba(46,125,96,0.04)' : '#E8F0EE', border:'1px solid ' + (isActive ? stage.color + '30' : isComplete ? 'rgba(46,125,96,0.2)' : 'rgba(28,43,50,0.1)'), borderRadius:'10px', padding:'12px 14px' }}>
                                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px', marginBottom:'4px' }}>
                                  <p style={{ fontSize:'13px', fontWeight:600, color: isActive ? stage.color : '#1C2B32', margin:0 }}>{stage.label}</p>
                                  {isComplete && <span style={{ fontSize:'10px', color:'#2E7D60', background:'rgba(46,125,96,0.1)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'4px', padding:'1px 7px', flexShrink:0 }}>Done</span>}
                                  {isActive && <span style={{ fontSize:'10px', color:stage.color, background:stage.color+'12', border:'1px solid '+stage.color+'30', borderRadius:'4px', padding:'1px 7px', flexShrink:0 }}>Active</span>}
                                </div>
                                <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 6px', lineHeight:'1.5' }}>
                                  <span style={{ fontWeight:500 }}>Needs:</span> {stage.dependsOn} · <span style={{ fontWeight:500 }}>Enables:</span> {stage.enables}
                                </p>
                                {stageJobs.length > 0 ? (
                                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'4px' }}>
                                    {stageJobs.map((j: any) => (
                                      <div key={j.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 10px', background:'white', borderRadius:'6px', border:'1px solid rgba(28,43,50,0.08)' }}>
                                        <p style={{ fontSize:'12px', color:'#1C2B32', margin:0 }}>{j.title}</p>
                                        <span style={{ fontSize:'10px', color:'#7A9098', background:'rgba(28,43,50,0.06)', borderRadius:'4px', padding:'1px 6px' }}>{STATUS_LABEL[j.status] || j.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => convertToJob({ ...activeProj, title: stage.label + ' — ' + activeProj.title })}
                                    style={{ fontSize:'11px', color:'#7A9098', background:'transparent', border:'1px dashed rgba(28,43,50,0.2)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', width:'100%' }}>
                                    + Add {stage.label.toLowerCase()} trade package
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

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
                  {(() => {
                    const projJobs = childJobs.filter(j => j.diy_project_id === activeProj.id)
                    const STATUS_LABEL: Record<string,string> = {
                      matching:'Matching', shortlisted:'Shortlisted', assess:'Consult', consult:'Consult',
                      quotes:'Quoting', agreement:'Agreement', delivery:'In progress',
                      signoff:'Sign-off', warranty:'Warranty', complete:'Complete',
                    }
                    const STATUS_COLOR: Record<string,string> = {
                      matching:'#7A9098', shortlisted:'#2E6A8F', assess:'#9B6B9B', consult:'#9B6B9B',
                      quotes:'#6B4FA8', agreement:'#6B4FA8', delivery:'#C07830',
                      signoff:'#D4522A', warranty:'#2E7D60', complete:'#2E7D60',
                    }
                    if (projJobs.length === 0) return (
                      <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'24px', textAlign:'center' as const }}>
                        <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.4 }}>🔧</div>
                        <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'6px' }}>No trade packages yet</p>
                        <p style={{ fontSize:'13px', color:'#7A9098' }}>Each time you hire a tradie through Steadyhand for this build, it will appear here with its full job record.</p>
                      </div>
                    )
                    return (
                      <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
                        {projJobs.map((j: any) => {
                          const sc = STATUS_COLOR[j.status] || '#7A9098'
                          const sl = STATUS_LABEL[j.status] || j.status
                          return (
                            <a key={j.id} href={'/shortlist'} style={{ textDecoration:'none' }}>
                              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                                <div>
                                  <p style={{ fontSize:'13px', fontWeight:500, color:'#1C2B32', margin:'0 0 2px' }}>{j.title}</p>
                                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{j.trade_category} · {j.suburb}</p>
                                </div>
                                <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:sc+'18', border:'1px solid '+sc+'40', color:sc, fontWeight:500, flexShrink:0 }}>{sl}</span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    )
                  })()}
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

              {/* Compliance tab — Sprint 4 close-out dashboard */}
              {activeTab === 'compliance' && (() => {
                const projJobs = childJobs.filter(j => j.diy_project_id === activeProj.id)
                const allSignoff = projJobs.length > 0 && projJobs.every(j => ['signoff','warranty','complete'].includes(j.status))
                const COC_TRADES = ['electr','plumb','gas']
                const cocRequiredJobs = projJobs.filter(j => COC_TRADES.some(t => (j.trade_category || '').toLowerCase().includes(t)))
                return (
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
                      {[
                        { label:'Compliance checklist', value: checklistDone+'/'+checklistTotal, color: checklistDone === checklistTotal && checklistTotal > 0 ? '#2E7D60' : checklistDone > 0 ? '#C07830' : '#D4522A' },
                        { label:'Certificates of compliance', value: cocRequiredJobs.length === 0 ? 'N/A' : vaultDocs.filter(d => cocRequiredJobs.some(j => d.job_id === j.id)).length+'/'+cocRequiredJobs.length, color: cocRequiredJobs.length === 0 ? '#7A9098' : vaultDocs.filter(d => cocRequiredJobs.some(j => d.job_id === j.id)).length === cocRequiredJobs.length ? '#2E7D60' : '#D4522A' },
                        { label:'Occupancy permit', value: activeProj.occupancy_permit_number ? 'Recorded' : 'Pending', color: activeProj.occupancy_permit_number ? '#2E7D60' : allSignoff ? '#C07830' : '#7A9098' },
                      ].map(s => (
                        <div key={s.label} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'10px', padding:'14px', textAlign:'center' as const }}>
                          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:s.color, margin:'0 0 3px' }}>{s.value}</p>
                          <p style={{ fontSize:'10px', color:'#7A9098', margin:0 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {allSignoff && !activeProj.occupancy_permit_number && (
                      <div style={{ background:'rgba(192,120,48,0.08)', border:'1px solid rgba(192,120,48,0.25)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'flex-start', gap:'10px' }}>
                        <span style={{ fontSize:'18px' }}>🏛</span>
                        <div>
                          <p style={{ fontSize:'13px', fontWeight:600, color:'#C07830', margin:'0 0 3px' }}>All trades at sign-off — book your final inspection</p>
                          <p style={{ fontSize:'12px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>Contact your local government to book a final building inspection. Once passed, apply for your occupancy permit.</p>
                        </div>
                      </div>
                    )}

                    {cocRequiredJobs.length > 0 && (
                      <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                        <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', background:'rgba(28,43,50,0.02)' }}>
                          <p style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32', margin:'0 0 2px' }}>Certificates of compliance</p>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>Electrical, plumbing and gas trades must provide a CoC before your final inspection.</p>
                        </div>
                        {cocRequiredJobs.map((j: any) => {
                          const hasCoc = vaultDocs.some(d => d.job_id === j.id)
                          return (
                            <div key={j.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid rgba(28,43,50,0.05)', gap:'12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                <div style={{ width:'9px', height:'9px', borderRadius:'50%', background: hasCoc ? '#2E7D60' : j.status === 'warranty' || j.status === 'complete' ? '#D4522A' : '#C07830', flexShrink:0 }} />
                                <div>
                                  <p style={{ fontSize:'13px', color:'#1C2B32', fontWeight:500, margin:'0 0 1px' }}>{j.title}</p>
                                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{j.trade_category}</p>
                                </div>
                              </div>
                              <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background: hasCoc ? 'rgba(46,125,96,0.1)' : 'rgba(212,82,42,0.08)', border:'1px solid '+(hasCoc?'rgba(46,125,96,0.25)':'rgba(212,82,42,0.2)'), color: hasCoc ? '#2E7D60' : '#D4522A', fontWeight:500, flexShrink:0 }}>
                                {hasCoc ? 'Received ✓' : 'Pending'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px 18px', marginBottom:'16px' }}>
                      <p style={{ fontSize:'12px', fontWeight:600, color:'#1C2B32', margin:'0 0 3px' }}>Occupancy permit</p>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 10px', lineHeight:'1.5' }}>Issued by local government after final inspection. Enter the permit number once received — this marks your project complete.</p>
                      {activeProj.occupancy_permit_number ? (
                        <div style={{ background:'rgba(46,125,96,0.08)', border:'1px solid rgba(46,125,96,0.2)', borderRadius:'7px', padding:'10px 14px' }}>
                          <p style={{ fontSize:'11px', color:'#7A9098', margin:'0 0 2px' }}>Permit number</p>
                          <p style={{ fontSize:'15px', fontWeight:600, color:'#2E7D60', margin:0 }}>{activeProj.occupancy_permit_number}</p>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:'8px' }}>
                          <input type="text" placeholder="e.g. OP2026/12345" value={occupancyInput} onChange={e => setOccupancyInput(e.target.value)}
                            style={{ flex:1, padding:'9px 12px', border:'1.5px solid rgba(28,43,50,0.18)', borderRadius:'8px', fontSize:'13px', background:'#F4F8F7', color:'#1C2B32', outline:'none' }} />
                          <button type="button" onClick={async () => {
                            if (!occupancyInput.trim()) return
                            setSavingPermit(true)
                            const supabase = createClient()
                            await supabase.from('diy_projects').update({ occupancy_permit_number: occupancyInput.trim(), status:'complete', completed_at: new Date().toISOString() }).eq('id', activeProj.id)
                            setProjects(prev => prev.map(p => p.id === activeProj.id ? { ...p, occupancy_permit_number: occupancyInput.trim(), status:'complete' } : p))
                            setSavingPermit(false)
                            setOccupancyInput('')
                          }} disabled={!occupancyInput.trim() || savingPermit}
                            style={{ background: !occupancyInput.trim() ? 'rgba(46,125,96,0.3)' : '#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                            {savingPermit ? 'Saving...' : 'Record →'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'10px', padding:'12px 16px', marginBottom:'12px' }}>
                      <p style={{ fontSize:'12px', color:'#6B4FA8', fontWeight:500, margin:'0 0 2px' }}>WA Owner-Builder Compliance Checklist</p>
                      <p style={{ fontSize:'11px', color:'#4A5E64', margin:0 }}>Based on WA Building Commission requirements. Always verify with the Building Commission directly.</p>
                    </div>
                    {projChecklist.length === 0 ? (
                      <div style={{ textAlign:'center' as const, padding:'24px', background:'#E8F0EE', borderRadius:'12px', color:'#7A9098', fontSize:'13px' }}>Compliance checklist is pre-populated for owner-builder projects when you create them.</div>
                    ) : (
                      WA_CHECKLIST.map(cat => {
                        const catItems = projChecklist.filter(c => c.category === cat.category)
                        const catDone = catItems.filter(c => c.completed).length
                        return (
                          <div key={cat.category} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', overflow:'hidden', marginBottom:'10px' }}>
                            <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(28,43,50,0.08)', background: catDone === catItems.length && catItems.length > 0 ? 'rgba(46,125,96,0.08)' : 'rgba(28,43,50,0.02)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <p style={{ fontSize:'12px', fontWeight:600, color: catDone === catItems.length && catItems.length > 0 ? '#2E7D60' : '#1C2B32', margin:0 }}>{cat.category}</p>
                              <span style={{ fontSize:'11px', color:'#7A9098' }}>{catDone}/{catItems.length}</span>
                            </div>
                            {catItems.map(item => (
                              <div key={item.id} onClick={() => toggleChecklist(item.id, item.completed)}
                                style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 18px', borderBottom:'1px solid rgba(28,43,50,0.04)', cursor:'pointer' }}>
                                <div style={{ width:'16px', height:'16px', borderRadius:'3px', border:'1.5px solid '+(item.completed?'#2E7D60':'rgba(28,43,50,0.25)'), background:item.completed?'#2E7D60':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px', fontSize:'10px', color:'white' }}>
                                  {item.completed?'✓':''}
                                </div>
                                <span style={{ fontSize:'12px', color:item.completed?'#7A9098':'#1C2B32', textDecoration:item.completed?'line-through':'none', lineHeight:'1.55' }}>{item.item}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
