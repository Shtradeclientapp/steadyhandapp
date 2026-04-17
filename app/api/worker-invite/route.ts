import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FROM = 'Steadyhand <noreply@steadyhandtrade.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.steadyhandtrade.app'

export async function POST(request: NextRequest) {
  try {
    const { worker_name, worker_email, worker_phone, tradie_id, business_name } = await request.json()
    if (!worker_email || !tradie_id) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const token = randomBytes(32).toString('hex')

    // Create worker record
    const { data: worker, error } = await supabase.from('tradie_workers').insert({
      tradie_id,
      name: worker_name || worker_email,
      email: worker_email,
      phone: worker_phone || null,
      status: 'invited',
      invite_token: token,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send invite email
    const inviteUrl = APP_URL + '/worker/accept?token=' + token
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#E8F0EE;">
        <h1 style="font-size:22px;color:#0A0A0A;letter-spacing:2px;margin:0 0 20px;font-family:Georgia,serif;">STEADYHAND</h1>
        <p style="font-size:14px;color:#0A0A0A;">Hi ${worker_name || 'there'},</p>
        <p style="font-size:14px;color:#4A5E64;line-height:1.7;"><strong>${business_name || 'Your employer'}</strong> has invited you to join their team on Steadyhand. You will be able to view your assigned jobs, site briefs and submit field updates from your phone.</p>
        <div style="background:#0A0A0A;border-radius:10px;padding:20px;margin:20px 0;">
          <p style="font-size:13px;color:rgba(216,228,225,0.6);margin:0 0 12px;">What you can do on Steadyhand:</p>
          <p style="font-size:13px;color:rgba(216,228,225,0.7);margin:0 0 6px;">✓ View your jobs and site briefs for the day</p>
          <p style="font-size:13px;color:rgba(216,228,225,0.7);margin:0 0 6px;">✓ Get directions and client contact details</p>
          <p style="font-size:13px;color:rgba(216,228,225,0.7);margin:0 0 6px;">✓ Submit completion photos and site notes</p>
          <p style="font-size:13px;color:rgba(216,228,225,0.7);margin:0;">✓ Mark work stages complete for your boss to approve</p>
        </div>
        <a href="${inviteUrl}" style="display:inline-block;background:#D4522A;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">Accept invitation →</a>
        <p style="font-size:12px;color:#9AA5AA;margin-top:24px;">This invitation expires in 7 days. If you did not expect this email, you can ignore it.</p>
      </div>
    `
    await resend.emails.send({ from: FROM, to: worker_email, subject: business_name + ' invited you to Steadyhand', html })

    return NextResponse.json({ worker })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
