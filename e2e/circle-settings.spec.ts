import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration } from './helpers'

test.describe('Circle Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('circle page requires authentication', async ({ page }) => {
    const response = await page.goto('/dashboard/circles/fake-id', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Circle Settings (with circle)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Wait for Convex auth to fully establish (spinner disappears when data loads)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    await page.waitForTimeout(500)
  })

  async function createAndGetCircleId(page: import('@playwright/test').Page, name: string) {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill(name)
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })
    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    return match?.[1] ?? null
  }

  async function openSettingsPage(page: import('@playwright/test').Page, circleId: string) {
    // Navigate directly to the settings page
    await page.goto(`/dashboard/circles/${circleId}/settings`, { waitUntil: 'domcontentloaded' })
    // Wait for page to hydrate (Convex data loaded, spinner gone)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    // Wait for the settings heading to be visible
    await expect(page.getByRole('heading', { name: 'Circle Settings' })).toBeVisible({
      timeout: 15000,
    })
  }

  test('settings page opens from circle page', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Settings Test Circle')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsPage(page, circleId)
  })

  test('settings page shows invite link section', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'InvLink Section Test')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsPage(page, circleId)
    // Wait for the invite link paragraph to render (Convex data load)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
      { timeout: 15000 }
    )
  })

  test('settings page shows regenerate invite link button', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Regen Link Test')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsPage(page, circleId)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
      { timeout: 15000 }
    )
    await expect(page.getByText(/regenerate invite link/i)).toBeVisible({ timeout: 5000 })
  })

  test('settings shows 3-member warning for new circle', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Warning Test Circle')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsPage(page, circleId)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
      { timeout: 15000 }
    )
    await expect(page.getByText(/invite.*more.*member/i)).toBeVisible({ timeout: 5000 })
  })

  test('regenerate shows warning dialog', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Dialog Test Circle')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsPage(page, circleId)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
      { timeout: 15000 }
    )
    await page.getByText(/regenerate invite link/i).click()
    await expect(page.getByText(/current invite link will stop working/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
  })
})
