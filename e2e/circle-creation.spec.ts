import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Circle Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('create page loads with form', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Create Circle')).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel('Circle Name')).toBeVisible()
  })

  test('shows back link to dashboard', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Create Circle')).toBeVisible({ timeout: 15000 })
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink).toBeVisible()
  })

  test('submit button disabled when name too short', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    // Type only 2 characters
    await page.getByLabel('Circle Name').fill('AB')
    const submitButton = page.getByRole('button', { name: /create circle/i })
    await expect(submitButton).toBeDisabled()
  })

  test('submit button enabled when name is valid', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Test Circle')
    const submitButton = page.getByRole('button', { name: /create circle/i })
    await expect(submitButton).toBeEnabled()
  })

  test('shows character counter for name', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Circle Name').fill('Hello')
    await expect(page.getByText('5/50')).toBeVisible()
  })

  test('shows icon and cover upload areas', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Icon')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Cover Image')).toBeVisible()
  })

  test('shows optional description field', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 15000 })
  })

  test('full creation flow navigates to prompts', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('Circle Name')).toBeVisible({ timeout: 15000 })

    // Fill the form
    await page.getByLabel('Circle Name').fill('E2E Test Circle')
    await page.getByLabel(/description/i).fill('Created by Playwright test')

    // Submit
    await page.getByRole('button', { name: /create circle/i }).click()

    // Should redirect to prompts page with setup=true
    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })
  })
})
