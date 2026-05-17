import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const serverClient = createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { documents } = body
    if (!documents?.length) return NextResponse.json({ error: 'No documents' }, { status: 400 })

    // Ensure all documents belong to the authenticated user
    const owned = documents.every((d: any) => d.user_id === user.id)
    if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = createServiceClient()
    const { error } = await supabase.from('vault_documents').insert(documents)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ filed: documents.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
