'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { initAnalytics, trackPageView, identifyUser, resetUser } from '@/lib/analytics'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  // Initialize PostHog on mount
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      initAnalytics()
    }
  }, [])

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`
      trackPageView(url)
    }
  }, [pathname, searchParams])

  // Identify user when auth state changes
  useEffect(() => {
    if (isSignedIn && userId && user) {
      identifyUser(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
      })
    } else if (!isSignedIn) {
      resetUser()
    }
  }, [isSignedIn, userId, user])

  return <>{children}</>
}
