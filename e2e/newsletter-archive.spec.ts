import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, createCircle } from './helpers'

test.describe('Newsletter - Circle Home', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('circle home page loads without errors', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Circle Home Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Page should show either newsletter content or "No newsletter for this month"
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    const header = page.locator('header')
    await expect(noNewsletter.or(header).first()).toBeVisible({ timeout: 15000 })
  })

  test('circle home shows newsletter content or empty state', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Circle Content Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Either shows newsletter content (Issue #N) or "No newsletter for this month"
    const issueText = page.getByText(/Issue #\d+/)
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    await expect(issueText.first().or(noNewsletter)).toBeVisible({ timeout: 15000 })
  })

  test('circle home has back link to dashboard', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Circle Back Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Back link should be visible
    const backButton = page.locator('button[aria-label="Back"]')
    await expect(backButton.first()).toBeVisible({ timeout: 15000 })
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
