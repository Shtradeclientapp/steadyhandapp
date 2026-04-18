import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Steadyhand',
  description: 'Terms of service for Steadyhand, the request-to-warranty platform for Western Australia.',
}

export default function TermsPage() {
  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom:'32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
        <div style={{ width:'3px', height:'18px', background:'#D4522A', borderRadius:'2px', flexShrink:0 }} />
        <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'13px', color:'#0A0A0A', letterSpacing:'0.5px', margin:0 }}>{title}</h2>
      </div>
      <div style={{ fontSize:'13px', color:'#4A5E64', lineHeight:'1.8' }}>{children}</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', fontFamily:'sans-serif' }}>
      <nav style={{ height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'#0A0A0A', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/" style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#D4522A', letterSpacing:'2px', textDecoration:'none' }}>STEADYHAND</Link>
        <Link href="/signup" style={{ fontSize:'13px', color:'white', background:'#D4522A', padding:'8px 16px', borderRadius:'7px', textDecoration:'none' }}>Sign in</Link>
      </nav>

      <div style={{ background:'#0A0A0A', padding:'40px 24px 32px' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <p style={{ fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase' as const, color:'rgba(216,228,225,0.35)', marginBottom:'8px' }}>Legal</p>
          <h1 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'clamp(22px,5vw,32px)', color:'rgba(216,228,225,0.92)', letterSpacing:'2px', margin:'0 0 10px' }}>TERMS OF SERVICE</h1>
          <p style={{ fontSize:'13px', color:'rgba(216,228,225,0.4)', margin:0 }}>Last updated: April 2025 · Steadyhand · Western Australia</p>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'36px 24px' }}>

        <div style={{ background:'rgba(192,120,48,0.06)', border:'1px solid rgba(192,120,48,0.2)', borderRadius:'12px', padding:'16px 20px', marginBottom:'28px' }}>
          <p style={{ fontSize:'13px', color:'#C07830', lineHeight:'1.7', margin:0 }}>
            Please read these terms carefully before using Steadyhand. By creating an account or using the platform, you agree to be bound by these terms. If you do not agree, do not use the platform.
          </p>
        </div>

        {section('1. About Steadyhand', <>
          <p>Steadyhand is a platform that facilitates the management of residential trade jobs in Western Australia. It provides tools for homeowners, trade businesses and property managers to manage the consult, quote, scope agreement, delivery, and warranty stages of a trade job.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand is operated by Steadyhand Trade Pty Ltd (ABN 14 696 780 588), registered in Western Australia. References to "Steadyhand", "we", "us" or "our" in these terms refer to Steadyhand Trade Pty Ltd.</p>
        </>)}

        {section('2. Eligibility', <>
          <p>You must be at least 18 years of age to use Steadyhand. By creating an account, you confirm that you are 18 or older and have the legal capacity to enter into a binding agreement.</p>
          <p style={{ marginTop:'10px' }}>Trade businesses using Steadyhand must hold all licences, registrations and insurances required by Western Australian law for the work they perform through the platform. Steadyhand may verify these credentials but is not responsible for ensuring ongoing compliance.</p>
        </>)}

        {section('3. Account Registration', <>
          <p>You are responsible for maintaining the security of your account credentials. You must not share your password or allow others to access your account except through the authorised worker seat feature.</p>
          <p style={{ marginTop:'10px' }}>You must provide accurate and complete information when registering. If your details change — including your licence number, ABN or insurance status — you must update your profile promptly.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand reserves the right to suspend or terminate accounts that provide false information, breach these terms, or engage in conduct that is harmful to other users or to the platform.</p>
        </>)}

        {section('4. Platform Role — Steadyhand is Not a Party to Trade Contracts', <>
          <p>Steadyhand provides a platform and tools. It is not a party to any agreement between a homeowner and a trade business. The scope agreement, milestone payments and warranty obligations are between the homeowner and the trade business directly.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand does not employ tradies, guarantee the quality of work, or accept liability for the outcome of any job facilitated through the platform. The platform facilitates documentation, communication and payment — it does not supervise or certify trade work.</p>
          <p style={{ marginTop:'10px' }}>Homeowners and trade businesses are responsible for ensuring their agreements comply with applicable WA law, including the Building Services (Complaint Resolution and Administration) Act 2011 and any relevant licensing requirements.</p>
        </>)}

        {section('5. Fees and Payments', <>
          <p>Steadyhand charges fees for use of the platform in two ways:</p>
          <p style={{ marginTop:'10px' }}><strong>Subscription fees:</strong> Trade businesses may subscribe to a paid plan. Subscription fees are charged monthly in advance and are non-refundable except where required by Australian Consumer Law. Subscriptions renew automatically unless cancelled before the renewal date.</p>
          <p style={{ marginTop:'10px' }}><strong>Completion fees:</strong> A percentage fee is charged on milestone payments processed through the platform. The applicable rate is shown on the subscription plan page and in your account settings. The fee is deducted at the time of payment processing.</p>
          <p style={{ marginTop:'10px' }}>All fees are in Australian dollars and are inclusive of GST where applicable. Steadyhand uses Stripe for payment processing. By using the payment features, you also agree to Stripe's terms of service.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand reserves the right to change its fee structure with 30 days written notice to affected users.</p>
        </>)}

        {section('6. Milestone Payments and Fund Holding', <>
          <p>Milestone payments submitted through Steadyhand are processed via Stripe Connect. Funds are held by Stripe and released to the trade business on client approval of a milestone.</p>
          <p style={{ marginTop:'10px' }}>Where a client elects to "approve work and hold payment", funds remain held pending resolution or final settlement. Steadyhand does not hold funds directly — all fund custody is managed by Stripe in accordance with their terms.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand is not responsible for disputes between parties regarding payment amounts, milestone definitions or payment timing. These disputes are between the homeowner and the trade business and should be resolved through the platform's messaging and dispute tools, or through the Building and Energy complaints process if required.</p>
        </>)}

        {section('7. Scope Agreements', <>
          <p>Scope agreements created or uploaded through Steadyhand constitute a record of what the parties agreed. They are not a substitute for legal advice and do not constitute a formal building contract unless they meet the requirements of applicable WA legislation for the work involved.</p>
          <p style={{ marginTop:'10px' }}>For building work above the threshold requiring a formal contract under WA law, parties should seek independent legal advice. Steadyhand does not provide legal advice and makes no representation about the legal sufficiency of any scope agreement.</p>
          <p style={{ marginTop:'10px' }}>Once a scope agreement is signed by both parties on Steadyhand, it is locked and cannot be edited without both parties signing again. Steadyhand maintains a timestamped record of all signed documents.</p>
        </>)}

        {section('8. Warranty Tracking', <>
          <p>Steadyhand provides tools to record and track warranty periods following job completion. The warranty period is set in the scope agreement and begins from the date of sign-off.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand's warranty tracking is a record-keeping tool. It does not create, modify or extend any legal warranty obligations that exist independently under WA law. Statutory warranties under the Building Services (Complaint Resolution and Administration) Act 2011 apply regardless of what is recorded in Steadyhand.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand is not responsible for enforcing warranty obligations. The platform facilitates communication and documentation of warranty issues. Resolution of warranty disputes is the responsibility of the parties.</p>
        </>)}

        {section('9. Dialogue Rating', <>
          <p>Steadyhand's Dialogue Rating is a measure of communication quality and professional conduct throughout the job stages. Ratings are calculated algorithmically based on platform activity and are not individually moderated.</p>
          <p style={{ marginTop:'10px' }}>Trade businesses may not manipulate their Dialogue Rating through artificial means. Attempts to do so may result in account suspension.</p>
          <p style={{ marginTop:'10px' }}>Dialogue Ratings are visible to other users as part of the platform's transparency features. Steadyhand does not guarantee the accuracy of ratings and accepts no liability for decisions made based on them.</p>
        </>)}

        {section('10. User Conduct', <>
          <p>You must not use Steadyhand to:</p>
          <ul style={{ marginTop:'8px', paddingLeft:'20px', display:'flex', flexDirection:'column' as const, gap:'6px' }}>
            <li>Submit false or misleading information about yourself, your business or your work</li>
            <li>Harass, threaten or abuse other users</li>
            <li>Circumvent the platform's payment system to avoid completion fees</li>
            <li>Create multiple accounts to manipulate ratings or shortlisting</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to access other users' accounts or data</li>
          </ul>
          <p style={{ marginTop:'10px' }}>Breach of these conduct requirements may result in immediate account suspension without refund of any subscription fees.</p>
        </>)}

        {section('11. Intellectual Property', <>
          <p>Steadyhand and its logos, design, software and content are the intellectual property of Steadyhand Trade Pty Ltd. You may not copy, reproduce or distribute any part of the platform without written permission.</p>
          <p style={{ marginTop:'10px' }}>Content you upload to Steadyhand — including job descriptions, photos and documents — remains your property. You grant Steadyhand a licence to store, display and process this content for the purpose of providing the platform services.</p>
        </>)}

        {section('12. Privacy', <>
          <p>Steadyhand's collection and use of personal information is governed by our Privacy Policy, available at <Link href="/privacy" style={{ color:'#2E6A8F' }}>steadyhandtrade.app/privacy</Link>. By using the platform you consent to the collection and use of your information as described in that policy.</p>
        </>)}

        {section('13. Limitation of Liability', <>
          <p>To the maximum extent permitted by Australian law, Steadyhand's liability to you for any loss or damage arising from your use of the platform is limited to the fees you have paid to Steadyhand in the three months preceding the event giving rise to the claim.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand is not liable for any indirect, incidental, special or consequential loss, including loss of profits, loss of data or loss of business opportunity, even if advised of the possibility of such loss.</p>
          <p style={{ marginTop:'10px' }}>Nothing in these terms excludes any rights you have under the Australian Consumer Law that cannot be excluded by contract.</p>
        </>)}

        {section('14. Disputes Between Users', <>
          <p>Steadyhand provides tools to facilitate resolution of disputes between homeowners and trade businesses. Where a dispute cannot be resolved through the platform, parties may refer the matter to the Building and Energy division of DMIRS or the WA Magistrates Court as appropriate.</p>
          <p style={{ marginTop:'10px' }}>Steadyhand may, at its discretion, review job records and intervene in disputes to ensure both parties have access to documented evidence. Steadyhand's intervention is facilitative only — it does not constitute adjudication or legal advice.</p>
        </>)}

        {section('15. Changes to These Terms', <>
          <p>Steadyhand may update these terms from time to time. Material changes will be notified to registered users by email at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the updated terms.</p>
        </>)}

        {section('16. Governing Law', <>
          <p>These terms are governed by the laws of Western Australia. Any disputes arising from these terms or your use of the platform are subject to the exclusive jurisdiction of the courts of Western Australia.</p>
        </>)}

        {section('17. Contact', <>
          <p>For questions about these terms, contact Steadyhand at <a href="mailto:support@steadyhandtrade.app" style={{ color:'#2E6A8F' }}>support@steadyhandtrade.app</a> or through the <Link href="/help" style={{ color:'#2E6A8F' }}>help page</Link>.</p>
        </>)}

        <div style={{ borderTop:'1px solid rgba(28,43,50,0.1)', paddingTop:'24px', display:'flex', gap:'16px', flexWrap:'wrap' as const }}>
          <Link href="/privacy" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none' }}>Privacy policy →</Link>
          <Link href="/guides/warranty-wa" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none' }}>Warranty reference guide →</Link>
          <Link href="/help" style={{ fontSize:'13px', color:'#2E6A8F', textDecoration:'none' }}>Help & support →</Link>
        </div>
      </div>

      <div style={{ background:'#0A0A0A', padding:'20px 24px', textAlign:'center' as const, marginTop:'24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Steadyhand Trade Pty Ltd · Western Australia · ABN 14 696 780 588</p>
      </div>
    </div>
  )
}
