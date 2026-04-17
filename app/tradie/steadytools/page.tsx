'use client'
import { useState } from 'react'
import { NavHeader } from '@/components/ui/NavHeader'

function CalcInput({ label, value, onChange, prefix = '', suffix = '' }: any) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <label style={{ display:'block', fontSize:'12px', fontWeight:500, color:'#0A0A0A', marginBottom:'4px' }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', background:'#F4F8F7', border:'1.5px solid rgba(28,43,50,0.15)', borderRadius:'8px', overflow:'hidden' }}>
        {prefix && <span style={{ padding:'10px 12px', fontSize:'13px', color:'#7A9098', borderRight:'1px solid rgba(28,43,50,0.1)', background:'rgba(28,43,50,0.03)' }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex:1, padding:'10px 12px', border:'none', background:'transparent', fontSize:'14px', color:'#0A0A0A', outline:'none' }} />
        {suffix && <span style={{ padding:'10px 12px', fontSize:'13px', color:'#7A9098', borderLeft:'1px solid rgba(28,43,50,0.1)', background:'rgba(28,43,50,0.03)' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function ResultRow({ label, value, highlight = false }: any) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background: highlight ? 'rgba(46,125,96,0.08)' : 'rgba(28,43,50,0.03)', borderRadius:'7px', marginBottom:'6px' }}>
      <span style={{ fontSize:'13px', color: highlight ? '#2E7D60' : '#4A5E64' }}>{label}</span>
      <span style={{ fontSize:'14px', fontWeight: highlight ? 700 : 500, color: highlight ? '#2E7D60' : '#0A0A0A' }}>{value}</span>
    </div>
  )
}

