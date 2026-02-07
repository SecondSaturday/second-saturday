import { test, expect } from '@playwright/test'

test.describe('Authentication (Unauthenticated)', () => {
  test('home page is accessible', async ({ page }) => {
    const response = await page.goto('/')

    // Page should load (200 or redirect to sign-in)
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-in page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-in')

    // Sign-in page should load successfully
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()

    // Page title or content should indicate sign-in
    await expect(page).toHaveURL(/sign-in/)
  })

  test('sign-up page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-up')

    // Sign-up page should load successfully
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()

    // Page title or content should indicate sign-up
    await expect(page).toHaveURL(/sign-up/)
  })
})
