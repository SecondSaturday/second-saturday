'use client'

import { useEffect, useRef } from 'react'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  initOneSignal,
  initOneSignalWeb,
  onNotificationReceived,
  onNotificationClicked,
  type NotificationClickPayload,
} from '@/lib/onesignal'
import { trackEvent } from '@/lib/analytics'
import { Capacitor } from '@capacitor/core'

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function navigateToDeepLink(
  router: ReturnType<typeof useRouter>,
  payload: NotificationClickPayload,
  isDesktop: boolean
) {
  switch (payload.type) {
    case 'submission_reminder':
      router.push(`/dashboard/circles/${payload.circleId}/submit`)
      break
    case 'admin_reminder':
      router.push(`/dashboard/circles/${payload.circleId}/submit`)
      break
    case 'newsletter_ready':
      if (isDesktop) {
        router.push(`/dashboard?circle=${payload.circleId}`)
      } else {
        router.push(`/dashboard/circles/${payload.circleId}`)
      }
      break
    default:
      console.warn('OneSignal: unknown notification type', payload.type)
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const registerPlayerId = useMutation(api.notifications.registerOneSignalPlayerId)
  const registerWebPlayerId = useMutation(api.notifications.registerOneSignalWebPlayerId)
  const lastPlayerIdRef = useRef<string | null>(null)
  const handlersRegisteredRef = useRef(false)
  const pendingDeepLinkRef = useRef<NotificationClickPayload | null>(null)
  const isDesktopRef = useRef(isDesktop)
  useEffect(() => {
    isDesktopRef.current = isDesktop
  }, [isDesktop])
  const isSignedInRef = useRef(isSignedIn)
  useEffect(() => {
    isSignedInRef.current = isSignedIn
  }, [isSignedIn])

  // Process any pending deep link once signed in
  useEffect(() => {
    if (isSignedIn && pendingDeepLinkRef.current) {
      navigateToDeepLink(router, pendingDeepLinkRef.current, isDesktopRef.current)
      pendingDeepLinkRef.current = null
    }
  }, [isSignedIn, router])

  // Initialize OneSignal on mount (native or web)
  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    async function setup() {
      try {
        if (isNative()) {
          // Native path (existing)
          const playerId = await initOneSignal()

          if (cancelled) return

          if (playerId && playerId !== lastPlayerIdRef.current) {
            lastPlayerIdRef.current = playerId
            await registerPlayerId({ playerId })
          }

          // Set up native notification handlers only once
          if (!handlersRegisteredRef.current) {
            handlersRegisteredRef.current = true

            onNotificationReceived(() => {
              // Notification received in foreground
            })

            onNotificationClicked((payload) => {
              if (!payload) return

              trackEvent('push_notification_clicked', {
                type: payload.type,
                circle_id: payload.circleId,
              })

              if (isSignedInRef.current) {
                navigateToDeepLink(router, payload, isDesktopRef.current)
              } else {
                pendingDeepLinkRef.current = payload
              }
            })
          }
        } else {
          // Web path
          const webPlayerId = await initOneSignalWeb()

          if (cancelled) return

          if (webPlayerId && webPlayerId !== lastPlayerIdRef.current) {
            lastPlayerIdRef.current = webPlayerId
            await registerWebPlayerId({ playerId: webPlayerId })
          }
        }
      } catch (err) {
        console.warn('OneSignal: provider setup failed:', err)
      }
    }

    setup()

    return () => {
      cancelled = true
    }
  }, [isSignedIn, registerPlayerId, registerWebPlayerId, router])

  return <>{children}</>
}
