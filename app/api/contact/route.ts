import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const ADMIN_EMAIL = 'support@steadyhandtrade.app'
const FROM = 'Steadyhand <noreply@steadyhandtrade.app>'

const PRIORITY_LABELS: Record<string,string> = {
  general: 'General question',
  dispute: '🔴 Job dispute',
  payment: '🟠 Payment issue',
  technical: '🔵 Technical error',
  account: '🟣 Account issue',
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role, subject, message, priority } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const priorityLabel = PRIORITY_LABELS[priority] || priority
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#0A0A0A;margin:0 0 4px;">Steadyhand Support Request</h2>
        <p style="color:#7A9098;font-size:13px;margin:0 0 24px;">${new Date().toLocaleString('en-AU', { timeZone:'Australia/Perth' })} AWST</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 12px;background:#F4F8F7;font-size:12px;color:#7A9098;width:120px;">Type</td><td style="padding:8px 12px;background:#F4F8F7;font-size:13px;color:#0A0A0A;font-weight:600;">${priorityLabel}</td></tr>
          <tr><td style="padding:8px 12px;font-size:12px;color:#7A9098;">From</td><td style="padding:8px 12px;font-size:13px;color:#0A0A0A;">${name} &lt;${email}&gt;</td></tr>
          <tr><td style="padding:8px 12px;background:#F4F8F7;font-size:12px;color:#7A9098;">Role</td><td style="padding:8px 12px;background:#F4F8F7;font-size:13px;color:#0A0A0A;">${role}</td></tr>
          <tr><td style="padding:8px 12px;font-size:12px;color:#7A9098;">Subject</td><td style="padding:8px 12px;font-size:13px;color:#0A0A0A;">${subject || '—'}</td></tr>
        </table>
        <div style="background:#F4F8F7;border-left:3px solid #D4522A;padding:16px;border-radius:6px;margin-bottom:20px;">
          <p style="font-size:13px;color:#0A0A0A;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
        </div>
        <p style="font-size:12px;color:#9AA5AA;">Reply directly to this email to respond to the user.</p>
      </div>
    `

    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[${priorityLabel}] ${subject || 'Support request'} — ${name}`,
      html,
    })

    // Confirmation to user
    const confirmHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h1 style="font-size:22px;color:#0A0A0A;letter-spacing:2px;margin:0 0 20px;">STEADYHAND</h1>
        <p style="font-size:14px;color:#0A0A0A;">Hi ${name},</p>
        <p style="font-size:14px;color:#4A5E64;line-height:1.7;">We have received your message and will respond within one business day.</p>
        <div style="background:#F4F8F7;border-left:3px solid #2E7D60;padding:16px;margin:20px 0;border-radius:6px;">
          <p style="font-size:13px;color:#0A0A0A;font-weight:600;margin:0 0 4px;">${subject || 'Your message'}</p>
          <p style="font-size:12px;color:#7A9098;margin:0;">${priorityLabel}</p>
        </div>
        <p style="font-size:13px;color:#4A5E64;line-height:1.7;">If your matter is urgent, you can also reply directly to this email.</p>
        <p style="color:#7A9098;font-size:12px;margin-top:32px;">Steadyhand · Western Australia</p>
      </div>
    `

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'We received your message — Steadyhand support',
      html: confirmHtml,
    })

    return NextResponse.json({ sent: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
