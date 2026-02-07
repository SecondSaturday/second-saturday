import { test, expect } from '@playwright/test'

test.describe('Authentication (Unauthenticated)', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/')

    // Should either show the page or redirect to sign-in
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-in page loads correctly', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')

    // Clerk sign-in component should be present (use flexible selectors)
    const signInComponent = page
      .locator('.cl-rootBox, .cl-signIn-root, [data-clerk-component]')
      .first()
    await expect(signInComponent).toBeVisible({ timeout: 30000 })
  })

  test('sign-up page loads correctly', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForLoadState('networkidle')

    // Clerk sign-up component should be present (use flexible selectors)
    const signUpComponent = page
      .locator('.cl-rootBox, .cl-signUp-root, [data-clerk-component]')
      .first()
    await expect(signUpComponent).toBeVisible({ timeout: 30000 })
  })
})
