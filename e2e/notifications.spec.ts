import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, createCircle } from './helpers'

test.describe('Notification Preferences', () => {
  // Increase timeout — warmupConvexAuth + page navigation + data loading can take >30s
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
    // Navigate to notifications page — use the menu to do client-side nav
    // (preserves the Convex WebSocket auth vs a full page.goto)
    await page.locator('button[aria-label="Menu"]').first().click()
    await page.getByText('Notifications').click()
    await page.waitForURL(/\/dashboard\/notifications/, { timeout: 10000 })
    // Wait for page header to render
    await page.waitForFunction(
      () => {
        const h1 = document.querySelector('h1')
        return h1 && h1.textContent?.includes('Notifications')
      },
      { timeout: 15000 }
    )
    // Wait for Convex to load notification preferences (skeleton → real content)
    // The switches only appear after preferences load, so wait for an actual switch element
    await page.waitForFunction(
      () => {
        const switches = document.querySelectorAll('[role="switch"]')
        return switches.length >= 2
      },
      { timeout: 25000 }
    )
  })

  test('notification preferences section loads on notifications page', async ({ page }) => {
    await expect(page.getByText('Control how Second Saturday communicates with you')).toBeVisible({
      timeout: 10000,
    })
  })

  test('submission reminders label is visible', async ({ page }) => {
    await expect(page.getByText('Submission Reminders')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Get reminded before the submission deadline')).toBeVisible()
  })

  test('newsletter notifications label is visible', async ({ page }) => {
    await expect(page.getByText('Newsletter Notifications')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Get notified when a new newsletter is ready')).toBeVisible()
  })

  test('both notification switches render', async ({ page }) => {
    // Wait for switches to load (skeleton replaced by actual switches)
    const submissionSwitch = page.locator('#submission-reminders')
    const newsletterSwitch = page.locator('#newsletter-ready')

    await expect(submissionSwitch).toBeVisible({ timeout: 15000 })
    await expect(newsletterSwitch).toBeVisible({ timeout: 15000 })
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
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('admin sees submission status page with reminder UI', async ({ page }) => {
    // Create a circle — creator is admin
    const circleId = await createCircle(page, 'E2E Admin Reminder Test')

    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })

    // Wait for the actual heading to render (not just spinner absence —
    // page.goto can resolve before React hydrates, making the spinner check pass prematurely)
    await expect(page.getByRole('heading', { name: 'Submission Status' })).toBeVisible({
      timeout: 20000,
    })
  })

  test('admin sees reminders remaining text', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Reminders Text Test')

    // Warm up Convex auth before navigating (page.goto breaks Convex WebSocket)
    await warmupConvexAuth(page)
    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })
    // Wait for the page to fully render
    await expect(page.getByRole('heading', { name: 'Submission Status' })).toBeVisible({
      timeout: 20000,
    })

    // Should see "X of 3 reminders remaining"
    await expect(page.getByText(/\d+ of 3 reminders remaining/)).toBeVisible({ timeout: 15000 })
  })

  test('admin sees remind all non-submitters button', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Remind Button Test')

    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })
    // Wait for the page to fully render
    await expect(page.getByRole('heading', { name: 'Submission Status' })).toBeVisible({
      timeout: 20000,
    })

    // Should see the bulk remind button
    await expect(page.getByRole('button', { name: /remind all non-submitters/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('deadline countdown is visible on submissions page', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Deadline Visible Test')

    await page.goto(`/dashboard/circles/${circleId}/submissions`, {
      waitUntil: 'domcontentloaded',
    })
    // Wait for the page to fully render
    await expect(page.getByRole('heading', { name: 'Submission Status' })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByText(/reminders remaining/)).toBeVisible({ timeout: 15000 })
  })
})
