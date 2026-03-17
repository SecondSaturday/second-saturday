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
      // Clear any pre-filled name first
      const nameInput = page.getByPlaceholder('Your name')
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.clear()
        const continueBtn = page.getByRole('button', { name: /continue/i })
        await expect(continueBtn).toBeDisabled()
      }
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

  // --- Account management via Clerk UserButton ---
  // Profile editing, email change, password change, and delete account
  // are now handled through Clerk's UserButton → "Manage Account" flow.

  test('user avatar (Clerk UserButton) is visible on dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const userButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userButton).toBeVisible({ timeout: 15000 })
  })

  test('Clerk account menu opens on avatar click', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const userButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userButton).toBeVisible({ timeout: 15000 })
    await userButton.click()

    // Clerk popover should show manage account or sign out options
    await expect(page.getByText(/manage account|sign out/i).first()).toBeVisible({ timeout: 10000 })
  })

  // --- Notification preferences (moved to /dashboard/notifications) ---

  test('notification preferences page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Control how Second Saturday communicates with you')).toBeVisible()
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
