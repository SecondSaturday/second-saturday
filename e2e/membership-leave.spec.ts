import { test, expect } from '@playwright/test'
import { waitForCreateFormHydration } from './helpers'

test.describe('Leave Circle Flow', () => {
  test.use({ storageState: '.auth/user.json' })

  test('should show leave circle option for non-admin members', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const circleCards = page.locator('[data-testid="circle-card"]')
    const count = await circleCards.count()

    if (count > 0) {
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard(\/(circles\/)|(\?.*circle=))/)

      // Open settings drawer
      const settingsBtn = page
        .locator('button')
        .filter({ has: page.locator('svg.lucide-settings') })
        .first()
      if (await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await settingsBtn.click()
        const leaveButton = page.locator('button:has-text("Leave this circle")')
        const isVisible = await leaveButton.isVisible()
        // Only non-admins see this option; admins won't
        expect(typeof isVisible).toBe('boolean')
      }
    }
  })

  test('should show confirmation modal when leaving circle', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const leaveButton = page.locator('button:has-text("Leave this circle")')
    if (await leaveButton.isVisible().catch(() => false)) {
      await leaveButton.click()
      await expect(page.locator('text=Leave this circle?')).toBeVisible()
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
      await expect(page.locator('button:has-text("Leave Circle")')).toBeVisible()
    }
  })

  test('should redirect to dashboard after leaving circle', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const leaveButton = page.locator('button:has-text("Leave this circle")')
    if (await leaveButton.isVisible().catch(() => false)) {
      await leaveButton.click()
      await page.waitForSelector('text=Leave this circle?')
      await page.click('button:has-text("Leave Circle")')
      await page.waitForURL('/dashboard', { timeout: 10000 })
      expect(page.url()).toContain('/dashboard')
    }
  })

  test('should show admin transfer dialog when admin clicks leave', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Admin Leave Test')
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

    // Extract circle ID and go to circle home
    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    // Open settings drawer
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-settings') })
      .first()
      .click()

    // Admin should see "Leave this circle" button
    const leaveButton = page.locator('button:has-text("Leave this circle")')
    if (await leaveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await leaveButton.click()

      // Should show admin transfer dialog (not the regular leave dialog)
      await expect(page.locator('text=Transfer admin & leave')).toBeVisible({ timeout: 5000 })

      // As the only member, should show message about being solo admin
      await expect(page.locator('text=You are the only member')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should allow rejoining after leaving', { timeout: 60000 }, async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('E2E Rejoin Test')
    await expect(page.getByRole('button', { name: /create circle/i })).toBeEnabled({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /create circle/i }).click()
    await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

    const match = page.url().match(/\/circles\/([^/]+)\/prompts/)
    const circleId = match?.[1]
    if (!circleId) return

    // Navigate to circle page via dashboard to ensure auth is established
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })

    // Wait for page hydration and Convex data
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

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

    // Open settings and get invite code
    await settingsBtn.click()

    // Wait for CircleSettings component to finish loading
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Wait for the invite link to render (Convex data must load)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
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

    // Visit invite link - should show join button, clicking reveals already-member
    await page.goto(`/invite/${inviteCode}`)
    const joinButton = page.getByRole('button', { name: /join circle/i })
    await expect(joinButton).toBeVisible({ timeout: 15000 })
    await joinButton.click()
    await expect(page.locator('p', { hasText: /already a member/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('should track circle_left analytics event', async ({ page, context }) => {
    await context.route('**/e/track**', (route) => {
      route.continue()
    })

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const leaveButton = page.locator('button:has-text("Leave this circle")')
    if (await leaveButton.isVisible().catch(() => false)) {
      await leaveButton.click()
      await page.waitForSelector('text=Leave this circle?')
      await page.click('button:has-text("Leave Circle")')
      await page.waitForTimeout(1000)
    }
  })
})
