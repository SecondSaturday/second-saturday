import { type Page, type Browser, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import path from 'path'

/**
 * Helper functions for E2E tests
 */

/**
 * Creates an authenticated browser page for a secondary user.
 * Uses the saved auth state from auth.setup.ts.
 * Returns the new page — caller must close the context when done.
 */
export async function createUser2Page(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    storageState: path.join(__dirname, '../.auth/user2.json'),
  })
  const page = await context.newPage()
  await setupClerkTestingToken({ page })
  return page
}

/**
 * Creates an authenticated browser page for the third user.
 */
export async function createUser3Page(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    storageState: path.join(__dirname, '../.auth/user3.json'),
  })
  const page = await context.newPage()
  await setupClerkTestingToken({ page })
  return page
}

/**
 * Joins a circle via invite code using the given page (different user context).
 * Navigates to the invite page, clicks Join, and waits for redirect.
 */
export async function joinCircleViaInvite(page: Page, inviteCode: string): Promise<void> {
  // First warm up auth so Clerk recognizes the user
  await warmupConvexAuth(page)

  // Navigate to invite page
  await page.goto(`/invite/${inviteCode}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

  // Authenticated users see "Join Circle" button, unauthenticated see "Sign up to Join"/"Log in to Join"
  const joinBtn = page.getByRole('button', { name: /^join circle$/i })
  const loginJoinBtn = page.getByRole('button', { name: /log in to join/i })

  // Wait for either button
  await expect(joinBtn.or(loginJoinBtn)).toBeVisible({ timeout: 15000 })

  if (await joinBtn.isVisible().catch(() => false)) {
    await joinBtn.click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  } else {
    // User appears unauthenticated on invite page — click "Log in to Join"
    // which will redirect through auth and auto-join
    await loginJoinBtn.click()
    await page.waitForURL(/\/dashboard/, { timeout: 30000 })
  }
}

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
  // Wait for Clerk UserButton to render — this only appears when Clerk
  // is fully authenticated, which means the JWT has been issued to Convex
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[aria-label="Open user menu"]')
      return btn !== null
    },
    { timeout: 20000 }
  )
  // Wait for Convex auth to fully establish.
  // The CircleList component shows animate-pulse skeletons while loading (query=undefined).
  // Once the Convex JWT is validated and the query resolves, it renders either:
  // - circle-card items (user has circles), or
  // - the EmptyState component (no circles), or
  // - the circle-list container (data loaded)
  // The skeleton pulse disappearing proves Convex queries are authenticated and resolved.
  await page.waitForFunction(
    () => {
      // If animate-pulse skeletons are still visible, Convex is still loading
      if (document.querySelector('.animate-pulse')) return false
      // If animate-spin spinner is still visible, page is still loading
      if (document.querySelector('.animate-spin')) return false
      // Verify actual Convex data has loaded (not just static components)
      const hasCircleList = document.querySelector('[data-testid="circle-list"]') !== null
      const hasCircleCards = document.querySelector('[data-testid="circle-card"]') !== null
      const hasEmptyState =
        document.querySelector('[data-testid="empty-state"]') !== null ||
        Array.from(document.querySelectorAll('p')).some((p) =>
          p.textContent?.toLowerCase().includes('no circles')
        )
      return hasCircleList || hasCircleCards || hasEmptyState
    },
    { timeout: 25000 }
  )
}

/**
 * Navigates to the circle creation page using client-side navigation.
 * This preserves the Convex WebSocket auth — page.goto() would do a full
 * page load which resets the WebSocket and causes "Not authenticated" errors.
 * Call warmupConvexAuth() before this.
 */
export async function navigateToCreatePage(page: Page): Promise<void> {
  const menuBtn = page.locator('button[aria-label="Menu"]').first()
  if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menuBtn.click()
    // Use menuitem role to avoid strict mode violation with empty state link
    await page.getByRole('menuitem', { name: /create a circle/i }).click()
  } else {
    // Empty state has a direct "Create a circle" link
    await page.getByText('Create a circle').click()
  }
  await page.waitForURL(/\/dashboard\/create/, { timeout: 10000 })
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

  // Navigate via client-side nav to preserve Convex WebSocket auth
  await navigateToCreatePage(page)

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
  await page.waitForURL(/\/circles\/[^/]+\/prompts/, { timeout: 25000 })

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
  // Navigate to settings page — prefer client-side nav if on prompts page
  const currentUrl = page.url()
  if (currentUrl.includes(`/circles/${circleId}/prompts`)) {
    // Use the back arrow link (goes to settings) to preserve Convex WebSocket auth
    const backLink = page.locator(`a[href*="/circles/${circleId}/settings"]`).first()
    if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backLink.click()
      await page.waitForURL(/\/settings/, { timeout: 10000 })
    } else {
      await page.goto(`/dashboard/circles/${circleId}/settings`, {
        waitUntil: 'domcontentloaded',
      })
    }
  } else {
    await page.goto(`/dashboard/circles/${circleId}/settings`, {
      waitUntil: 'domcontentloaded',
    })
  }

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
 * Opens the media upload dropdown on the submission page.
 * Clicks the first "Add media" button to reveal Take Photo, Choose Photo, Choose Video options.
 */
export async function openMediaDropdown(page: Page): Promise<void> {
  // Wait for the submission page to fully load (Convex data must resolve)
  // The "Add media" button is disabled until submission data is ready
  await page.waitForFunction(
    () => {
      const buttons = document.querySelectorAll('button[aria-label="Add media"]')
      return Array.from(buttons).some((btn) => !(btn as HTMLButtonElement).disabled)
    },
    { timeout: 20000 }
  )
  // Click the first ENABLED "Add media" button (there's one per prompt card)
  const enabledBtn = page.locator('button[aria-label="Add media"]:not([disabled])').first()
  await expect(enabledBtn).toBeVisible({ timeout: 5000 })
  await enabledBtn.click()
}

/**
 * Waits for Convex to be ready on the current page.
 * Checks that loading spinners and skeleton animations have resolved,
 * proving the Convex WebSocket connection is authenticated and queries are complete.
 */
export async function waitForConvexReady(page: Page): Promise<void> {
  // Wait for any loading spinners to finish
  await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
  // Wait for skeleton animations to resolve (Convex data loaded)
  await page.waitForFunction(() => !document.querySelector('.animate-pulse'), { timeout: 15000 })
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

/**
 * Clicks a circle card and navigates to the circle page.
 * On desktop (>=768px), dashboard uses /dashboard?circle={id} (split view).
 * On mobile (<768px), it navigates to /dashboard/circles/{id}.
 * This helper navigates to the dedicated circle page regardless of viewport.
 */
export async function navigateToCircle(page: Page): Promise<string | null> {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await warmupConvexAuth(page)

  const circleCard = page.locator('[data-testid="circle-card"]').first()
  const hasCircle = await circleCard.isVisible({ timeout: 10000 }).catch(() => false)
  if (!hasCircle) return null

  // Extract circle ID from the card's data or click behavior
  await circleCard.click()

  // Wait for either URL pattern (desktop query param or mobile route)
  await page.waitForURL(/\/dashboard(\/circles\/|\?circle=)/, { timeout: 10000 })

  const url = page.url()

  // Extract circle ID from either URL format
  const routeMatch = url.match(/\/circles\/([^/?]+)/)
  const queryMatch = url.match(/[?&]circle=([^&]+)/)
  const circleId = routeMatch?.[1] ?? queryMatch?.[1] ?? null

  if (!circleId) return null

  // If we're on the desktop split-view URL, navigate to the dedicated circle page
  if (url.includes('?circle=')) {
    await page.goto(`/dashboard/circles/${circleId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
  }

  return circleId
}
