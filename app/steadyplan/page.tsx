'use client'
import { useState } from 'react'
import { Aboreto } from 'next/font/google'
const aboreto = Aboreto({ weight: '400', subsets: ['latin'] })

const PLANS = [
  { id:'sp1', code:'SP1', name:'Conservative Upgrade', weeks:8, weeklyRate:1500, mindset:'Efficiency upgrade', description:'For trade businesses running on informal systems. We document your existing processes, identify the highest-friction points and introduce digital tools that replace manual steps without disrupting how you already work.', outcomes:['Consistent operations with less owner dependency','Documented processes and handover-ready systems','Digital tools matched to your workflow'], colour:'#2E6A8F' },
  { id:'sp2', code:'SP2', name:'Growth-Focused', weeks:12, weeklyRate:1500, mindset:'Scalable growth', description:'For businesses ready to pursue growth deliberately. We build lead generation systems, quoting consistency, client communication workflows and the operational capacity to take on more work without you becoming the bottleneck.', outcomes:['Repeatable client acquisition systems','Scalable operating model','Quoting and pipeline discipline'], colour:'#6B4FA8', popular:true },
  { id:'sp3', code:'SP3', name:'Scaling', weeks:16, weeklyRate:1500, mindset:'Strategic repositioning', description:'For businesses actively growing headcount or preparing to. We address hiring systems, team coordination, financial visibility and brand positioning. Optional add-ons available.', outcomes:['Business built to grow beyond the founding operator','Team coordination and financial visibility','Hiring systems and brand positioning'], addons:[{name:'Recruitment Add-on',description:'9.5% of first year salary of any employee hired through the program'},{name:'Embedded Office Support',description:'20 hours dedicated admin support · $75/hr · fixed at $1,500'}], colour:'#C07830' },
]

type Step = 'discover'|'plans'|'confirm'

