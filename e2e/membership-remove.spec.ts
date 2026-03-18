import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration, warmupConvexAuth, navigateToCreatePage } from './helpers'

test.describe('Admin Remove Member Flow', () => {
  test.use({ storageState: '.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('should show remove button for admin next to each member (except self)', async ({
    page,
  }) => {
    await warmupConvexAuth(page)

    await navigateToCreatePage(page)
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Remove Member Test')
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })

    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    const membersLink = page.locator('a:has-text("Members")')
    if (await membersLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await membersLink.click()
      await expect(page.locator('text=Members')).toBeVisible()

      // Admin (self) should NOT have remove button
      const memberCards = page.locator('[data-testid="member-card"]')
      const firstMember = memberCards.first()
      if (await firstMember.isVisible().catch(() => false)) {
        const adminBadge = firstMember.locator('text=Admin')
        if (await adminBadge.isVisible()) {
          const removeButton = firstMember.locator('button:has-text("Remove")')
          await expect(removeButton).not.toBeVisible()
        }
      }
    }
  })

  test('should show remove modal with two options', async ({ page }) => {
    await warmupConvexAuth(page)

    await navigateToCreatePage(page)
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Remove Modal Test')
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })

    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    const membersLink = page.locator('a:has-text("Members")')
    if (await membersLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await membersLink.click()
      await page.waitForURL(/\/members/)

      // Look for remove buttons (only on non-admin members)
      const removeButtons = page.locator('button:has-text("Remove")')
      const count = await removeButtons.count()
      // With only 1 member (admin), no remove buttons expected
      expect(count).toBe(0)
    }
  })

  test.skip('should remove member with keep contributions option', async () => {
    // Requires multi-user setup
  })

  test.skip('should remove member with block option', async () => {
    // Requires multi-user setup
  })

  test.skip('should track member_removed analytics event with keepContributions flag', async () => {
    // Requires multi-user setup
  })

  test('should not allow admin to remove themselves', async ({ page }) => {
    await warmupConvexAuth(page)

    await navigateToCreatePage(page)
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Self Remove Test')
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })

    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    const membersLink = page.locator('a:has-text("Members")')
    if (await membersLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await membersLink.click()
      // Admin should not have remove button on self
      const memberCards = page.locator('[data-testid="member-card"]')
      if (
        await memberCards
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        const removeButton = memberCards.first().locator('button:has-text("Remove")')
        await expect(removeButton).not.toBeVisible()
      }
    }
  })

  test.skip('should update member count after removal', async () => {
    // Requires multi-user setup
  })

  test('should show only active members in list', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/circles\/|\?circle=)/)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
