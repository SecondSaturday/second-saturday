import type { Page } from '@playwright/test'

/**
 * Helper functions for E2E tests
 */

/**
 * Waits for React hydration on the create circle page.
 * Dismisses the "Create Your Group" splash screen if shown,
 * then waits for React's internal __reactFiber property on the #name input.
 */
export async function waitForCreateFormHydration(page: Page): Promise<void> {
  // Dismiss the "Create Your Group" splash screen if it's showing
  const getStartedBtn = page.getByRole('button', { name: 'Get Started' })
  if (await getStartedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Wait for React hydration on the button before clicking
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button')
        if (!btn || !btn.textContent?.includes('Get Started')) return false
        return Object.keys(btn).some((k) => k.startsWith('__reactFiber'))
      },
      { timeout: 10000 }
    )
    await getStartedBtn.click()
    // Wait for React to re-render the form after splash dismissal
    await page.waitForFunction(() => document.querySelector('#name') !== null, { timeout: 15000 })
  }

  await page.waitForFunction(
    () => {
      const el = document.querySelector('#name')
      if (!el) return false
      return Object.keys(el).some((k) => k.startsWith('__reactFiber'))
    },
    { timeout: 15000 }
  )
}

/**
 * Waits for Convex auth to establish by visiting dashboard and waiting
 * for the loading spinner to disappear (proves auth + initial data loaded).
 */
export async function warmupConvexAuth(page: Page): Promise<void> {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  // Wait until the Convex-powered dashboard finishes loading
  await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
  // Wait for Convex auth to fully propagate — verify real data has loaded
  // (circle cards or "No circles" message proves queries are running authenticated)
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="circle-card"]') !== null ||
      document.body.textContent?.includes('No circles') ||
      document.body.textContent?.includes('Create'),
    { timeout: 15000 }
  )
}

/**
 * Creates a new circle via the create page.
 * Returns the circle ID extracted from the redirect URL.
 */
export async function createCircle(
  page: Page,
  name: string,
  description?: string
): Promise<string> {
  // Warm up Convex auth
  await warmupConvexAuth(page)

  await page.goto('/dashboard/create', { waitUntil: 'domcontentloaded' })

  // Wait for React hydration - ensure event handlers are attached
  await waitForCreateFormHydration(page)

  // Fill in circle name - fill() works with React controlled inputs
  await page.locator('#name').fill(name)

  if (description) {
    await page.locator('#description').fill(description)
  }

  // Wait for button to be enabled and click
  const submitBtn = page.getByRole('button', { name: 'Next', exact: true })
  await submitBtn.waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[type="submit"]')
      return btn && !(btn as HTMLButtonElement).disabled
    },
    { timeout: 5000 }
  )
  await submitBtn.click()

  // App redirects to /dashboard/circles/{id}/prompts?setup=true
  await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 15000 })

  const url = page.url()
  const match = url.match(/\/circles\/([^/]+)\/prompts/)
  if (!match) {
    throw new Error(`Failed to extract circle ID from URL: ${url}`)
  }

  return match[1]!
}

/**
 * Gets the invite code for a circle by navigating to its settings page.
 */
export async function getInviteCode(page: Page, circleId: string): Promise<string> {
  // Navigate directly to the settings page
  await page.goto(`/dashboard/circles/${circleId}/settings`, {
    waitUntil: 'domcontentloaded',
  })

  // Wait for CircleSettings component to finish loading
  await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

  // Wait for the invite link to render (Convex data must load)
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('p')).some((p) => p.textContent?.includes('/invite/')),
    { timeout: 25000 }
  )

  // Get invite code from the displayed link
  const inviteLinkText = await page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('p')).find((el) =>
      el.textContent?.includes('/invite/')
    )
    return p?.textContent ?? null
  })

  if (!inviteLinkText) {
    throw new Error('Failed to find invite link')
  }

  const match = inviteLinkText.match(/\/invite\/([^\s]+)/)
  if (!match) {
    throw new Error(`Failed to extract invite code from: ${inviteLinkText}`)
  }

  return match[1]!
}

/**
 * Checks if an element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}
