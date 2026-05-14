import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { client_id } = await request.json()
    if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

    // ── Create a demo tradie profile ─────────────────────────────────────────
    // Use a fixed demo tradie ID so we can reference it across jobs
    const demoTradieId = '00000000-0000-0000-0000-000000000001'
    const { data: existingTradie } = await supabase
      .from('tradie_profiles')
      .select('id')
      .eq('id', demoTradieId)
      .single()

    if (!existingTradie) {
      // Create a demo auth user first
      const { data: demoUser } = await supabase.auth.admin.createUser({
        email: 'demo-tradie@steadyhandtrade.app',
        password: 'demo-tradie-' + Math.random().toString(36).slice(2),
        email_confirm: true,
        user_metadata: { is_demo: true },
      })
      const tradieUserId = demoUser?.user?.id || demoTradieId

      await supabase.from('profiles').upsert({
        id: tradieUserId,
        role: 'tradie',
        full_name: 'Marcus Webb',
        email: 'demo-tradie@steadyhandtrade.app',
        suburb: 'Subiaco',
        is_demo: true,
      }, { onConflict: 'id' })

      await supabase.from('tradie_profiles').upsert({
        id: tradieUserId,
        business_name: 'Webb Electrical',
        bio: 'Licensed electrician with 12 years experience across residential and light commercial. Based in Subiaco, servicing the inner western suburbs.',
        trade_categories: ['Electrical'],
        service_areas: ['Subiaco', 'Claremont', 'Nedlands', 'Cottesloe', 'Mosman Park'],
        licence_number: 'EW-4821',
        licence_type: 'Electrical Worker',
        licence_verified: true,
        abn: '41 234 567 890',
        years_experience: 12,
        availability_status: 'available',
        onboarding_step: 'active',
        subscription_active: true,
        dialogue_score_avg: 84,
        completed_jobs_count: 27,
        rating_avg: 4.7,
      }, { onConflict: 'id' })
    }

    const { data: tradieProf } = await supabase
      .from('tradie_profiles')
      .select('id')
      .eq('business_name', 'Webb Electrical')
      .single()

    const tradieId = tradieProf?.id || demoTradieId

    const now = new Date()
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

    // ── Job 1: In delivery — switchboard upgrade ──────────────────────────────
    const { data: job1 } = await supabase.from('jobs').insert({
      client_id,
      tradie_id: tradieId,
      title: 'Switchboard upgrade and safety inspection',
      description: 'Replace old ceramic fuse board with modern circuit breaker panel. Add RCD protection to all circuits. Safety inspection and test report.',
      trade_category: 'Electrical',
      suburb: 'Subiaco',
      status: 'delivery',
      urgency: 'within_month',
      budget_range: '2000-5000',
      is_demo: true,
      created_at: daysAgo(18),
    }).select('id').single()

    if (job1) {
      // Quote
      const { data: q1 } = await supabase.from('quotes').insert({
        job_id: job1.id,
        tradie_id: tradieId,
        total_price: 3200,
        gst_included: true,
        summary: 'Full switchboard replacement with 18-circuit panel, RCD protection on all circuits, and a written test report.',
        warranty_days: 365,
        status: 'accepted',
        version: 1,
        created_at: daysAgo(14),
      }).select('id').single()

      // Scope agreement
      if (q1) {
        const sigDate = daysAgo(12)
        await supabase.from('scope_agreements').insert({
          job_id: job1.id,
          tradie_id: tradieId,
          client_id,
          version: 1,
          inclusions: 'Supply and install 18-circuit Clipsal consumer mains unit. RCD protection on all circuits. Written test and inspection report. Removal and disposal of existing fuse board.',
          exclusions: 'Cable runs beyond 2m from existing positions. Any work in roof space beyond switchboard connections.',
          assumptions: 'Existing wiring is in serviceable condition. Safe access to switchboard location. Power can be isolated for minimum 4 hours.',
          total_price: 3200,
          warranty_days: 365,
          tradie_signed_at: sigDate,
          client_signed_at: sigDate,
          tradie_business_name_snapshot: 'Webb Electrical',
          tradie_licence_number_snapshot: 'EW-4821',
          client_full_name_snapshot: 'Demo User',
          created_at: daysAgo(13),
        })
      }

      // Milestones
      const ms1 = [
        { label: 'Isolation and removal of existing board', percent: 30, amount: 960, status: 'approved', order_index: 1, approved_at: daysAgo(8) },
        { label: 'Install new consumer mains unit and RCDs', percent: 50, amount: 1600, status: 'approved', order_index: 2, approved_at: daysAgo(4) },
        { label: 'Test, inspection report and sign-off', percent: 20, amount: 640, status: 'active', order_index: 3 },
      ]
      for (const ms of ms1) {
        await supabase.from('milestones').insert({ job_id: job1.id, ...ms, created_at: daysAgo(13) })
      }

      // A message thread
      await supabase.from('job_messages').insert([
        { job_id: job1.id, sender_id: tradieId, body: 'Hi — I\'ll be on site Wednesday morning. The board location looks straightforward from the photos. I\'ll bring the new panel and all the RCDs.', created_at: daysAgo(10) },
        { job_id: job1.id, sender_id: client_id, body: 'Perfect. I\'ll make sure the path to the meter box is clear. What time should I expect you?', created_at: daysAgo(10) },
        { job_id: job1.id, sender_id: tradieId, body: 'Around 8am. Should be done by midday.', created_at: daysAgo(9) },
        { job_id: job1.id, sender_id: tradieId, body: '✅ Stage 1 complete — old board removed, new panel in. Ready for your approval before I continue with the RCD wiring.', created_at: daysAgo(8) },
        { job_id: job1.id, sender_id: client_id, body: 'Looks great. Approved.', created_at: daysAgo(8) },
        { job_id: job1.id, sender_id: tradieId, body: '✅ Stage 2 complete — all RCDs wired and tested individually. Starting the full test report tomorrow.', created_at: daysAgo(4) },
      ])

      // Vault documents
      await supabase.from('vault_documents').insert([
        { user_id: client_id, job_id: job1.id, job_title: job1.id, title: 'Switchboard upgrade — signed scope agreement', document_type: 'scope', tradie_name: 'Webb Electrical', issued_date: daysAgo(12).split('T')[0], notes: 'Signed by both parties. 18-circuit panel, RCD protection, test report.', is_demo: true },
      ])
    }

    // ── Job 2: In agreement — bathroom renovation ─────────────────────────────
    const { data: job2 } = await supabase.from('jobs').insert({
      client_id,
      tradie_id: tradieId,
      title: 'Bathroom renovation — full retile and refit',
      description: 'Remove existing tiles, waterproof, and retile floor and walls. Replace vanity, toilet, and shower screen. New tapware throughout.',
      trade_category: 'Tiling',
      suburb: 'Subiaco',
      status: 'agreement',
      urgency: 'flexible',
      budget_range: '10000-20000',
      is_demo: true,
      created_at: daysAgo(7),
    }).select('id').single()

    if (job2) {
      await supabase.from('quotes').insert({
        job_id: job2.id,
        tradie_id: tradieId,
        total_price: 14500,
        gst_included: true,
        summary: 'Full bathroom strip-out and refit. Italian porcelain floor tiles, subway wall tiles, new Caroma suite, Methven tapware.',
        warranty_days: 180,
        status: 'accepted',
        version: 2,
        created_at: daysAgo(4),
      })

      await supabase.from('scope_agreements').insert({
        job_id: job2.id,
        tradie_id: tradieId,
        client_id,
        version: 1,
        inclusions: 'Strip-out of existing tiles, fixtures and fittings. Waterproofing membrane to AS 3740. 600x600 porcelain floor tiles. 300x600 subway wall tiles to ceiling. Supply and install Caroma Luna toilet suite. Supply and install 900mm vanity. Shower screen 900x900 frameless. Methven Maku tapware set.',
        exclusions: 'Electrical work (separate licensed electrician required for exhaust fan). Any structural work if waterproofing damage found. Painting.',
        assumptions: 'Existing plumbing in serviceable condition. No structural waterproofing damage behind tiles. Bathroom dimensions as per photos provided.',
        total_price: 14500,
        warranty_days: 180,
        tradie_signed_at: daysAgo(2),
        client_full_name_snapshot: 'Demo User',
        tradie_business_name_snapshot: 'Webb Electrical',
        tradie_licence_number_snapshot: 'EW-4821',
        created_at: daysAgo(3),
      })

      await supabase.from('job_messages').insert([
        { job_id: job2.id, sender_id: tradieId, body: 'I\'ve drafted the scope agreement — take your time reviewing the inclusions and exclusions. Happy to clarify anything before you sign.', created_at: daysAgo(2) },
        { job_id: job2.id, sender_id: client_id, body: 'Quick question — the Methven tapware, is that the Maku or the Satinjet range?', created_at: daysAgo(1) },
        { job_id: job2.id, sender_id: tradieId, body: 'Maku — I\'ve updated the scope to specify that. Same price point but better suited to the style you mentioned.', created_at: daysAgo(1) },
      ])
    }

    // ── Job 3: Under warranty — exterior painting ────────────────────────────
    const { data: job3 } = await supabase.from('jobs').insert({
      client_id,
      tradie_id: tradieId,
      title: 'Exterior repaint — full house',
      description: 'Preparation, prime, and two coats of exterior acrylic to all walls, fascias, and trim. Colour consultation included.',
      trade_category: 'Painting',
      suburb: 'Subiaco',
      status: 'warranty',
      urgency: 'within_month',
      budget_range: '5000-10000',
      is_demo: true,
      created_at: daysAgo(60),
    }).select('id').single()

    if (job3) {
      await supabase.from('quotes').insert({
        job_id: job3.id,
        tradie_id: tradieId,
        total_price: 7800,
        gst_included: true,
        summary: 'Full exterior repaint. Dulux Weathershield premium acrylic, two coats. Includes all prep, masking, fascias, and trim.',
        warranty_days: 90,
        status: 'accepted',
        version: 1,
        created_at: daysAgo(56),
      })

      const signDate = daysAgo(54)
      await supabase.from('scope_agreements').insert({
        job_id: job3.id,
        tradie_id: tradieId,
        client_id,
        version: 1,
        inclusions: 'Full exterior preparation — scrape, sand, fill and prime all surfaces. Two coats Dulux Weathershield acrylic in agreed colour. All fascias, soffits and trim. Masking and protection of all windows, doors and hardscape.',
        exclusions: 'Interior painting. Any rotted timber replacement. Garage door.',
        assumptions: 'Scaffolding not required — all surfaces accessible by ladder. No asbestos material present.',
        total_price: 7800,
        warranty_days: 90,
        tradie_signed_at: signDate,
        client_signed_at: signDate,
        tradie_business_name_snapshot: 'Webb Electrical',
        tradie_licence_number_snapshot: 'EW-4821',
        client_full_name_snapshot: 'Demo User',
        created_at: daysAgo(55),
      })

      const signoffDate = daysAgo(14)
      await supabase.from('jobs').update({
        signoff_completed_at: signoffDate,
        warranty_expires_at: new Date(new Date(signoffDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', job3.id)

      await supabase.from('milestones').insert([
        { job_id: job3.id, label: 'Preparation and priming', percent: 40, amount: 3120, status: 'approved', order_index: 1, approved_at: daysAgo(30) },
        { job_id: job3.id, label: 'First coat — all surfaces', percent: 35, amount: 2730, status: 'approved', order_index: 2, approved_at: daysAgo(20) },
        { job_id: job3.id, label: 'Final coat and clean-up', percent: 25, amount: 1950, status: 'approved', order_index: 3, approved_at: daysAgo(15) },
      ])

      await supabase.from('warranty_issues').insert({
        job_id: job3.id,
        client_id,
        tradie_id: tradieId,
        title: 'Paint bubbling on north-facing wall near window',
        description: 'Small section of paint approximately 30cm x 20cm on the north wall beside the lounge window has started to bubble. First noticed about a week after completion.',
        severity: 'medium',
        status: 'in_progress',
        tradie_response: 'Thanks for letting me know. This can happen with rapid temperature changes on north-facing surfaces in the first few weeks. I\'ll come back and sand it back, re-prime, and apply two fresh coats. Can I book in for next Tuesday?',
        response_due_at: daysAgo(7),
        created_at: daysAgo(10),
      })

      await supabase.from('job_messages').insert([
        { job_id: job3.id, sender_id: client_id, body: '⚠ Warranty issue raised: Paint bubbling on north-facing wall near window', created_at: daysAgo(10) },
        { job_id: job3.id, sender_id: tradieId, body: 'On it — I\'ll be back Tuesday to sort this out. No charge of course.', created_at: daysAgo(9) },
      ])

      await supabase.from('vault_documents').insert([
        { user_id: client_id, job_id: job3.id, job_title: job3.id, title: 'Exterior repaint — signed scope agreement', document_type: 'scope', tradie_name: 'Webb Electrical', issued_date: signDate.split('T')[0], is_demo: true },
        { user_id: client_id, job_id: job3.id, job_title: job3.id, title: 'Exterior repaint — warranty certificate', document_type: 'warranty', tradie_name: 'Webb Electrical', issued_date: signoffDate.split('T')[0], is_demo: true },
      ])
    }

    // ── Mark profile as demo ──────────────────────────────────────────────────
    await supabase.from('profiles').update({ demo_data_seeded: true }).eq('id', client_id)

    return NextResponse.json({
      ok: true,
      jobs: [job1?.id, job2?.id, job3?.id].filter(Boolean),
    })

  } catch (err: any) {
    console.error('seed-demo-data error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
