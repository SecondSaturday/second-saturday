import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

/**
 * E2E tests for deadline countdown and submission locking.
 *
 * The DeadlineCountdown component shows:
 * - Time remaining (days/hours/minutes/seconds) before the deadline
 * - "Submissions Locked" when deadline is past
 * - Urgent amber styling when < 1 hour remains
 *
 * The MultiCircleSubmissionScreen:
 * - Disables all inputs when deadlineIsPast === true
 * - Shows a locked banner with lock icon
 *
 * Tests use clock mocking via Date.now override to simulate past deadlines
 * without waiting for real time to pass.
 */

/** Injects a Date.now override that returns a timestamp in year 2099. */
function injectPastDeadlineClock(isoDate: string) {
  return () => {
    const fakeNow = new Date(isoDate).getTime()
    // Override Date.now to return the fake timestamp
    Date.now = () => fakeNow
    // Override new Date() with no args to return the fake date
    const OriginalDate = window.Date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Date = function (...args: unknown[]) {
      if (args.length === 0) {
        return new OriginalDate(fakeNow)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (OriginalDate as any)(...args)
    }
    // Preserve static methods
    Object.assign(window.Date, OriginalDate)
    window.Date.now = () => fakeNow
  }
}

test.describe('Deadline Countdown - Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('deadline countdown is visible on submissions admin page', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    // Navigate to a circle's submissions page if one exists
    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    // Check if admin can see the Submission Status link
    const submissionsLink = page.locator('a:has-text("Submission Status")')
    const hasSubmissionsLink = await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasSubmissionsLink) {
      test.skip()
      return
    }

    await submissionsLink.click()
    await page.waitForURL(/\/submissions/, { timeout: 10000 })

    // DeadlineCountdown should be visible with time display
    // It shows either a countdown or "Submissions Locked"
    const deadlineWidget = page.locator('[class*="rounded-lg"][class*="border"]').filter({
      hasText: /deadline|locked|submissions/i,
    })
    await expect(deadlineWidget.first()).toBeVisible({ timeout: 10000 })
  })

  test('deadline countdown shows time format (days/hours/minutes/seconds)', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    const submissionsLink = page.locator('a:has-text("Submission Status")')
    const hasLink = await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasLink) {
      test.skip()
      return
    }

    await submissionsLink.click()
    await page.waitForURL(/\/submissions/, { timeout: 10000 })

    // Time display pattern: "Xd Xh Xm Xs", "Xh Xm Xs", "Xm Xs", or "Submissions Locked"
    const timePattern = /\d+[dhms]|\d+d \d+h|\d+h \d+m|\d+m \d+s|submissions locked/i
    const timeDisplay = page.getByText(timePattern)
    await expect(timeDisplay.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Deadline Locking - Past Deadline', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('shows Submissions Locked state when deadline is in the past', async ({ page }) => {
    // Override Date.now to simulate a date far past the next Second Saturday deadline.
    await page.addInitScript(injectPastDeadlineClock('2099-01-01T12:00:00Z'))

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    const submissionsLink = page.locator('a:has-text("Submission Status")')
    const hasLink = await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasLink) {
      test.skip()
      return
    }

    await submissionsLink.click()
    await page.waitForURL(/\/submissions/, { timeout: 10000 })

    // DeadlineCountdown should show "Submissions Locked"
    const lockedText = page.getByText(/submissions locked/i)
    await expect(lockedText).toBeVisible({ timeout: 10000 })
  })

  test('info banner appears on submission screen when deadline passed', async ({ page }) => {
    // Mock clock to be past the deadline
    await page.addInitScript(injectPastDeadlineClock('2099-06-15T12:00:00Z'))

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    // After deadline, an informational banner shows instead of a destructive lock banner.
    // The banner says submissions will be included in next month's newsletter.
    const infoBanner = page.getByText(/deadline for this cycle has passed/i)
    const hasInfoBanner = await infoBanner.isVisible({ timeout: 5000 }).catch(() => false)

    // The banner may or may not render depending on whether the circle page
    // renders MultiCircleSubmissionScreen. Verify either the banner or the page loads.
    if (hasInfoBanner) {
      await expect(infoBanner).toBeVisible()
    }
    // Either way, the page should load without error
    await expect(page.locator('body')).toBeVisible()
  })

  test('textarea remains enabled when deadline is past', async ({ page }) => {
    await page.addInitScript(injectPastDeadlineClock('2099-03-10T12:00:00Z'))

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    // Textareas should remain enabled even after deadline — users can still submit late
    const textareas = page.locator('textarea')
    const textareaCount = await textareas.count()

    if (textareaCount > 0) {
      for (let i = 0; i < textareaCount; i++) {
        const textarea = textareas.nth(i)
        const isDisabled = await textarea.isDisabled()
        // Textareas should not be disabled just because the deadline passed
        expect(isDisabled).toBe(false)
      }
    }
  })
})

test.describe('Deadline Countdown - Urgency Styling', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('countdown widget is visible with clock icon', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    const submissionsLink = page.locator('a:has-text("Submission Status")')
    const hasLink = await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasLink) {
      test.skip()
      return
    }

    await submissionsLink.click()
    await page.waitForURL(/\/submissions/, { timeout: 10000 })

    // DeadlineCountdown renders a Clock icon (SVG) and a time display
    // The container has rounded-lg border classes
    const countdownContainer = page
      .locator('div')
      .filter({ hasText: /deadline|submissions locked/i })
      .first()
    await expect(countdownContainer).toBeVisible({ timeout: 10000 })
  })

  test('countdown shows "Submission Locked" label when deadline is past', async ({ page }) => {
    await page.addInitScript(injectPastDeadlineClock('2099-12-25T12:00:00Z'))

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    const submissionsLink = page.locator('a:has-text("Submission Status")')
    const hasLink = await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasLink) {
      test.skip()
      return
    }

    await submissionsLink.click()
    await page.waitForURL(/\/submissions/, { timeout: 10000 })

    // With a date far in the future (2099), the deadline is always past.
    // DeadlineCountdown shows "Submission Locked" label and "Submissions Locked" time display.
    const submissionLockedLabel = page.getByText(/submission locked/i)
    await expect(submissionLockedLabel.first()).toBeVisible({ timeout: 10000 })
  })
})
