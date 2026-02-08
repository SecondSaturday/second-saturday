'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { trackEvent } from '@/lib/analytics'

export function useAuthAnalytics() {
  const { user, isSignedIn } = useUser()
  const hasTrackedRef = useRef(false)
  const wasSignedInRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!user || hasTrackedRef.current) return

    // Detect auth method from Clerk's external accounts or email
    const getAuthMethod = (): 'email' | 'Google' | 'Apple' => {
      const externalAccounts = user.externalAccounts || []
      const googleAccount = externalAccounts.find((a) => a.provider === 'google')
      const appleAccount = externalAccounts.find((a) => a.provider === 'apple')

      if (googleAccount) return 'Google'
      if (appleAccount) return 'Apple'
      return 'email'
    }

    // Check if this is a new signup (created within last 30 seconds)
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0
    const now = Date.now()
    const isNewUser = now - createdAt < 30000 // 30 seconds

    if (isNewUser) {
      trackEvent('user_signed_up', {
        method: getAuthMethod(),
        userId: user.id,
      })
      hasTrackedRef.current = true
    } else if (wasSignedInRef.current === false && isSignedIn) {
      // User just logged in (was not signed in, now is)
      trackEvent('user_logged_in', {
        method: getAuthMethod(),
        userId: user.id,
      })
      hasTrackedRef.current = true
    }

    wasSignedInRef.current = isSignedIn
  }, [user, isSignedIn])
}
