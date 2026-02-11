import type { Page } from '@playwright/test'

/**
 * Helper functions for E2E tests
 */

/**
 * Creates a new circle via the dashboard
 * @param page Playwright page object
 * @param name Circle name
 * @param description Optional circle description
 * @returns The circle ID extracted from the URL
 */
export async function createCircle(
  page: Page,
  name: string,
  description?: string
): Promise<string> {
  await page.goto('/dashboard', { waitUntil: 'networkidle' })

  // Wait for dashboard to load - either create button or circle list should appear
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="create-circle-button"]', { timeout: 20000 }),
      page.waitForSelector('[data-testid="circle-list"]', { timeout: 20000 }),
    ])
  } catch {
    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/dashboard-load-error-${Date.now()}.png` })
    throw new Error('Dashboard failed to load - neither create button nor circle list appeared')
  }

  // Now click the create button
  await page.click('[data-testid="create-circle-button"]')

  // Wait for create form
  await page.waitForSelector('[name="name"]', { timeout: 10000 })

  // Fill in circle details
  await page.fill('[name="name"]', name)
  if (description) {
    await page.fill('[name="description"]', description)
  }

  // Submit form
  await page.click('button[type="submit"]:has-text("Create")')

  // Wait for redirect to circle page
  await page.waitForURL(/\/dashboard\/circles\//, { timeout: 15000 })

  // Extract circle ID from URL
  const url = page.url()
  const match = url.match(/\/dashboard\/circles\/([^/]+)/)
  if (!match) {
    throw new Error(`Failed to extract circle ID from URL: ${url}`)
  }

  return match[1]
}

/**
 * Gets the invite code for a circle
 * @param page Playwright page object
 * @param circleId Circle ID
 * @returns The invite code
 */
export async function getInviteCode(page: Page, circleId: string): Promise<string> {
  // Navigate to circle if not already there
  if (!page.url().includes(`/dashboard/circles/${circleId}`)) {
    await page.goto(`/dashboard/circles/${circleId}`)
  }

  // Click settings button
  const settingsButton = page.locator(
    '[data-testid="settings-button"], button:has-text("Settings")'
  )
  await settingsButton.click({ timeout: 10000 })

  // Wait for settings panel to open
  await page.waitForSelector('text=Invite Link', { timeout: 10000 })

  // Get invite code from the page
  const inviteLinkElement = await page.locator('text=/\\/invite\\/[^\\s]+/').first()
  const inviteLinkText = await inviteLinkElement.textContent()

  if (!inviteLinkText) {
    throw new Error('Failed to find invite link')
  }

  const match = inviteLinkText.match(/\/invite\/([^\s]+)/)
  if (!match) {
    throw new Error(`Failed to extract invite code from: ${inviteLinkText}`)
  }

  return match[1]
}

/**
 * Waits for a circle to be created and navigates to its page
 * @param page Playwright page object
 * @param timeout Maximum time to wait in ms
 */
export async function waitForCircleCreation(page: Page, timeout = 15000): Promise<void> {
  await page.waitForURL(/\/dashboard\/circles\//, { timeout })
}

/**
 * Checks if an element exists on the page
 * @param page Playwright page object
 * @param selector Element selector
 * @returns True if element exists, false otherwise
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Waits for dashboard to fully load
 * @param page Playwright page object
 */
export async function waitForDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard')
  // Wait for either the create button or circle list to appear
  await Promise.race([
    page.waitForSelector('[data-testid="create-circle-button"]', { timeout: 15000 }),
    page.waitForSelector('[data-testid="circle-list"]', { timeout: 15000 }),
  ])
}
