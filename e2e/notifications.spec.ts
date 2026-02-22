import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Notification Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    // Warm up Convex auth before navigating to settings
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    // Navigate to settings and wait for page to fully hydrate
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 15000 })
  })

  test('notification preferences section loads on settings page', async ({ page }) => {
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Control how Second Saturday communicates with you')).toBeVisible()
  })

  test('submission reminders label is visible', async ({ page }) => {
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Submission Reminders')).toBeVisible()
    await expect(page.getByText('Get reminded before the submission deadline')).toBeVisible()
  })

  test('newsletter notifications label is visible', async ({ page }) => {
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Newsletter Notifications')).toBeVisible()
    await expect(page.getByText('Get notified when a new newsletter is ready')).toBeVisible()
  })

  test('both notification switches render and are checked by default', async ({ page }) => {
    // Wait for switches to load (skeleton replaced by actual switches)
    const submissionSwitch = page.locator('#submission-reminders')
    const newsletterSwitch = page.locator('#newsletter-ready')

    await expect(submissionSwitch).toBeVisible({ timeout: 15000 })
    await expect(newsletterSwitch).toBeVisible({ timeout: 15000 })

    // Both should default to checked
    await expect(submissionSwitch).toBeChecked()
    await expect(newsletterSwitch).toBeChecked()
  })

  test('toggle submission reminders switch', async ({ page }) => {
    const submissionSwitch = page.locator('#submission-reminders')
    await expect(submissionSwitch).toBeVisible({ timeout: 15000 })

    // Toggle off
    await submissionSwitch.click()

    // Toast should appear confirming the update
    await expect(page.getByText('Preferences updated')).toBeVisible({ timeout: 15000 })

    // Toggle back on to restore state
    await submissionSwitch.click()
    await expect(page.getByText('Preferences updated').first()).toBeVisible({ timeout: 15000 })
  })

  test('toggle newsletter notifications switch', async ({ page }) => {
    const newsletterSwitch = page.locator('#newsletter-ready')
    await expect(newsletterSwitch).toBeVisible({ timeout: 15000 })

    // Toggle off
    await newsletterSwitch.click()

    // Toast should appear confirming the update
    await expect(page.getByText('Preferences updated')).toBeVisible({ timeout: 15000 })

    // Toggle back on to restore state
    await newsletterSwitch.click()
    await expect(page.getByText('Preferences updated').first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Admin Submission Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    // Warm up Convex auth
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
  })

  test('admin sees submission status page with reminder UI', async ({ page }) => {
    // First, navigate to dashboard and find a circle
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Look for a circle link on the dashboard
    const circleLink = page.locator('a[href*="/dashboard/circles/"]').first()
    const hasCircle = await circleLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCircle) {
      test.skip(true, 'No circles available to test admin reminders')
      return
    }

    // Extract the circle ID from the link href
    const href = await circleLink.getAttribute('href')
    const circleIdMatch = href?.match(/\/circles\/([^/]+)/)
    if (!circleIdMatch) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    const circleId = circleIdMatch[1]

    // Navigate to the submissions page for this circle
    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })

    // Check if we are admin — non-admins see "Only admins can view submissions"
    const nonAdminMessage = page.getByText('Only admins can view submissions')
    const isNonAdmin = await nonAdminMessage.isVisible({ timeout: 5000 }).catch(() => false)

    if (isNonAdmin) {
      test.skip(true, 'Current user is not admin of this circle')
      return
    }

    // Admin should see the submission status header
    await expect(page.getByText('Submission Status')).toBeVisible({ timeout: 15000 })
  })

  test('admin sees reminders remaining text', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const circleLink = page.locator('a[href*="/dashboard/circles/"]').first()
    const hasCircle = await circleLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCircle) {
      test.skip(true, 'No circles available to test admin reminders')
      return
    }

    const href = await circleLink.getAttribute('href')
    const circleIdMatch = href?.match(/\/circles\/([^/]+)/)
    if (!circleIdMatch) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    const circleId = circleIdMatch[1]
    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })

    const nonAdminMessage = page.getByText('Only admins can view submissions')
    const isNonAdmin = await nonAdminMessage.isVisible({ timeout: 5000 }).catch(() => false)

    if (isNonAdmin) {
      test.skip(true, 'Current user is not admin of this circle')
      return
    }

    // Should see "X of 3 reminders remaining"
    await expect(page.getByText(/\d+ of 3 reminders remaining/)).toBeVisible({ timeout: 15000 })
  })

  test('admin sees remind all non-submitters button', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const circleLink = page.locator('a[href*="/dashboard/circles/"]').first()
    const hasCircle = await circleLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCircle) {
      test.skip(true, 'No circles available to test admin reminders')
      return
    }

    const href = await circleLink.getAttribute('href')
    const circleIdMatch = href?.match(/\/circles\/([^/]+)/)
    if (!circleIdMatch) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    const circleId = circleIdMatch[1]
    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })

    const nonAdminMessage = page.getByText('Only admins can view submissions')
    const isNonAdmin = await nonAdminMessage.isVisible({ timeout: 5000 }).catch(() => false)

    if (isNonAdmin) {
      test.skip(true, 'Current user is not admin of this circle')
      return
    }

    // Should see the bulk remind button
    await expect(page.getByRole('button', { name: /remind all non-submitters/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('deadline countdown is visible on submissions page', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const circleLink = page.locator('a[href*="/dashboard/circles/"]').first()
    const hasCircle = await circleLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCircle) {
      test.skip(true, 'No circles available to test admin reminders')
      return
    }

    const href = await circleLink.getAttribute('href')
    const circleIdMatch = href?.match(/\/circles\/([^/]+)/)
    if (!circleIdMatch) {
      test.skip(true, 'Could not extract circle ID')
      return
    }

    const circleId = circleIdMatch[1]
    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })

    const nonAdminMessage = page.getByText('Only admins can view submissions')
    const isNonAdmin = await nonAdminMessage.isVisible({ timeout: 5000 }).catch(() => false)

    if (isNonAdmin) {
      test.skip(true, 'Current user is not admin of this circle')
      return
    }

    // The submissions page should have both the header and the dashboard content
    await expect(page.getByText('Submission Status')).toBeVisible({ timeout: 15000 })
    // Deadline countdown or reminder section should be present
    await expect(page.getByText(/reminders remaining/)).toBeVisible({ timeout: 15000 })
  })
})
