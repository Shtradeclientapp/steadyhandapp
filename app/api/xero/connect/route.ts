import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const clientId = process.env.XERO_CLIENT_ID!
  const redirectUri = process.env.XERO_REDIRECT_URI!
  const scopes = 'openid profile email offline_access'
  const state = Math.random().toString(36).substring(2)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  })

  const url = 'https://login.xero.com/identity/connect/authorize?' + params.toString()
  console.log('Xero connect URL:', url)
  console.log('Client ID:', clientId ? clientId.substring(0, 8) + '...' : 'MISSING')
  console.log('Redirect URI:', redirectUri || 'MISSING')
  return NextResponse.redirect(url)
}
