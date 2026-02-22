// OneSignal SDK initialization and helpers for Capacitor native builds
// Note: This only works in Capacitor native context, not in web browsers

import { Capacitor } from '@capacitor/core'

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

export interface NotificationClickPayload {
  type: 'submission_reminder' | 'newsletter_ready'
  circleId: string
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
 * Get the OneSignal plugin instance. Only available in native context.
 */
async function getOneSignalPlugin() {
  if (!isNative()) return null
  try {
    const { OneSignal } = await import('@awesome-cordova-plugins/onesignal')
    return OneSignal
  } catch (err) {
    console.warn('OneSignal plugin not available:', err)
    return null
  }
}

/**
 * Initialize OneSignal SDK using Capacitor plugin.
 * Only works in Capacitor native context (not web browser).
 * Returns player ID on success, null otherwise.
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

  const OneSignal = await getOneSignalPlugin()
  if (!OneSignal) return null

  try {
    OneSignal.startInit(ONESIGNAL_APP_ID)
    OneSignal.inFocusDisplaying(2) // OSDisplayType.Notification
    OneSignal.endInit()

    // Request notification permission
    const accepted = await OneSignal.promptForPushNotificationsWithUserResponse()
    if (!accepted) {
      console.warn('OneSignal: user declined notification permission')
    }

    // Get player ID
    const ids = await OneSignal.getIds()
    return ids?.userId ?? null
  } catch (err) {
    console.error('OneSignal: initialization failed:', err)
    return null
  }
}

/**
 * Get current player/subscription ID.
 * Returns null if not in native context or not initialized.
 */
export async function getOneSignalPlayerId(): Promise<string | null> {
  if (!isNative()) return null

  const OneSignal = await getOneSignalPlugin()
  if (!OneSignal) return null

  try {
    const ids = await OneSignal.getIds()
    return ids?.userId ?? null
  } catch (err) {
    console.error('OneSignal: failed to get player ID:', err)
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

  const OneSignal = await getOneSignalPlugin()
  if (!OneSignal) return

  try {
    OneSignal.handleNotificationReceived().subscribe((notification) => {
      callback({
        title: notification.payload?.title ?? '',
        body: notification.payload?.body ?? '',
        data: notification.payload?.additionalData,
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

  const OneSignal = await getOneSignalPlugin()
  if (!OneSignal) return

  try {
    OneSignal.handleNotificationOpened().subscribe((result) => {
      const data = result.notification?.payload?.additionalData
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
