'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

const STAGES = [
  { n:1, label:'Site preparation', desc:'Demolition, excavation, site clearing', color:'#7A9098' },
  { n:2, label:'Slab / footings', desc:'Concrete, footings, drainage', color:'#C07830' },
  { n:3, label:'Frame / structure', desc:'Timber or steel frame, roof structure', color:'#D4522A' },
  { n:4, label:'Rough-in', desc:'Electrical, plumbing, gas rough-in', color:'#6B4FA8' },
  { n:5, label:'Lock-up', desc:'Roofing, windows, external doors', color:'#2E6A8F' },
  { n:6, label:'Fix-out', desc:'Tiling, plastering, painting, joinery', color:'#2E7D60' },
  { n:7, label:'Completion', desc:'Final inspections and certificates', color:'#1A6B5A' },
]

const STEP_LABELS = ['Project type', 'Name & address', 'Budget & timeline', 'Permit details', 'Description', 'Build stages', 'Start date']

export default function NewDIYProjectPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<any>({
    project_type: 'owner_builder',
    title: '', address: '',
    budget_estimate: '', estimated_completion: '',
    permit_number: '', builder_registration: '',
    description: '',
    excludedStages: [] as number[],
    planned_start: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
    })
  }, [])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px',
    border: '1.5px solid rgba(28,43,50,0.18)', borderRadius: '8px',
    fontSize: '14px', background: '#F4F8F7', color: '#0A0A0A',
    outline: 'none', fontFamily: 'sans-serif', boxSizing: 'border-box',
  }

  const createProject = async () => {
    if (!form.title || creating) return
    setCreating(true)
    setError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: proj, error: projErr } = await supabase.from('diy_projects').insert({
      user_id: session?.user.id,
      title: form.title,
      description: form.description || null,
      address: form.address || null,
      permit_number: form.permit_number || null,
      project_type: form.project_type,
      budget_estimate: form.budget_estimate ? Number(form.budget_estimate) : null,
      estimated_completion: form.estimated_completion || null,
      builder_registration: form.builder_registration || null,
      status: 'active',
    }).select().single()
    if (projErr || !proj) {
      setError('Could not create project — please check your connection and try again.')
      setCreating(false)
      return
    }
    if (form.project_type === 'owner_builder') {
      const items = WA_CHECKLIST.flatMap((cat: any) =>
        cat.items.map((item: string) => ({ project_id: proj.id, category: cat.category, item }))
      )
      await supabase.from('ob_checklist_items').insert(items)
    }
    setCreating(false)
    window.location.href = '/diy?project=' + proj.id
  }

  const backBtn = (toStep: number) => (
    <button type="button" onClick={() => setStep(toStep)}
      style={{ background:'transparent', border:'1px solid rgba(28,43,50,0.2)', borderRadius:'8px', padding:'11px 16px', fontSize:'13px', cursor:'pointer', color:'#0A0A0A' }}>← Back</button>
  )

  const nextBtn = (toStep: number, disabled = false, label = 'Continue →') => (
    <button type="button" onClick={() => setStep(toStep)} disabled={disabled}
      style={{ flex:1, background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>{label}</button>
  )

  const card = (content: React.ReactNode) => (
    <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
      <div style={{ background:'#0A0A0A', padding:'16px 24px', borderBottom:'2px solid #D4522A' }}>
        <p style={{ fontSize:'10px', color:'rgba(216,228,225,0.4)', letterSpacing:'1.5px', textTransform:'uppercase' as const, margin:'0 0 2px' }}>Step {step + 1} of {STEP_LABELS.length}</p>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:0 }}>{STEP_LABELS[step].toUpperCase()}</p>
      </div>
      <div style={{ padding:'24px' }}>{content}</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(200,213,210,0.95)', borderBottom:'1px solid rgba(28,43,50,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <a href="/diy" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</a>
        <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'1px' }}>NEW PROJECT</div>
        <a href="/diy" style={{ fontSize:'13px', color:'#4A5E64', textDecoration:'none' }}>Cancel</a>
      </nav>

      <div style={{ maxWidth:'580px', margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ marginBottom:'24px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(212,82,42,0.08)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'100px', padding:'4px 12px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', color:'#D4522A', fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase' as const }}>Property Journal</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'26px', color:'#0A0A0A', letterSpacing:'1px', margin:'0 0 6px' }}>SET UP YOUR PROJECT</h1>
          <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>Steadyhand will build your compliance checklist, Gantt schedule and document vault automatically.</p>
        </div>

        {/* Progress bar */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'20px' }}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i <= step ? '#D4522A' : 'rgba(28,43,50,0.12)', transition:'background 0.2s' }} />
          ))}
        </div>

        {/* Step 0 — Project type */}
        {step === 0 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>This determines what guidance and compliance checklists Steadyhand prepares for you.</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'20px' }}>
              {[
                { value:'owner_builder', label:'Owner-builder', desc:'I have or am getting an owner-builder permit from the WA Building Commission' },
                { value:'renovation', label:'Renovation / extension', desc:'Major work with multiple trades — no owner-builder permit required' },
                { value:'diy', label:'Home project', desc:'Smaller project — some DIY, some tradies' },
              ].map(opt => (
                <div key={opt.value} onClick={() => set('project_type', opt.value)}
                  style={{ padding:'14px 16px', borderRadius:'10px', border:'1.5px solid ' + (form.project_type === opt.value ? '#D4522A' : 'rgba(28,43,50,0.15)'), background: form.project_type === opt.value ? 'rgba(212,82,42,0.06)' : 'white', cursor:'pointer' }}>
                  <p style={{ fontSize:'14px', fontWeight:500, color:'#0A0A0A', margin:'0 0 3px' }}>{opt.label}</p>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>{opt.desc}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setStep(1)}
              style={{ width:'100%', background:'#D4522A', color:'white', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:500, cursor:'pointer' }}>Continue →</button>
          </>
        )}

        {/* Step 1 — Name + address */}
        {step === 1 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>Give your project a name you will recognise. The address is used to tag all documents and trade packages.</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'20px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Project name *</label>
                <input placeholder="e.g. My renovation project" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Site address</label>
                <input placeholder="e.g. 14 Smith St, Perth WA 6000" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('address', e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(0)}
              {nextBtn(2, !form.title)}
            </div>
          </>
        )}

        {/* Step 2 — Budget + timeline */}
        {step === 2 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>Used to track spending and trigger reminders. You can update these at any time.</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'20px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Total budget estimate ($)</label>
                <input type="number" placeholder="e.g. 80000" value={form.budget_estimate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('budget_estimate', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Target completion date</label>
                <input type="date" value={form.estimated_completion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('estimated_completion', e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(1)}
              {nextBtn(3)}
            </div>
          </>
        )}

        {/* Step 3 — Permit details */}
        {step === 3 && card(
          <>
            {form.project_type === 'owner_builder' ? (
              <>
                <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>If you have received your owner-builder approval, enter the details here. If not, leave blank — Steadyhand will remind you.</p>
                <div style={{ background:'rgba(107,79,168,0.06)', border:'1px solid rgba(107,79,168,0.15)', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
                  <p style={{ fontSize:'12px', color:'#6B4FA8', margin:0 }}>Owner-builder permits are issued by the WA Building Commission. Apply at <a href="https://www.buildingcommission.wa.gov.au" target="_blank" style={{color:"#6B4FA8"}}>buildingcommission.wa.gov.au</a> before work begins.</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px', marginBottom:'20px' }}>
                  <div>
                    <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Owner-builder permit number</label>
                    <input placeholder="e.g. OB12345" value={form.permit_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('permit_number', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Builder registration number (if applicable)</label>
                    <input placeholder="e.g. BR12345" value={form.builder_registration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('builder_registration', e.target.value)} style={inp} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding:'16px', background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', marginBottom:'20px' }}>
                <p style={{ fontSize:'14px', color:'#2E7D60', fontWeight:500, margin:'0 0 4px' }}>No permit required</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', margin:0 }}>For renovations and home projects, no owner-builder permit is needed. Steadyhand will still track your compliance checklist for licensed trade work.</p>
              </div>
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(2)}
              {nextBtn(4)}
            </div>
          </>
        )}

        {/* Step 4 — Description */}
        {step === 4 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>
              {form.project_type === 'owner_builder'
                ? 'This becomes the basis of your project plan summary — required for your owner-builder permit application. Steadyhand can draft it for you.'
                : 'A brief description helps Steadyhand generate better trade package suggestions and reminders.'}
            </p>
            <textarea
              placeholder="Describe the scope of work — what you are building, the scale, key trades involved, and any site-specific details."
              value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value)}
              rows={5} style={{ ...inp, resize:'vertical' as const, marginBottom:'12px' }} />
            {form.project_type === 'owner_builder' && form.description && (
              <button type="button" onClick={async () => {
                setGeneratingSummary(true)
                try {
                  const res = await fetch('/api/ob-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: form.description, address: form.address, title: form.title }),
                  })
                  const { summary } = await res.json()
                  if (summary) set('description', summary)
                } finally { setGeneratingSummary(false) }
              }} disabled={generatingSummary}
                style={{ width:'100%', background:'rgba(107,79,168,0.08)', color:'#6B4FA8', border:'1px solid rgba(107,79,168,0.2)', borderRadius:'8px', padding:'10px', fontSize:'13px', fontWeight:500, cursor:'pointer', marginBottom:'12px', opacity: generatingSummary ? 0.6 : 1 }}>
                {generatingSummary ? 'Drafting...' : '✦ Draft project plan summary with AI'}
              </button>
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(3)}
              {nextBtn(5)}
            </div>
          </>
        )}

        {/* Step 5 — Build stages */}
        {step === 5 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>These become the rows in your Gantt schedule. Deselect any that don't apply — you can add custom stages later.</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'20px' }}>
              {STAGES.map((stage: any) => {
                const selected = !form.excludedStages.includes(stage.n)
                return (
                  <div key={stage.n} onClick={() => set('excludedStages', selected ? [...form.excludedStages, stage.n] : form.excludedStages.filter((n: number) => n !== stage.n))}
                    style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'10px', border:'1.5px solid '+(selected ? stage.color+'60' : 'rgba(28,43,50,0.1)'), background: selected ? stage.color+'08' : 'rgba(28,43,50,0.02)', cursor:'pointer' }}>
                    <div style={{ width:'18px', height:'18px', borderRadius:'4px', border:'1.5px solid '+(selected ? stage.color : 'rgba(28,43,50,0.2)'), background: selected ? stage.color : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', flexShrink:0 }}>{selected ? '✓' : ''}</div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:500, color:'#0A0A0A', margin:0 }}>{stage.label}</p>
                      <p style={{ fontSize:'11px', color:'#7A9098', margin:0 }}>{stage.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(4)}
              {nextBtn(6)}
            </div>
          </>
        )}

        {/* Step 6 — Start date + create */}
        {step === 6 && card(
          <>
            <p style={{ fontSize:'13px', color:'#4A5E64', marginBottom:'16px', lineHeight:'1.6' }}>Steadyhand calculates end dates for each stage using standard WA build durations. You can adjust everything in the Schedule tab.</p>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', color:'#7A9098', display:'block', marginBottom:'4px' }}>Planned start date</label>
              <input type="date" value={form.planned_start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('planned_start', e.target.value)} style={inp} />
            </div>
            <div style={{ background:'rgba(46,125,96,0.06)', border:'1px solid rgba(46,125,96,0.15)', borderRadius:'8px', padding:'12px 14px', marginBottom:'20px' }}>
              <p style={{ fontSize:'12px', color:'#2E7D60', margin:0, lineHeight:'1.5' }}>✓ Your Gantt schedule will be pre-populated with selected stages and standard WA build durations.</p>
            </div>
            {error && <p style={{ fontSize:'13px', color:'#D4522A', marginBottom:'12px' }}>⚠ {error}</p>}
            <div style={{ display:'flex', gap:'8px' }}>
              {backBtn(5)}
              <button type="button" onClick={createProject} disabled={creating || !form.title}
                style={{ flex:1, background:'#2E7D60', color:'white', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:500, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}>
                {creating ? 'Creating project...' : 'Create project & schedule →'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
