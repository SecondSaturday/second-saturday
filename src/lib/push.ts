// OneSignal Push Notification utilities
// Note: The Capacitor plugin (@onesignal/onesignal-capacitor) will be installed
// when Capacitor is configured in issue #7

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY

// Server-side: Send push notification via REST API
export interface SendNotificationOptions {
  title: string
  message: string
  userIds?: string[] // External user IDs (Clerk IDs)
  segments?: string[] // OneSignal segments
  data?: Record<string, string>
  url?: string
}

export async function sendPushNotification({
  title,
  message,
  userIds,
  segments,
  data,
  url,
}: SendNotificationOptions) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal not configured, skipping push notification')
    return { success: false, error: 'OneSignal not configured' }
  }

  const payload: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
  }

  // Target by user IDs (external_user_id in OneSignal)
  if (userIds && userIds.length > 0) {
    payload.include_aliases = {
      external_id: userIds,
    }
    payload.target_channel = 'push'
  } else if (segments && segments.length > 0) {
    // Target by segments
    payload.included_segments = segments
  } else {
    // Default to all subscribers
    payload.included_segments = ['Subscribed Users']
  }

  // Optional data payload
  if (data) {
    payload.data = data
  }

  // Optional URL to open
  if (url) {
    payload.url = url
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OneSignal API error:', error)
      return { success: false, error }
    }

    const result = await response.json()
    return { success: true, id: result.id, recipients: result.recipients }
  } catch (err) {
    console.error('Failed to send push notification:', err)
    return { success: false, error: String(err) }
  }
}

// Send notification to a specific user
export async function sendPushToUser(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, string>
) {
  return sendPushNotification({
    title,
    message,
    userIds: [userId],
    data,
  })
}

// Send notification to multiple users
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  message: string,
  data?: Record<string, string>
) {
  return sendPushNotification({
    title,
    message,
    userIds,
    data,
  })
}
