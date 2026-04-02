import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    return await ctx.storage.generateUploadUrl()
  },
})

// getUrl and deleteFile removed: no frontend callers exist and they lacked
// ownership verification, allowing any authenticated user to access/delete
// any storage blob. File URLs are resolved server-side inside queries that
// already enforce membership checks.
