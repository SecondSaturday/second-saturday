'use node'

import { v } from 'convex/values'
import { action } from './_generated/server'
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
    try {
      const mux = getMuxClient()

      // Create a direct upload
      const upload = await mux.video.uploads.create({
        cors_origin: '*', // Configure based on your domain in production
        new_asset_settings: {
          playback_policy: ['public'],
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
