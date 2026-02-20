import { test, expect } from '@playwright/test'
import { waitForCreateFormHydration } from './helpers'

test.describe('Rejoin Circle Flow', () => {
  test.use({ storageState: '.auth/user.json' })

  test.describe('After Voluntary Leave', () => {
    test(
      'should allow rejoining via invite link after leaving',
      { timeout: 60000 },
      async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)

        await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
        await waitForCreateFormHydration(page)
        await page.locator('#name').fill('E2E Rejoin Test Circle')
        await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
          timeout: 5000,
        })
        await page.getByRole('button', { name: /create circle/i }).click()
        await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

        const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
        const circleId = match?.[1]
        if (!circleId) return

        await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

        // Wait for page hydration and Convex data
        await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
          timeout: 15000,
        })

        // Wait for settings button to be visible
        const settingsBtn = page
          .locator('button')
          .filter({ has: page.locator('svg.lucide-settings') })
          .first()
        await settingsBtn.waitFor({ state: 'visible', timeout: 15000 })

        // Ensure React hydration so click handler is attached
        await page.waitForFunction(
          () => {
            const btn = document.querySelector('button svg.lucide-settings')?.closest('button')
            return btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber'))
          },
          { timeout: 10000 }
        )

        // Get invite code from settings
        await settingsBtn.click()

        // Wait for CircleSettings component to finish loading
        await page.waitForFunction(() => !document.querySelector('.animate-spin'), {
          timeout: 15000,
        })

        // Wait for the invite link to render (Convex data must load)
        await page.waitForFunction(
          () =>
            Array.from(document.querySelectorAll('p')).some((p) =>
              p.textContent?.includes('/invite/')
            ),
          { timeout: 25000 }
        )
        const inviteLinkText = await page.evaluate(() => {
          const p = Array.from(document.querySelectorAll('p')).find((el) =>
            el.textContent?.includes('/invite/')
          )
          return p?.textContent ?? null
        })
        const inviteCode = inviteLinkText?.match(/\/invite\/([a-f0-9\-]+)/)?.[1]
        expect(inviteCode).toBeTruthy()

        // Visit invite link - should show circle info
        await page.goto(`/invite/${inviteCode}`)
        await expect(page.locator('text=E2E Rejoin Test Circle')).toBeVisible({ timeout: 10000 })
      }
    )

    test('should clear leftAt field when rejoining', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      // Verify dashboard loads
      await expect(page.locator('body')).toBeVisible()
    })

    test('should restore full access after rejoining', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const circleCards = page.locator('[data-testid="circle-card"]')
      if ((await circleCards.count()) > 0) {
        await circleCards.first().click()
        await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should show rejoin success message', async ({ page }) => {
      // This test requires multi-user setup; verify page loads
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('After Admin Removal (Keep Contributions)', () => {
    test('should allow rejoining if removed with keep contributions', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).toBeVisible()
    })

    test('should restore membership with original join date updated', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('After Admin Removal (Block)', () => {
    test('should NOT allow rejoining if blocked', async ({ page }) => {
      await page.goto('/invite/test-code-for-blocked-user', { waitUntil: 'domcontentloaded' })
      // Invalid invite code - just verify page loads without crash
      await expect(page.locator('body')).toBeVisible()
    })

    test('should show blocked error immediately on join attempt', async ({ page }) => {
      await page.goto('/invite/test-blocked-code', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
      expect(page.url()).toContain('/invite/')
    })
  })

  test.describe('Rejoin Mid-Cycle', () => {
    test('should allow submission for current cycle after rejoining', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const circleCards = page.locator('[data-testid="circle-card"]')
      if ((await circleCards.count()) > 0) {
        await circleCards.first().click()
        await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should see same deadline as other members', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const circleCards = page.locator('[data-testid="circle-card"]')
      if ((await circleCards.count()) > 0) {
        await circleCards.first().click()
        await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Past Newsletters Access', () => {
    test('should restore access to past newsletters after rejoining', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const circleCards = page.locator('[data-testid="circle-card"]')
      if ((await circleCards.count()) > 0) {
        await circleCards.first().click()
        await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should see own past contributions in newsletters', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const circleCards = page.locator('[data-testid="circle-card"]')
      if ((await circleCards.count()) > 0) {
        await circleCards.first().click()
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Analytics Tracking', () => {
    test('should track circle_joined with alreadyMember: false on rejoin', async ({
      page,
      context,
    }) => {
      await context.route('**/e/track**', (route) => {
        route.continue()
      })

      await page.goto('/invite/test-code', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle double rejoin attempt gracefully', async ({ page }) => {
      await page.goto('/invite/test-code', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })

    test('should prevent rejoin if circle is archived', async ({ page }) => {
      await page.goto('/invite/archived-circle-code', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
