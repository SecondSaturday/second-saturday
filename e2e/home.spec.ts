import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Home Page (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure testing token is set for each test
    await setupClerkTestingToken({ page })
  })

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/')

    // Should load without server errors
    expect(response?.status()).toBeLessThan(500)

    // Page should be visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('has correct title', async ({ page }) => {
    await page.goto('/')

    // Page should have a title
    const title = await page.title()
    expect(title).toBeTruthy()
  })
})
