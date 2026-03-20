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
 * Multi-user tests for member list display.
 * User A (primary) = admin.
 * User B (user2) = non-admin member.
 */

test.describe('Multi-User: Member List', () => {
  test.setTimeout(90000)

  test('should NOT show remove button for non-admin users', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    // User A creates circle
    const circleId = await createCircle(page, 'E2E Non-Admin View Test')
    const inviteCode = await getInviteCode(page, circleId)

    // User B joins
    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User B navigates to circle settings → Members tab
      await warmupConvexAuth(user2Page)
      await user2Page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await user2Page.waitForFunction(() => !document.querySelector('.animate-spin'), {
        timeout: 15000,
      })

      const membersTab = user2Page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 10000 })
      await membersTab.click()

      // User B should see member names but NOT see any "Member actions" buttons
      // (only admin can see those)
      await user2Page.waitForTimeout(2000) // let member list render
      const actionButtons = user2Page.locator('[aria-label="Member actions"]')
      const actionCount = await actionButtons.count()
      expect(actionCount).toBe(0)

      // User B should still see the "Admin" badge on User A
      await expect(user2Page.getByText(/admin/i).first()).toBeVisible({ timeout: 5000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should update in real-time when members join', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    // User A creates circle
    const circleId = await createCircle(page, 'E2E Realtime Members Test')
    const inviteCode = await getInviteCode(page, circleId)

    // User A stays on members tab
    await page.goto(`/dashboard/circles/${circleId}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    // Wait for tabs to render (not just spinner check — spinner check can pass before React mounts)
    await page.waitForFunction(() => document.querySelectorAll('[role="tab"]').length >= 3, {
      timeout: 20000,
    })

    const membersTab = page.getByRole('tab', { name: /members/i })
    await expect(membersTab).toBeVisible({ timeout: 10000 })
    await membersTab.click()

    // Should show 1 member (just admin)
    await expect(page.getByRole('tab', { name: /members.*1/i })).toBeVisible({ timeout: 10000 })

    // User B joins in background
    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A's member list should update in real-time to show 2 members
      await expect(page.getByRole('tab', { name: /members.*2/i })).toBeVisible({ timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })
})
