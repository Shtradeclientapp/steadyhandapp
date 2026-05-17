/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_ACCOUNTS = [
  {
    email: process.env.E2E_DEMO_CLIENT_EMAIL ?? 'demo-client@steadyhandtrade.app',
    password: process.env.E2E_DEMO_CLIENT_PASSWORD ?? 'demo1234',
    fullName: 'Demo Client',
    role: 'client',
    suburb: 'Subiaco',
  },
  {
    email: process.env.E2E_DEMO_TRADIE_EMAIL ?? 'demo-tradie@steadyhandtrade.app',
    password: process.env.E2E_DEMO_TRADIE_PASSWORD ?? 'demo1234',
    fullName: 'Demo Tradie',
    role: 'tradie',
    suburb: 'Subiaco',
  },
]

export default async function globalSetup() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn('[e2e] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — skipping demo account bootstrap')
    return
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as any

  const { data: listData } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const allUsers: any[] = listData?.users ?? []

  for (const acct of DEMO_ACCOUNTS) {
    const existing = allUsers.find((u: any) => u.email === acct.email)

    if (existing) {
      console.log(`[e2e] Account exists: ${acct.email}`)
      await sb.from('profiles').upsert(
        { id: existing.id, email: acct.email, full_name: acct.fullName, role: acct.role, suburb: acct.suburb, is_demo: true },
        { onConflict: 'id' }
      )
      if (acct.role === 'tradie') await upsertTradieProfile(sb, existing.id)
      continue
    }

    const { data: created, error } = await sb.auth.admin.createUser({
      email: acct.email,
      password: acct.password,
      email_confirm: true,
    })
    if (error || !created?.user) {
      console.error(`[e2e] Could not create ${acct.email}:`, error?.message)
      continue
    }

    const uid = created.user.id
    console.log(`[e2e] Created account: ${acct.email} (${uid})`)

    await sb.from('profiles').upsert(
      { id: uid, email: acct.email, full_name: acct.fullName, role: acct.role, suburb: acct.suburb, is_demo: true },
      { onConflict: 'id' }
    )
    if (acct.role === 'tradie') await upsertTradieProfile(sb, uid)
  }
}

async function upsertTradieProfile(sb: any, uid: string) {
  await sb.from('tradie_profiles').upsert(
    {
      id: uid,
      business_name: 'Demo Tradie Co',
      trade_categories: ['Tiling'],
      service_areas: ['Subiaco'],
      onboarding_step: 'active',
      subscription_active: true,
      bio: 'Demo tradie account for automated testing.',
    },
    { onConflict: 'id' }
  )
}
