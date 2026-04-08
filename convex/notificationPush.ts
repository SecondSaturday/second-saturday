'use node'

import { internalAction } from './_generated/server'
import { v } from 'convex/values'

/**
 * Send a push notification via OneSignal REST API.
 * Runs in Node.js runtime.
 */
export const sendPushNotification = internalAction({
  args: {
    playerIds: v.array(v.string()),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (_ctx, args) => {
    const appId = process.env.ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !apiKey) {
      console.warn('OneSignal not configured, skipping push notification')
      return
    }

    const payload: Record<string, unknown> = {
      app_id: appId,
      include_player_ids: args.playerIds,
      headings: { en: args.title },
      contents: { en: args.message },
    }

    if (args.data) {
      payload.data = args.data
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('OneSignal API error:', error)
        return
      }

      const result = await response.json()
      console.log(`Push notification sent to ${args.playerIds.length} players`, result)

      // Analytics: log push_notification_sent for server-side ingestion
      console.log(
        JSON.stringify({
          event: 'push_notification_sent',
          properties: {
            type: args.data?.type ?? 'unknown',
            recipient_count: args.playerIds.length,
          },
        })
      )
    } catch (err) {
      console.error('Failed to send push notification:', err)
    }
  },
})
