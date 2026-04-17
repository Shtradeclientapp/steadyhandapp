export default function PrivacyPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif', padding:'40px 24px' }}>
      <div style={{ maxWidth:'740px', margin:'0 auto' }}>
        <a href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none', display:'block', marginBottom:'40px' }}>STEADYHAND</a>
        <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'28px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'8px' }}>PRIVACY POLICY</h1>
        <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'40px' }}>Last updated: April 2026 · Steadyhand Digital Pty Ltd</p>
        {[
          { title:'1. Who we are', body:'Steadyhand Digital Pty Ltd operates the Steadyhand platform. We are committed to protecting your personal information in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles.' },
          { title:'2. What we collect', body:'We collect your name, email, phone number, property address, ABN and trade licence details (for tradies), job descriptions, consult notes, scope agreements, payment information (processed by Stripe — we do not store card details), photos uploaded to jobs, and messages sent through the platform.' },
          { title:'3. How we use your information', body:'We use your information to operate the platform; to process payments via Stripe; to send transactional emails about your jobs; to calculate Dialogue Ratings; to improve the platform; and to comply with our legal obligations.' },
          { title:'4. AI processing', body:'Steadyhand uses AI (Anthropic Claude) to match clients with tradies, generate scope agreements, and produce consult summaries. Your job descriptions and profile information may be processed by the AI. We do not use your data to train AI models.' },
          { title:'5. Who we share your information with', body:'We share information with Stripe (payments), Supabase (database hosting), Resend (email delivery), and Anthropic (AI features). We do not sell your personal information. We may disclose information if required by law.' },
          { title:'6. Document Vault', body:'Documents in your Document Vault are accessible only to you and the parties to the relevant job. Documents are retained for a minimum of 7 years to support warranty and legal obligations.' },
          { title:'7. Data retention', body:'Job records, scope agreements, and warranty documents are retained for 7 years after job completion. You may request deletion of your account subject to legal retention requirements.' },
          { title:'8. Your rights', body:'You have the right to access, correct, or request deletion of your personal information. Contact us at privacy@steadyhanddigital.com.au to exercise these rights.' },
          { title:'9. Security', body:'We use encrypted connections, row-level database security, and access controls. Payment data is handled entirely by Stripe and never stored on our servers.' },
          { title:'10. Contact', body:'For privacy enquiries, contact privacy@steadyhanddigital.com.au. If unsatisfied with our response, you may contact the Office of the Australian Information Commissioner at oaic.gov.au.' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom:'32px', paddingBottom:'32px', borderBottom: i < 9 ? '1px solid rgba(28,43,50,0.1)' : 'none' }}>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'15px', color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:'10px' }}>{s.title}</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.75', margin:0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
