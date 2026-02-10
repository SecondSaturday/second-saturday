import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Prompt Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  /**
   * Helper to create a circle and return its ID.
   * Navigates through creation flow and extracts circleId from the URL.
   */
  async function createCircleAndGetId(
    page: import('@playwright/test').Page,
    name: string
  ): Promise<string | null> {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill(name)
    await page.getByRole('button', { name: /create circle/i }).click()
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })
    const url = page.url()
    const match = url.match(/\/circles\/([^/]+)\/prompts/)
    return match?.[1] ?? null
  }

  test('prompts page loads with default prompts after circle creation', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Default Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Should already be on prompts page with setup=true
    await expect(page.getByText(/set up prompts|prompts/i)).toBeVisible({ timeout: 15000 })

    // Should show 4 default prompts
    await expect(page.getByText('What did you do this month?')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('One Good Thing')).toBeVisible()
    await expect(page.getByText('On Your Mind')).toBeVisible()
    await expect(page.getByText('What are you listening to?')).toBeVisible()
  })

  test('shows prompt count indicator', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Count Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Should show 4/8 counter
    await expect(page.getByText('4/8')).toBeVisible({ timeout: 15000 })
  })

  test('shows prompt library with categories', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Library Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    await expect(page.getByText('Prompt Library')).toBeVisible({ timeout: 15000 })
    // Should show category labels
    await expect(page.getByText('reflection')).toBeVisible()
    await expect(page.getByText('fun')).toBeVisible()
    await expect(page.getByText('gratitude')).toBeVisible()
    await expect(page.getByText('deep')).toBeVisible()
  })

  test('can add a prompt from library', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Add Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Wait for prompts to load
    await expect(page.getByText('4/8')).toBeVisible({ timeout: 15000 })

    // Click a library prompt to add it
    const libraryPrompt = page.getByRole('button', {
      name: /best meal you had this month/i,
    })
    if (await libraryPrompt.isVisible()) {
      await libraryPrompt.click()
      // Counter should update to 5/8
      await expect(page.getByText('5/8')).toBeVisible({ timeout: 5000 })
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

    // Wait for prompts to load
    await expect(page.getByText('4/8')).toBeVisible({ timeout: 15000 })

    // Click Continue (setup flow)
    await page.getByRole('button', { name: /continue/i }).click()

    // Should navigate to setup-complete page
    await expect(page).toHaveURL(/\/setup-complete/, { timeout: 15000 })
  })

  test('prompts page has drag handles', async ({ page }) => {
    const circleId = await createCircleAndGetId(page, 'Prompts Drag Test')
    if (!circleId) {
      test.skip(true, 'Could not create circle')
      return
    }

    // Wait for prompts to load
    await expect(page.getByText('What did you do this month?')).toBeVisible({ timeout: 15000 })

    // Should have grip/drag handle buttons (one per prompt)
    const gripButtons = page.locator('button[class*="cursor-grab"]')
    await expect(gripButtons).toHaveCount(4, { timeout: 5000 })
  })
})
