import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://steadyhandapp.vercel.app'
const FROM = 'Steadyhand <notifications@steadyhanddigital.com>'

export async function POST(request: NextRequest) {
  try {
    const { job_id, client_id, business_name, email, trade_category, phone } = await request.json()
    if (!job_id || !email || !business_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('*, client:profiles!jobs_client_id_fkey(full_name)')
      .eq('id', job_id)
      .single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const token = crypto.randomBytes(32).toString('hex')

    const { data: invitation, error } = await supabase
      .from('tradie_invitations')
      .insert({
        job_id,
        client_id,
        business_name,
        email,
        trade_category,
        phone: phone || null,
        token,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const inviteUrl = APP_URL + '/join?token=' + token

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: business_name + ', you have a job request waiting on Steadyhand',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">' +
        '<h1 style="font-size:24px;color:#1C2B32;letter-spacing:2px;">STEADYHAND</h1>' +
        '<p style="color:#4A5E64;">Hi ' + business_name + ',</p>' +
        '<p style="color:#4A5E64;"><strong>' + job.client.full_name + '</strong> has submitted a job request and would like to work with you specifically.</p>' +
        '<div style="background:#F4F8F7;border-left:3px solid #D4522A;padding:16px;margin:20px 0;border-radius:6px;">' +
        '<h2 style="font-size:18px;color:#1C2B32;margin:0 0 8px;">' + job.title + '</h2>' +
        '<p style="color:#4A5E64;margin:0 0 4px;">' + job.trade_category + ' · ' + job.suburb + '</p>' +
        '<p style="color:#4A5E64;margin:0;">' + job.description + '</p>' +
        '</div>' +
        '<p style="color:#4A5E64;">Steadyhand is a request-to-warranty platform that helps you manage scopes, milestone payments and warranties digitally — at no cost to get started.</p>' +
        '<p style="color:#4A5E64;">Your job is ready and waiting. Create your free account to respond:</p>' +
        '<a href="' + inviteUrl + '" style="display:inline-block;background:#D4522A;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:8px;font-weight:500;">View job and create account →</a>' +
        '<p style="color:#7A9098;font-size:12px;margin-top:32px;">This invitation was sent on behalf of ' + job.client.full_name + '. Steadyhand · Western Australia</p>' +
        '</div>'
    })

    return NextResponse.json({ invitation, sent: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { data: invitation } = await supabase
    .from('tradie_invitations')
    .select('*, job:jobs(*, client:profiles!jobs_client_id_fkey(full_name, email, suburb))')
    .eq('token', token)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })

  return NextResponse.json({ invitation })
}
