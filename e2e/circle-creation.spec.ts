import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration, warmupConvexAuth, navigateToCreatePage } from './helpers'

test.describe('Circle Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await warmupConvexAuth(page)
  })

  test('create page loads with splash screen', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Create Your Group' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('shows back link to dashboard', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    // Back link is visible on splash screen
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink).toBeVisible({ timeout: 15000 })
  })

  test('submit button disabled when name too short', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('AB')
    const submitButton = page.getByRole('button', { name: 'Next', exact: true })
    await expect(submitButton).toBeDisabled()
  })

  test('submit button enabled when name is valid', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('Test Circle')
    const submitButton = page.getByRole('button', { name: 'Next', exact: true })
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
  })

  test('shows character counter for name', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('Hello')
    await expect(page.getByText('5/50')).toBeVisible({ timeout: 5000 })
  })

  test('shows icon and cover upload areas', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await expect(page.getByText('Icon')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Cover Image')).toBeVisible()
  })

  test('shows optional description field', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 15000 })
  })

  test('full creation flow navigates to prompts', async ({ page }) => {
    await navigateToCreatePage(page)
    await waitForCreateFormHydration(page)

    await page.locator('#name').fill('E2E Test Circle')

    const submitButton = page.getByRole('button', { name: 'Next', exact: true })
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    // Wait for React to fully process the form state
    await page.waitForTimeout(500)
    await submitButton.click()

    await expect(page).toHaveURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })
  })
})
