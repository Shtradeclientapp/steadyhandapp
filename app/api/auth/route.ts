import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { action, email, password, full_name, role, business_name, trade_categories, service_areas } = await request.json()

  if (action === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const userId = data.user?.id
    if (!userId) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId, role, full_name, email,
    })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Create tradie profile — required for tradie role
    if (role === 'tradie') {
      if (!business_name) {
        return NextResponse.json({ error: 'Business name is required for tradie accounts' }, { status: 400 })
      }
      const { error: tradieError } = await supabase.from('tradie_profiles').insert({
        id: userId,
        business_name,
        trade_categories: trade_categories || [],
        service_areas: service_areas || [],
        subscription_active: false,
      })
      if (tradieError) return NextResponse.json({ error: tradieError.message }, { status: 500 })
    }

    return NextResponse.json({ user: data.user }, { status: 201 })

  } else if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return NextResponse.json({ user: data.user, session: data.session })

  } else if (action === 'logout') {
    await supabase.auth.signOut()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
