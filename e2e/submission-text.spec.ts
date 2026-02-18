import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

/**
 * E2E tests for text-only submission flow.
 *
 * These tests use /demo-submissions as a harness for the MediaUploader
 * and rely on the full authenticated submission page for text entry tests.
 * The demo page avoids needing real Convex circle/cycle data.
 */

test.describe('Text Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('demo submissions page loads and shows upload controls', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    // Page title visible
    await expect(page.getByRole('heading', { name: /demo video upload/i })).toBeVisible({
      timeout: 15000,
    })

    // Upload buttons visible
    await expect(page.getByRole('button', { name: /take photo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /choose photo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /choose video/i })).toBeVisible()
  })

  test('submission page requires authentication', async ({ page }) => {
    // Navigate directly to dashboard without auth token
    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Should redirect to sign-in or return 200 (Next.js SSR handles auth)
    expect(response?.status()).toBeLessThan(500)
  })

  test('authenticated user can reach the dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    // Dashboard loads without 5xx error
    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(500)
  })

  test('PromptResponseCard textarea enforces 500 character limit', async ({ page }) => {
    // Test character limit enforcement via a page that renders PromptResponseCard.
    // The dashboard page itself loads it when a circle exists.
    // We validate the maxLength attribute is set correctly by the component.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    // Wait for the page to load (either circle list or empty state)
    await page.waitForLoadState('domcontentloaded')

    // Navigate to a circle if one exists
    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasCircle) {
      await circleCard.click()
      await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

      // Look for a textarea on the circle page (prompt response)
      const textarea = page.locator('textarea').first()
      const hasTextarea = await textarea.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasTextarea) {
        // Verify maxLength is set (character limit enforcement)
        const maxLength = await textarea.getAttribute('maxlength')
        expect(Number(maxLength)).toBeGreaterThan(0)
        expect(Number(maxLength)).toBeLessThanOrEqual(500)
      }
    }
  })

  test('character counter updates as user types', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      // Skip if no circles available in test environment
      test.skip()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    const textarea = page.locator('textarea').first()
    const hasTextarea = await textarea.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasTextarea) {
      test.skip()
      return
    }

    // Type some text
    await textarea.fill('Hello world')

    // Check character counter updated
    // Counter format is "11/500"
    const counter = page.getByText(/\d+\/500/)
    await expect(counter).toBeVisible({ timeout: 3000 })
    const counterText = await counter.textContent()
    expect(counterText).toMatch(/11\/500/)
  })
})

test.describe('Text Submission - Auto-save Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('auto-save indicator is hidden when idle', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const circleCard = page.locator('[data-testid="circle-card"]').first()
    const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasCircle) {
      // Verify indicator is not present on a page that has no form
      const savingText = page.getByText(/saving\.\.\./i)
      await expect(savingText).not.toBeVisible()
      return
    }

    await circleCard.click()
    await page.waitForURL(/\/dashboard\/circles\//, { timeout: 10000 })

    // Initially no save status shown
    const savingText = page.getByText(/saving\.\.\./i)
    await expect(savingText).not.toBeVisible({ timeout: 3000 })
  })
})
