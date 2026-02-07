import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'

const http = httpRouter()

// Clerk webhook endpoint
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // TODO: Verify webhook signature with Clerk
    // TODO: Process user.created, user.updated, user.deleted events
    const payload = await request.json()
    console.log('Clerk webhook received:', payload.type)

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
