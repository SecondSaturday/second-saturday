import { test as setup } from '@playwright/test'
import { clerk, clerkSetup } from '@clerk/testing/playwright'

const authFile = '.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Ensure Clerk testing is set up
  await clerkSetup()

  // Use Clerk's testing bypass - this uses the CLERK_TESTING_TOKEN
  // to create a fake session without needing to interact with Clerk UI
  await page.goto('/')

  // Sign in using Clerk's bypass mode with test credentials
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  })

  // Wait for auth to be established
  await page.waitForTimeout(1000)

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
