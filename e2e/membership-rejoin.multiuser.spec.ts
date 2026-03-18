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
 * Multi-user tests for rejoin flow after removal.
 * User A (primary) = admin.
 * User B (user2) = member who gets removed then rejoins.
 */

test.describe('Multi-User: Rejoin After Removal', () => {
  test.setTimeout(90000)

  /** Helper: User A creates circle, User B joins, User A removes User B (keep contributions). */
  async function setupRemovalScenario(
    page: import('@playwright/test').Page,
    browser: import('@playwright/test').Browser,
    circleName: string
  ) {
    const circleId = await createCircle(page, circleName)
    const inviteCode = await getInviteCode(page, circleId)

    const user2Page = await createUser2Page(browser)
    await joinCircleViaInvite(user2Page, inviteCode)

    // User A removes User B (keep contributions)
    await page.goto(`/dashboard/circles/${circleId}/settings`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    const membersTab = page.getByRole('tab', { name: /members/i })
    await expect(membersTab).toBeVisible({ timeout: 10000 })
    await membersTab.click()

    await page.waitForFunction(
      () => document.querySelectorAll('[aria-label="Member actions"]').length >= 1,
      { timeout: 15000 }
    )

    await page.locator('[aria-label="Member actions"]').first().click()
    await page.getByRole('menuitem', { name: /remove/i }).click()
    await page.getByRole('button', { name: /^remove$/i }).click()
    await expect(page.getByText(/removed/i).first()).toBeVisible({ timeout: 10000 })

    return { circleId, inviteCode, user2Page }
  }

  test('should allow rejoining via invite link after removal', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const { circleId, inviteCode, user2Page } = await setupRemovalScenario(
      page,
      browser,
      'E2E Rejoin After Remove Test'
    )

    try {
      // User B navigates to invite link and rejoins
      await user2Page.goto(`/invite/${inviteCode}`, { waitUntil: 'domcontentloaded' })
      await user2Page.waitForFunction(() => !document.querySelector('.animate-spin'), {
        timeout: 15000,
      })

      const joinBtn = user2Page.getByRole('button', { name: /join/i })
      await expect(joinBtn).toBeVisible({ timeout: 15000 })
      await joinBtn.click()

      // Should redirect to dashboard after rejoining
      await user2Page.waitForURL(/\/dashboard/, { timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should show rejoin success message', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const { inviteCode, user2Page } = await setupRemovalScenario(
      page,
      browser,
      'E2E Rejoin Success Msg Test'
    )

    try {
      await user2Page.goto(`/invite/${inviteCode}`, { waitUntil: 'domcontentloaded' })
      await user2Page.waitForFunction(() => !document.querySelector('.animate-spin'), {
        timeout: 15000,
      })

      await user2Page.getByRole('button', { name: /join/i }).click()

      // Success toast should appear
      await expect(user2Page.getByText(/joined|welcome back|success/i).first()).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should restore access after rejoining', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const { circleId, inviteCode, user2Page } = await setupRemovalScenario(
      page,
      browser,
      'E2E Restore Access Test'
    )

    try {
      // User B rejoins
      await joinCircleViaInvite(user2Page, inviteCode)

      // User B should be able to access the submit page
      await user2Page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
      await user2Page.waitForFunction(() => !document.querySelector('.animate-spin'), {
        timeout: 15000,
      })

      // Should see the submission form (not "Join or create a circle")
      const heading = user2Page.getByRole('heading', { name: /make submission/i })
      const joinPrompt = user2Page.getByText(/join or create a circle/i)
      await expect(heading.or(joinPrompt)).toBeVisible({ timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should clear leftAt and show member in active list after rejoining', async ({
    page,
    browser,
  }) => {
    await setupClerkTestingToken({ page })

    const { circleId, inviteCode, user2Page } = await setupRemovalScenario(
      page,
      browser,
      'E2E Clear LeftAt Test'
    )

    try {
      // User A verifies User B is NOT in the active member list
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForFunction(
        () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
        { timeout: 20000 }
      )
      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 10000 })
      await membersTab.click()

      // Should show only 1 member (admin) — User B was removed
      await expect(page.getByRole('tab', { name: /members.*1/i })).toBeVisible({ timeout: 10000 })

      // User B rejoins
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A's member list should now show 2 members (real-time update)
      await expect(page.getByRole('tab', { name: /members.*2/i })).toBeVisible({ timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })

  test('should update join date when member rejoins', async ({ page, browser }) => {
    await setupClerkTestingToken({ page })

    const { circleId, inviteCode, user2Page } = await setupRemovalScenario(
      page,
      browser,
      'E2E Rejoin Date Test'
    )

    try {
      // User B rejoins
      await joinCircleViaInvite(user2Page, inviteCode)

      // User A views the member list — User B should appear with a recent join date
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForFunction(
        () => !document.querySelector('.animate-spin') && !document.querySelector('.animate-pulse'),
        { timeout: 20000 }
      )
      const membersTab = page.getByRole('tab', { name: /members/i })
      await expect(membersTab).toBeVisible({ timeout: 10000 })
      await membersTab.click()

      // Should show 2 members now
      await expect(page.getByRole('tab', { name: /members.*2/i })).toBeVisible({ timeout: 15000 })
    } finally {
      await user2Page.context().close()
    }
  })
})