export default function SteadyplanPage() {
  const [step, setStep] = useState<Step>('plans')
  const [viewOnly, setViewOnly] = useState(true)
  const [form, setForm] = useState({ name:'', business:'', trade:'', phone:'', email:'', employees:'', revenue:'', challenge:'', timeline:'' })
  const [selectedPlan, setSelectedPlan] = useState<string|null>(null)
  const [bulkPay, setBulkPay] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}))
  const plan = PLANS.find(p=>p.id===selectedPlan)

  const handleEnquire = async () => {
    if (!plan) return
    setSubmitting(true)
    try { await fetch('/api/steadyplan-enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,plan:plan.code,bulkPay,addons:selectedAddons})}) } catch(_){}
    setSubmitting(false)
    setSubmitted(true)
  }

  const inp = { width:'100%', padding:'12px 14px', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:'8px', fontSize:'14px', background:'rgba(255,255,255,0.05)', color:'rgba(216,228,225,0.9)', outline:'none', fontFamily:'Georgia,serif', boxSizing:'border-box' as const }
  const lbl = { display:'block' as const, fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'6px' }

  return (
    <div style={{minHeight:'100vh',background:'#0A0A0A',color:'rgba(216,228,225,0.9)',fontFamily:'Georgia,serif'}}>
      {/* Hero */}
      <div style={{position:'relative',overflow:'hidden',padding:'80px 24px 60px',textAlign:'center'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(212,82,42,0.12),transparent 65%)'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:'680px',margin:'0 auto'}}>
          <p style={{fontSize:'11px',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(216,228,225,0.3)',marginBottom:'16px'}}>Steadyhand Digital</p>
          <h1 style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:400,letterSpacing:'2px',lineHeight:1.15,margin:'0 0 20px',fontFamily:aboreto.style.fontFamily,color:'#D4522A'}}>STEADYPLANS</h1>
          <p style={{fontSize:'17px',color:'rgba(216,228,225,0.45)',lineHeight:1.7,maxWidth:'520px',margin:'0 auto 32px'}}>12-week programs that digitalise trade business operations — from informal systems to a business that runs without you in every conversation.</p>
          <div style={{display:'flex',gap:'28px',justifyContent:'center',flexWrap:'wrap'}}>
            {['$1,500 /week','4-week minimum','Weekly billing in advance'].map(t=>(
              <span key={t} style={{fontSize:'13px',color:'rgba(216,228,225,0.35)',borderBottom:'1px solid rgba(216,228,225,0.1)',paddingBottom:'3px'}}>{t}</span>
            ))}
          </div>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',marginTop:'32px',flexWrap:'wrap' as const}}>
            <button type="button" onClick={()=>{setViewOnly(false);setStep('discover')}}
              style={{background:'#D4522A',color:'white',border:'none',padding:'13px 28px',borderRadius:'9px',fontSize:'15px',fontFamily:'Georgia,serif',cursor:'pointer',letterSpacing:'0.2px'}}>
              Get started →
            </button>
            <button type="button" onClick={()=>{setViewOnly(true);setStep('plans')}}
              style={{background:'transparent',color:'rgba(216,228,225,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'13px 28px',borderRadius:'9px',fontSize:'15px',fontFamily:'Georgia,serif',cursor:'pointer'}}>
              View plans
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'700px',margin:'0 auto',padding:'0 24px 80px'}}>
        {/* Steps */}
        <div style={{display:'flex',gap:'8px',marginBottom:'40px',alignItems:'center'}}>
          {(['discover','plans','confirm'] as Step[]).map((s,i)=>(
            <div key={s} style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,background:step===s?'#D4522A':'rgba(255,255,255,0.06)',color:step===s?'white':'rgba(216,228,225,0.3)',border:step===s?'none':'1px solid rgba(255,255,255,0.08)'}}>{i+1}</div>
              <span style={{fontSize:'12px',color:step===s?'rgba(216,228,225,0.7)':'rgba(216,228,225,0.25)',letterSpacing:'0.5px'}}>{s==='discover'?'About you':s==='plans'?'Choose plan':'Confirm'}</span>
              {i<2&&<div style={{width:'28px',height:'1px',background:'rgba(255,255,255,0.07)'}}/>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step==='discover'&&(
          <div>
            <h2 style={{fontSize:'22px',fontWeight:400,margin:'0 0 8px'}}>Tell us about your business</h2>
            <p style={{fontSize:'14px',color:'rgba(216,228,225,0.4)',margin:'0 0 32px',lineHeight:1.6}}>A Steadyplan starts with understanding where you are now. This takes two minutes.</p>
            <div style={{display:'grid',gap:'18px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div><label style={lbl}>Your name</label><input style={inp} value={form.name} onChange={set('name')} placeholder="First name"/></div>
                <div><label style={lbl}>Business name</label><input style={inp} value={form.business} onChange={set('business')} placeholder="Trading name"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div><label style={lbl}>Trade</label>
                  <select style={inp} value={form.trade} onChange={set('trade')}>
                    <option value="">Select trade</option>
                    {['Electrical','Plumbing & Gas','Carpentry & Joinery','Painting & Decorating','Tiling','Roofing','Air Conditioning','Landscaping','Concreting & Paving','Building','Other'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Team size</label>
                  <select style={inp} value={form.employees} onChange={set('employees')}>
                    <option value="">Select</option>
                    {['Solo operator','2–4 people','5–10 people','10+ people'].map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="you@business.com"/></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={set('phone')} placeholder="04xx xxx xxx"/></div>
              </div>
              <div><label style={lbl}>Approximate annual revenue</label>
                <select style={inp} value={form.revenue} onChange={set('revenue')}>
                  <option value="">Select range</option>
                  {['Under $250k','$250k–$500k','$500k–$1M','$1M–$3M','Over $3M'].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Biggest challenge in your business right now</label>
                <textarea style={{...inp,minHeight:'90px',resize:'vertical' as const}} value={form.challenge} onChange={set('challenge')} placeholder="e.g. Too much time on admin, inconsistent quoting, can't step away from the tools..."/>
              </div>
              <div><label style={lbl}>When are you looking to start?</label>
                <select style={inp} value={form.timeline} onChange={set('timeline')}>
                  <option value="">Select</option>
                  {['ASAP','Within 4 weeks','Next quarter','Just exploring'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <button type="button" onClick={()=>{if(form.name&&form.business&&form.email&&form.challenge)setStep('plans')}}
                style={{background:'#D4522A',color:'white',border:'none',padding:'14px 32px',borderRadius:'9px',fontSize:'15px',fontFamily:'Georgia,serif',cursor:'pointer',opacity:(form.name&&form.business&&form.email&&form.challenge)?1:0.4}}>
                See your Steadyplan options →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step==='plans'&&(
          <div>
            <h2 style={{fontSize:'22px',fontWeight:400,margin:'0 0 8px'}}>Choose your Steadyplan</h2>
            <p style={{fontSize:'14px',color:'rgba(216,228,225,0.4)',margin:'0 0 28px',lineHeight:1.6}}>All plans at $1,500/week. The difference is duration, depth and what you're ready to build.</p>
            <div style={{display:'flex',flexDirection:'column' as const,gap:'14px',marginBottom:'24px'}}>
              {PLANS.map(p=>(
                <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{border:`1.5px solid ${selectedPlan===p.id?p.colour:'rgba(255,255,255,0.07)'}`,borderRadius:'14px',padding:'22px',cursor:'pointer',position:'relative' as const,background:selectedPlan===p.id?`${p.colour}0d`:'rgba(255,255,255,0.02)',transition:'all 0.2s'}}>
                  {(p as any).popular&&<div style={{position:'absolute' as const,top:'-1px',right:'18px',background:p.colour,color:'white',fontSize:'10px',letterSpacing:'1px',padding:'3px 10px',borderRadius:'0 0 6px 6px',textTransform:'uppercase' as const}}>Most popular</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px',flexWrap:'wrap' as const,gap:'8px'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'3px'}}>
                        <span style={{fontSize:'12px',fontWeight:600,color:p.colour,letterSpacing:'1px'}}>{p.code}</span>
                        <span style={{fontSize:'15px'}}>{p.name}</span>
                      </div>
                      <p style={{fontSize:'11px',color:'rgba(216,228,225,0.3)',margin:0}}>{p.mindset} · {p.weeks} weeks</p>
                    </div>
                    <div style={{textAlign:'right' as const}}>
                      <p style={{fontSize:'19px',margin:'0 0 1px'}}>$1,500<span style={{fontSize:'12px',color:'rgba(216,228,225,0.3)'}}>/week</span></p>
                      <p style={{fontSize:'11px',color:'rgba(216,228,225,0.25)',margin:0}}>${(1500*p.weeks).toLocaleString()} total</p>
                    </div>
                  </div>
                  <p style={{fontSize:'13px',color:'rgba(216,228,225,0.5)',lineHeight:1.65,margin:'0 0 12px'}}>{p.description}</p>
                  {p.outcomes.map(o=>(
                    <div key={o} style={{display:'flex',gap:'8px',marginBottom:'4px'}}>
                      <span style={{color:p.colour,fontSize:'12px',flexShrink:0}}>→</span>
                      <span style={{fontSize:'12px',color:'rgba(216,228,225,0.45)'}}>{o}</span>
                    </div>
                  ))}
                  {(p as any).addons&&selectedPlan===p.id&&(
                    <div style={{marginTop:'14px',paddingTop:'14px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                      <p style={{fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase' as const,color:'rgba(216,228,225,0.25)',margin:'0 0 8px'}}>Optional add-ons</p>
                      {(p as any).addons.map((a:any)=>(
                        <label key={a.name} style={{display:'flex',gap:'10px',cursor:'pointer',marginBottom:'8px'}} onClick={e=>e.stopPropagation()}>
                          <input type="checkbox" checked={selectedAddons.includes(a.name)} onChange={()=>setSelectedAddons(prev=>prev.includes(a.name)?prev.filter((x:string)=>x!==a.name):[...prev,a.name])} style={{marginTop:'2px',accentColor:p.colour}}/>
                          <div>
                            <p style={{fontSize:'13px',color:'rgba(216,228,225,0.8)',margin:'0 0 2px'}}>{a.name}</p>
                            <p style={{fontSize:'11px',color:'rgba(216,228,225,0.35)',margin:0}}>{a.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* SP4 */}
              <div style={{border:'1px solid rgba(255,255,255,0.05)',borderRadius:'14px',padding:'20px',background:'rgba(255,255,255,0.01)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:'8px'}}>
                  <div>
                    <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'3px'}}>
                      <span style={{fontSize:'12px',fontWeight:600,color:'#7A9098',letterSpacing:'1px'}}>SP4</span>
                      <span style={{fontSize:'15px',color:'rgba(216,228,225,0.6)'}}>Custom Digitalisation & E-Commerce</span>
                    </div>
                    <p style={{fontSize:'11px',color:'rgba(216,228,225,0.25)',margin:0}}>Bespoke · Scoped individually</p>
                  </div>
                  <span style={{fontSize:'13px',color:'rgba(216,228,225,0.25)',fontStyle:'italic'}}>Custom pricing</span>
                </div>
                <p style={{fontSize:'13px',color:'rgba(216,228,225,0.35)',lineHeight:1.65,margin:'10px 0 0'}}>Custom software, e-commerce, client portals or end-to-end digital transformation. Scoped after a discovery session.</p>
              </div>
            </div>

            {/* Upfront discount */}
            {selectedPlan&&(
              <div style={{border:'1.5px solid rgba(46,125,96,0.2)',borderRadius:'12px',padding:'16px 18px',marginBottom:'22px',background:'rgba(46,125,96,0.04)'}}>
                <label style={{display:'flex',gap:'12px',alignItems:'flex-start',cursor:'pointer'}}>
                  <input type="checkbox" checked={bulkPay} onChange={e=>setBulkPay(e.target.checked)} style={{marginTop:'3px',accentColor:'#2E7D60'}}/>
                  <div>
                    <p style={{fontSize:'14px',margin:'0 0 3px',fontWeight:500}}>Pay 8 weeks upfront — save 10%</p>
                    <p style={{fontSize:'12px',color:'rgba(216,228,225,0.4)',margin:0}}>$1,350/week · one invoice · ${(1350*8).toLocaleString()} total · simpler cashflow planning</p>
                  </div>
                </label>
              </div>
            )}

            {/* SP5 */}
            <div style={{border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px 16px',marginBottom:'24px'}}>
              <p style={{fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase' as const,color:'rgba(216,228,225,0.2)',margin:'0 0 4px'}}>SP5 — Phase II (graduates only)</p>
              <p style={{fontSize:'13px',color:'rgba(216,228,225,0.35)',margin:0,lineHeight:1.6}}>$750/month ongoing retainer for consolidation and strategic check-ins. Available after completing a Steadyplan.</p>
            </div>

            <div style={{display:'flex',gap:'10px'}}>
              {!viewOnly&&<button type="button" onClick={()=>setStep('discover')} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(216,228,215,0.4)',padding:'13px 22px',borderRadius:'9px',fontSize:'14px',fontFamily:'Georgia,serif',cursor:'pointer'}}>← Back</button>}
              <button type="button" onClick={()=>{if(!selectedPlan)return;if(viewOnly){setViewOnly(false);setStep('discover')}else{setStep('confirm')}}} disabled={!selectedPlan}
                style={{flex:1,background:'#D4522A',color:'white',border:'none',padding:'13px 28px',borderRadius:'9px',fontSize:'15px',fontFamily:'Georgia,serif',cursor:'pointer',opacity:selectedPlan?1:0.4}}>
                {viewOnly?`Enquire about ${selectedPlan?PLANS.find(p=>p.id===selectedPlan)?.code:'plan'} →`:`Continue with ${selectedPlan?PLANS.find(p=>p.id===selectedPlan)?.code:'plan'} →`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step==='confirm'&&plan&&!submitted&&(
          <div>
            <h2 style={{fontSize:'22px',fontWeight:400,margin:'0 0 8px'}}>Confirm your enquiry</h2>
            <p style={{fontSize:'14px',color:'rgba(216,228,225,0.4)',margin:'0 0 28px',lineHeight:1.6}}>We'll be in touch within one business day to confirm your start date and set up billing.</p>
            <div style={{border:`1.5px solid ${plan.colour}25`,borderRadius:'14px',padding:'22px',marginBottom:'20px',background:`${plan.colour}08`}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap' as const,gap:'8px',marginBottom:'14px'}}>
                <div>
                  <p style={{fontSize:'13px',color:plan.colour,margin:'0 0 3px',letterSpacing:'0.5px'}}>{plan.code} — {plan.name}</p>
                  <p style={{fontSize:'11px',color:'rgba(216,228,225,0.3)',margin:0}}>{plan.weeks} weeks · {plan.mindset}</p>
                </div>
                <div style={{textAlign:'right' as const}}>
                  {bulkPay?<><p style={{fontSize:'17px',margin:'0 0 2px'}}>$1,350<span style={{fontSize:'12px',color:'rgba(216,228,225,0.3)'}}>/week</span></p><p style={{fontSize:'11px',color:'#2E7D60',margin:0}}>10% upfront discount</p></>
                  :<p style={{fontSize:'17px',margin:0}}>$1,500<span style={{fontSize:'12px',color:'rgba(216,228,225,0.3)'}}>/week</span></p>}
                </div>
              </div>
              <div style={{display:'flex',gap:'20px',flexWrap:'wrap' as const}}>
                {[{label:'Billing',value:bulkPay?`8 weeks upfront · $${(1350*8).toLocaleString()}`:'Weekly in advance'},{label:'Minimum',value:'4 weeks'},{label:'Start',value:form.timeline||'TBC'}].map(item=>(
                  <div key={item.label}>
                    <p style={{fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase' as const,color:'rgba(216,228,225,0.25)',margin:'0 0 2px'}}>{item.label}</p>
                    <p style={{fontSize:'13px',color:'rgba(216,228,225,0.65)',margin:0}}>{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedAddons.length>0&&<div style={{marginTop:'14px',paddingTop:'14px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                {selectedAddons.map(a=><p key={a} style={{fontSize:'13px',color:'rgba(216,228,225,0.55)',margin:'0 0 2px'}}>+ {a}</p>)}
              </div>}
            </div>
            <div style={{border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'16px 18px',marginBottom:'24px'}}>
              <p style={{fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase' as const,color:'rgba(216,228,225,0.25)',margin:'0 0 8px'}}>Your details</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                {[{label:'Name',value:form.name},{label:'Business',value:form.business},{label:'Email',value:form.email},{label:'Phone',value:form.phone||'—'},{label:'Trade',value:form.trade||'—'},{label:'Team',value:form.employees||'—'}].map(item=>(
                  <div key={item.label}>
                    <p style={{fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase' as const,color:'rgba(216,228,225,0.2)',margin:'0 0 1px'}}>{item.label}</p>
                    <p style={{fontSize:'13px',color:'rgba(216,228,225,0.6)',margin:0}}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button type="button" onClick={()=>setStep('plans')} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(216,228,225,0.4)',padding:'13px 22px',borderRadius:'9px',fontSize:'14px',fontFamily:'Georgia,serif',cursor:'pointer'}}>← Back</button>
              <button type="button" onClick={handleEnquire} disabled={submitting} style={{flex:1,background:'#D4522A',color:'white',border:'none',padding:'13px 28px',borderRadius:'9px',fontSize:'15px',fontFamily:'Georgia,serif',cursor:'pointer',opacity:submitting?0.6:1}}>
                {submitting?'Sending…':'Submit enquiry →'}
              </button>
            </div>
          </div>
        )}

        {/* Submitted */}
        {submitted&&(
          <div style={{textAlign:'center' as const,padding:'48px 0'}}>
            <div style={{fontSize:'36px',marginBottom:'16px'}}>✓</div>
            <h2 style={{fontSize:'22px',fontWeight:400,margin:'0 0 10px'}}>Enquiry received</h2>
            <p style={{fontSize:'14px',color:'rgba(216,228,225,0.4)',lineHeight:1.7,maxWidth:'400px',margin:'0 auto 28px'}}>
              We'll be in touch within one business day. Questions? <a href="mailto:info@steadyhanddigital.com" style={{color:'#D4522A',textDecoration:'none'}}>info@steadyhanddigital.com</a>
            </p>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'18px',display:'inline-block',textAlign:'left' as const}}>
              <p style={{fontSize:'14px',color:'rgba(216,228,225,0.75)',margin:'0 0 3px'}}>{plan?.code} — {plan?.name}</p>
              <p style={{fontSize:'12px',color:'rgba(216,228,225,0.35)',margin:0}}>{bulkPay?'8-week upfront · $1,350/week':'$1,500/week · billed weekly'}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',padding:'28px 24px',textAlign:'center' as const}}>
        <p style={{fontSize:'12px',color:'rgba(216,228,225,0.18)',margin:0}}>Steadyhand Digital · Perth, WA · <a href="mailto:info@steadyhanddigital.com" style={{color:'rgba(216,228,225,0.25)',textDecoration:'none'}}>info@steadyhanddigital.com</a></p>
      </div>
    </div>
  )
}
