import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const job_id = formData.get('job_id') as string
  const stage = formData.get('stage') as string || 'request'
  const caption = formData.get('caption') as string || ''
  const doc_type = formData.get('doc_type') as string  // for tradie docs

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const service = createServiceClient()
  const ext = file.name.split('.').pop()
  const bucket = doc_type ? 'documents' : 'job-photos'
  const path = doc_type
    ? `${user.id}/${doc_type}/${Date.now()}.${ext}`
    : `${job_id}/${stage}/${Date.now()}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await service.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage.from(bucket).getPublicUrl(path)

  // Save record to DB
  if (doc_type) {
    await supabase.from('documents').insert({
      tradie_id: user.id,
      job_id: job_id || null,
      type: doc_type,
      storage_path: path,
    })
  } else if (job_id) {
    await supabase.from('job_photos').insert({
      job_id,
      uploader_id: user.id,
      storage_path: path,
      caption,
      stage,
    })
  }

  return NextResponse.json({ path, url: publicUrl }, { status: 201 })
}
