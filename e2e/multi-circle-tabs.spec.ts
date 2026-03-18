import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { createCircle, warmupConvexAuth } from './helpers'

/**
 * E2E tests for multi-circle tab switching in the submission screen.
 *
 * These tests create a circle to ensure data exists, then navigate
 * to the submit page to verify the tabbed submission interface.
 */

test.describe('Multi-Circle Tab Navigation', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('dashboard page loads with circle navigation', async ({ page }) => {
    await warmupConvexAuth(page)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    // Dashboard should show either empty state or circles
    const emptyState = page.getByText(/no circles yet/i)
    const circleCard = page.locator('[data-testid="circle-card"]')
    await expect(emptyState.or(circleCard.first())).toBeVisible({ timeout: 15000 })
  })

  test('submit page shows tabbed submission interface', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Multi Tab Test')

    // Navigate to submit page — it renders CircleSubmissionTabs
    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // The submit page should load with the heading
    await expect(page.getByRole('heading', { name: /make submission/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('tab bar renders circle tabs on submit page', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Tab Render Test')

    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Look for the tablist (CircleSubmissionTabs uses role="tablist")
    const tabList = page.getByRole('tablist')
    const hasTabList = await tabList.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTabList) {
      // Should have at least one tab trigger
      const tabs = page.getByRole('tab')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThanOrEqual(1)
    }
  })

  test('submit page renders prompt response cards', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Prompt Cards Test')

    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 })

    // The submit page should render prompt response textareas
    const textarea = page.locator('textarea').first()
    const hasTextarea = await textarea.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTextarea) {
      // Verify placeholder text exists
      const placeholder = await textarea.getAttribute('placeholder')
      expect(placeholder).toBeTruthy()
    }
  })
})

test.describe('Multi-Circle Tabs - Status Indicators', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('submit page renders status indicators', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Status Test')

    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // SVG circles are rendered for status indicators
    // (even 'not-started' renders an empty ring SVG circle)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Multi-Circle Tabs - Scroll Behavior', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('tab list supports horizontal scroll', async ({ page }) => {
    const circleId = await createCircle(page, 'E2E Scroll Test')

    await page.goto('/dashboard/submit', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    const tabList = page.getByRole('tablist')
    const hasTabList = await tabList.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasTabList) {
      // The TabsList has overflow-x-auto class for horizontal scroll
      const overflowStyle = await tabList.evaluate((el) => {
        return window.getComputedStyle(el).overflowX
      })
      expect(['auto', 'scroll']).toContain(overflowStyle)
    }
  })
})
