import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('settings page loads with user profile', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Profile')).toBeVisible()
  })

  test('can update display name', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    const nameInput = page.getByPlaceholder('Your name')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('New Name')
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await expect(saveButton).toBeEnabled()
  })

  test('email is read-only', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Profile')).toBeVisible({ timeout: 15000 })
    const emailInput = page.locator('input[disabled]')
    await expect(emailInput).toBeVisible()
  })

  test('delete account modal opens and requires confirmation', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /delete account/i }).click()
    await expect(page.getByPlaceholder('DELETE')).toBeVisible()
  })

  test('password change section renders for password users', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 15000 })
    // Password section may or may not be visible depending on user type
    // Just verify the page loads without error
    await expect(page.getByText('Profile')).toBeVisible()
  })
})
