import { test as setup } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'

const authFile = '.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Fetch testing token from Clerk API
  await clerkSetup()

  // Inject testing token into cookies BEFORE navigation
  // This bypasses Clerk JS entirely - auth happens at middleware level
  await setupClerkTestingToken({ page })

  // Navigate - Clerk middleware will recognize the testing token
  await page.goto('/')

  // Save authentication state for reuse in other tests
  await page.context().storageState({ path: authFile })
})
