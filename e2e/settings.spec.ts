import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth } from './helpers'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  // Profile, email, password, and delete account are now managed via
  // Clerk's UserButton → "Manage Account" flow, not a custom settings page.

  test('user avatar button is visible on dashboard', async ({ page }) => {
    const userButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userButton).toBeVisible({ timeout: 15000 })
  })

  test('clicking user avatar opens Clerk account menu', async ({ page }) => {
    const userButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userButton).toBeVisible({ timeout: 15000 })
    await userButton.click()

    await expect(page.getByText(/manage account|sign out/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('notifications page loads from menu', async ({ page }) => {
    // Open the three-dot menu
    await page.getByLabel('Menu').click()
    await page.getByText('Notifications').click()

    await page.waitForURL(/\/dashboard\/notifications/, { timeout: 10000 })
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Control how Second Saturday communicates with you')).toBeVisible()
  })

  test('notifications page has back link to dashboard', async ({ page }) => {
    await page.goto('/dashboard/notifications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 15000 })
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink).toBeVisible()
  })

  test('log out option accessible via user button', async ({ page }) => {
    const userButton = page.getByRole('button', { name: /open user menu/i })
    await expect(userButton).toBeVisible({ timeout: 15000 })
    await userButton.click()

    await expect(page.getByText(/sign out/i)).toBeVisible({ timeout: 10000 })
  })
})
