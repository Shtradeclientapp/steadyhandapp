import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { tradie_id } = await req.json()
    if (!tradie_id) return NextResponse.json({ error: 'tradie_id required' }, { status: 400 })

    // Verify caller is admin
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        if (!prof?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get tradie profile + email
    const { data: tp } = await supabase
      .from('tradie_profiles')
      .select('id, business_name, trade_categories, onboarding_step')
      .eq('id', tradie_id)
      .single()

    const { data: prof } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', tradie_id)
      .single()

    if (!tp || !prof?.email) return NextResponse.json({ error: 'Tradie not found' }, { status: 404 })

    // Activate
    await supabase.from('tradie_profiles').update({
      onboarding_step: 'active',
      licence_verified: true,
      onboarding_completed_at: new Date().toISOString(),
    }).eq('id', tradie_id)

    const trade = (tp.trade_categories || [])[0] || 'trade'
    const dashUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://steadyhandtrade.app'}/tradie/dashboard`

    // Send activation email
    await resend.emails.send({
      from: 'Steadyhand <no-reply@steadyhandtrade.app>',
      to: prof.email,
      subject: 'Your Steadyhand account is now live',
      html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:0;">
        <div style="background:#0A0A0A;padding:28px 32px;">
          <p style="font-family:Georgia,serif;font-size:22px;color:#D4522A;letter-spacing:2px;margin:0;">STEADYHAND</p>
        </div>
        <div style="padding:36px 32px;background:#F2F6F5;">
          <h2 style="font-size:22px;color:#0A0A0A;margin:0 0 12px;font-weight:600;">You're verified and live.</h2>
          <p style="font-size:15px;color:#4A5E64;line-height:1.7;margin:0 0 8px;">Hi ${prof.full_name || tp.business_name},</p>
          <p style="font-size:15px;color:#4A5E64;line-height:1.7;margin:0 0 24px;">
            Your <strong>${tp.business_name}</strong> account has been verified by the Steadyhand team.
            Your profile is now live in the directory — clients looking for a ${trade} in your area can find and invite you.
          </p>
          <div style="background:white;border-radius:10px;padding:20px 24px;margin:0 0 24px;border:1px solid rgba(28,43,50,0.08);">
            <p style="font-size:13px;font-weight:600;color:#0A0A0A;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">What happens next</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${[
                'Complete your profile — trade categories, service areas and a strong bio help clients choose you',
                'When a client invites you to quote, you\'ll receive an email notification',
                'Your Dialogue Rating builds with every completed job — it\'s visible to future clients',
              ].map((s, i) => `<div style="display:flex;gap:12px;"><span style="font-size:13px;color:#2E7D60;font-weight:600;min-width:18px;">${i+1}.</span><p style="font-size:13px;color:#4A5E64;margin:0;line-height:1.5;">${s}</p></div>`).join('')}
            </div>
          </div>
          <a href="${dashUrl}" style="display:inline-block;background:#D4522A;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Go to my dashboard →</a>
        </div>
        <div style="padding:20px 32px;background:#E8F0EE;">
          <p style="font-size:12px;color:#9AA5AA;margin:0;">Steadyhand · Perth, WA · <a href="https://steadyhandtrade.app" style="color:#9AA5AA;">steadyhandtrade.app</a></p>
        </div>
      </div>`
    })

    return NextResponse.json({ ok: true, email_sent_to: prof.email })
  } catch (e: any) {
    console.error('tradie-activate error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
