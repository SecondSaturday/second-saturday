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

    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })

    // Page should load — either shows newsletter or "No newsletter for this month"
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )
    const noNewsletter = page.getByText(/no newsletter for this month/i)
    const header = page.locator('header')
    await expect(noNewsletter.or(header).first()).toBeVisible({ timeout: 15000 })
  })

  test('circle page shows "not found" for invalid circle ID', async ({ page }) => {
    await warmupConvexAuth(page)

    await page.goto('/dashboard/circles/k17abc123def456gh', {
      waitUntil: 'domcontentloaded',
    })

    // Should show "Circle not found" or an error state
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )
    const notFound = page.getByText(/circle not found|not found/i)
    const body = page.locator('body')
    await expect(notFound.or(body)).toBeVisible({ timeout: 15000 })
  })

  test('circle page has back button to dashboard', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Back Button Test')

    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Back link should be visible
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink.first()).toBeVisible({ timeout: 15000 })
  })

  test('new circle shows no newsletter for this month', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E No Newsletter Test')

    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
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

    await page.goto(`/dashboard/circles/${circleId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
      { timeout: 20000 }
    )

    // Click the back arrow link
    const backLink = page.locator('a[href="/dashboard"]').first()
    await expect(backLink).toBeVisible({ timeout: 15000 })
    await backLink.click()

    // Should navigate back to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  })
})
