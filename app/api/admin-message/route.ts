import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'Steadyhand <no-reply@steadyhandtrade.app>'

export async function POST(req: NextRequest) {
  try {
    const { admin_id, recipient_id, recipient_email, recipient_name, subject, body, message_type } = await req.json()
    if (!subject || !body || (!recipient_id && !recipient_email)) {
      return NextResponse.json({ error: 'subject, body and recipient required' }, { status: 400 })
    }

    // Resolve recipient email if not provided
    let toEmail = recipient_email
    let toName = recipient_name
    if (recipient_id && !toEmail) {
      const { data: prof } = await supabase.from('profiles').select('email, full_name').eq('id', recipient_id).single()
      toEmail = prof?.email
      toName = prof?.full_name
    }
    if (!toEmail) return NextResponse.json({ error: 'Could not resolve recipient email' }, { status: 400 })

    // Send email
    const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:0;">
      <div style="background:#0A0A0A;padding:24px 32px;border-radius:12px 12px 0 0;">
        <p style="font-family:Georgia,serif;font-size:20px;color:#D4522A;letter-spacing:2px;margin:0;">STEADYHAND</p>
      </div>
      <div style="background:#F2F6F5;padding:32px;border-radius:0 0 12px 12px;">
        ${toName ? `<p style="font-size:15px;color:#4A5E64;margin:0 0 16px;">Hi ${toName},</p>` : ''}
        <div style="font-size:15px;color:#0A0A0A;line-height:1.7;white-space:pre-wrap;">${body.replace(/\n/g, '<br/>')}</div>
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(28,43,50,0.1);">
          <p style="font-size:12px;color:#9AA5AA;margin:0;">The Steadyhand Team · <a href="https://steadyhandtrade.app" style="color:#9AA5AA;">steadyhandtrade.app</a></p>
        </div>
      </div>
    </div>`

    const emailResult = await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject,
      html,
    })

    // Log to admin_messages table
    await supabase.from('admin_messages').insert({
      admin_id: admin_id || null,
      recipient_id: recipient_id || null,
      recipient_email: toEmail,
      recipient_name: toName || null,
      subject,
      body,
      message_type: message_type || 'direct',
      email_sent: true,
      email_sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, email_id: emailResult.data?.id })
  } catch (e: any) {
    console.error('admin-message error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  const { data } = await supabase
    .from('admin_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return NextResponse.json(data || [])
}
