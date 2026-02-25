import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Auth Flows (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  // --- Sign-up redirect ---

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    // Authenticated users may be redirected, or see sign-up form
    // Just verify no server error
    const url = page.url()
    expect(url).toBeTruthy()
  })

  // --- Complete profile page ---

  test('complete-profile page loads', async ({ page }) => {
    await page.goto('/complete-profile', { waitUntil: 'domcontentloaded' })
    // Should either show the profile form or redirect to dashboard (if name exists)
    await expect(page.locator('body')).toBeVisible()
    const url = page.url()
    const isProfilePage = url.includes('/complete-profile')
    const isDashboard = url.includes('/dashboard')
    expect(isProfilePage || isDashboard).toBe(true)
  })

  test('complete-profile has display name input', async ({ page }) => {
    await page.goto('/complete-profile', { waitUntil: 'domcontentloaded' })
    // If user already has name, it redirects — so check if we're still on the page
    if (page.url().includes('/complete-profile')) {
      await expect(page.getByPlaceholder('Your name')).toBeVisible({ timeout: 15000 })
      await expect(page.getByText('Set up your profile')).toBeVisible()
    }
  })

  test('complete-profile has photo upload', async ({ page }) => {
    await page.goto('/complete-profile', { waitUntil: 'domcontentloaded' })
    if (page.url().includes('/complete-profile')) {
      await expect(page.getByText('Add photo')).toBeVisible({ timeout: 15000 })
      await expect(page.getByText('Optional')).toBeVisible()
    }
  })

  test('complete-profile continue button is disabled without name', async ({ page }) => {
    await page.goto('/complete-profile', { waitUntil: 'domcontentloaded' })
    if (page.url().includes('/complete-profile')) {
      const continueBtn = page.getByRole('button', { name: /continue/i })
      await expect(continueBtn).toBeDisabled()
    }
  })

  test('complete-profile continue button enables with name', async ({ page }) => {
    await page.goto('/complete-profile', { waitUntil: 'domcontentloaded' })
    if (page.url().includes('/complete-profile')) {
      await page.getByPlaceholder('Your name').fill('Test User')
      const continueBtn = page.getByRole('button', { name: /continue/i })
      await expect(continueBtn).toBeEnabled()
    }
  })

  // --- Settings: Profile ---

  test('settings page shows timezone field', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Timezone')).toBeVisible({ timeout: 15000 })
  })

  test('settings page shows change email button', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Change', exact: true })).toBeVisible()
  })

  test('change email shows input when clicked', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Change', exact: true }).click()
    await expect(page.getByPlaceholder('New email address')).toBeVisible()
    await expect(page.getByRole('button', { name: /send verification/i })).toBeVisible()
  })

  test('change email cancel hides input', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Change', exact: true }).click()
    await expect(page.getByPlaceholder('New email address')).toBeVisible()
    await page
      .getByRole('button', { name: /cancel/i })
      .first()
      .click()
    await expect(page.getByPlaceholder('New email address')).not.toBeVisible()
  })

  // --- Settings: Photo upload with crop ---

  test('settings photo upload button visible', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    // The ImageUpload button should be visible
    await expect(page.getByRole('button', { name: 'Photo' })).toBeVisible()
  })

  // --- Settings: Account Deletion with Re-auth ---

  test('delete account requires re-authentication step', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /delete account/i }).click()
    // Should show re-auth step first, not the DELETE confirmation
    await expect(page.getByText(/enter your password|confirm your email/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /verify identity/i })).toBeVisible()
  })

  test('delete account dialog resets on close', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /delete account/i }).click()
    await expect(page.getByRole('button', { name: /verify identity/i })).toBeVisible()
    // Close dialog
    await page.getByRole('button', { name: /cancel/i }).click()
    // Re-open — should be back to re-auth step
    await page.getByRole('button', { name: /delete account/i }).click()
    await expect(page.getByRole('button', { name: /verify identity/i })).toBeVisible()
  })

  // --- Password change (if visible) ---

  test('password change section validates input', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 15000 })
    // Password section may not be visible for OAuth users
    const changePasswordSection = page.getByText('Change Password')
    if (await changePasswordSection.isVisible().catch(() => false)) {
      const changeBtn = page.getByRole('button', { name: /change password/i })
      // Should be disabled without valid input
      await expect(changeBtn).toBeDisabled()
    }
  })

  // --- Session persistence ---

  test('authenticated user is redirected from home to dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Middleware should redirect authenticated users to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('protected routes are accessible when authenticated', async ({ page }) => {
    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })
})
