import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { Webhook } from 'svix'
import { api, internal } from './_generated/api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internalVideos = (internal as any).videos

const http = httpRouter()

// Clerk webhook endpoint
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    // Get headers for verification
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 })
    }

    const body = await request.text()

    // Verify webhook signature
    const wh = new Webhook(webhookSecret)
    let payload: {
      type: string
      data: {
        id: string
        email_addresses?: Array<{ email_address: string }>
        first_name?: string
        last_name?: string
        image_url?: string
      }
    }

    try {
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as typeof payload
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    const { type, data } = payload

    // Handle different event types
    switch (type) {
      case 'user.created': {
        const email = data.email_addresses?.[0]?.email_address
        if (!email) {
          console.error('No email found in webhook payload')
          return new Response('No email in payload', { status: 400 })
        }

        // Don't set name here — let the user set it on /complete-profile
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

        await ctx.runMutation(api.users.upsertUser, {
          clerkId: data.id,
          email,
          imageUrl: data.image_url,
        })

        await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, { email, name })
        break
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address
        if (!email) {
          console.error('No email found in webhook payload')
          return new Response('No email in payload', { status: 400 })
        }

        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

        await ctx.runMutation(api.users.upsertUser, {
          clerkId: data.id,
          email,
          name,
          imageUrl: data.image_url,
        })
        break
      }

      case 'user.deleted': {
        await ctx.runMutation(api.users.deleteUser, {
          clerkId: data.id,
        })
        break
      }

      default:
        console.log('Unhandled webhook event type:', type)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

// Mux webhook endpoint
http.route({
  path: '/mux-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const muxWebhookSecret = process.env.MUX_WEBHOOK_SECRET

    // Get the signature header
    const signature = request.headers.get('mux-signature')
    const body = await request.text()

    // Verify webhook signature if secret is configured
    if (muxWebhookSecret && signature) {
      const isValid = await verifyMuxSignature(body, signature, muxWebhookSecret)
      if (!isValid) {
        console.error('Mux webhook signature verification failed')
        return new Response('Invalid signature', { status: 400 })
      }
    }

    const payload = JSON.parse(body) as {
      type: string
      data: {
        id: string
        upload_id?: string
        playback_ids?: Array<{ id: string; policy: string }>
        duration?: number
        aspect_ratio?: string
        status?: string
        errors?: { messages: string[] }
      }
    }

    console.log('Mux webhook received:', payload.type)

    switch (payload.type) {
      case 'video.upload.asset_created': {
        // Upload completed, asset created
        const uploadId = payload.data.upload_id
        const assetId = payload.data.id
        if (uploadId && assetId) {
          await ctx.runMutation(internalVideos.updateVideoAsset, {
            uploadId,
            assetId,
            status: 'processing',
          })
        }
        break
      }

      case 'video.asset.ready': {
        // Asset is ready for playback
        const assetId = payload.data.id
        const playbackId = payload.data.playback_ids?.[0]?.id
        if (assetId && playbackId) {
          await ctx.runMutation(internalVideos.updateVideoReady, {
            assetId,
            playbackId,
            duration: payload.data.duration,
            aspectRatio: payload.data.aspect_ratio,
          })
        }
        break
      }

      case 'video.asset.errored': {
        // Asset processing failed
        const assetId = payload.data.id
        const errorMessages = payload.data.errors?.messages?.join(', ')
        if (assetId) {
          await ctx.runMutation(internalVideos.updateVideoError, {
            assetId,
            error: errorMessages,
          })
        }
        break
      }

      default:
        console.log('Unhandled Mux webhook event type:', payload.type)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

// Helper to verify Mux webhook signature using Web Crypto API
async function verifyMuxSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Mux signature format: t=<timestamp>,v1=<signature>
  const parts = signature.split(',')
  const timestampPart = parts.find((p) => p.startsWith('t='))
  const signaturePart = parts.find((p) => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) {
    return false
  }

  const timestamp = timestampPart.slice(2)
  const expectedSignature = signaturePart.slice(3)

  // Create the signed payload
  const signedPayload = `${timestamp}.${body}`

  try {
    // Import the secret key
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Compute HMAC-SHA256
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    if (expectedSignature.length !== computedSignature.length) {
      return false
    }
    let result = 0
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ computedSignature.charCodeAt(i)
    }
    return result === 0
  } catch {
    return false
  }
}

// Health check endpoint
http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

export default http
