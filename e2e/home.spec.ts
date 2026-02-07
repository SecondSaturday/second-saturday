import { test, expect } from '@playwright/test'

test.describe('Home Page (Authenticated)', () => {
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
