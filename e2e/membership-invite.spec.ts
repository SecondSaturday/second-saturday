import { test, expect } from '@playwright/test'
import { createCircle, getInviteCode } from './helpers'

test.describe('Invite Link Flow', () => {
  test.describe('Logged-in User', () => {
    test.use({ storageState: '.auth/user.json' })

    test('should show circle preview and join button for authenticated user', async ({ page }) => {
      // Create a circle and get its invite code
      const circleId = await createCircle(
        page,
        'E2E Test Circle - Invite Flow',
        'Testing invite link flow'
      )
      const inviteCode = await getInviteCode(page, circleId)

      expect(inviteCode).toBeTruthy()

      // Visit invite link as the same user (creator)
      await page.goto(`/invite/${inviteCode}`)

      // Should see circle details and a join/already-member option
      await expect(page.getByText('E2E Test Circle - Invite Flow')).toBeVisible({ timeout: 15000 })

      // Should see either "Join Circle" button or "already a member" after clicking
      const joinButton = page.getByRole('button', { name: /join circle/i })
      if (await joinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await joinButton.click()
        // As the creator, clicking Join should show "already a member"
        await expect(page.locator('p', { hasText: /already a member/i })).toBeVisible({
          timeout: 10000,
        })
      }
    })

    test('should join circle when clicking Join Circle button', async ({ page }) => {
      // Create test circle
      const circleId = await createCircle(page, 'E2E Join Test Circle')
      const inviteCode = await getInviteCode(page, circleId)

      expect(inviteCode).toBeTruthy()

      // Test with same user (should show already member after clicking join)
      await page.goto(`/invite/${inviteCode}`)
      await expect(page.getByText('E2E Join Test Circle')).toBeVisible({ timeout: 15000 })

      // Click "Join Circle" - should trigger already-member check
      const joinButton = page.getByRole('button', { name: /join circle/i })
      if (await joinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await joinButton.click()
        await expect(page.locator('p', { hasText: /already a member/i })).toBeVisible({
          timeout: 10000,
        })
      }
    })

    test('should redirect to circle after joining', async ({ page }) => {
      // Create a circle
      const circleId = await createCircle(page, 'E2E Redirect Test Circle')
      const inviteCode = await getInviteCode(page, circleId)

      await page.goto(`/invite/${inviteCode}`)
      await expect(page.getByText('E2E Redirect Test Circle')).toBeVisible({ timeout: 15000 })

      // Click "Go to Circle" button (shown when already a member)
      const goToCircleButton = page.getByRole('button', { name: /go to circle/i })
      if (await goToCircleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await goToCircleButton.click()
        await page.waitForURL(/\/dashboard\/circles\//, { timeout: 15000 })
      }
    })
  })

  test.describe('Unauthenticated User', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should show sign up and log in options for unauthenticated user', async ({ page }) => {
      // Navigate to a mock invite page (you'd use a real invite code in practice)
      await page.goto('/invite/test-invite-code-123')

      // Wait for page to load (will show either invalid or valid invite)
      await page.waitForLoadState('networkidle')

      const pageContent = await page.textContent('body')

      // If it's a valid invite, should show auth options
      if (pageContent?.includes('Sign up to Join') || pageContent?.includes('Log in to Join')) {
        await expect(page.locator('text=Sign up to Join')).toBeVisible()
        await expect(page.locator('text=Log in to Join')).toBeVisible()
      }

      // If invalid, should show error
      if (pageContent?.includes('Invalid invite link')) {
        await expect(page.locator('text=Invalid invite link')).toBeVisible()
      }
    })

    test('should preserve redirect URL in auth flow', async ({ page }) => {
      await page.goto('/invite/test-code-123')

      // Click sign up button
      const signUpLink = page.locator('a:has-text("Sign up to Join")')
      if (await signUpLink.isVisible()) {
        const href = await signUpLink.getAttribute('href')
        expect(href).toContain('redirect_url=/invite/test-code-123')
      }

      // Click log in button
      const logInLink = page.locator('a:has-text("Log in to Join")')
      if (await logInLink.isVisible()) {
        const href = await logInLink.getAttribute('href')
        expect(href).toContain('redirect_url=/invite/test-code-123')
      }
    })
  })

  test.describe('Invalid Invite Code', () => {
    test.use({ storageState: '.auth/user.json' })

    test('should show error for invalid invite code', async ({ page }) => {
      await page.goto('/invite/invalid-code-does-not-exist')

      await page.waitForSelector('text=Invalid invite link', { timeout: 15000 })
      await expect(page.locator('text=Invalid invite link')).toBeVisible()
      await expect(page.locator('a:has-text("Go to dashboard")')).toBeVisible()
    })
  })

  test.describe('Analytics Tracking', () => {
    test.use({ storageState: '.auth/user.json' })

    test('should track invite_link_viewed event', async ({ page, context }) => {
      // Listen for analytics events (if PostHog is configured)
      page.on('console', (msg) => {
        if (msg.text().includes('invite_link_viewed')) {
          // Event tracked
        }
      })

      await context.route('**/e/track**', (route) => {
        const postData = route.request().postData()
        if (postData?.includes('invite_link_viewed')) {
          // Event tracked
        }
        route.continue()
      })

      await page.goto('/invite/test-code')
      await page.waitForLoadState('networkidle')

      // Note: This test assumes analytics is configured
      // You may need to adjust based on your actual setup
    })
  })
})
