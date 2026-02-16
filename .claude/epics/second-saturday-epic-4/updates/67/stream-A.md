---
stream: Mux SDK & Upload Action
agent: stream-a-specialist
started: 2026-02-16T14:08:55Z
status: completed
---

# Stream A Progress: Mux SDK & Upload Action

## Completed
- ✅ Verified @mux/mux-node SDK is installed (v12.8.1)
- ✅ Added 'use node' directive to convex/videos.ts
- ✅ Implemented getMuxClient() helper function
- ✅ Implemented uploadVideoToMux action
  - Creates Mux direct upload URL
  - Configures public playback policy
  - Enables MP4 support
  - Creates video record in database
  - Returns uploadUrl, uploadId, and videoId
- ✅ Added comprehensive error handling
- ✅ Video metadata will be extracted via webhooks (duration, aspectRatio)

## Implementation Details

### uploadVideoToMux Action
- **Input**: userId, title (optional), circleId (optional)
- **Output**: { uploadUrl, uploadId, videoId }
- **Process**:
  1. Validates Mux credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET)
  2. Creates Mux direct upload with public playback policy
  3. Creates video record with status 'uploading'
  4. Returns upload URL for client-side upload

### Error Handling
- Throws error if Mux credentials not configured
- Catches and logs Mux API errors
- Returns user-friendly error messages

### Coordination with Stream B
- Stream B implemented webhook handlers (already in file)
- No file conflicts - action added separately
- Webhooks will update video with assetId, playbackId, duration, aspectRatio

## Environment Variables Required
- MUX_TOKEN_ID
- MUX_TOKEN_SECRET
- MUX_WEBHOOK_SECRET (for webhook validation)

## Next Steps
- Client-side implementation will use uploadUrl to upload video
- Webhook handler will process Mux events
- Video metadata extracted automatically via webhooks

## Files Modified
- convex/videos.ts - Added uploadVideoToMux action and Mux SDK integration

## Blocked
- None
