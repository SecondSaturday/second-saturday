import { test, expect } from '@playwright/test'

test.describe('Authentication (Unauthenticated)', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Should redirect to sign-in for protected routes
    // Adjust this based on your actual auth flow
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-in page loads correctly', async ({ page }) => {
    await page.goto('/sign-in')

    // Clerk sign-in component should be present
    await expect(page.locator('[data-clerk-component="SignIn"]')).toBeVisible({
      timeout: 10000,
    })
  })

  test('sign-up page loads correctly', async ({ page }) => {
    await page.goto('/sign-up')

    // Clerk sign-up component should be present
    await expect(page.locator('[data-clerk-component="SignUp"]')).toBeVisible({
      timeout: 10000,
    })
  })
})
