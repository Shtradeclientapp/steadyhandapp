import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'Steadyhand <noreply@steadyhandtrade.app>'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, business, trade, phone, email, employees, revenue, challenge, timeline, plan, bulkPay, addons } = body

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px 16px;background:#0A0A0A;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;background:#111;border-radius:12px;overflow:hidden;">
  <div style="padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:rgba(216,228,225,0.3);text-transform:uppercase;">Steadyhand Digital</p>
    <h1 style="margin:0;font-size:22px;color:rgba(216,228,225,0.9);font-weight:400;">New Steadyplan Enquiry</h1>
  </div>
  <div style="padding:28px 36px;">
    <table width="100%">
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Plan</p>
        <p style="margin:4px 0 0;font-size:16px;color:#D4522A;">${plan}${bulkPay ? ' · 8-week upfront (10% discount)' : ' · Weekly billing'}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Contact</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(216,228,225,0.8);">${name} · ${business}</p>
        <p style="margin:2px 0 0;font-size:13px;color:rgba(216,228,225,0.5);">${email}${phone ? ' · ' + phone : ''}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Business</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(216,228,225,0.8);">${trade || '—'} · ${employees || '—'} · ${revenue || '—'}</p>
      </td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Timeline</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(216,228,225,0.8);">${timeline || '—'}</p>
      </td></tr>
      ${addons?.length ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Add-ons</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(216,228,225,0.8);">${addons.join(', ')}</p>
      </td></tr>` : ''}
      <tr><td style="padding:8px 0;">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(216,228,225,0.3);">Challenge</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(216,228,225,0.8);line-height:1.6;">${challenge}</p>
      </td></tr>
    </table>
    <a href="mailto:${email}" style="display:block;margin-top:24px;background:#D4522A;color:white;padding:13px 24px;border-radius:8px;font-size:14px;text-decoration:none;text-align:center;">Reply to ${name} →</a>
  </div>
</div>
</body></html>`

    await resend.emails.send({
      from: FROM,
      to: 'info@steadyhanddigital.com',
      subject: `Steadyplan enquiry — ${plan} · ${name} · ${business}`,
      html,
      replyTo: email,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
