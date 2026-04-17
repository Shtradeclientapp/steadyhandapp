'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OrgAcceptPage() {
  const [status, setStatus] = useState<'loading'|'success'|'already'|'error'>('loading')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    const accept = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)
        return
      }
      const params = new URLSearchParams(window.location.search)
      const orgId = params.get('org_id')
      if (!orgId) { setStatus('error'); return }

      const { data: org } = await supabase.from('organisations').select('name').eq('id', orgId).single()
      setOrgName(org?.name || 'your organisation')

      // Check if already a member
      const { data: existing } = await supabase.from('org_memberships')
        .select('id, status').eq('org_id', orgId).eq('user_id', session.user.id).maybeSingle()
      if (existing?.status === 'active') { setStatus('already'); return }

      // Find pending invite by email
      const { data: invite } = await supabase.from('org_memberships')
        .select('id, role').eq('org_id', orgId).eq('invited_email', session.user.email).eq('status', 'pending').maybeSingle()

      if (invite) {
        // Accept invite - update membership and set org_id on profile
        await supabase.from('org_memberships').update({
          user_id: session.user.id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        }).eq('id', invite.id)
      } else {
        // Create membership
        await supabase.from('org_memberships').insert({
          org_id: orgId,
          user_id: session.user.id,
          role: 'member',
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
      }

      // Set org_id on profile
      await supabase.from('profiles').update({ org_id: orgId }).eq('id', session.user.id)
      setStatus('success')
    }
    accept()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', padding:'24px' }}>
      <div style={{ background:'#E8F0EE', borderRadius:'20px', padding:'40px 32px', maxWidth:'440px', width:'100%', textAlign:'center' }}>
        <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'22px', color:'#D4522A', letterSpacing:'2px', marginBottom:'32px' }}>STEADYHAND</p>
        {status === 'loading' && <p style={{ color:'#7A9098' }}>Accepting invitation...</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
            <h2 style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'20px', color:'#0A0A0A', marginBottom:'8px' }}>YOU HAVE JOINED</h2>
            <p style={{ fontSize:'14px', color:'#4A5E64', marginBottom:'24px' }}>{orgName}</p>
            <p style={{ fontSize:'13px', color:'#7A9098', marginBottom:'24px' }}>You now have access to the organisation dashboard. Jobs you create will be linked to {orgName}.</p>
            <a href="/org/dashboard">
              <button style={{ background:'#0A0A0A', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Go to dashboard →
              </button>
            </a>
          </>
        )}
        {status === 'already' && (
          <>
            <p style={{ fontSize:'15px', color:'#2E7D60', marginBottom:'20px' }}>You are already a member of {orgName}.</p>
            <a href="/org/dashboard"><button style={{ background:'#0A0A0A', color:'white', padding:'13px 28px', borderRadius:'8px', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer' }}>Go to dashboard →</button></a>
          </>
        )}
        {status === 'error' && (
          <p style={{ color:'#D4522A', fontSize:'14px' }}>Invalid or expired invitation link. Please contact your organisation admin.</p>
        )}
      </div>
    </div>
  )
}
