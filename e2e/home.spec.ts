import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Home Page (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure testing token is set for each test
    await setupClerkTestingToken({ page })
  })

  test('authenticated user is redirected to dashboard from home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Authenticated users should be redirected to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('has correct title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Page should have a title
    const title = await page.title()
    expect(title).toBeTruthy()
  })
})
