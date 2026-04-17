import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, Aboreto } from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const aboreto = Aboreto({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-aboreto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Steadyhand',
  description: 'Request to warranty platform for Western Australia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${aboreto.variable}`}>
      <body>
        {children}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            try { await OneSignal.init({
              appId: "9a835013-fb55-452e-8860-450ac951bd34",
              safari_web_id: "web.onesignal.auto.1592f4e8-7629-48b3-b916-fa35b5011e11",
              notifyButton: { enable: true },
            });
            } catch(e) { console.warn('OneSignal init skipped:', e.message); return; }
            OneSignal.on('subscriptionChange', async function(isSubscribed) {
              if (isSubscribed) {
                const playerId = await OneSignal.getUserId();
                if (playerId) {
                  await fetch('/api/notify/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ onesignal_id: playerId }),
                  });
                }
              }
            });
          });
        `}} />
      <footer style={{ background:'#0A0A0A', padding:'40px 24px 28px', marginTop:'auto' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'28px', marginBottom:'32px' }}>
            <div>
              <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'18px', color:'#D4522A', letterSpacing:'2px', margin:'0 0 8px' }}>STEADYHAND</p>
              <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.3)', lineHeight:'1.6', margin:0 }}>Request to warranty platform for Western Australia.</p>
            </div>
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.35)', letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 12px' }}>Platform</p>
              {[
                { href:'/signup', label:'Create account' },
                { href:'/login', label:'Sign in' },
                { href:'/help', label:'Help & support' },
                { href:'/guides', label:'Cost guides' },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ display:'block', fontSize:'13px', color:'rgba(216,228,225,0.45)', textDecoration:'none', marginBottom:'7px' }}>{l.label}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.35)', letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 12px' }}>Resources</p>
              {[
                { href:'/guides/warranty-wa', label:'Warranties in WA' },
                { href:'/guides/electrical', label:'Electrical costs' },
                { href:'/guides/plumbing', label:'Plumbing costs' },
                { href:'/guides/bathroom-renovation', label:'Bathroom renovation' },
                { href:'/guides', label:'All cost guides →' },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ display:'block', fontSize:'13px', color:'rgba(216,228,225,0.45)', textDecoration:'none', marginBottom:'7px' }}>{l.label}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, color:'rgba(216,228,225,0.35)', letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 12px' }}>Legal</p>
              {[
                { href:'/privacy', label:'Privacy policy' },
                { href:'/guides/warranty-wa', label:'Warranty reference' },
                { href:'/help', label:'Contact us' },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ display:'block', fontSize:'13px', color:'rgba(216,228,225,0.45)', textDecoration:'none', marginBottom:'7px' }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>© 2025 Steadyhand · Western Australia · ABN pending</p>
            <p style={{ fontSize:'12px', color:'rgba(216,228,225,0.2)', margin:0 }}>Built for the WA trade sector</p>
          </div>
        </div>
      </footer>
      </body>
    </html>
  )
}