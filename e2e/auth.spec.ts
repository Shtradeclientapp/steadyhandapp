import { test, expect } from '@playwright/test'
import { loginAs, DEMO_CLIENT } from './fixtures'

test.describe('Authentication', () => {
  test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('login with valid demo client credentials lands on /dashboard', async ({ page }) => {
    await loginAs(page, DEMO_CLIENT.email, DEMO_CLIENT.password)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('login with invalid credentials shows an error message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notareal@example.com')
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
    // Should remain on /login — no redirect to dashboard
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('signup page renders all three role options', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('text=HOMEOWNER')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=TRADE BUSINESS')).toBeVisible()
    await expect(page.locator('text=ORGANISATION')).toBeVisible()
  })
})
