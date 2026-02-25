import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { waitForCreateFormHydration } from './helpers'

test.describe('Circle Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('create page loads with form', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Create Circle' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByLabel('Circle Name')).toBeVisible()
  })

  test('shows back link to dashboard', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Create Circle' })).toBeVisible({
      timeout: 15000,
    })
    const backLink = page.locator('a[href="/dashboard"]')
    await expect(backLink).toBeVisible()
  })

  test('submit button disabled when name too short', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('AB')
    const submitButton = page.getByRole('button', { name: /create circle/i })
    await expect(submitButton).toBeDisabled()
  })

  test('submit button enabled when name is valid', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)
    await page.locator('#name').fill('Test Circle')
    const submitButton = page.getByRole('button', { name: /create circle/i })
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
    await expect(page.getByText('Icon')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Cover Image')).toBeVisible()
  })

  test('shows optional description field', async ({ page }) => {
    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/description/i)).toBeVisible({ timeout: 15000 })
  })

  test('full creation flow navigates to prompts', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })
    await waitForCreateFormHydration(page)

    await page.locator('#name').fill('E2E Test Circle')

    const submitButton = page.getByRole('button', { name: /create circle/i })
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    await submitButton.click()

    await expect(page).toHaveURL(/\/prompts\?setup=true/, { timeout: 15000 })
  })
})
