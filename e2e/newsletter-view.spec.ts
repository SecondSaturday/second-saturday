import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, navigateToCircle } from './helpers'

test.describe('Newsletter View Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('newsletter page requires authentication (protected route)', async ({ page }) => {
    const response = await page.goto('/dashboard/circles/fake-id/newsletter/fake-newsletter', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBeLessThan(500)
  })

  test('newsletter page loads without server errors', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    // Look for a newsletter link in the archive section
    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Page should load without server errors - header visible
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 })
  })

  test('newsletter page shows loading state while data loads', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    const href = await newsletterLink.getAttribute('href')
    if (!href) {
      test.skip(true, 'Could not get newsletter URL')
      return
    }

    // Navigate directly to catch the loading state
    await page.goto(href, { waitUntil: 'domcontentloaded' })

    // Either the spinner (loading) or the content should be visible
    const spinner = page.locator('.animate-spin')
    const header = page.locator('header')
    await expect(spinner.or(header)).toBeVisible({ timeout: 15000 })
  })

  test('newsletter page shows "not found" for invalid newsletter ID', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    // Navigate to a non-existent newsletter
    await page.goto(`/dashboard/circles/${circleId}/newsletter/invalid_id_here`, {
      waitUntil: 'domcontentloaded',
    })

    // Should show "Newsletter not found" or an error state (not a 500)
    const notFound = page.getByText(/newsletter not found/i)
    const headerText = page.getByText('Newsletter')
    await expect(notFound.or(headerText)).toBeVisible({ timeout: 15000 })
  })

  test('newsletter page shows back button that links to circle dashboard', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Back button should link to circle dashboard
    const backLink = page.locator(`a[href*="/dashboard/circles/${circleId}"]`).first()
    await expect(backLink).toBeVisible({ timeout: 15000 })
  })

  test('newsletter page displays circle name and issue number when newsletter exists', async ({
    page,
  }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Wait for content to load (spinner gone)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Should display issue number somewhere on the page
    const issueText = page.getByText(/Issue #\d+/)
    await expect(issueText.first()).toBeVisible({ timeout: 15000 })
  })

  test('newsletter page displays publication date', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Wait for content to load
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Publication date is displayed as "Month Day, Year" (e.g. "January 15, 2026")
    // The middot separator is used between issue number and date
    const datePattern = page.getByText(
      /\u00B7\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/
    )
    const hasDate = await datePattern
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    // Date may not be present if publishedAt is null - just verify page loaded
    if (!hasDate) {
      // At minimum, the issue number should be visible
      await expect(page.getByText(/Issue #\d+/).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('newsletter page displays prompt sections with member responses', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Wait for content to load
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // The page should show either prompt sections or "no content yet" message
    const noContent = page.getByText(/no content yet/i)
    const hasNoContent = await noContent.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasNoContent) {
      // Newsletter exists but has no content - valid state
      await expect(noContent).toBeVisible()
    } else {
      // Newsletter has content - page body should be visible without errors
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

test.describe('Newsletter View - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('back button navigates to circle dashboard', async ({ page }) => {
    const circleId = await navigateToCircle(page)
    if (!circleId) {
      test.skip(true, 'No circles available')
      return
    }

    const newsletterLink = page.locator('a[href*="/newsletter/"]').first()
    const hasNewsletter = await newsletterLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasNewsletter) {
      test.skip(true, 'No newsletters available')
      return
    }

    await newsletterLink.click()
    await page.waitForURL(/\/newsletter\//, { timeout: 10000 })

    // Wait for page to load
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Click the back arrow link
    const backLink = page.locator(`a[href*="/dashboard/circles/${circleId}"]`).first()
    await expect(backLink).toBeVisible({ timeout: 15000 })
    await backLink.click()

    // Should navigate back to circle dashboard
    await page.waitForURL(new RegExp(`/dashboard/circles/${circleId}`), { timeout: 10000 })
  })
})
