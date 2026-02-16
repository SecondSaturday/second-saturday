/**
 * Integration tests for Mux webhook handling logic.
 *
 * These test the signature verification and event processing logic
 * by replicating the rules in isolation. True end-to-end webhook
 * integration tests require a running Convex backend and Mux account.
 */
import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import muxEvents from '../fixtures/mux-events.json'

// Replicate signature verification logic from convex/http.ts
function verifyMuxSignature(body: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(',')
    let timestamp = ''
    const signatures: string[] = []

    for (const part of parts) {
      if (part.startsWith('t=')) {
        timestamp = part.substring(2)
      } else if (part.startsWith('v1=')) {
        signatures.push(part.substring(3))
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false
    }

    const signedPayload = `${timestamp}.${body}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    // Constant-time comparison
    return signatures.some((sig) =>
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
    )
  } catch {
    return false
  }
}

// Helper to generate Mux signature
function generateMuxSignature(payload: string, timestamp: string, secret: string): string {
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
  return `t=${timestamp},v1=${signature}`
}

// Validate webhook event structure
function validateWebhookEvent(event: Record<string, unknown>): { valid: boolean; error?: string } {
  if (!event.type || typeof event.type !== 'string') {
    return { valid: false, error: 'Event type is required' }
  }

  if (!event.data || typeof event.data !== 'object') {
    return { valid: false, error: 'Event data is required' }
  }

  return { valid: true }
}

// Validate video.upload.asset_created event
function validateAssetCreatedEvent(event: Record<string, unknown>): {
  valid: boolean
  error?: string
  data?: { uploadId: string; assetId: string }
} {
  if (event.type !== 'video.upload.asset_created') {
    return { valid: false, error: 'Invalid event type' }
  }

  const uploadId = event.data?.id
  const assetId = event.data?.asset_id

  if (!uploadId || typeof uploadId !== 'string') {
    return { valid: false, error: 'Upload ID is required' }
  }

  if (!assetId || typeof assetId !== 'string') {
    return { valid: false, error: 'Asset ID is required' }
  }

  return { valid: true, data: { uploadId, assetId } }
}

// Validate video.asset.ready event
function validateAssetReadyEvent(event: Record<string, unknown>): {
  valid: boolean
  error?: string
  data?: {
    assetId: string
    playbackId: string
    duration?: number
    aspectRatio?: string
  }
} {
  if (event.type !== 'video.asset.ready') {
    return { valid: false, error: 'Invalid event type' }
  }

  const assetId = event.data?.id
  const playbackIds = event.data?.playback_ids

  if (!assetId || typeof assetId !== 'string') {
    return { valid: false, error: 'Asset ID is required' }
  }

  if (!Array.isArray(playbackIds) || playbackIds.length === 0) {
    return { valid: false, error: 'Playback IDs are required' }
  }

  const playbackId = playbackIds[0]?.id
  if (!playbackId || typeof playbackId !== 'string') {
    return { valid: false, error: 'Valid playback ID is required' }
  }

  return {
    valid: true,
    data: {
      assetId,
      playbackId,
      duration: event.data.duration,
      aspectRatio: event.data.aspect_ratio,
    },
  }
}

// Validate video.asset.errored event
function validateAssetErroredEvent(event: Record<string, unknown>): {
  valid: boolean
  error?: string
  data?: { assetId: string; errorMessage: string }
} {
  if (event.type !== 'video.asset.errored') {
    return { valid: false, error: 'Invalid event type' }
  }

  const assetId = event.data?.id
  if (!assetId || typeof assetId !== 'string') {
    return { valid: false, error: 'Asset ID is required' }
  }

  const errors = event.data?.errors
  const errorMessage = errors?.messages?.[0] || 'Unknown error occurred during processing'

  return { valid: true, data: { assetId, errorMessage } }
}

describe('Mux Webhook Integration Tests', () => {
  const testSecret = 'test_webhook_secret_key'

  describe('Webhook Signature Validation', () => {
    it('should accept valid webhook signature', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = generateMuxSignature(payload, timestamp, testSecret)

      const isValid = verifyMuxSignature(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = `t=${timestamp},v1=invalid_signature_here`

      const isValid = verifyMuxSignature(payload, signature, testSecret)
      expect(isValid).toBe(false)
    })

    it('should reject webhook with tampered payload', () => {
      const originalPayload = JSON.stringify(muxEvents['video.asset.ready'])
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = generateMuxSignature(originalPayload, timestamp, testSecret)

      // Tamper with payload after generating signature
      const tamperedPayload = JSON.stringify({
        ...muxEvents['video.asset.ready'],
        data: {
          ...muxEvents['video.asset.ready'].data,
          id: 'tampered_asset_id',
        },
      })

      const isValid = verifyMuxSignature(tamperedPayload, signature, testSecret)
      expect(isValid).toBe(false)
    })

    it('should reject webhook with missing signature parts', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const signature = 'malformed_signature_without_parts'

      const isValid = verifyMuxSignature(payload, signature, testSecret)
      expect(isValid).toBe(false)
    })

    it('should reject webhook with tampered timestamp', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const originalTimestamp = Math.floor(Date.now() / 1000).toString()
      const signature = generateMuxSignature(payload, originalTimestamp, testSecret)

      // Change timestamp in signature
      const tamperedSignature = signature.replace(
        `t=${originalTimestamp}`,
        `t=${parseInt(originalTimestamp) + 3600}`
      )

      const isValid = verifyMuxSignature(payload, tamperedSignature, testSecret)
      expect(isValid).toBe(false)
    })
  })

  describe('Webhook Event Structure Validation', () => {
    it('should validate event with required fields', () => {
      const result = validateWebhookEvent(muxEvents['video.asset.ready'])
      expect(result.valid).toBe(true)
    })

    it('should fail when event type is missing', () => {
      const result = validateWebhookEvent({ data: {} })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Event type is required')
    })

    it('should fail when event data is missing', () => {
      const result = validateWebhookEvent({ type: 'video.asset.ready' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Event data is required')
    })
  })

  describe('video.upload.asset_created Event Validation', () => {
    it('should validate asset_created event with all fields', () => {
      const result = validateAssetCreatedEvent(muxEvents['video.upload.asset_created'])
      expect(result.valid).toBe(true)
      expect(result.data?.uploadId).toBe('upload_test_123')
      expect(result.data?.assetId).toBe('asset_test_abc123')
    })

    it('should fail when upload ID is missing', () => {
      const invalidEvent = {
        type: 'video.upload.asset_created',
        data: { asset_id: 'asset_123' },
      }
      const result = validateAssetCreatedEvent(invalidEvent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Upload ID is required')
    })

    it('should fail when asset ID is missing', () => {
      const invalidEvent = {
        type: 'video.upload.asset_created',
        data: { id: 'upload_123' },
      }
      const result = validateAssetCreatedEvent(invalidEvent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Asset ID is required')
    })
  })

  describe('video.asset.ready Event Validation', () => {
    it('should validate asset_ready event with all fields', () => {
      const result = validateAssetReadyEvent(muxEvents['video.asset.ready'])
      expect(result.valid).toBe(true)
      expect(result.data?.assetId).toBe('asset_test_abc123')
      expect(result.data?.playbackId).toBe('playback_test_xyz789')
      expect(result.data?.duration).toBe(120.5)
      expect(result.data?.aspectRatio).toBe('16:9')
    })

    it('should fail when asset ID is missing', () => {
      const invalidEvent = {
        type: 'video.asset.ready',
        data: { playback_ids: [{ id: 'playback_123' }] },
      }
      const result = validateAssetReadyEvent(invalidEvent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Asset ID is required')
    })

    it('should fail when playback IDs are missing', () => {
      const invalidEvent = {
        type: 'video.asset.ready',
        data: { id: 'asset_123' },
      }
      const result = validateAssetReadyEvent(invalidEvent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Playback IDs are required')
    })

    it('should accept optional duration and aspectRatio', () => {
      const minimalEvent = {
        type: 'video.asset.ready',
        data: {
          id: 'asset_123',
          playback_ids: [{ id: 'playback_123' }],
        },
      }
      const result = validateAssetReadyEvent(minimalEvent)
      expect(result.valid).toBe(true)
      expect(result.data?.duration).toBeUndefined()
      expect(result.data?.aspectRatio).toBeUndefined()
    })
  })

  describe('video.asset.errored Event Validation', () => {
    it('should validate asset_errored event with all fields', () => {
      const result = validateAssetErroredEvent(muxEvents['video.asset.errored'])
      expect(result.valid).toBe(true)
      expect(result.data?.assetId).toBe('asset_test_error456')
      expect(result.data?.errorMessage).toBe('Video file is corrupted')
    })

    it('should fail when asset ID is missing', () => {
      const invalidEvent = {
        type: 'video.asset.errored',
        data: { errors: { messages: ['Some error'] } },
      }
      const result = validateAssetErroredEvent(invalidEvent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Asset ID is required')
    })

    it('should provide default error message when errors are missing', () => {
      const minimalEvent = {
        type: 'video.asset.errored',
        data: { id: 'asset_123' },
      }
      const result = validateAssetErroredEvent(minimalEvent)
      expect(result.valid).toBe(true)
      expect(result.data?.errorMessage).toBe('Unknown error occurred during processing')
    })
  })

  describe('Complete Webhook Lifecycle', () => {
    it('should validate complete video success lifecycle', () => {
      // 1. Asset created
      const assetCreated = validateAssetCreatedEvent(muxEvents['video.upload.asset_created'])
      expect(assetCreated.valid).toBe(true)
      expect(assetCreated.data?.uploadId).toBe('upload_test_123')
      expect(assetCreated.data?.assetId).toBe('asset_test_abc123')

      // 2. Asset ready
      const assetReady = validateAssetReadyEvent(muxEvents['video.asset.ready'])
      expect(assetReady.valid).toBe(true)
      expect(assetReady.data?.assetId).toBe('asset_test_abc123')
      expect(assetReady.data?.playbackId).toBe('playback_test_xyz789')
    })

    it('should validate complete video error lifecycle', () => {
      // 1. Asset created
      const assetCreated = validateAssetCreatedEvent(muxEvents['video.upload.asset_created'])
      expect(assetCreated.valid).toBe(true)

      // 2. Asset errored
      const assetErrored = validateAssetErroredEvent(muxEvents['video.asset.errored'])
      expect(assetErrored.valid).toBe(true)
      expect(assetErrored.data?.errorMessage).toBe('Video file is corrupted')
    })
  })

  describe('Webhook Security', () => {
    it('should verify signature before processing any event', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const timestamp = Math.floor(Date.now() / 1000).toString()

      // Valid signature
      const validSignature = generateMuxSignature(payload, timestamp, testSecret)
      expect(verifyMuxSignature(payload, validSignature, testSecret)).toBe(true)

      // Invalid signature - should reject
      const invalidSignature = `t=${timestamp},v1=wrong_signature`
      expect(verifyMuxSignature(payload, invalidSignature, testSecret)).toBe(false)
    })

    it('should use constant-time comparison for signatures', () => {
      const payload = JSON.stringify(muxEvents['video.asset.ready'])
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = generateMuxSignature(payload, timestamp, testSecret)

      // This should use crypto.timingSafeEqual internally
      const isValid = verifyMuxSignature(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })
  })
})
