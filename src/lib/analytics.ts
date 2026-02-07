import posthog from 'posthog-js'

// Initialize PostHog (call this once in your app)
export function initAnalytics() {
  if (typeof window === 'undefined') return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll handle this manually for SPA
    capture_pageleave: true,
  })
}

// Track a custom event
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(eventName, properties)
}

// Track a page view (call on route changes)
export function trackPageView(url?: string) {
  if (typeof window === 'undefined') return
  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

// Identify a user (call after login)
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.identify(userId, properties)
}

// Reset user identity (call after logout)
export function resetUser() {
  if (typeof window === 'undefined') return
  posthog.reset()
}

// Check if a feature flag is enabled
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined') return false
  return posthog.isFeatureEnabled(flagKey) ?? false
}

// Get feature flag value
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (typeof window === 'undefined') return undefined
  return posthog.getFeatureFlag(flagKey)
}
