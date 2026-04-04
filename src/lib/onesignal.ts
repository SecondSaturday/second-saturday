// OneSignal SDK initialization for both Capacitor native and web browsers
// Native: uses onesignal-cordova-plugin v5.x API
// Web: uses react-onesignal (OneSignal Web SDK)

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

// OneSignal Web SDK v16 types
interface OneSignalWebSDK {
  init(options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }): Promise<void>
  User: {
    PushSubscription: {
      id: string | null
    }
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
 * Initialize OneSignal on native (Capacitor).
 * Returns subscription ID on success, null otherwise.
 */
export async function initOneSignal(): Promise<string | null> {
  if (!isNative()) {
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

    // Request notification permission (will show prompt on iOS, Android 13+)
    const accepted = await OneSignal.Notifications.requestPermission(true)
    if (!accepted) {
      console.warn('OneSignal: user declined notification permission')
    }

    // Get subscription ID (may take a moment after permission granted)
    // Wait briefly for subscription to register
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const subscriptionId = OneSignal.User.pushSubscription.id
    return subscriptionId
  } catch (err) {
    console.error('OneSignal: initialization failed:', err)
    return null
  }
}

/**
 * Initialize OneSignal on web (browser).
 * Returns web subscription ID on success, null otherwise.
 */
export async function initOneSignalWeb(): Promise<string | null> {
  if (isNative()) return null
  if (typeof window === 'undefined') return null

  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal: NEXT_PUBLIC_ONESIGNAL_APP_ID not set')
    return null
  }

  try {
    console.log('OneSignal Web: initializing with appId', ONESIGNAL_APP_ID)

    // Load the OneSignal Web SDK v16 script if not already loaded
    if (!document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load OneSignal SDK'))
        document.head.appendChild(script)
      })
    }

    // Use the deferred initialization pattern from OneSignal v16
    const win = window as unknown as {
      OneSignalDeferred?: Array<(OneSignal: OneSignalWebSDK) => void>
    }
    win.OneSignalDeferred = win.OneSignalDeferred || []

    await new Promise<void>((resolve, reject) => {
      win.OneSignalDeferred!.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerParam: { scope: '/' },
            path: '/',
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: 'push',
                    autoPrompt: true,
                    delay: { pageViews: 1, timeDelay: 3 },
                    text: {
                      actionMessage:
                        'Get notified when your newsletter is ready and submission deadlines are coming up.',
                      acceptButton: 'Allow',
                      cancelButton: 'Maybe Later',
                    },
                  },
                ],
              },
            },
          } as Parameters<typeof OneSignal.init>[0])
          console.log('OneSignal Web: init complete')
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })

    // Wait briefly for subscription to register
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const onesignal = (window as unknown as { OneSignal?: OneSignalWebSDK }).OneSignal
    const subscriptionId = onesignal?.User?.PushSubscription?.id
    console.log('OneSignal Web: subscription ID =', subscriptionId)
    return subscriptionId ?? null
  } catch (err) {
    console.error('OneSignal Web: initialization failed:', err)
    return null
  }
}

/**
 * Get current subscription ID (native only).
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
 * Register foreground notification handler (native only).
 * Web notifications are handled by the browser/service worker automatically.
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
 * Register click handler for notifications (native only).
 * Web notification clicks are handled by the service worker.
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
        callback({ type: data.type as NotificationClickPayload['type'], circleId: data.circleId })
      } else {
        callback(null)
      }
    })
  } catch (err) {
    console.error('OneSignal: failed to set up notification click handler:', err)
  }
}
