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
  title: 'Steadyhand — Request to Warranty',
  description: 'Client-first trades platform for Western Australia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${aboreto.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
