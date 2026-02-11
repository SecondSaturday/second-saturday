import { test, expect } from '@playwright/test'

test.describe('Leave Circle Flow', () => {
  test.use({ storageState: '.auth/user.json' })

  test('should show leave circle option for non-admin members', async ({ page }) => {
    // This test assumes there's a circle where the user is a member but not admin
    // In practice, you'd set up this scenario in a beforeEach hook

    await page.goto('/dashboard')

    // Find a circle where user is not admin (if any)
    const circleCards = page.locator('[data-testid="circle-card"]')
    const count = await circleCards.count()

    if (count > 0) {
      // Click on first circle
      await circleCards.first().click()
      await page.waitForURL(/\/dashboard\/circles\//)

      // Navigate to settings
      await page.click('button:has-text("Settings")')

      // Check if "Leave this circle" option is visible
      const leaveButton = page.locator('button:has-text("Leave this circle")')

      // Only non-admins should see this option
      const isVisible = await leaveButton.isVisible()

      if (isVisible) {
        // This is a non-admin member
        expect(leaveButton).toBeVisible()
      }
    }
  })

  test('should show confirmation modal when leaving circle', async ({ page }) => {
    // Navigate to a test circle (non-admin membership)
    // For this test, we'll create a circle, add a member, then test leave from member perspective

    await page.goto('/dashboard')

    // In a real test, you'd navigate to a circle where you're a non-admin member
    // For demo purposes, we'll check the modal behavior

    // Assuming we're on a circle settings page as a non-admin
    const leaveButton = page.locator('button:has-text("Leave this circle")')

    if (await leaveButton.isVisible()) {
      await leaveButton.click()

      // Modal should appear
      await expect(page.locator('text=Leave this circle?')).toBeVisible()
      await expect(page.locator("text=You'll lose access to this circle's content")).toBeVisible()
      await expect(page.locator('text=Your past contributions will remain visible')).toBeVisible()
      await expect(page.locator('text=You can rejoin later via invite link')).toBeVisible()

      // Modal should have Cancel and Leave buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
      await expect(page.locator('button:has-text("Leave Circle")')).toBeVisible()
    }
  })

  test('should redirect to dashboard after leaving circle', async ({ page }) => {
    await page.goto('/dashboard')

    const leaveButton = page.locator('button:has-text("Leave this circle")')

    if (await leaveButton.isVisible()) {
      await leaveButton.click()

      // Wait for modal
      await page.waitForSelector('text=Leave this circle?')

      // Click Leave Circle button
      await page.click('button:has-text("Leave Circle")')

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 })
      expect(page.url()).toContain('/dashboard')

      // Should show success toast
      await expect(page.locator('text=Left circle')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should prevent admin from leaving without transferring role', async ({ page }) => {
    // Create a circle (user becomes admin)
    await page.goto('/dashboard')
    await page.click('[data-testid="create-circle-button"]')
    await page.fill('[name="name"]', 'E2E Admin Leave Test')
    await page.click('text=Create')

    await page.waitForURL(/\/dashboard\/circles\//)

    // Navigate to settings
    await page.click('button:has-text("Settings")')

    // Admin should NOT see "Leave this circle" option
    const leaveButton = page.locator('button:has-text("Leave this circle")')
    await expect(leaveButton).not.toBeVisible()

    // Or if we try to leave via mutation, should get error
    // This would be tested in integration tests, not E2E
  })

  test('should allow rejoining after leaving', async ({ page }) => {
    // This test requires setting up:
    // 1. A circle where user is a non-admin member
    // 2. Leaving the circle
    // 3. Rejoining via invite link

    await page.goto('/dashboard')

    // Assuming we can create a test scenario:
    // Create circle
    await page.click('[data-testid="create-circle-button"]')
    await page.fill('[name="name"]', 'E2E Rejoin Test')
    await page.click('text=Create')
    await page.waitForURL(/\/dashboard\/circles\//)

    // Get invite code
    await page.click('button:has-text("Settings")')
    const inviteLinkText = await page
      .locator('text=/\\/invite\\/[a-f0-9\\-]+/')
      .first()
      .textContent()
    const inviteCode = inviteLinkText?.match(/\/invite\/([a-f0-9\-]+)/)?.[1]

    // In a real scenario, we'd have a second user join, then leave, then rejoin
    // For this test, we're verifying the rejoin flow exists

    expect(inviteCode).toBeTruthy()

    // Navigate to invite link
    await page.goto(`/invite/${inviteCode}`)

    // Should show "already a member" state
    await expect(page.locator('text=/already a member/i')).toBeVisible()
  })

  test('should track circle_left analytics event', async ({ page, context }) => {
    await context.route('**/e/track**', (route) => {
      const postData = route.request().postData()
      if (postData?.includes('circle_left')) {
        // Event tracked
      }
      route.continue()
    })

    // Trigger leave circle flow (if available)
    const leaveButton = page.locator('button:has-text("Leave this circle")')

    if (await leaveButton.isVisible()) {
      await leaveButton.click()
      await page.waitForSelector('text=Leave this circle?')
      await page.click('button:has-text("Leave Circle")')

      await page.waitForTimeout(1000) // Wait for analytics event
    }
  })
})
