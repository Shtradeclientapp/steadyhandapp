import { NavHeader } from '@/components/ui/NavHeader'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F2F6F5' }}>
      <div style={{ background: '#0A0A0A', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '22px', color: '#D4522A', letterSpacing: '2px', margin: '0 0 4px' }}>STEADYHAND</p>
          <p style={{ fontSize: '13px', color: 'rgba(216,228,225,0.4)', margin: 0 }}>Trade services — Perth, WA</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#7A9098', marginBottom: '12px' }}>About</p>
          <h1 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '28px', color: '#0A0A0A', letterSpacing: '1px', margin: '0 0 20px', lineHeight: '1.3' }}>Built for the trust that already exists in trade.</h1>
          <p style={{ fontSize: '15px', color: '#4A5E64', lineHeight: '1.8', margin: 0 }}>
            Steadyhand is a platform for residential trade services in Western Australia. It connects homeowners with verified local tradies and guides both parties through the job — from the first conversation to the final sign-off.
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(28,43,50,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: '#0A0A0A', letterSpacing: '0.5px', margin: '0 0 20px' }}>ON TRADE TRADITIONS</h2>
          <div style={{ fontSize: '15px', color: '#4A5E64', lineHeight: '1.85' }}>
            <p style={{ margin: '0 0 18px' }}>
              Trade businesses have always run on trust. Handshake agreements can signal flexibility and commitment. Vague quote breakdowns can sometimes spare a client unnecessary stress. Warranty conversations can leave room for going above and beyond. These are traditions, not oversights — and they often reflect a quality of professional judgement that formal documentation can&apos;t always fully capture.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              Steadyhand doesn&apos;t try to turn every form of trade discretion into a form or a policy. What it does is create a shared record of what was understood and agreed — so that when memory differs, there&apos;s something to return to. That record is there to protect both parties, not to regulate the relationship.
            </p>
            <p style={{ margin: 0 }}>
              Think of Steadyhand as extending trade traditions into a medium where a handshake can&apos;t be remembered. The relationship still has room to breathe. The scope is where you both started — not a ceiling on what the job becomes.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(28,43,50,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: '#0A0A0A', letterSpacing: '0.5px', margin: '0 0 20px' }}>THE DIALOGUE RATING</h2>
          <div style={{ fontSize: '15px', color: '#4A5E64', lineHeight: '1.85' }}>
            <p style={{ margin: '0 0 18px' }}>
              Every completed job generates a Dialogue Rating for the tradie. It&apos;s built from six dimensions of client experience: pricing transparency, scope clarity, risk communication, timeline, compliance and professionalism.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              It doesn&apos;t penalise discretion. Trade businesses have always operated on trust, handshake agreements and a degree of give-and-take that formal documentation can&apos;t always fully capture. Steadyhand doesn&apos;t try to change that. The rating reflects whether clients felt respected and informed — not whether a tradie followed a script.
            </p>
            <p style={{ margin: 0 }}>
              A tradie who says little but says the right things scores well. The rating builds across jobs and is visible to clients at the shortlist stage — not as a ranking, but as a signal of professional confidence.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(28,43,50,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: '#0A0A0A', letterSpacing: '0.5px', margin: '0 0 20px' }}>ESTIMATES AND QUOTES</h2>
          <div style={{ fontSize: '15px', color: '#4A5E64', lineHeight: '1.85' }}>
            <p style={{ margin: '0 0 18px' }}>
              Steadyhand makes a deliberate distinction between an estimate and a quote. An estimate is submitted at stage 4, after the tradie has visited the site and reviewed the client&apos;s scope notes. It&apos;s an informed indicative price — not a binding commitment.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              The quote is the priced scope agreement signed by both parties at stage 5. It&apos;s the contract. Milestone payments are drawn from it.
            </p>
            <p style={{ margin: 0 }}>
              This distinction matters because most quote revisions happen when the scope wasn&apos;t properly understood before pricing. Steadyhand&apos;s pipeline front-loads the discovery work — site consult, client intent, observations — so that by the time an estimate is submitted, the tradie has seen the job and the client has communicated what they actually need. The estimate is more reliable precisely because of what preceded it. And because the parties have already explored the scope together, the rate of revision between estimate and signed quote is lower than in a cold-quote process.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(28,43,50,0.1)', paddingTop: '40px', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '18px', color: '#0A0A0A', letterSpacing: '0.5px', margin: '0 0 20px' }}>THE PIPELINE</h2>
          <p style={{ fontSize: '15px', color: '#4A5E64', lineHeight: '1.85', margin: '0 0 18px' }}>
            Every job on Steadyhand moves through eight stages — from the initial request through matching, consultation, scope agreement, delivery, sign-off and warranty. Each stage has a clear role for both parties.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {[
              { n: '1', label: 'Request', sub: 'Client describes the job' },
              { n: '2', label: 'Match', sub: 'AI shortlist + invite' },
              { n: '3', label: 'Consult', sub: 'Site visit + observations' },
              { n: '4', label: 'Compare', sub: 'Estimates reviewed' },
              { n: '5', label: 'Agreement', sub: 'Scope signed by both' },
              { n: '6', label: 'Build', sub: 'Milestones + delivery' },
              { n: '7', label: 'Sign off', sub: 'Rating + final payment' },
              { n: '8', label: 'Protected', sub: 'Warranty period' },
            ].map(s => (
              <div key={s.n} style={{ background: 'white', border: '1px solid rgba(28,43,50,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: '0 0 3px', fontWeight: 600 }}>{s.n}.</p>
                <p style={{ fontSize: '13px', color: '#0A0A0A', fontWeight: 600, margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: '#7A9098', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#0A0A0A', borderRadius: '12px', padding: '28px 32px' }}>
          <p style={{ fontFamily: 'var(--font-aboreto), sans-serif', fontSize: '14px', color: 'rgba(216,228,225,0.9)', letterSpacing: '1px', margin: '0 0 8px' }}>STEADYHAND</p>
          <p style={{ fontSize: '13px', color: 'rgba(216,228,225,0.45)', margin: '0 0 16px' }}>Perth, Western Australia</p>
          <a href="/signup" style={{ display: 'inline-block', background: '#D4522A', color: 'white', padding: '10px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', marginRight: '10px' }}>Get started →</a>
          <a href="/login" style={{ display: 'inline-block', color: 'rgba(216,228,225,0.5)', fontSize: '13px', textDecoration: 'none' }}>Log in</a>
        </div>

      </div>
    </div>
  )
}
