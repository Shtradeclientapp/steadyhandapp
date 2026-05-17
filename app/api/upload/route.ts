import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const serverClient = createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const job_id = formData.get('job_id') as string
    const user_id = user.id  // always use verified JWT, never body

    if (!file || !job_id) return NextResponse.json({ error: 'Missing file or job_id' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const path = 'agreements/' + job_id + '/' + Date.now() + '.' + ext
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    await supabase.from('jobs').update({
      agreement_document_url: path,
      agreement_document_name: file.name,
      agreement_uploaded_at: new Date().toISOString(),
    }).eq('id', job_id)

    await supabase.from('job_messages').insert({
      job_id,
      sender_id: user_id,
      body: 'Agreement document uploaded: ' + file.name,
    })

    return NextResponse.json({ path, name: file.name, uploaded: true })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}