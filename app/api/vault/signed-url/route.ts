import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { file_url } = await request.json()
  if (!file_url) return NextResponse.json({ error: 'file_url required' }, { status: 400 })

  try {
    // Extract the storage path from the full URL
    const url = new URL(file_url)
    const pathParts = url.pathname.split('/storage/v1/object/')
    if (pathParts.length < 2) {
      // Already a non-storage URL or external — return as-is
      return NextResponse.json({ signed_url: file_url })
    }
    const storagePath = pathParts[1].replace(/^(public|private)\//, '')
    const bucketEnd = storagePath.indexOf('/')
    const bucket = storagePath.substring(0, bucketEnd)
    const path = storagePath.substring(bucketEnd + 1)

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error)
      return NextResponse.json({ signed_url: file_url }) // fallback to original
    }

    return NextResponse.json({ signed_url: data.signedUrl })
  } catch (err: any) {
    console.error('Signed URL error:', err)
    return NextResponse.json({ signed_url: file_url }) // fallback
  }
}
