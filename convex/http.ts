import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { Webhook } from 'svix'
import { api } from './_generated/api'

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
      case 'user.created':
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
    // TODO: Verify webhook signature with Mux
    // TODO: Process video.asset.ready, video.upload.asset_created events
    const payload = await request.json()
    console.log('Mux webhook received:', payload.type)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

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
