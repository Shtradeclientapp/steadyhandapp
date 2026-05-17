import { test, expect } from '@playwright/test'
import { loginAs, DEMO_CLIENT } from './fixtures'

test.describe('API security', () => {
  test('POST to /api/match without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/match', {
      data: { job_id: '00000000-0000-0000-0000-000000000001' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST to /api/dialogue without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/dialogue', {
      data: { action: 'score_stage', stage: 'consult', job_id: '00000000-0000-0000-0000-000000000001' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST to /api/observatory without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/observatory', {
      data: { job_id: '00000000-0000-0000-0000-000000000001' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST to /api/seed-demo-data with a mismatched client_id returns 403', async ({ page, request }) => {
    await loginAs(page, DEMO_CLIENT.email, DEMO_CLIENT.password)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Supply a client_id that belongs to a different user
    const res = await request.post('/api/seed-demo-data', {
      data: { client_id: '00000000-0000-0000-0000-000000000099' },
      headers: { Cookie: cookieHeader },
    })
    // Should be 403 (client_id mismatch) or 401 (session not carried)
    expect([401, 403]).toContain(res.status())
  })

  test('POST to /api/stripe with action release_milestone without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/stripe', {
      data: { action: 'release_milestone', milestone_id: '00000000-0000-0000-0000-000000000001' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST to /api/upload without auth returns 401', async ({ request }) => {
    const formData = new FormData()
    formData.append('path', 'vault/test.pdf')
    const res = await request.post('/api/upload', {
      multipart: {
        path: 'vault/test.pdf',
        user_id: '00000000-0000-0000-0000-000000000001',
      },
    })
    expect(res.status()).toBe(401)
  })
})
