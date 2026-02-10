import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
  })

  test('dashboard shows header with date', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Header should contain a date label button (e.g., "Feb 14")
    const dateButton = page.locator('button').filter({ hasText: /[A-Z][a-z]{2} \d{1,2}/ })
    await expect(dateButton.first()).toBeVisible({ timeout: 15000 })
  })

  test('dashboard shows FAB with next deadline', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // FAB links to create page
    const fab = page.locator('a[href="/dashboard/create"]')
    await expect(fab).toBeVisible({ timeout: 15000 })
  })

  test('dashboard shows empty state or circle list', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Should show either "No circles yet" or at least one circle item
    const emptyState = page.getByText(/no circles yet/i)
    const circleItem = page.locator('button').filter({ hasText: /\w+/ }).first()
    await expect(emptyState.or(circleItem)).toBeVisible({ timeout: 15000 })
  })

  test('FAB navigates to circle creation page', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const fab = page.locator('a[href="/dashboard/create"]')
    await expect(fab).toBeVisible({ timeout: 15000 })
    await fab.click()
    await expect(page).toHaveURL(/\/dashboard\/create/)
  })

  test('date picker opens and shows past issues', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Click on the date label to open picker
    const dateButton = page.locator('button').filter({ hasText: /[A-Z][a-z]{2} \d{1,2}/ })
    await expect(dateButton.first()).toBeVisible({ timeout: 15000 })
    await dateButton.first().click()
    // Should show the Select Issue dialog
    await expect(page.getByText('Select Issue')).toBeVisible({ timeout: 5000 })
  })

  test('date picker selects a date and closes', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const dateButton = page.locator('button').filter({ hasText: /[A-Z][a-z]{2} \d{1,2}/ })
    await expect(dateButton.first()).toBeVisible({ timeout: 15000 })
    await dateButton.first().click()
    await expect(page.getByText('Select Issue')).toBeVisible({ timeout: 5000 })
    // Click any date option in the picker
    const dateOption = page.getByRole('dialog').locator('button').first()
    await dateOption.click()
    // Dialog should close
    await expect(page.getByText('Select Issue')).not.toBeVisible({ timeout: 5000 })
  })
})
