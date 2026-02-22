'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  initOneSignal,
  onNotificationReceived,
  onNotificationClicked,
  type NotificationClickPayload,
} from '@/lib/onesignal'
import { trackEvent } from '@/lib/analytics'

function navigateToDeepLink(
  router: ReturnType<typeof useRouter>,
  payload: NotificationClickPayload
) {
  switch (payload.type) {
    case 'submission_reminder':
      router.push(`/dashboard/circles/${payload.circleId}/submit`)
      break
    case 'newsletter_ready':
      router.push(`/dashboard/circles/${payload.circleId}`)
      break
    default:
      console.warn('OneSignal: unknown notification type', payload.type)
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const registerPlayerId = useMutation(api.notifications.registerOneSignalPlayerId)
  const lastPlayerIdRef = useRef<string | null>(null)
  const handlersRegisteredRef = useRef(false)
  const pendingDeepLinkRef = useRef<NotificationClickPayload | null>(null)

  // Process any pending deep link once signed in
  useEffect(() => {
    if (isSignedIn && pendingDeepLinkRef.current) {
      navigateToDeepLink(router, pendingDeepLinkRef.current)
      pendingDeepLinkRef.current = null
    }
  }, [isSignedIn, router])

  // Initialize OneSignal on mount (native only)
  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    async function setup() {
      try {
        const playerId = await initOneSignal()

        if (cancelled) return

        // Register player ID if we got one and it changed
        if (playerId && playerId !== lastPlayerIdRef.current) {
          lastPlayerIdRef.current = playerId
          await registerPlayerId({ playerId })
        }

        // Set up notification handlers only once
        if (!handlersRegisteredRef.current) {
          handlersRegisteredRef.current = true

          onNotificationReceived((notification) => {
            console.log('OneSignal: notification received', notification.title)
          })

          onNotificationClicked((payload) => {
            if (!payload) return

            trackEvent('push_notification_clicked', {
              type: payload.type,
              circle_id: payload.circleId,
            })

            if (isSignedIn) {
              navigateToDeepLink(router, payload)
            } else {
              // Store for processing after auth completes (cold start)
              pendingDeepLinkRef.current = payload
            }
          })
        }
      } catch (err) {
        console.warn('OneSignal: provider setup failed:', err)
      }
    }

    setup()

    return () => {
      cancelled = true
    }
  }, [isSignedIn, registerPlayerId, router])

  return <>{children}</>
}
