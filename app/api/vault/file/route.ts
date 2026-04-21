import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documents } = body
    if (!documents?.length) return NextResponse.json({ error: 'No documents' }, { status: 400 })
    const supabase = createServiceClient()
    const { error } = await supabase.from('vault_documents').insert(documents)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ filed: documents.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
