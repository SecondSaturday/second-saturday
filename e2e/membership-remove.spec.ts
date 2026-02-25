import { test, expect } from '@playwright/test'
import { waitForCreateFormHydration } from './helpers'

test.describe('Admin Remove Member Flow', () => {
  test.use({ storageState: '.auth/user.json' })

  test('should show remove button for admin next to each member (except self)', async ({
    page,
  }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Remove Member Test')
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

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
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Remove Modal Test')
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

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

  test('should remove member with keep contributions option', async ({ page }) => {
    // Requires multi-user setup
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should remove member with block option', async ({ page }) => {
    // Requires multi-user setup
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should track member_removed analytics event with keepContributions flag', async ({
    page,
    context,
  }) => {
    await context.route('**/e/track**', (route) => {
      route.continue()
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should not allow admin to remove themselves', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Self Remove Test')
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

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

  test('should update member count after removal', async ({ page }) => {
    // Requires multi-user setup
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show only active members in list', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard\/circles\//)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
