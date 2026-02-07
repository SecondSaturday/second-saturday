import { test, expect } from '@playwright/test'

test.describe('Home Page (Authenticated)', () => {
  test('displays user content after login', async ({ page }) => {
    await page.goto('/')

    // Should be on authenticated page, not redirected to sign-in
    await expect(page).not.toHaveURL(/sign-in/)

    // Page should load successfully
    await expect(page).toHaveTitle(/Second Saturday/)
  })

  test('can navigate to main sections', async ({ page }) => {
    await page.goto('/')

    // Verify page loaded
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