export default function SteadytoolsPage() {
  const [activeCalc, setActiveCalc] = useState<'markup'|'roi'|'tax'>('markup')

  // Markup vs margin
  const [cost, setCost] = useState('1000')
  const [markupPct, setMarkupPct] = useState('30')
  const [marginPct, setMarginPct] = useState('25')
  const costN = parseFloat(cost) || 0
  const markupN = parseFloat(markupPct) || 0
  const marginN = parseFloat(marginPct) || 0
  const sellFromMarkup = costN * (1 + markupN / 100)
  const markupFromSell = costN / (1 - marginN / 100)
  const actualMarginFromMarkup = markupN / (100 + markupN) * 100
  const actualMarkupFromMargin = marginN / (100 - marginN) * 100

  // ROI
  const [jobRevenue, setJobRevenue] = useState('5000')
  const [jobMaterials, setJobMaterials] = useState('1500')
  const [jobLabourHours, setJobLabourHours] = useState('20')
  const [labourRate, setLabourRate] = useState('65')
  const [jobOverhead, setJobOverhead] = useState('200')
  const revenueN = parseFloat(jobRevenue) || 0
  const materialsN = parseFloat(jobMaterials) || 0
  const hoursN = parseFloat(jobLabourHours) || 0
  const rateN = parseFloat(labourRate) || 0
  const overheadN = parseFloat(jobOverhead) || 0
  const labourCost = hoursN * rateN
  const totalCost = materialsN + labourCost + overheadN
  const grossProfit = revenueN - totalCost
  const roiPct = totalCost > 0 ? (grossProfit / totalCost * 100) : 0
  const marginPctROI = revenueN > 0 ? (grossProfit / revenueN * 100) : 0
  const hourlyReturn = hoursN > 0 ? grossProfit / hoursN : 0

  // Tax
  const [annualRevenue, setAnnualRevenue] = useState('120000')
  const [annualExpenses, setAnnualExpenses] = useState('45000')
  const [gstRegistered, setGstRegistered] = useState(true)
  const annualRevenueN = parseFloat(annualRevenue) || 0
  const annualExpensesN = parseFloat(annualExpenses) || 0
  const taxableIncome = annualRevenueN - annualExpensesN
  const gstOwed = gstRegistered ? annualRevenueN * 0.1 - annualExpensesN * 0.1 : 0
  const quarterlyGST = gstOwed / 4
  let incomeTax = 0
  if (taxableIncome > 180000) incomeTax = 51667 + (taxableIncome - 180000) * 0.45
  else if (taxableIncome > 135000) incomeTax = 31288 + (taxableIncome - 135000) * 0.37
  else if (taxableIncome > 45000) incomeTax = 5092 + (taxableIncome - 45000) * 0.325
  else if (taxableIncome > 18200) incomeTax = (taxableIncome - 18200) * 0.19
  const medicareLevy = taxableIncome * 0.02
  const totalTax = incomeTax + medicareLevy
  const takeHome = taxableIncome - totalTax
  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome * 100 : 0

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString()
  const fmtPct = (n: number) => n.toFixed(1) + '%'

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <NavHeader profile={null} isTradie={true} backLabel="← Dashboard" backHref="/tradie/dashboard" />

      <div style={{ background:'#0A0A0A', padding:'28px 24px' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.4)', marginBottom:'4px' }}>Tradie toolkit</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'26px', color:'rgba(216,228,225,0.9)', letterSpacing:'2px', margin:'0 0 4px' }}>STEADYTOOLS</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.45)', margin:0 }}>Finance calculators, document vault and job management — built for trade businesses.</p>
        </div>
      </div>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'24px' }}>

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'10px', marginBottom:'28px' }}>
          {[
            { icon:'📁', label:'Document vault', sub:'Licences, compliance, job records', href:'/tradie/vault', color:'#6B4FA8' },
            { icon:'👤', label:'Invite or import a lead', sub:'From Simpro, Tradify, paper or phone', href:'/tradie/lead', color:'#D4522A' },
            { icon:'📊', label:'Dialogue Rating', sub:'Your communication score', href:'/tradie/dialogue', color:'#2E6A8F' },
            { icon:'📅', label:'Availability', sub:'Set when you can take jobs', href:'/tradie/availability', color:'#C07830' },
            { icon:'👷', label:'Workers', sub:'Manage your field team', href:'/tradie/workers', color:'#2E7D60' },
            { icon:'📋', label:'Active jobs', sub:'Milestones, consults, delivery', href:'/tradie/dashboard', color:'#2E7D60' },
          ].map(item => (
            <a key={item.label} href={item.href} style={{ textDecoration:'none' }}>
              <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'14px', display:'flex', gap:'10px', alignItems:'flex-start', cursor:'pointer' }}>
                <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize:'11px', color:'#7A9098', margin:0, lineHeight:'1.4' }}>{item.sub}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Finance calculators */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden', marginBottom:'24px' }}>
          <div style={{ padding:'16px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:'0 0 2px' }}>FINANCE CALCULATORS</p>
            <p style={{ fontSize:'12px', color:'#7A9098', margin:0 }}>Quick tools for pricing, profitability and tax planning.</p>
          </div>
          <div style={{ display:'flex', borderBottom:'1px solid rgba(28,43,50,0.1)' }}>
            {[{ key:'markup', label:'Markup vs Margin' }, { key:'roi', label:'Job ROI' }, { key:'tax', label:'Tax estimator' }].map(t => (
              <button key={t.key} type="button" onClick={() => setActiveCalc(t.key as any)}
                style={{ padding:'11px 18px', border:'none', borderBottom: activeCalc === t.key ? '2px solid #D4522A' : '2px solid transparent', background:'transparent', cursor:'pointer', fontSize:'13px', fontWeight: activeCalc === t.key ? 600 : 400, color: activeCalc === t.key ? '#0A0A0A' : '#7A9098' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>

            {activeCalc === 'markup' && <>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Your inputs</p>
                <CalcInput label="Cost price" value={cost} onChange={setCost} prefix="$" />
                <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'14px', marginBottom:'12px' }}>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 10px' }}>From <strong>markup %</strong></p>
                  <CalcInput label="Markup %" value={markupPct} onChange={setMarkupPct} suffix="%" />
                </div>
                <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'8px', padding:'14px' }}>
                  <p style={{ fontSize:'12px', color:'#7A9098', margin:'0 0 10px' }}>From <strong>margin %</strong></p>
                  <CalcInput label="Margin %" value={marginPct} onChange={setMarginPct} suffix="%" />
                </div>
              </div>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Results</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'8px' }}>From <strong>{markupPct}% markup</strong>:</p>
                <ResultRow label="Sell price" value={fmt(sellFromMarkup)} highlight />
                <ResultRow label="Gross profit" value={fmt(sellFromMarkup - costN)} />
                <ResultRow label="Actual margin" value={fmtPct(actualMarginFromMarkup)} />
                <div style={{ height:'1px', background:'rgba(28,43,50,0.1)', margin:'12px 0' }} />
                <p style={{ fontSize:'12px', color:'#4A5E64', marginBottom:'8px' }}>From <strong>{marginPct}% margin</strong>:</p>
                <ResultRow label="Sell price" value={fmt(markupFromSell)} highlight />
                <ResultRow label="Gross profit" value={fmt(markupFromSell - costN)} />
                <ResultRow label="Actual markup" value={fmtPct(actualMarkupFromMargin)} />
                <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'8px', padding:'12px', marginTop:'12px' }}>
                  <p style={{ fontSize:'11px', color:'#C07830', margin:0, lineHeight:'1.6' }}>A 30% markup is only a 23% margin. Markup is on cost — margin is on revenue. They are not interchangeable.</p>
                </div>
              </div>
            </>}

            {activeCalc === 'roi' && <>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Job details</p>
                <CalcInput label="Job revenue (quoted price)" value={jobRevenue} onChange={setJobRevenue} prefix="$" />
                <CalcInput label="Materials cost" value={jobMaterials} onChange={setJobMaterials} prefix="$" />
                <CalcInput label="Labour hours" value={jobLabourHours} onChange={setJobLabourHours} suffix="hrs" />
                <CalcInput label="Your labour rate" value={labourRate} onChange={setLabourRate} prefix="$" suffix="/hr" />
                <CalcInput label="Overhead / other costs" value={jobOverhead} onChange={setJobOverhead} prefix="$" />
              </div>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Profitability</p>
                <ResultRow label="Total costs" value={fmt(totalCost)} />
                <ResultRow label="Gross profit" value={fmt(grossProfit)} highlight={grossProfit > 0} />
                <ResultRow label="Profit margin" value={fmtPct(marginPctROI)} highlight={marginPctROI > 0} />
                <ResultRow label="ROI" value={fmtPct(roiPct)} />
                <ResultRow label="Return per hour" value={fmt(hourlyReturn) + '/hr'} />
                {grossProfit < 0 && <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px', padding:'12px', marginTop:'10px' }}><p style={{ fontSize:'12px', color:'#D4522A', margin:0 }}>⚠ Unprofitable at these numbers. Raise your price or reduce costs.</p></div>}
                {grossProfit > 0 && marginPctROI < 15 && <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'8px', padding:'12px', marginTop:'10px' }}><p style={{ fontSize:'12px', color:'#C07830', margin:0 }}>Margin below 15% — tight once tax and rework risk are factored in.</p></div>}
              </div>
            </>}

            {activeCalc === 'tax' && <>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Your financials</p>
                <CalcInput label="Annual revenue" value={annualRevenue} onChange={setAnnualRevenue} prefix="$" />
                <CalcInput label="Annual business expenses" value={annualExpenses} onChange={setAnnualExpenses} prefix="$" />
                <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#0A0A0A', cursor:'pointer', marginBottom:'12px' }}>
                  <input type="checkbox" checked={gstRegistered} onChange={e => setGstRegistered(e.target.checked)} />
                  Registered for GST
                </label>
                <div style={{ background:'rgba(46,106,143,0.06)', border:'1px solid rgba(46,106,143,0.15)', borderRadius:'8px', padding:'12px' }}>
                  <p style={{ fontSize:'11px', color:'#2E6A8F', margin:0, lineHeight:'1.6' }}>Estimates only — 2024–25 ATO individual rates for sole traders. Consult your accountant for actual obligations.</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:'#7A9098', letterSpacing:'0.5px', textTransform:'uppercase' as const, marginBottom:'14px' }}>Tax estimate</p>
                <ResultRow label="Taxable income" value={fmt(taxableIncome)} />
                <ResultRow label="Income tax" value={fmt(incomeTax)} />
                <ResultRow label="Medicare levy (2%)" value={fmt(medicareLevy)} />
                <ResultRow label="Total tax" value={fmt(totalTax)} highlight />
                <ResultRow label="Effective rate" value={fmtPct(effectiveRate)} />
                <ResultRow label="Estimated take-home" value={fmt(takeHome)} highlight={takeHome > 0} />
                {gstRegistered && <>
                  <div style={{ height:'1px', background:'rgba(28,43,50,0.1)', margin:'12px 0' }} />
                  <ResultRow label="Annual GST owed" value={fmt(gstOwed)} />
                  <ResultRow label="Quarterly BAS estimate" value={fmt(quarterlyGST)} highlight />
                </>}
              </div>
            </>}

          </div>
        </div>

        {/* Capability links */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', background:'rgba(28,43,50,0.04)', borderBottom:'1px solid rgba(28,43,50,0.08)' }}>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>BUILD YOUR CAPABILITY</p>
          </div>
          <div style={{ padding:'14px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'10px' }}>
            {[
              { icon:'⭐', title:'Improve your Dialogue Rating', body:'Pricing transparency and risk disclosure matter most.', href:'https://www.steadyhanddigital.com', label:'How scoring works →' },
              { icon:'📄', title:'Writing better scope agreements', body:'Clear inclusions protect you from scope creep and disputes.', href:'https://www.steadyhanddigital.com', label:'Scope writing guide →' },
              { icon:'✅', title:'Licence and compliance — WA', body:'Stay current with WA Building Commission requirements.', href:'https://www.buildingcommission.com.au', label:'Building Commission WA →' },
              { icon:'💻', title:'Digital tools for trade businesses', body:'Xero for invoicing, Steadyhand for scope and warranty.', href:'https://www.steadyhanddigital.com', label:'Steadyhand Digital →' },
            ].map(card => (
              <a key={card.title} href={card.href} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'rgba(28,43,50,0.03)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'14px' }}>
                  <div style={{ fontSize:'18px', marginBottom:'6px' }}>{card.icon}</div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', marginBottom:'3px' }}>{card.title}</p>
                  <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.5', marginBottom:'6px' }}>{card.body}</p>
                  <p style={{ fontSize:'12px', color:'#2E6A8F', margin:0 }}>{card.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
