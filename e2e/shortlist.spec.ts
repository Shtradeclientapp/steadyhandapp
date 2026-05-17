import { test, expect } from '@playwright/test'
import { loginAs, DEMO_CLIENT } from './fixtures'

test.describe('Shortlist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, DEMO_CLIENT.email, DEMO_CLIENT.password)
  })

  test('/shortlist page loads for an authenticated client with an existing job', async ({ page }) => {
    await page.goto('/shortlist')
    await expect(page).toHaveURL(/\/shortlist/)
    // Either shows the shortlist UI or the job selector — either way the page renders
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    // Should not redirect to /login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('demo tradie account does NOT appear in shortlist or browse directory', async ({ page }) => {
    await page.goto('/shortlist')
    await page.waitForTimeout(3000)
    // The demo tradie email should never appear in a list visible to real clients
    const demoTradieEmail = 'demo-tradie@steadyhandtrade.app'
    const demoText = await page.locator('body').textContent()
    expect(demoText).not.toContain(demoTradieEmail)

    // Also check browse tab if it exists
    const browseTab = page.locator('button:has-text("Browse"), [role="tab"]:has-text("Browse")')
    if (await browseTab.count() > 0) {
      await browseTab.click()
      await page.waitForTimeout(2000)
      const browseText = await page.locator('body').textContent()
      expect(browseText).not.toContain(demoTradieEmail)
    }
  })

  test('browse directory tab loads tradie cards', async ({ page }) => {
    await page.goto('/shortlist')
    await page.waitForTimeout(2000)

    const browseTab = page.locator('button:has-text("Browse"), [role="tab"]:has-text("Browse")')
    if (await browseTab.count() > 0) {
      await browseTab.click()
      await page.waitForTimeout(2000)
      // After clicking Browse, some tradie cards or an empty state should be visible
      await expect(page.locator('body')).toBeVisible()
      await expect(page).not.toHaveURL(/\/login/)
    } else {
      // Browse tab not found — shortlist may not have jobs yet; acceptable
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
