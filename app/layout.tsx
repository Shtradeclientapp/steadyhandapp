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

      </body>
    </html>
  )
}