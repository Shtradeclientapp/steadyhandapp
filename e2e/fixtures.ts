import { type Page } from '@playwright/test'

export const DEMO_CLIENT = {
  email: 'demo-client@steadyhandtrade.app',
  password: 'demo1234',
  dashboard: '/dashboard',
}

export const DEMO_TRADIE = {
  email: 'demo-tradie@steadyhandtrade.app',
  password: 'demo1234',
  dashboard: '/tradie/dashboard',
}

export const DEMO_ORG = {
  email: 'demo-org@steadyhandtrade.app',
  password: 'demo1234',
  dashboard: '/org/dashboard',
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
  await page.waitForURL(/\/(dashboard|tradie\/dashboard|org\/dashboard)/, { timeout: 15000 })
}

export async function createJob(
  page: Page,
  overrides: Partial<{
    trade_category: string
    title: string
    description: string
    suburb: string
    state: string
    property_type: string
  }> = {}
) {
  const defaults = {
    trade_category: 'Tiling',
    title: 'Bathroom tile replacement',
    description: 'Need bathroom floor tiles replaced after water damage. Approx 12sqm.',
    suburb: 'Subiaco',
    state: 'WA',
    property_type: 'Residential house',
    ...overrides,
  }

  await page.goto('/request')

  // Step 1 — trade category
  const categorySelect = page.locator('select').filter({ hasText: defaults.trade_category }).first()
  if (await categorySelect.count() > 0) {
    await categorySelect.selectOption(defaults.trade_category)
  } else {
    // Try radio buttons or card-style selectors
    await page.locator(`text=${defaults.trade_category}`).first().click()
  }

  // Title and description may be on step 1 or step 2
  const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"], input[placeholder*="summarise"]').first()
  if (await titleInput.isVisible()) {
    await titleInput.fill(defaults.title)
  }
  const descInput = page.locator('textarea').first()
  if (await descInput.isVisible()) {
    await descInput.fill(defaults.description)
  }

  // Suburb
  const suburbInput = page.locator('input[list="suburbs-list"], input[placeholder*="suburb"], input[placeholder*="Subiaco"]').first()
  if (await suburbInput.isVisible()) {
    await suburbInput.fill(defaults.suburb)
  }

  // State
  const stateSelect = page.locator('select').filter({ hasText: 'Western Australia' }).first()
  if (await stateSelect.count() > 0) {
    await stateSelect.selectOption(defaults.state)
  }

  // Submit
  const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').last()
  await submitBtn.click()
}
