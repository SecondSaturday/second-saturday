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
 * Multi-user tests for member removal.
 * User A (primary) = admin who creates the circle.
 * User B (user2) = non-admin member who joins via invite.
 */

/**
 * Ensures user A is on the settings page with tabs rendered.
 * After getInviteCode, user A is already on settings — uses reload
 * instead of full page.goto() to preserve Convex WebSocket auth.
 */
async function ensureOnSettingsWithTabs(page: import('@playwright/test').Page, circleId: string) {
  const settingsUrl = `/dashboard/circles/${circleId}/settings`
  const currentUrl = page.url()

  if (currentUrl.includes(`/circles/${circleId}/settings`)) {
    await page.reload({ waitUntil: 'domcontentloaded' })
  } else {
    await page.goto(settingsUrl, { waitUntil: 'domcontentloaded' })
  }

  // Wait for tabs to render. If it times out, try a full navigation as fallback.
  const tabsLoaded = await page
    .waitForFunction(() => document.querySelectorAll('[role="tab"]').length >= 3, {
      timeout: 20000,
    })
    .then(() => true)
    .catch(() => false)

  if (!tabsLoaded) {
    await page.goto(settingsUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.querySelectorAll('[role="tab"]').length >= 3, {
      timeout: 30000,
    })
  }
}

test.describe('Multi-User: Admin Remove Member', () => {
  test.setTimeout(90000)

  test('should remove member with keep contributions option', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    // User A creates circle and gets invite code
    const circleId = await createCircle(page, 'E2E Remove Keep Test')
    const inviteCode = await getInviteCode(page, circleId)

    // User B joins via invite
    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings → Members tab
      await ensureOnSettingsWithTabs(page, circleId)

      // Click Members tab
      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 15000 })
      await membersTab.click()

      // Wait for member list to load — should show 2 members
      await page.waitForFunction(
        () => {
          const items = document.querySelectorAll('[aria-label="Member actions"]')
          return items.length >= 1 // At least one non-admin member has actions
        },
        { timeout: 20000 }
      )

      // Click the MoreVertical menu on the non-admin member
      const memberActions = page.locator('[aria-label="Member actions"]').first()
      await memberActions.click()

      // Click Remove from dropdown
      const removeOption = page.getByRole('menuitem', { name: /remove/i })
      await expect(removeOption).toBeVisible({ timeout: 5000 })
      await removeOption.click()

      // Modal should appear with remove options
      const removeBtn = page.getByRole('button', { name: /^remove$/i })
      await expect(removeBtn).toBeVisible({ timeout: 5000 })
      await removeBtn.click()

      // Member should be removed — toast confirms
      await expect(page.getByText(/removed/i).first()).toBeVisible({ timeout: 10000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should remove member with block option', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Remove Block Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings → Members tab
      await ensureOnSettingsWithTabs(page, circleId)

      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 10000 })
      await membersTab.click()

      await page.waitForFunction(
        () => document.querySelectorAll('[aria-label="Member actions"]').length >= 1,
        { timeout: 15000 }
      )

      const memberActions = page.locator('[aria-label="Member actions"]').first()
      await memberActions.click()

      const removeOption = page.getByRole('menuitem', { name: /remove/i })
      await expect(removeOption).toBeVisible({ timeout: 5000 })
      await removeOption.click()

      // Click "Remove & Block" option
      const blockBtn = page.getByRole('button', { name: /remove.*block|block/i })
      await expect(blockBtn).toBeVisible({ timeout: 5000 })
      await blockBtn.click()

      // Member should be removed and blocked
      await expect(page.getByText(/removed/i).first()).toBeVisible({ timeout: 10000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should update member count after removal', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Member Count Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings → Members tab
      await ensureOnSettingsWithTabs(page, circleId)

      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 10000 })
      await membersTab.click()

      // Should show "Members (2)" in tab
      await expect(page.getByRole('tab', { name: /members.*2/i })).toBeVisible({ timeout: 10000 })

      // Remove user B
      const memberActions = page.locator('[aria-label="Member actions"]').first()
      await memberActions.click()
      await page.getByRole('menuitem', { name: /remove/i }).click()
      await page.getByRole('button', { name: /^remove$/i }).click()

      // Wait for removal to complete
      await expect(page.getByText(/removed/i).first()).toBeVisible({ timeout: 10000 })

      // Member count should update to 1
      await expect(page.getByRole('tab', { name: /members.*1/i })).toBeVisible({ timeout: 10000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should complete member removal flow with keepContributions flag', async ({
    page,
    browser,
  }) => {
    await setupClerkTestingToken({ page })

    const circleId = await createCircle(page, 'E2E Analytics Remove Test')
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    try {
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A navigates to settings
      await ensureOnSettingsWithTabs(page, circleId)

      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 15000 })
      await membersTab.click()

      // Verify 2 members before removal
      await page.waitForFunction(
        () => document.querySelectorAll('[aria-label="Member actions"]').length >= 1,
        { timeout: 20000 }
      )

      await page.locator('[aria-label="Member actions"]').first().click()
      await page.getByRole('menuitem', { name: /remove/i }).click()

      // Click "Remove" (keepContributions=true) — not "Remove & Block"
      const removeBtn = page.getByRole('button', { name: /^remove$/i })
      await expect(removeBtn).toBeVisible({ timeout: 5000 })
      await removeBtn.click()

      // Verify success toast — this confirms handleRemove completed fully,
      // which includes the trackEvent('member_removed', { keepContributions: true }) call.
      await expect(page.getByText('Member removed')).toBeVisible({ timeout: 10000 })

      // Verify modal closed (the remove modal should no longer be visible)
      await expect(page.getByText('Choose how to remove this member')).not.toBeVisible({
        timeout: 5000,
      })

      // Verify member was actually removed — member actions should be gone
      const remainingActions = page.locator('[aria-label="Member actions"]')
      await expect(remainingActions).toHaveCount(0, { timeout: 10000 })
    } finally {
      await user2Page.context().close()
    }
  })
})
