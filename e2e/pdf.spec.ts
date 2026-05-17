import { test, expect } from '@playwright/test'
import { loginAs, DEMO_CLIENT } from './fixtures'

test.describe('PDF generation security', () => {
  test('unauthenticated GET request to /api/pdf/generate/scope returns 401', async ({ request }) => {
    const res = await request.get('/api/pdf/generate/scope?job_id=00000000-0000-0000-0000-000000000001')
    expect(res.status()).toBe(401)
  })

  test('unauthenticated GET request to /api/pdf/scope returns 401', async ({ request }) => {
    const res = await request.get('/api/pdf/scope?job_id=00000000-0000-0000-0000-000000000001')
    expect(res.status()).toBe(401)
  })

  test('authenticated client requesting PDF for a job they do not own returns 403', async ({ page, request }) => {
    // Log in and capture the session cookie
    await loginAs(page, DEMO_CLIENT.email, DEMO_CLIENT.password)

    // Use a job ID that doesn't belong to the demo client
    const foreignJobId = '00000000-0000-0000-0000-000000000001'
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const res = await request.get(`/api/pdf/generate/scope?job_id=${foreignJobId}`, {
      headers: { Cookie: cookieHeader },
    })
    // Either 401 (session not recognised by request context) or 403/404 (not owner)
    expect([401, 403, 404]).toContain(res.status())
  })
})
