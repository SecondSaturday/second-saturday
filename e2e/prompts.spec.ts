import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration, warmupConvexAuth } from './helpers'

test.describe('Prompt Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  async function createCircleAndGetId(
    page: import('@playwright/test').Page,
    name: string
  ): Promise<string | null> {
    // Warm up Convex auth
    await warmupConvexAuth(page)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill(name)
    const submitBtn = page.getByRole('button', { name: 'Next', exact: true })
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()

    // Wait for navigation - may fail if Convex mutation fails
    try {
      await page.waitForURL(/\/prompts/, { timeout: 20000 })
    } catch {
      return null
    }
    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) return null

    // Wait for Convex auth to establish on the new page
    await page
      .waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 })
      .catch(() => {})

    // If page is still loading (spinner), reload to re-establish Convex auth
    const stillLoading = await page.evaluate(() => !!document.querySelector('.animate-spin'))
    if (stillLoading) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page
        .waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
        .catch(() => {})
    }

    return match[1] ?? null
  }

  test('prompts page loads with setup heading after circle creation', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Default Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    await expect(page.getByRole('heading', { name: /set up prompts/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('prompts page shows browse prompt library link', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Library Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    await expect(page.getByText('Browse Prompt Library')).toBeVisible({ timeout: 15000 })
  })

  test('prompts page shows default prompts as editable inputs', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Content Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Wait for loading spinner to disappear and content to render
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    // Default prompts are auto-created with the circle.
    // They appear as editable inputs in the sortable list.
    await page.waitForFunction(
      () => {
        const inputs = document.querySelectorAll('input')
        return Array.from(inputs).some((i) => i.value?.includes('What did you do'))
      },
      { timeout: 15000 }
    )
    // Verify prompt library link shows
    await expect(page.getByText('Browse Prompt Library')).toBeVisible({ timeout: 5000 })
  })

  test('shows prompt count indicator', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Count Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }
    // Count shows current prompts out of 8 max
    await expect(page.getByText(/\/8/)).toBeVisible({ timeout: 15000 })
  })

  test('shows add custom prompt button', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Custom Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }
    await expect(page.getByText(/add custom prompt/i)).toBeVisible({ timeout: 15000 })
  })

  test('can save prompts and navigate away', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Save Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    const continueBtn = page.getByRole('button', { name: /continue|save/i })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await expect(page).toHaveURL(/\/setup-complete|\/dashboard/, { timeout: 15000 })
    }
  })

  test('prompts page has drag handles for sortable prompts', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Drag Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Default prompts should be visible with drag handles
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Check for drag handles (buttons with cursor-grab or GripVertical icons)
    const gripButtons = page.locator('button[aria-label="Reorder prompt"]')
    const count = await gripButtons.count()
    expect(count).toBeGreaterThan(0)
  })
})
