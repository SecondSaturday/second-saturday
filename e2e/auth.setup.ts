import { test as setup } from '@playwright/test'
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '../.auth/user.json')

// Setup test has longer timeout for initial server warmup
setup.setTimeout(60000)

setup('authenticate', async ({ page }) => {
  await clerkSetup()

  // Ensure .auth directory exists
  const authDir = path.dirname(authFile)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  await setupClerkTestingToken({ page })

  // Navigate to sign-in page and authenticate via Clerk UI
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' })

  // Wait for Clerk sign-in form to load
  await page.waitForSelector('.cl-signIn-root, [data-clerk-component="SignIn"]', {
    state: 'attached',
    timeout: 15000,
  })

  // Fill in credentials
  await page.locator('input[name=identifier]').fill(process.env.E2E_CLERK_USER_USERNAME!)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for password field
  await page.locator('input[name=password]').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('input[name=password]').fill(process.env.E2E_CLERK_USER_PASSWORD!)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for redirect to dashboard after successful sign-in
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })

  // Save authentication state for reuse in other tests
  await page.context().storageState({ path: authFile })
})
