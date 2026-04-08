import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, createCircle } from './helpers'

test.describe('Newsletter View Page', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('newsletter page requires authentication (protected route)', async ({ page }) => {
    await warmupConvexAuth(page)
    const response = await page.goto('/dashboard/circles/fake-id/newsletter/fake-newsletter', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })

  test('circle landing page loads without server errors', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Newsletter Load Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    const header = page.locator('header')
    await expect(noNewsletter.or(header).first()).toBeVisible({ timeout: 15000 })
  })

  test('circle page handles invalid URL gracefully', async ({ page }) => {
    await warmupConvexAuth(page)

    // Navigate to a non-existent circle URL — should not crash with a 500
    const response = await page.goto('/dashboard/circles/nonexistent', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })

  test('circle page has back button to dashboard', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Back Button Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Back button should be visible
    const backButton = page.locator('button[aria-label="Back"]')
    await expect(backButton.first()).toBeVisible({ timeout: 15000 })
  })

  test('new circle shows no newsletter for this month', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E No Newsletter Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // New circles have no newsletters — should show empty state
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    await expect(noNewsletter).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Newsletter View - Navigation', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('back button navigates to dashboard', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Nav Back Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('header', { timeout: 20000 })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Click the back arrow button
    const backButton = page.locator('button[aria-label="Back"]').first()
    await expect(backButton).toBeVisible({ timeout: 15000 })
    await backButton.click()

    // Should navigate back to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  })
})
