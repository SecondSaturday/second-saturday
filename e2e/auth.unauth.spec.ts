import { test, expect } from '@playwright/test'

// Longer timeout for CI cold starts
test.setTimeout(30000)

test.describe('Authentication (Unauthenticated)', () => {
  test('home page is accessible', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Page should load (200 or redirect to sign-in)
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-in page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-in', { waitUntil: 'domcontentloaded' })

    // Sign-in page should load successfully
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-up page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-up', { waitUntil: 'domcontentloaded' })

    // Sign-up page should load successfully
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })
})
