import { test as setup, expect } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'

const authFile = '.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Initialize Clerk testing
  await clerkSetup()

  // Get test credentials from environment
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment variables')
  }

  // Navigate to sign-in page
  await page.goto('/sign-in')

  // Wait for Clerk to load
  await page.waitForSelector('[data-clerk-component="SignIn"]', { timeout: 10000 })

  // Fill in credentials
  await page.fill('input[name="identifier"]', email)
  await page.click('button[data-localization-key="formButtonPrimary"]')

  // Wait for password field and fill
  await page.waitForSelector('input[name="password"]', { timeout: 5000 })
  await page.fill('input[name="password"]', password)
  await page.click('button[data-localization-key="formButtonPrimary"]')

  // Wait for successful authentication - should redirect away from sign-in
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
