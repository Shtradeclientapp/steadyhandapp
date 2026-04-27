import Link from 'next/link'

export const metadata = {
  title: 'Trade Warranties in WA — What Homeowners Are Not Told | Steadyhand',
  description: 'A reference guide to trade warranties in Western Australia — the gap between what the law provides, what the data shows, and what homeowners actually experience after the job is done.',
}

export default function WarrantyGuide() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <Link href="/guides" style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', textDecoration:'none' }}>← All guides</Link>
          <Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Post a job</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:'#0A0A0A', padding:'48px 24px 40px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <Link href="/guides" style={{ fontSize:'12px', color:'rgba(216,228,225,0.35)', textDecoration:'none', display:'block', marginBottom:'14px' }}>Reference / Warranties</Link>
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.3)', marginBottom:'10px' }}>Western Australia · Reference guide</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px, 5vw, 34px)', color:'rgba(216,228,225,0.92)', letterSpacing:'1.5px', margin:'0 0 16px', lineHeight:'1.2' }}>
            TRADE WARRANTIES IN WA
          </h1>
          <p style={{ fontSize:'15px', color:'rgba(216,228,225,0.5)', lineHeight:'1.8', maxWidth:'600px', margin:'0 0 16px' }}>
            What homeowners are entitled to, why the dispute data dramatically understates the problem, and why the current system produces poor outcomes for both parties.
          </p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' as const }}>
            {['Statutory warranties','Workmanship guarantees','The data gap','WA-specific context','What good looks like'].map(tag => (
              <span key={tag} style={{ fontSize:'12px', color:'rgba(216,228,225,0.4)', display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#D4522A', display:'inline-block', flexShrink:0 }} />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'36px 24px' }}>

        {/* Opening argument */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'24px 28px', marginBottom:'28px' }}>
          <p style={{ fontSize:'15px', color:'#0A0A0A', lineHeight:'1.8', marginBottom:'14px', fontStyle:'italic' }}>
            The WA Magistrates Court small claims figures for trade disputes tell a story — but not the right one. They record the disputes that made it to filing. They say nothing about the disputes that were abandoned because the homeowner ran out of energy, the ones that were settled under duress for a fraction of the loss, or the ones that never started because the tradie dissolved their company first.
          </p>
          <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.8', margin:0 }}>
            This is a reference guide to trade warranties in WA — what the law provides, where it falls short, and why the lack of structured data on post-completion disputes is itself a significant problem for the sector.
          </p>
        </div>

        {/* Section 1 — The legal framework */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#2E6A8F', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>THE LEGAL FRAMEWORK IN WA</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              {
                heading: 'Statutory warranties — what the law implies',
                body: 'Under the Building Services (Complaint Resolution and Administration) Act 2011 and the Building Act 2011, residential building work in WA carries implied statutory warranties regardless of what the contract says. These include that the work will be done in a proper and workmanlike manner, that materials will be fit for purpose, and that the completed building will be fit to occupy. These warranties cannot be contracted out of — a contract that attempts to waive them is unenforceable to that extent.',
              },
              {
                heading: 'The 6-year and 25-year rule',
                body: 'In WA, the limitation period for building defect claims is generally 6 years from the date the defect became apparent (or should have been apparent). For structural defects, a 25-year period applies under the Building Act in certain circumstances. In practice, most homeowners are unaware of these timeframes and either act too late or too early. The 6-year clock starts running from when the defect manifests — not when the work was completed — which is an important and poorly understood distinction.',
              },
              {
                heading: 'Home Indemnity Insurance — a safety net with large gaps',
                body: 'WA requires Home Indemnity Insurance (HII) for most residential building contracts over $20,000 involving a licensed builder. HII covers homeowners if the builder dies, disappears or becomes insolvent — but not if the builder is still in business and simply refuses to honour the warranty. This distinction is critical. The most common warranty dispute scenario — a builder who is still operating but unwilling to return to rectify defective work — is not covered by HII. The policy exists to manage insolvency risk, not conduct risk.',
              },
              {
                heading: 'The Building and Energy complaint process',
                body: 'The Building and Energy division of DMIRS administers the complaints process for building work in WA. Homeowners can lodge a complaint about defective work, and a building inspector may be appointed to assess the defect. If the complaint is upheld, a rectification order can be issued. In practice, the process is slow (often 6–18 months), requires the homeowner to manage a significant administrative burden, and results in rectification orders that are difficult to enforce against a non-compliant contractor. The complaint process is free but not simple.',
              },
            ].map(item => (
              <div key={item.heading} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 8px' }}>{item.heading}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 — The data gap */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#D4522A', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>THE DATA GAP — WHY RECORDED DISPUTES UNDERCOUNT THE REAL PICTURE</h2>
          </div>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', marginBottom:'16px' }}>
            The WA Magistrates Court processes several thousand small claims each year, a portion of which relate to trade disputes. These figures are frequently cited as an indicator of the trade dispute rate in WA. They are not. They are an indicator of the disputes that survived the following filters:
          </p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'16px' }}>
            {[
              { n:'01', heading:'The filing threshold', body:'Small claims in WA can be filed for amounts up to $10,000 in the Magistrates Court (Minor Cases) or up to $75,000 in the full Magistrates Court. Filing costs, time investment and the stress of the process mean many legitimate claims — particularly those under $3,000–$5,000 — are never filed. The homeowner does a rough calculation and decides the money is not worth the effort.' },
              { n:'02', heading:'The company dissolution filter', body:'A significant proportion of small building contractors in WA operate through companies that are dissolved or deregistered after a project is complete or when disputes arise. ASIC records show high rates of voluntary deregistration among small building companies. Once a company is dissolved, pursuing a warranty claim against it requires tracing personal liability — a process beyond most homeowners without legal support.' },
              { n:'03', heading:'The power asymmetry', body:'Many post-completion disputes involve a homeowner with no construction knowledge facing a tradie who is on familiar territory. The tradie knows the language of defects, the difficulty of proving causation, and the cost of litigation. This knowledge asymmetry suppresses claims before they start. Homeowners frequently accept a partial remedy, a cash payment, or nothing — rather than pursue a formal process they do not understand.' },
              { n:'04', heading:'The documentation problem', body:'The most common reason warranty claims fail is evidentiary — the homeowner cannot prove what was agreed, what was built, or when the defect appeared. Without a signed scope agreement, milestone records, or contemporaneous photographs, a defect claim is a he-said-she-said dispute. Tradies know this. It is not always cynical — many simply build what they believe was agreed — but the absence of documentation systematically disadvantages the homeowner in any dispute.' },
              { n:'05', heading:'The definition problem', body:"What counts as a defect is contested. A tiler may consider a 2mm lippage acceptable. The homeowner considers it a failure. A painter may consider surface preparation adequate for the quoted price. The homeowner expected a result that lasts. Without agreed specifications in writing before the work begins, both parties are right by their own standards — and the dispute is irresolvable. The complaint data does not capture the disputes that never escalated because there was no written standard to measure against." },
            ].map(item => (
              <div key={item.n} style={{ display:'flex', gap:'14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#D4522A', flexShrink:0, paddingTop:'2px', letterSpacing:'0.5px' }}>{item.n}</div>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 6px' }}>{item.heading}</p>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.15)', borderRadius:'12px', padding:'18px 20px' }}>
            <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>
              <strong style={{ color:'#D4522A' }}>The structural conclusion:</strong> The true rate of post-completion trade disputes in WA is unknown but almost certainly 5–10x the recorded court data. This is not a claim about trade conduct — most tradies do good work and intend to honour their commitments. It is a claim about the system. A dispute resolution ecosystem that systematically suppresses claims produces poor data, which produces poor policy, which produces poor outcomes for both homeowners and the tradies who operate honestly.
            </p>
          </div>
        </div>

        {/* Section 3 — WA specific factors */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#9B6B9B', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>WA-SPECIFIC FACTORS</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              {
                heading: 'The boom-bust construction cycle',
                body: "WA's construction sector is unusually volatile relative to eastern states — amplified by the resources sector's effect on labour costs, migration and consumer confidence. The mining boom periods of 2005–2012 and 2020–2024 saw rapid expansion of the building sector, with many new entrants operating without adequate capital, experience or systems. Warranty obligations incurred during boom periods often surface 2–5 years later when market conditions have changed and marginal operators have exited. This lag between work completion and warranty claim creates a mismatch between the trading entity at the time of work and the entity (if it still exists) at the time of claim.",
              },
              {
                heading: 'Outer suburb and regional city construction volume',
                body: 'The scale of residential development across outer Perth — Ellenbrook, Baldivis, Alkimos, Piara Waters, Byford — and in regional WA cities experiencing their own growth cycles has produced an enormous volume of new homes built by volume builders and subcontractors operating under cost and schedule pressure. Bunbury, Busselton, Geraldton, Broome, Karratha and Port Hedland have all seen significant residential construction booms tied to resources sector activity and population growth. In regional cities, the warranty exposure problem is compounded: fewer local contractors means less competitive pressure on quality, longer distances make return visits for rectification more costly for the tradie, and regulatory oversight is lighter than in Perth metro. Homeowners in both outer Perth suburbs and regional WA cities are statistically more likely to encounter warranty issues and less likely to have the documentation required to pursue them.',
              },
              {
                heading: 'Distance from regulatory oversight',
                body: 'WA operates its own building regulation framework largely independently of eastern state equivalents. The Building and Energy division is adequately resourced for routine licensing but faces limitations in its enforcement capacity for complex multi-trade disputes or systemic issues with larger builders. There is no equivalent of the NSW Fair Trading rapid dispute resolution process in WA. The consequence is that homeowners with legitimate warranty claims face a slower, more expensive process than counterparts in other states.',
              },
              {
                heading: 'The climate-warranty connection',
                body: "Perth's extreme climate creates warranty exposure that would not exist elsewhere. Waterproofing failures that might take 10 years to manifest in Melbourne manifest in 3 years in Perth's UV-intense, thermally cycling environment. Decking treatments that last 5 years in Sydney last 2 years in Carnarvon. Paint systems applied without adequate surface preparation fail in 18 months on north-facing Perth walls. The connection between WA's climate and accelerated defect manifestation is poorly understood by both homeowners and some tradies — and rarely discussed in warranty documentation.",
              },
            ].map(item => (
              <div key={item.heading} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 8px' }}>{item.heading}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — What good looks like */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#2E7D60', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>WHAT GOOD WARRANTY PRACTICE LOOKS LIKE</h2>
          </div>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', marginBottom:'16px' }}>
            A warranty is only as useful as the documentation that supports it. The following are the elements of warranty practice that distinguish contractors who take their obligations seriously from those who rely on the homeowner not pursuing them.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'12px', marginBottom:'20px' }}>
            {[
              { icon:'📋', heading:'Written scope before work starts', body:'The scope agreement defines what was built, to what standard, with what materials. Without it, a warranty claim has no baseline. Every warranty dispute begins with the question: what was actually agreed?' },
              { icon:'📸', heading:'Photographic record at completion', body:'Timestamped photographs of the completed work, before and after, provide evidence of the condition at handover. They establish that defects visible at a later date were not present at completion — or that they were.' },
              { icon:'🔒', heading:'Explicit warranty terms in writing', body:'The warranty period, what it covers, how defects should be notified, and what the response time commitment is should all be in writing. A verbal warranty is unenforceable. A warranty that says "call me if there are problems" is not a warranty.' },
              { icon:'📅', heading:'Milestone sign-off with dates', body:'Signed milestone approvals establish when each stage was completed and accepted. This is relevant to the warranty period start date and to establishing the sequence of events in any dispute.' },
              { icon:'🛡', heading:'Compliance certificates on file', body:'Electrical Certificates of Compliance, plumbing Form 5s, and waterproofing certificates should be retained against the job record. They are required for insurance claims, property sales and warranty enforcement.' },
              { icon:'📬', heading:'Formal defect notification process', body:"The warranty document should specify how defects are to be notified — in writing, to a specific contact, within a defined period of discovery. This is not bureaucratic — it creates the paper trail that makes rectification enforceable and protects the tradie from claims years later about defects they were never told about." },
            ].map(item => (
              <div key={item.heading} style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px' }}>
                <div style={{ fontSize:'22px', marginBottom:'8px' }}>{item.icon}</div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 6px' }}>{item.heading}</p>
                <p style={{ fontSize:'12px', color:'#4A5E64', lineHeight:'1.65', margin:0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Homeowner checklist */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#C07830', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>HOMEOWNER WARRANTY CHECKLIST</h2>
          </div>
          <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', background:'rgba(192,120,48,0.06)', borderBottom:'1px solid rgba(192,120,48,0.15)' }}>
              <p style={{ fontSize:'12px', color:'#C07830', margin:0 }}>Before signing off on any trade job, confirm the following are in place:</p>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {[
                'Signed scope agreement on file — documents what was built, to what standard',
                'All compliance certificates received — electrical, plumbing Form 5, waterproofing',
                'Warranty terms confirmed in writing — period, coverage, notification process',
                'Photographs taken of completed work before final payment released',
                'Tradie business details confirmed — ABN, licence number, business address',
                'Milestone sign-offs signed and dated by both parties',
                'Any variations to original scope documented and signed',
                'Home Indemnity Insurance certificate received for projects over $20,000',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'9px 0', borderBottom: i < 7 ? '1px solid rgba(28,43,50,0.06)' : 'none' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'4px', border:'1.5px solid rgba(192,120,48,0.4)', flexShrink:0, marginTop:'1px' }} />
                  <p style={{ fontSize:'13px', color:'#4A5E64', margin:0, lineHeight:'1.5' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6 — When things go wrong */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#D4522A', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>WHEN THINGS GO WRONG — YOUR OPTIONS IN WA</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {[
              { step:'1', heading:'Contact the contractor in writing first', body:'Send a written notice (email is sufficient) identifying the defect, when it was first observed, and what rectification you require. Set a reasonable timeframe — 14 days is standard for non-urgent matters. Keep a copy. This is required before any formal complaint can be lodged and demonstrates good faith.' },
              { step:'2', heading:'Lodge a complaint with Building and Energy', body:'If the contractor does not respond or refuses to rectify, lodge a complaint with the Building and Energy division of DMIRS (dmirs.wa.gov.au). The complaint is free. An inspector may be appointed. The process can take months but produces a formal finding. A rectification order, if issued, is a legal obligation on the contractor.' },
              { step:'3', heading:'Small claims in the WA Magistrates Court', body:'For amounts up to $10,000, the Magistrates Court Minor Cases process is relatively accessible. For amounts up to $75,000, the full Magistrates Court applies. Legal representation is not required in minor cases. The filing fee varies by claim amount. Success requires documentation — a signed scope, evidence of the defect, and evidence of your attempts to resolve.' },
              { step:'4', heading:'Home Indemnity Insurance claim', body:'If the contractor has become insolvent, died, or disappeared, lodge a claim under the Home Indemnity Insurance policy (if one was required and issued). Contact the insurer named on the HII certificate. Note: HII does not cover disputes with solvent contractors who refuse to rectify — it is an insolvency product, not a conduct product.' },
              { step:'5', heading:'Legal advice', body:'For significant defects or complex situations, legal advice from a building and construction lawyer is worth the cost. Many operate on a first-consultation-free basis. The Law Society of WA (lawsocietywa.asn.au) maintains a referral service. Building disputes are a specialist area — general practitioners may not be familiar with the specific WA building acts.' },
            ].map(item => (
              <div key={item.step} style={{ display:'flex', gap:'14px', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'16px 20px' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#D4522A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                  <span style={{ fontSize:'12px', fontWeight:700, color:'white' }}>{item.step}</span>
                </div>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 6px' }}>{item.heading}</p>
                  <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section — how this affects tradies */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'3px', height:'20px', background:'#C07830', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>THE COST TO TRADIES — AN UNDERAPPRECIATED SIDE OF THE PROBLEM</h2>
          </div>
          <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', marginBottom:'16px' }}>
            Warranty disputes are not only a homeowner problem. The data gap and the absence of structured documentation create significant and underappreciated costs for tradies — particularly for those who do good work and intend to stand behind it.
          </p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              {
                heading: 'Unclear scope creates unclear responsibility',
                body: "When a defect appears after a job is complete, the first question is almost always: whose responsibility is it? In multi-trade jobs — a bathroom renovation involving a tiler, plumber and electrician — the answer is rarely obvious. Water damage behind a wall could be a plumbing failure, a waterproofing failure, or a tiling failure. Without a written scope that defines each trade's responsibilities, the tradie faces an allegation they cannot easily defend and the homeowner cannot easily prove. Both parties lose time, money and goodwill in a dispute that a clear scope agreement would have resolved in ten minutes.",
              },
              {
                heading: 'Legitimate workmanship questioned without a standard',
                body: "A common and genuinely unfair scenario: a tradie completes work to an industry-accepted standard. The homeowner, having no reference point, believes the result is defective. Without agreed specifications in writing — tile lippage tolerance, paint coat count and product, concrete surface finish — the tradie has no documented standard to point to. They know their work was correct but cannot prove it. The warranty complaint process, slow and adversarial by design, does not resolve these ambiguities quickly. Reputation damage accumulates before any finding is made.",
              },
              {
                heading: 'The impact of previous tradies\' poor work',
                body: "In renovation work, a tradie frequently encounters the consequences of previous work — inadequate waterproofing, non-compliant framing, undersized electrical — that they did not cause. Without a documented pre-work condition report (photographs, notes on what was found), the new tradie can inherit responsibility for defects they discovered but did not create. This is particularly common in regional WA where construction activity has surged rapidly in resource towns — Karratha, Port Hedland, Broome — without a corresponding increase in experienced trades, leading to layered defects from multiple contractors over time.",
              },
              {
                heading: 'The reputational asymmetry',
                body: "A homeowner who has a poor experience — whether the tradie was genuinely at fault or not — is more likely to leave a negative review than a satisfied homeowner is to leave a positive one. In a sector where reputation is the primary currency, the absence of documented scope agreements, milestone records and warranty terms means tradies have no structured evidence to contest inaccurate accounts of their work. The Dialogue Rating on Steadyhand is designed to address this directly: a tradie who communicates clearly, documents thoroughly and responds to warranty issues promptly builds a verifiable professional record that reflects their actual conduct.",
              },
              {
                heading: 'Confusion about statutory obligations',
                body: "Many tradies — particularly sole traders and small operators working outside major builders — are genuinely uncertain about their statutory warranty obligations under WA law. The distinction between what is required by law and what is promised contractually is often unclear. This uncertainty leads to two equally problematic outcomes: some tradies over-extend themselves on obligations they do not legally owe, while others assume no obligations exist beyond what was verbally agreed. Neither position serves the tradie or the homeowner. A written scope agreement with explicit warranty terms removes this ambiguity.",
              },
            ].map(f => (
              <div key={f.heading} style={{ borderLeft:'3px solid #C07830', paddingLeft:'14px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 4px' }}>{f.heading}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steadyhand approach */}
        <div style={{ background:'#0A0A0A', borderRadius:'16px', padding:'32px', marginBottom:'28px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'rgba(216,228,225,0.9)', letterSpacing:'0.5px', margin:'0 0 14px' }}>HOW STEADYHAND ADDRESSES THIS</p>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.5)', lineHeight:'1.8', marginBottom:'14px' }}>
            Steadyhand does not solve the enforcement problem — if a contractor is determined not to honour their obligations, no platform changes that. What it does is address the documentation problem, which is the most common reason legitimate warranty claims fail.
          </p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'20px' }}>
            {[
              'Every job produces a signed scope agreement — the baseline for any warranty claim',
              'Milestone sign-offs are date-stamped and tied to the job record',
              'Compliance certificates are filed against the job in the document vault',
              'Warranty issues are logged through the platform — creating a timestamped record',
              'The Dialogue Rating reflects how tradies respond to warranty issues — visible to future clients',
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <span style={{ color:'#2E7D60', flexShrink:0, marginTop:'2px', fontSize:'14px' }}>✓</span>
                <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.55)', margin:0, lineHeight:'1.6' }}>{item}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.35)', lineHeight:'1.75', margin:'0 0 20px' }}>
            The longer-term goal is that structured warranty data from jobs run through Steadyhand contributes to a better picture of where post-completion issues occur, in which trade categories, and in which circumstances — the kind of data that currently does not exist in WA at a useful resolution.
          </p>
          <Link href="/signup" style={{ display:'inline-block', background:'#D4522A', color:'white', padding:'12px 24px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>
            Run your next job through Steadyhand →
          </Link>
        </div>

        {/* For trade businesses — subcontractor warranty liability */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.12)', borderRadius:'16px', padding:'32px', marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <div style={{ width:'3px', height:'20px', background:'#D4522A', borderRadius:'2px', flexShrink:0 }} />
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'14px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>FOR TRADE BUSINESSES — SUBCONTRACTORS AND WARRANTY LIABILITY</h2>
          </div>
          <p style={{ fontSize:'13px', color:'#7A9098', margin:'0 0 20px', lineHeight:'1.7' }}>
            This section is written for tradies and contractors who bring workers or subcontractors onto jobs. The warranty obligations are different — and often misunderstood.
          </p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            {[
              {
                heading: 'You are responsible for your subcontractor's work',
                body: 'When you engage a subcontractor to perform part of a job, your warranty obligation to the client covers their work as well as your own. The client's contract is with you — not with your subcontractor. If the subcontractor's work is defective, the client's claim is against you as the head contractor. You then pursue the subcontractor separately. This is the doctrine of privity of contract, and it applies regardless of what your subcontract says.',
              },
              {
                heading: 'The Building Commissioner cannot hear the client's complaint directly against your subcontractor',
                body: 'The Building Services (Complaint Resolution and Administration) Act 2011 explicitly excludes work carried out by a person who is in turn obliged to perform the work under another contract — that is, subcontractor work. A homeowner cannot lodge a complaint directly against your subcontractor with the Building Commissioner. The complaint is against you. If a rectification order is issued, you must comply — and then pursue your subcontractor separately if their work caused the defect.',
              },
              {
                heading: 'If your subcontractor's work fails a product warranty claim',
                body: 'When a defect is caused by a product or material failure rather than workmanship, the question of who installed it matters. A manufacturer may decline a warranty claim if they can show the product was improperly installed. Your subcontractor's installation methodology and the product they used are therefore directly relevant to your exposure. Keeping a record of what was installed, by whom, using which product, is not administrative overhead — it is your protection.',
              },
              {
                heading: 'Practical steps to protect yourself',
                body: 'Use a written subcontract for every engagement — even for small jobs. Specify the scope clearly. Require the subcontractor to carry their own public liability insurance and provide evidence of it. Keep records of who did what work and when. If you use Steadyhand, adding the worker to the job record creates a timestamped record of their involvement that is available to you if a dispute arises. This does not create a direct contractual relationship between the subcontractor and your client — but it creates the evidence trail that supports your claim against the subcontractor if their work is later found to be defective.',
              },
              {
                heading: 'The ACL applies to your subcontractor's work too',
                body: 'Under the Australian Consumer Law, the service guarantee of due care and skill applies to every trade transaction. Your subcontractor's obligation to perform with due care and skill runs from them to you (under your subcontract). Your obligation to deliver with due care and skill runs from you to the client. Both obligations exist simultaneously. If a subcontractor's poor workmanship causes a defect, you have an ACL claim against the subcontractor — but your client's ACL claim is against you.',
              },
            ].map(item => (
              <div key={item.heading} style={{ background:'white', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'10px', padding:'16px 18px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#0A0A0A', margin:'0 0 8px' }}>{item.heading}</p>
                <p style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'20px', padding:'14px 16px', background:'rgba(212,82,42,0.06)', border:'1px solid rgba(212,82,42,0.2)', borderRadius:'8px' }}>
            <p style={{ fontSize:'12px', color:'#D4522A', margin:0, lineHeight:'1.7' }}>
              <strong>Note:</strong> This information is educational and not legal advice. If you are dealing with a specific subcontractor dispute or warranty claim, seek advice from a qualified construction lawyer or contact the Master Builders Association WA or HIA for member support.
            </p>
          </div>
        </div>

        {/* References */}
        <div style={{ background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'12px', padding:'18px 20px' }}>
          <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'11px', color:'#7A9098', letterSpacing:'0.5px', margin:'0 0 12px' }}>REFERENCES AND FURTHER READING</p>
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'6px' }}>
            {[
              { label:'Building and Energy WA — complaints process', url:'https://www.dmirs.wa.gov.au/building-energy' },
              { label:'Building Services (Complaint Resolution and Administration) Act 2011', url:'https://www.legislation.wa.gov.au' },
              { label:'Home Indemnity Insurance — WA requirements', url:'https://www.dmirs.wa.gov.au' },
              { label:'WA Magistrates Court — minor cases', url:'https://www.magistratescourt.wa.gov.au' },
              { label:'Law Society of WA — find a lawyer', url:'https://www.lawsocietywa.asn.au' },
              { label:'Builders Registration Board of WA', url:'https://www.dmirs.wa.gov.au' },
            ].map(ref => (
              <a key={ref.label} href={ref.url} target="_blank" rel="noreferrer"
                style={{ fontSize:'12px', color:'#2E6A8F', textDecoration:'none', display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#2E6A8F', flexShrink:0, display:'inline-block' }} />
                {ref.label}
              </a>
            ))}
          </div>
          <p style={{ fontSize:'11px', color:'#9AA5AA', margin:'14px 0 0', lineHeight:'1.6' }}>
            This guide reflects WA legislation and practice as at April 2025. It is for informational purposes and does not constitute legal advice. For advice on a specific warranty dispute, consult a building and construction lawyer.
          </p>
        </div>

      </div>

      <div style={{ background:'#0A0A0A', padding:'24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand · Western Australia · Trade warranty reference guide · April 2025</p>
      </div>
    </div>
  )
}
