export default function TermsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif', padding:'40px 24px' }}>
      <div style={{ maxWidth:'740px', margin:'0 auto' }}>
        <a href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none', display:'block', marginBottom:'40px' }}>STEADYHAND</a>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#1C2B32', letterSpacing:'1px', marginBottom:'8px' }}>TERMS OF SERVICE</h1>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'40px' }}>Last updated: April 2026 · Steadyhand Digital Pty Ltd</p>
        {[
          { title:'1. About Steadyhand', body:'Steadyhand Digital Pty Ltd operates a platform connecting homeowners with licensed trade contractors in Western Australia. Steadyhand facilitates the engagement process but is not a party to any contract between a client and a tradie.' },
          { title:'2. Eligibility', body:'You must be at least 18 years of age and located in Australia. Tradies must hold current licences for their listed trade categories. By registering you warrant that your information is accurate and complete.' },
          { title:'3. The Steadyhand process', body:'Steadyhand provides a structured process: job request, AI-assisted matching, site consult, quote comparison, scope agreement, milestone delivery, sign-off, and warranty tracking. Steadyhand does not guarantee the quality of work performed by tradies.' },
          { title:'4. Scope agreements', body:'Scope agreements are binding contracts between the client and the tradie. Steadyhand is not a party. Where applicable, the Home Building Contracts Act 1991 (WA) governs these agreements.' },
          { title:'5. Payments', body:'Payments are processed through Stripe. Steadyhand charges a completion fee of 3.5% (3% for founding members) per milestone. Steadyhand does not hold client funds — payments go directly through Stripe Connect.' },
          { title:'6. Warranty', body:'The warranty period begins on sign-off and runs for the agreed period (minimum 90 days). Tradies must respond to warranty issues within 5 business days. Steadyhand provides tracking but is not responsible for rectification.' },
          { title:'7. Dialogue Rating', body:'The Dialogue Rating scores tradies on communication quality and follow-through. Steadyhand may adjust or remove ratings that appear fraudulent or manipulated.' },
          { title:'8. Prohibited conduct', body:'You must not use Steadyhand for fraud, to circumvent payments, post false information, harass users, or violate any law. Steadyhand may suspend or terminate accounts that breach these terms.' },
          { title:'9. Limitation of liability', body:'To the maximum extent permitted by law, Steadyhand liability is limited to fees paid in the preceding 12 months. Steadyhand is not liable for indirect or consequential loss.' },
          { title:'10. Governing law', body:'These terms are governed by the laws of Western Australia. Disputes are subject to the exclusive jurisdiction of Western Australian courts.' },
          { title:'11. Contact', body:'For questions about these terms, contact legal@steadyhanddigital.com.au.' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom:'32px', paddingBottom:'32px', borderBottom: i < 10 ? '1px solid rgba(28,43,50,0.1)' : 'none' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#1C2B32', letterSpacing:'0.5px', marginBottom:'10px' }}>{s.title}</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
