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

  // Handle email verification / 2FA if required (Clerk's input-otp component)
  try {
    await page.waitForURL(/\/factor/, { timeout: 5000 })
    await page.waitForTimeout(1000)

    // Clerk uses input-otp: a single hidden input inside [data-input-otp-container]
    // Click the container to focus, then type the code
    const otpContainer = page.locator('[data-input-otp-container]')
    await otpContainer.waitFor({ state: 'visible', timeout: 5000 })

    // Remove pointer-events:none so we can interact
    await page.evaluate(() => {
      const container = document.querySelector('[data-input-otp-container]') as HTMLElement
      if (container) container.style.pointerEvents = 'auto'
    })

    // Focus the hidden input and type the code
    const input = page.locator('input').first()
    await input.focus()
    await page.keyboard.type('424242', { delay: 50 })

    // Wait for auto-submit or click Continue
    await page.waitForTimeout(500)
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true })
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click()
    }
  } catch {
    // No verification step required, continue
  }

  // Wait for redirect to dashboard after successful sign-in
  await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(async (err) => {
    await page.screenshot({ path: 'e2e-auth-debug.png' })
    throw err
  })

  // Save authentication state for reuse in other tests
  await page.context().storageState({ path: authFile })
})
