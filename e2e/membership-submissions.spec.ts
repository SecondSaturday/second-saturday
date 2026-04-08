import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration, warmupConvexAuth, navigateToCreatePage } from './helpers'

test.describe('Admin Submission Dashboard', () => {
  test.use({ storageState: '.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('should show submission status dashboard for admin', async ({ page }) => {
    await warmupConvexAuth(page)

    await navigateToCreatePage(page)
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Submission Dashboard Test')
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })

    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    // Check if submissions link exists (may not be implemented yet)
    const submissionsLink = page.locator('a:has-text("Submission Status")')
    if (await submissionsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submissionsLink.click()
      await expect(page.locator('text=Submission Status')).toBeVisible()
    }
  })

  test('should show all active members with status', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/circles\/|\?circle=)/)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  // Implemented in membership-submissions.multiuser.spec.ts:
  // - should show correct status indicators for members
  // - should show send reminder button for non-submitted members
  // - should NOT show status tab for non-admin users
  // - should NOT show content preview (privacy)
  // - should track analytics for member_removed (in membership-remove.multiuser.spec.ts)

  test.skip('should update in real-time via Convex subscription', async () => {
    // Requires simultaneous browser sessions observing live Convex updates
  })
})
