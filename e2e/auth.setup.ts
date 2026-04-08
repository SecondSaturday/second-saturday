import { test as setup } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import path from 'path'
import fs from 'fs'

const authDir = path.join(__dirname, '../.auth')

// Setup test has longer timeout for initial server warmup
setup.setTimeout(120000)

// Run auth setups sequentially to avoid Clerk race conditions
setup.describe.configure({ mode: 'serial' })

/** Signs in a Clerk user and saves their storage state to a file. */
async function signInUser(
  page: import('@playwright/test').Page,
  username: string,
  password: string,
  storageFile: string
) {
  await setupClerkTestingToken({ page })

  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' })

  await page.waitForSelector('.cl-signIn-root, [data-clerk-component="SignIn"]', {
    state: 'attached',
    timeout: 15000,
  })

  await page.locator('input[name=identifier]').fill(username)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.locator('input[name=password]').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('input[name=password]').fill(password)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Handle email verification / 2FA if required
  try {
    await page.waitForURL(/\/factor/, { timeout: 5000 })
    await page.waitForTimeout(1000)

    const otpContainer = page.locator('[data-input-otp-container]')
    await otpContainer.waitFor({ state: 'visible', timeout: 5000 })

    await page.evaluate(() => {
      const container = document.querySelector('[data-input-otp-container]') as HTMLElement
      if (container) container.style.pointerEvents = 'auto'
    })

    const input = page.locator('input').first()
    await input.focus()
    await page.keyboard.type('424242', { delay: 50 })

    await page.waitForTimeout(500)
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true })
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click()
    }
  } catch {
    // No verification step required
  }

  // Wait for redirect to dashboard or complete-profile
  await page.waitForURL(/\/(dashboard|complete-profile)/, { timeout: 30000 }).catch(async (err) => {
    await page.screenshot({ path: `e2e-auth-debug-${path.basename(storageFile, '.json')}.png` })
    throw err
  })

  await page.context().storageState({ path: storageFile })
}

setup('authenticate', async ({ page }) => {
  await clerkSetup()

  // Ensure .auth directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Sign in primary user (admin for most tests)
  await signInUser(
    page,
    process.env.E2E_CLERK_USER_USERNAME!,
    process.env.E2E_CLERK_USER_PASSWORD!,
    path.join(authDir, 'user.json')
  )
})

setup('authenticate user2', async ({ page }) => {
  await clerkSetup()

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Sign in second user (used as non-admin member)
  if (process.env.E2E_CLERK_USER2_USERNAME && process.env.E2E_CLERK_USER2_PASSWORD) {
    await signInUser(
      page,
      process.env.E2E_CLERK_USER2_USERNAME,
      process.env.E2E_CLERK_USER2_PASSWORD,
      path.join(authDir, 'user2.json')
    )
  }
})

setup('authenticate user3', async ({ page }) => {
  await clerkSetup()

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Sign in third user (used for 3-user scenarios)
  if (process.env.E2E_CLERK_USER3_USERNAME && process.env.E2E_CLERK_USER3_PASSWORD) {
    await signInUser(
      page,
      process.env.E2E_CLERK_USER3_USERNAME,
      process.env.E2E_CLERK_USER3_PASSWORD,
      path.join(authDir, 'user3.json')
    )
  }
})
