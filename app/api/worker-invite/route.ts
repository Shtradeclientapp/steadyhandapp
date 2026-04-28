import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, email, phone } = await req.json()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

    const { data: tradie } = await supabase
      .from('tradie_profiles')
      .select('id, business_name')
      .eq('id', session.user.id)
      .single()

    if (!tradie) return NextResponse.json({ error: 'Tradie not found' }, { status: 404 })

    const token = crypto.randomUUID()

    const { data: worker, error: workerErr } = await supabase
      .from('tradie_workers')
      .upsert({ tradie_id: session.user.id, name, email, phone: phone || null, status: 'invited', invite_token: token }, { onConflict: 'tradie_id,email' })
      .select()
      .single()

    if (workerErr) return NextResponse.json({ error: workerErr.message }, { status: 500 })

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/worker/setup?token=${token}`

    await resend.emails.send({
      from: 'Steadyhand <no-reply@steadyhandtrade.app>',
      to: email,
      subject: `${tradie.business_name} has invited you to Steadyhand`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;color:#0A0A0A;margin:0 0 12px;">You've been invited to join ${tradie.business_name}'s field team</h2>
        <p style="font-size:14px;color:#4A5E64;line-height:1.6;margin:0 0 24px;">${tradie.business_name} uses Steadyhand to manage jobs and coordinate their field team. Click below to set up your worker account.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#D4522A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Accept invite →</a>
        <p style="font-size:12px;color:#9AA5AA;margin:24px 0 0;">This link expires in 7 days.</p>
      </div>`
    })

    return NextResponse.json({ ok: true, worker_id: worker.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
