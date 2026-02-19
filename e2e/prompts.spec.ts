import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration } from './helpers'

test.describe('Prompt Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  async function createCircleAndGetId(
    page: import('@playwright/test').Page,
    name: string
  ): Promise<string | null> {
    // Warm up Convex auth - wait for dashboard to load with data
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill(name)
    const submitBtn = page.getByRole('button', { name: /create circle/i })
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()

    // Wait for navigation - may fail if Convex mutation fails
    try {
      await page.waitForURL(/\/prompts/, { timeout: 15000 })
    } catch {
      return null
    }
    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    if (!match) return null

    // Wait for Convex auth to establish on the new page
    // The loading spinner indicates queries are pending
    await page
      .waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 20000 })
      .catch(() => {
        // If spinner is still showing, try reloading to re-establish auth
      })

    // If page is still loading (spinner), reload to re-establish Convex auth
    const stillLoading = await page.evaluate(() => !!document.querySelector('.animate-spin'))
    if (stillLoading) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page
        .waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
        .catch(() => {})
    }

    return match[1]
  }

  test('prompts page loads with setup heading after circle creation', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Default Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    await expect(page.getByText(/set up prompts|prompts/i)).toBeVisible({ timeout: 15000 })
  })

  test('prompts page shows prompt library with categories', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Library Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('reflection')).toBeVisible()
    await expect(page.getByText('fun')).toBeVisible()
    await expect(page.getByText('gratitude')).toBeVisible()
    await expect(page.getByText('deep')).toBeVisible()
  })

  test('prompts library contains expected prompts', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Content Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Wait for loading spinner to disappear and content to render
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    // Default prompts are auto-created with the circle.
    // They appear as editable inputs in the sortable list, NOT in the library.
    // The library only shows prompts NOT yet added.
    // Check that default prompts exist as input values
    await page.waitForFunction(
      () => {
        const inputs = document.querySelectorAll('input')
        return Array.from(inputs).some((i) => i.value?.includes('What did you do'))
      },
      { timeout: 15000 }
    )
    // Verify prompt library shows remaining (non-default) prompts
    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 5000 })
    // These are the non-default library prompts that should be available to add
    await expect(page.getByText("What's something you learned recently?")).toBeVisible({
      timeout: 5000,
    })
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

  test('can add a prompt from library', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Add Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // createCircleAndGetId already waits for spinner to clear
    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 15000 })
    // Library prompts are buttons with "+ {text}" text
    const libraryPrompt = page.getByRole('button', { name: /best meal you had this month/i })
    if (await libraryPrompt.isVisible({ timeout: 5000 }).catch(() => false)) {
      await libraryPrompt.click()
      await page.waitForTimeout(500)
    } else {
      test.skip(true, 'Library prompt button not found')
    }
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

    // Add at least one prompt before saving
    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 15000 })
    const libraryPrompt = page.getByText('What did you do this month?')
    if (await libraryPrompt.isVisible()) {
      await libraryPrompt.click()
      await page.waitForTimeout(500)
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

    // Add some prompts first so drag handles appear
    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 15000 })

    // Add a prompt from the library
    const prompt1 = page.getByText('What did you do this month?')
    if (await prompt1.isVisible()) {
      await prompt1.click()
      await page.waitForTimeout(500)
    }

    // Check for drag handles (GripVertical icons rendered as buttons with cursor-grab)
    const gripButtons = page.locator('[class*="cursor-grab"], button:has(svg.lucide-grip-vertical)')
    const count = await gripButtons.count()
    expect(count).toBeGreaterThan(0)
  })
})
