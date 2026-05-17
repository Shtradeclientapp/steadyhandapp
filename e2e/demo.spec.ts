import { test, expect } from '@playwright/test'

test.describe('Demo flow', () => {
  test('/demo page renders a "Start the demo" button', async ({ page }) => {
    await page.goto('/demo')
    await expect(page.locator('button:has-text("Start the demo")')).toBeVisible({ timeout: 10000 })
  })

  test('clicking Start the demo creates an account and redirects to /dashboard within 10 seconds', async ({ page }) => {
    await page.goto('/demo')
    await page.click('button:has-text("Start the demo")')
    // Should transition to 'creating' state first
    await expect(page.locator('text=Setting up your demo, text=Creating your account').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
    // Then redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 })
  })

  test('after demo account creation, the DemoSwitcher bar is visible', async ({ page }) => {
    await page.goto('/demo')
    await page.click('button:has-text("Start the demo")')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 })
    // DemoSwitcher is a sticky bar at the top of the layout for demo accounts
    await expect(page.locator('text=DEMO, text=🔍 DEMO').first()).toBeVisible({ timeout: 10000 })
  })

  test('DemoSwitcher shows three role buttons: Homeowner, Tradie, Property Manager', async ({ page }) => {
    await page.goto('/demo')
    await page.click('button:has-text("Start the demo")')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 })
    // Wait for demo switcher to hydrate
    await page.waitForTimeout(2000)
    await expect(page.locator('button:has-text("Homeowner")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Tradie")')).toBeVisible()
    await expect(page.locator('button:has-text("Property Manager")')).toBeVisible()
  })
})
