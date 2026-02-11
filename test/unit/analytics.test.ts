/**
 * Unit tests for analytics module.
 * Tests PostHog integration and event tracking.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock posthog before importing analytics
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    isFeatureEnabled: vi.fn(),
    getFeatureFlag: vi.fn(),
  },
}))

// Import after mocking
import {
  initAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  resetUser,
  isFeatureEnabled,
  getFeatureFlag,
} from '@/lib/analytics'
import posthog from 'posthog-js'

describe('Analytics Module', () => {
  const originalWindow = global.window

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window object for browser environment
    global.window = {} as Window & typeof globalThis
  })

  afterEach(() => {
    global.window = originalWindow
  })

  describe('initAnalytics', () => {
    it('initializes PostHog with correct config', () => {
      const mockKey = 'test-posthog-key'
      const mockHost = 'https://test.posthog.com'
      process.env.NEXT_PUBLIC_POSTHOG_KEY = mockKey
      process.env.NEXT_PUBLIC_POSTHOG_HOST = mockHost

      initAnalytics()

      expect(posthog.init).toHaveBeenCalledWith(mockKey, {
        api_host: mockHost,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      })
    })

    it('uses default host when not specified', () => {
      const mockKey = 'test-posthog-key'
      process.env.NEXT_PUBLIC_POSTHOG_KEY = mockKey
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST

      initAnalytics()

      expect(posthog.init).toHaveBeenCalledWith(
        mockKey,
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
        })
      )
    })

    it('does nothing on server side (no window)', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      initAnalytics()

      expect(posthog.init).not.toHaveBeenCalled()
    })
  })

  describe('trackEvent', () => {
    it('captures event with name and properties', () => {
      const eventName = 'circle_joined'
      const properties = { circleId: '123', source: 'invite_link' }

      trackEvent(eventName, properties)

      expect(posthog.capture).toHaveBeenCalledWith(eventName, properties)
    })

    it('captures event without properties', () => {
      const eventName = 'dashboard_viewed'

      trackEvent(eventName)

      expect(posthog.capture).toHaveBeenCalledWith(eventName, undefined)
    })

    it('does nothing on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      trackEvent('test_event')

      expect(posthog.capture).not.toHaveBeenCalled()
    })

    it('tracks all Epic 3 membership events correctly', () => {
      const events = [
        { name: 'invite_link_viewed', props: { inviteCode: 'abc123' } },
        { name: 'circle_joined', props: { circleId: '123', source: 'invite_link' } },
        { name: 'circle_left', props: { circleId: '123' } },
        { name: 'member_removed', props: { circleId: '123', keepContributions: true } },
      ]

      events.forEach((event) => {
        trackEvent(event.name, event.props)
      })

      expect(posthog.capture).toHaveBeenCalledTimes(4)
      events.forEach((event, index) => {
        expect(posthog.capture).toHaveBeenNthCalledWith(index + 1, event.name, event.props)
      })
    })
  })

  describe('trackPageView', () => {
    it('captures pageview with custom URL', () => {
      const customUrl = '/dashboard/circles/123'

      trackPageView(customUrl)

      expect(posthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: customUrl,
      })
    })

    it('captures pageview with window location when no URL provided', () => {
      const mockLocation = 'https://example.com/page'
      global.window = { location: { href: mockLocation } } as Window & typeof globalThis

      trackPageView()

      expect(posthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: mockLocation,
      })
    })

    it('does nothing on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      trackPageView('/test')

      expect(posthog.capture).not.toHaveBeenCalled()
    })
  })

  describe('identifyUser', () => {
    it('identifies user with ID and properties', () => {
      const userId = 'user_123'
      const properties = { email: 'test@example.com', name: 'Test User' }

      identifyUser(userId, properties)

      expect(posthog.identify).toHaveBeenCalledWith(userId, properties)
    })

    it('identifies user without properties', () => {
      const userId = 'user_123'

      identifyUser(userId)

      expect(posthog.identify).toHaveBeenCalledWith(userId, undefined)
    })

    it('does nothing on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      identifyUser('user_123')

      expect(posthog.identify).not.toHaveBeenCalled()
    })
  })

  describe('resetUser', () => {
    it('resets user identity', () => {
      resetUser()

      expect(posthog.reset).toHaveBeenCalled()
    })

    it('does nothing on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      resetUser()

      expect(posthog.reset).not.toHaveBeenCalled()
    })
  })

  describe('isFeatureEnabled', () => {
    it('returns true when feature is enabled', () => {
      posthog.isFeatureEnabled.mockReturnValue(true)

      const result = isFeatureEnabled('new-feature')

      expect(result).toBe(true)
      expect(posthog.isFeatureEnabled).toHaveBeenCalledWith('new-feature')
    })

    it('returns false when feature is disabled', () => {
      posthog.isFeatureEnabled.mockReturnValue(false)

      const result = isFeatureEnabled('new-feature')

      expect(result).toBe(false)
    })

    it('returns false when result is null/undefined', () => {
      posthog.isFeatureEnabled.mockReturnValue(null)

      const result = isFeatureEnabled('new-feature')

      expect(result).toBe(false)
    })

    it('returns false on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      const result = isFeatureEnabled('new-feature')

      expect(result).toBe(false)
      expect(posthog.isFeatureEnabled).not.toHaveBeenCalled()
    })
  })

  describe('getFeatureFlag', () => {
    it('returns string flag value', () => {
      posthog.getFeatureFlag.mockReturnValue('variant-a')

      const result = getFeatureFlag('experiment')

      expect(result).toBe('variant-a')
      expect(posthog.getFeatureFlag).toHaveBeenCalledWith('experiment')
    })

    it('returns boolean flag value', () => {
      posthog.getFeatureFlag.mockReturnValue(true)

      const result = getFeatureFlag('feature-toggle')

      expect(result).toBe(true)
    })

    it('returns undefined when flag not found', () => {
      posthog.getFeatureFlag.mockReturnValue(undefined)

      const result = getFeatureFlag('unknown-flag')

      expect(result).toBeUndefined()
    })

    it('returns undefined on server side', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      const result = getFeatureFlag('test-flag')

      expect(result).toBeUndefined()
      expect(posthog.getFeatureFlag).not.toHaveBeenCalled()
    })
  })

  describe('SSR safety', () => {
    it('all functions handle server-side rendering gracefully', () => {
      global.window = undefined as unknown as Window & typeof globalThis

      // Should not throw errors
      expect(() => {
        initAnalytics()
        trackEvent('test')
        trackPageView()
        identifyUser('user')
        resetUser()
        isFeatureEnabled('flag')
        getFeatureFlag('flag')
      }).not.toThrow()

      // No PostHog calls should be made
      expect(posthog.init).not.toHaveBeenCalled()
      expect(posthog.capture).not.toHaveBeenCalled()
      expect(posthog.identify).not.toHaveBeenCalled()
      expect(posthog.reset).not.toHaveBeenCalled()
      expect(posthog.isFeatureEnabled).not.toHaveBeenCalled()
      expect(posthog.getFeatureFlag).not.toHaveBeenCalled()
    })
  })
})
