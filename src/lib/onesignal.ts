// OneSignal SDK v5 initialization and helpers for Capacitor native builds
// Note: This only works in Capacitor native context, not in web browsers
// Uses onesignal-cordova-plugin v5.x API (not the @awesome-cordova-plugins wrapper)

import { Capacitor } from '@capacitor/core'

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

export interface NotificationClickPayload {
  type: 'submission_reminder' | 'newsletter_ready'
  circleId: string
}

// OneSignal SDK v5 types (from cordova plugin)
interface OneSignalPlugin {
  initialize(appId: string): void
  Notifications: {
    requestPermission(fallbackToSettings: boolean): Promise<boolean>
    addEventListener(
      event: 'foregroundWillDisplay' | 'click',
      handler: (event: NotificationEvent) => void
    ): void
  }
  User: {
    pushSubscription: {
      id: string | null
      token: string | null
      optedIn: boolean
      addEventListener(event: 'change', handler: (event: unknown) => void): void
    }
  }
}

interface NotificationEvent {
  notification: {
    title: string
    body: string
    additionalData?: Record<string, string>
  }
}

/**
 * Check if we're running in a Capacitor native context
 */
function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Get the OneSignal plugin instance (SDK v5). Only available in native context.
 */
function getOneSignalPlugin(): OneSignalPlugin | null {
  if (!isNative()) return null
  // OneSignal v5 Cordova plugin exposes itself at window.plugins.OneSignal
  const plugins = (window as unknown as { plugins?: { OneSignal?: OneSignalPlugin } }).plugins
  if (!plugins?.OneSignal) {
    console.warn('OneSignal plugin not available at window.plugins.OneSignal')
    return null
  }
  return plugins.OneSignal
}

/**
 * Initialize OneSignal SDK v5 using Capacitor plugin.
 * Only works in Capacitor native context (not web browser).
 * Returns subscription ID on success, null otherwise.
 */
export async function initOneSignal(): Promise<string | null> {
  if (!isNative()) {
    console.log('OneSignal: skipping init (not native platform)')
    return null
  }

  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal: NEXT_PUBLIC_ONESIGNAL_APP_ID not set')
    return null
  }

  const OneSignal = getOneSignalPlugin()
  if (!OneSignal) return null

  try {
    // Initialize SDK v5
    OneSignal.initialize(ONESIGNAL_APP_ID)
    console.log('OneSignal: initialized with app ID', ONESIGNAL_APP_ID)

    // Request notification permission (will show prompt on iOS, Android 13+)
    const accepted = await OneSignal.Notifications.requestPermission(true)
    if (!accepted) {
      console.warn('OneSignal: user declined notification permission')
    } else {
      console.log('OneSignal: notification permission granted')
    }

    // Get subscription ID (may take a moment after permission granted)
    // Wait briefly for subscription to register
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const subscriptionId = OneSignal.User.pushSubscription.id
    console.log('OneSignal: subscription ID', subscriptionId)
    return subscriptionId
  } catch (err) {
    console.error('OneSignal: initialization failed:', err)
    return null
  }
}

/**
 * Get current subscription ID.
 * Returns null if not in native context or not initialized.
 */
export async function getOneSignalPlayerId(): Promise<string | null> {
  if (!isNative()) return null

  const OneSignal = getOneSignalPlugin()
  if (!OneSignal) return null

  try {
    return OneSignal.User.pushSubscription.id
  } catch (err) {
    console.error('OneSignal: failed to get subscription ID:', err)
    return null
  }
}

/**
 * Register foreground notification handler.
 * Callback fires when a notification is received while app is in foreground.
 */
export async function onNotificationReceived(
  callback: (notification: { title: string; body: string; data?: Record<string, string> }) => void
): Promise<void> {
  if (!isNative()) return

  const OneSignal = getOneSignalPlugin()
  if (!OneSignal) return

  try {
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      callback({
        title: event.notification.title ?? '',
        body: event.notification.body ?? '',
        data: event.notification.additionalData,
      })
    })
  } catch (err) {
    console.error('OneSignal: failed to set up notification received handler:', err)
  }
}

/**
 * Register click handler for notifications.
 * Extracts payload with { type, circleId } from notification data.
 */
export async function onNotificationClicked(
  callback: (payload: NotificationClickPayload | null) => void
): Promise<void> {
  if (!isNative()) return

  const OneSignal = getOneSignalPlugin()
  if (!OneSignal) return

  try {
    OneSignal.Notifications.addEventListener('click', (event) => {
      const data = event.notification.additionalData
      if (data?.type && data?.circleId) {
        callback({ type: data.type, circleId: data.circleId })
      } else {
        callback(null)
      }
    })
  } catch (err) {
    console.error('OneSignal: failed to set up notification click handler:', err)
  }
}
