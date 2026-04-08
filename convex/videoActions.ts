'use node'

import { v } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { Id } from './_generated/dataModel'
import Mux from '@mux/mux-node'
import { api } from './_generated/api'

// Initialize Mux client
const getMuxClient = () => {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be configured')
  }

  return new Mux({ tokenId, tokenSecret })
}

// Upload video to Mux - Returns direct upload URL
export const uploadVideoToMux = action({
  args: {
    title: v.optional(v.string()),
    circleId: v.optional(v.id('circles')),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    uploadUrl: string
    uploadId: string
    videoId: Id<'videos'>
  }> => {
    // Verify authentication before creating Mux resources
    const user = await ctx.runQuery(api.users.getCurrentUser, {})
    if (!user) throw new Error('Not authenticated')

    try {
      const mux = getMuxClient()

      // Create a direct upload
      const upload = await mux.video.uploads.create({
        cors_origin: (() => {
          const origin = process.env.MUX_CORS_ORIGIN
          if (!origin) throw new Error('MUX_CORS_ORIGIN environment variable must be configured')
          return origin
        })(),
        new_asset_settings: {
          playback_policy: ['public'],
          max_resolution_tier: '1080p',
        },
      })

      // Create video record in database
      const videoId: Id<'videos'> = await ctx.runMutation(api.videos.createVideo, {
        uploadId: upload.id,
        title: args.title,
        circleId: args.circleId,
      })

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
        videoId,
      }
    } catch (error) {
      console.error('Failed to create Mux upload:', error)
      throw new Error(
        `Failed to create video upload: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },
})

// Delete a Mux asset (internal - called when videos are deleted)
export const deleteMuxAsset = internalAction({
  args: { assetId: v.string() },
  handler: async (_ctx, args) => {
    try {
      const mux = getMuxClient()
      await mux.video.assets.delete(args.assetId)
    } catch (error) {
      // Log but don't throw — the DB record is already deleted
      console.error('Failed to delete Mux asset:', args.assetId, error)
    }
  },
})
