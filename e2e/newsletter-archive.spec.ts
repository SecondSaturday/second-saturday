import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, navigateToCircle } from './helpers'

test.describe('Newsletter - Circle Home', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('circle home page loads without errors', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    // Wait for page to hydrate
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Page should show either newsletter content, "No newsletter for this month", or a header
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    const header = page.locator('header')
    await expect(noNewsletter.or(header)).toBeVisible({ timeout: 15000 })
  })

  test('circle home shows newsletter content or empty state', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Either shows newsletter content (Issue #N) or "No newsletter for this month"
    const issueText = page.getByText(/Issue #\d+/)
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    await expect(issueText.first().or(noNewsletter)).toBeVisible({ timeout: 15000 })
  })

  test('circle home has back link to dashboard', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Back link should be visible
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink.first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Newsletter - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('circle page requires authentication (no server error)', async ({ page }) => {
    const response = await page.goto('/dashboard/circles/fake-circle-id', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })
})
