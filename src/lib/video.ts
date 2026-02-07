import Mux from '@mux/mux-node'
import crypto from 'crypto'

// Mux client - only available server-side
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export interface CreateUploadOptions {
  corsOrigin?: string
  maxDurationSeconds?: number
}

// Create a direct upload URL for client-side uploads
export async function createUploadUrl(options: CreateUploadOptions = {}) {
  const { corsOrigin = '*', maxDurationSeconds = 300 } = options

  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
      cors_origin: corsOrigin,
      // Max 5 minutes by default
      ...(maxDurationSeconds && {
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline',
          max_resolution_tier: '1080p',
        },
      }),
    })

    return {
      uploadId: upload.id,
      uploadUrl: upload.url,
    }
  } catch (err) {
    console.error('Failed to create Mux upload:', err)
    throw err
  }
}

// Get asset details by ID
export async function getAsset(assetId: string) {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    return {
      id: asset.id,
      status: asset.status,
      duration: asset.duration,
      playbackId: asset.playback_ids?.[0]?.id,
      aspectRatio: asset.aspect_ratio,
      resolution: asset.resolution_tier,
    }
  } catch (err) {
    console.error('Failed to get Mux asset:', err)
    throw err
  }
}

// Get playback URL for a video
export function getPlaybackUrl(playbackId: string, options: { thumbnail?: boolean } = {}) {
  if (options.thumbnail) {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg`
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Get thumbnail URL at a specific time
export function getThumbnailUrl(
  playbackId: string,
  options: { time?: number; width?: number; height?: number } = {}
) {
  const { time = 0, width = 640, height } = options
  const params = new URLSearchParams({
    time: time.toString(),
    width: width.toString(),
    ...(height && { height: height.toString() }),
  })
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params.toString()}`
}

// Delete an asset
export async function deleteAsset(assetId: string) {
  try {
    await mux.video.assets.delete(assetId)
    return { success: true }
  } catch (err) {
    console.error('Failed to delete Mux asset:', err)
    throw err
  }
}

// Verify Mux webhook signature
export function verifyMuxWebhook(body: string, signature: string, webhookSecret: string): boolean {
  // Mux uses a simple HMAC-SHA256 signature
  // The signature header format is: t=<timestamp>,v1=<signature>
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

  // Compute HMAC
  const hmac = crypto.createHmac('sha256', webhookSecret)
  hmac.update(signedPayload)
  const computedSignature = hmac.digest('hex')

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(computedSignature))
  } catch {
    return false
  }
}
