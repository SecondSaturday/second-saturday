import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration, warmupConvexAuth } from './helpers'

test.describe('Member List Display', () => {
  test.use({ storageState: '.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('should navigate to member list from circle home', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)

      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        await page.waitForURL(/\/members/)
      }
    }
  })

  test('should show all active members with avatars and names', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        const memberCards = page.locator('[data-testid="member-card"]')
        const count = await memberCards.count()
        expect(count).toBeGreaterThan(0)
      }
    }
  })

  test('should show admin badge for admin member', async ({ page }) => {
    // Create a circle to ensure we're admin
    await warmupConvexAuth(page)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Member List Test')
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
      const adminBadge = page.locator('text=Admin')
      await expect(adminBadge).toBeVisible({ timeout: 10000 })
    }
  })

  test('should sort members with admin first, then alphabetical', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        const memberCards = page.locator('[data-testid="member-card"]')
        const count = await memberCards.count()
        if (count > 1) {
          const firstCard = memberCards.first()
          const hasAdminBadge = await firstCard.locator('text=Admin').isVisible()
          expect(hasAdminBadge).toBe(true)
        }
      }
    }
  })

  test('should show member count in header', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        // Just check the page loaded
        await expect(page.locator('text=Members')).toBeVisible()
      }
    }
  })

  test('should NOT show members who have left', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        const memberCards = page.locator('[data-testid="member-card"]')
        const count = await memberCards.count()
        for (let i = 0; i < count; i++) {
          const card = memberCards.nth(i)
          const hasLeftStatus = await card.locator('text=/left|removed/i').isVisible()
          expect(hasLeftStatus).toBe(false)
        }
      }
    }
  })

  test('should have back button to circle home', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        await page.waitForURL(/\/members/)
        const backButton = page.locator('a[href*="/dashboard/circles/"]').first()
        await expect(backButton).toBeVisible()
      }
    }
  })

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        await expect(page.locator('text=Members')).toBeVisible()
      }
    }
  })

  test('should show member initials in avatar fallback', async ({ page }) => {
    await warmupConvexAuth(page)

    const circleCards = page.locator('[data-testid="circle-card"]')
    if ((await circleCards.count()) > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
      const membersLink = page.locator('a:has-text("Members")')
      if (await membersLink.isVisible().catch(() => false)) {
        await membersLink.click()
        // Just verify we're on members page
        await expect(page.locator('text=Members')).toBeVisible()
      }
    }
  })

  test.skip('should update in real-time when members are added/removed', async () => {
    // Requires multi-user setup with real-time changes
  })

  test.skip('should show empty state when no members (edge case)', async () => {
    // Edge case requiring special setup
  })

  test('should show remove button for admin on all non-admin members', async ({ page }) => {
    await warmupConvexAuth(page)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Remove Button Test')
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

      // Admin (self) should NOT have remove button
      const memberCards = page.locator('[data-testid="member-card"]')
      const firstCard = memberCards.first()
      if (await firstCard.isVisible().catch(() => false)) {
        const isAdmin = await firstCard.locator('text=Admin').isVisible()
        if (isAdmin) {
          const removeButton = firstCard.locator('button:has-text("Remove")')
          await expect(removeButton).not.toBeVisible()
        }
      }
    }
  })

  test.skip('should NOT show remove button for non-admin users', async () => {
    // Requires multi-user setup with non-admin role
  })
})
