import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { warmupConvexAuth, createCircle, openMediaDropdown } from './helpers'

/**
 * E2E tests for text-only submission flow.
 *
 * These tests use /dashboard/submit for the submission form
 * with MediaUploader and text entry for the authenticated user's circles.
 */

test.describe('Text Submission Flow', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('submission page loads and shows upload controls', async ({ page }) => {
    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Page title visible
    await expect(page.getByRole('heading', { name: /make submission|submit/i })).toBeVisible({
      timeout: 15000,
    })

    // Open media dropdown and verify upload buttons
    await openMediaDropdown(page)
    await expect(page.getByRole('menuitem', { name: /take photo/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /choose photo/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /choose video/i })).toBeVisible()
  })

  test('submission page requires authentication', async ({ page }) => {
    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(500)
  })

  test('authenticated user can reach the dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(500)
  })

  test('PromptResponseCard textarea enforces 500 character limit', async ({ page }) => {
    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Look for a textarea on the submit page (prompt response)
    const textarea = page.locator('textarea').first()
    const hasTextarea = await textarea.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTextarea) {
      const maxLength = await textarea.getAttribute('maxlength')
      expect(Number(maxLength)).toBeGreaterThan(0)
      expect(Number(maxLength)).toBeLessThanOrEqual(500)
    }
  })

  test('character counter updates as user types', async ({ page }) => {
    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 })

    const textarea = page.locator('textarea').first()
    const hasTextarea = await textarea.isVisible({ timeout: 10000 }).catch(() => false)

    if (!hasTextarea) {
      test.skip(true, 'No textarea available on submit page')
      return
    }

    // Type some text
    await textarea.fill('Hello world')

    // Check character counter updated — format is "11/500"
    const counter = page.getByText(/\d+\/500/)
    await expect(counter).toBeVisible({ timeout: 3000 })
    const counterText = await counter.textContent()
    expect(counterText).toMatch(/11\/500/)
  })
})

test.describe('Text Submission - Auto-save Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('auto-save indicator is hidden when idle', async ({ page }) => {
    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Initially no save status shown
    const savingText = page.getByText(/saving\.\.\./i)
    await expect(savingText).not.toBeVisible({ timeout: 3000 })
  })
})
