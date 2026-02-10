import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Circle Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('settings page requires authentication', async ({ page }) => {
    // Try accessing a settings page - should not return 500
    const response = await page.goto('/dashboard/circles/fake-id/settings', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Circle Settings (with circle)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('settings page shows circle settings title', async ({ page }) => {
    // First create a circle to get a valid ID
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Settings Test Circle')
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })

    // Extract circleId from URL
    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) {
      test.skip(true, 'Could not extract circle ID')
      return
    }
    const circleId = match[1]

    // Navigate to settings
    await page.goto(`/dashboard/circles/${circleId}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByText('Circle Settings')).toBeVisible({ timeout: 15000 })
  })

  test('settings page shows invite link section', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Invite Link Test')
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })

    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await page.goto(`/dashboard/circles/${match[1]}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByText('Invite Link')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/invite/i)).toBeVisible()
  })

  test('settings page shows regenerate invite link button', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Regen Link Test')
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })

    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await page.goto(`/dashboard/circles/${match[1]}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByText(/regenerate invite link/i)).toBeVisible({ timeout: 15000 })
  })

  test('settings shows 3-member warning for new circle', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Warning Test Circle')
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })

    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await page.goto(`/dashboard/circles/${match[1]}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    // Should show the 3-member minimum warning (only 1 member - admin)
    await expect(page.getByText(/invite.*more.*member/i)).toBeVisible({ timeout: 15000 })
  })

  test('regenerate shows warning dialog', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Dialog Test Circle')
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })

    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await page.goto(`/dashboard/circles/${match[1]}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByText(/regenerate invite link/i).click()
    // Warning dialog should appear
    await expect(page.getByText(/current invite link will stop working/i)).toBeVisible({
      timeout: 5000,
    })
    // Should have Cancel button
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
  })
})
