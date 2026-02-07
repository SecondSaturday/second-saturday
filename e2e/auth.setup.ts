import { test as setup, expect } from '@playwright/test'

const authFile = '.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Get test credentials from environment
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment variables')
  }

  // Navigate to sign-in page
  await page.goto('/sign-in')

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')

  // Wait for Clerk to initialize and show the sign-in form
  // Use a more flexible selector that works with Clerk's component
  const signInForm = page.locator('.cl-rootBox, .cl-signIn-root, [data-clerk-component]').first()
  await expect(signInForm).toBeVisible({ timeout: 30000 })

  // Fill in email/identifier
  const identifierInput = page.locator('input[name="identifier"], input[type="email"]').first()
  await identifierInput.waitFor({ state: 'visible', timeout: 10000 })
  await identifierInput.fill(email)

  // Click continue/submit button
  const continueButton = page.locator('button[type="submit"], button:has-text("Continue")').first()
  await continueButton.click()

  // Wait for password field
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
  await passwordInput.fill(password)

  // Click sign in button
  const signInButton = page
    .locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Continue")')
    .first()
  await signInButton.click()

  // Wait for successful authentication - should redirect away from sign-in
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 15000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
