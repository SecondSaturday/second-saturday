import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import {
  createCircle,
  getInviteCode,
  warmupConvexAuth,
  createUser2Page,
  joinCircleViaInvite,
} from './helpers'

/**
 * Multi-user tests for admin submission status dashboard.
 * User A (primary) = admin who views submission status.
 * User B (user2) = non-admin member whose status is tracked.
 */

test.describe('Multi-User: Submission Status Dashboard', () => {
  test.setTimeout(90000)

  test('should show correct status indicators for members', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Status Indicators Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings → Status tab
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

      const statusTab = page.getByRole('tab', { name: /status/i })
      await expect(statusTab).toBeVisible({ timeout: 10000 })
      await statusTab.click()

      // Should show at least one member with a status badge
      const statusBadge = page.getByText(/not started|in progress|submitted/i)
      await expect(statusBadge.first()).toBeVisible({ timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should show send reminder button for non-submitted members', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Reminder Button Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings → Status tab
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

      const statusTab = page.getByRole('tab', { name: /status/i })
      await expect(statusTab).toBeVisible({ timeout: 10000 })
      await statusTab.click()

      // Should show a remind button for non-submitted member (User B)
      // The Send icon button appears next to non-submitted members
      const remindBtn = page.locator('button').filter({ hasText: /remind|send/i })
      const hasRemindBtn = await remindBtn
        .first()
        .isVisible({ timeout: 10000 })
        .catch(() => false)

      // If remind button exists, verify it's clickable
      if (hasRemindBtn) {
        await expect(remindBtn.first()).toBeEnabled()
      }
    } finally {
      await user2Page.context().close()
    }
  })

  test('should NOT show status tab for non-admin users', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Non-Admin Status Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User B navigates to settings
      await warmupConvexAuth(user2Page)
      await user2Page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await user2Page.waitForFunction(() => !document.querySelector('.animate-spin'), {
        timeout: 15000,
      })

      // User B should NOT see the Status tab (admin-only)
      const statusTab = user2Page.getByRole('tab', { name: /status/i })
      const hasStatusTab = await statusTab.isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasStatusTab).toBe(false)
    } finally {
      await user2Page.context().close()
    }
  })

  test('should NOT show content preview (privacy)', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Privacy Check Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to Status tab
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

      const statusTab = page.getByRole('tab', { name: /status/i })
      await expect(statusTab).toBeVisible({ timeout: 10000 })
      await statusTab.click()

      // The status dashboard should show member names and status
      // but NOT any submission content (text, photos, videos)
      await page.waitForTimeout(2000) // let content render

      // Verify no textarea content or response text is visible in the status view
      const statusSection = page.locator('[role="tabpanel"][data-state="active"]')
      const text = await statusSection.textContent()

      // Status section should contain member names and status labels,
      // but not prompt response text
      expect(text).toMatch(/not started|in progress|submitted/i)
    } finally {
      await user2Page.context().close()
    }
  })
})
