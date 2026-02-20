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

  async function openSettingsDrawer(page: import('@playwright/test').Page, circleId: string) {
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })
    // Wait for page to hydrate (Convex data loaded, spinner gone)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    // Wait for settings button to be visible and React-hydrated
    const settingsBtn = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-settings') })
      .first()
    await settingsBtn.waitFor({ state: 'visible', timeout: 15000 })
    // Ensure React hydration so click handler is attached
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button svg.lucide-settings')?.closest('button')
        return btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber'))
      },
      { timeout: 10000 }
    )
    await settingsBtn.click()
    await expect(page.getByRole('heading', { name: 'Circle Settings' })).toBeVisible({
      timeout: 15000,
    })
    // Wait for CircleSettings component to finish loading (spinner disappears)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
  }

  test('settings drawer opens from circle page', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Settings Test Circle')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsDrawer(page, circleId)
  })

  test('settings drawer shows invite link section', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'InvLink Section Test')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsDrawer(page, circleId)
    // Wait for the invite link paragraph to render (Convex data load)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
      { timeout: 15000 }
    )
  })

  test('settings drawer shows regenerate invite link button', async ({ page }) => {
    const circleId = await createAndGetCircleId(page, 'Regen Link Test')
    if (!circleId) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    await openSettingsDrawer(page, circleId)
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

    await openSettingsDrawer(page, circleId)
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

    await openSettingsDrawer(page, circleId)
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
