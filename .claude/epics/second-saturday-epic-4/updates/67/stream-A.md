---
stream: Mux SDK & Upload Action
agent: stream-a-specialist
started: 2026-02-16T14:08:55Z
status: completed
---

# Stream A Progress: Mux SDK & Upload Action

## Completed
- ✅ Verified @mux/mux-node SDK is installed (v12.8.1)
- ✅ Created separate convex/videoActions.ts file for Node.js actions
- ✅ Implemented getMuxClient() helper function
- ✅ Implemented uploadVideoToMux action
  - Creates Mux direct upload URL
  - Configures public playback policy
  - Enables MP4 support
  - Creates video record in database
  - Returns uploadUrl, uploadId, and videoId
- ✅ Added comprehensive error handling
- ✅ Video metadata will be extracted via webhooks (duration, aspectRatio)
- ✅ Kept mutations/queries in videos.ts, actions in videoActions.ts

## Implementation Details

### File Structure
- **convex/videos.ts**: Mutations, queries, and internal mutations (no 'use node')
- **convex/videoActions.ts**: Node.js actions with Mux SDK (has 'use node' directive)

### uploadVideoToMux Action
- **Location**: convex/videoActions.ts
- **Input**: userId, title (optional), circleId (optional)
- **Output**: { uploadUrl, uploadId, videoId }
- **Process**:
  1. Validates Mux credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET)
  2. Creates Mux direct upload with public playback policy
  3. Creates video record via api.videos.createVideo mutation
  4. Returns upload URL for client-side upload

### Error Handling
- Throws error if Mux credentials not configured
- Catches and logs Mux API errors
- Returns user-friendly error messages

### Coordination with Stream B
- Stream B implemented webhook handlers in convex/http.ts
- No file conflicts - separate files used
- Webhooks will update video with assetId, playbackId, duration, aspectRatio

## Environment Variables Required
- MUX_TOKEN_ID ✅ (configured in .env.local)
- MUX_TOKEN_SECRET ✅ (configured in .env.local)
- MUX_WEBHOOK_SECRET ✅ (configured in .env.local)

## Next Steps
- Client-side implementation will call api.videoActions.uploadVideoToMux
- Client uploads video to the returned uploadUrl
- Webhook handler processes Mux events
- Video metadata extracted automatically via webhooks

## Files Created/Modified
- `convex/videoActions.ts` - New file with uploadVideoToMux action
- `convex/videos.ts` - Kept unchanged (mutations and queries)

## Technical Notes
- Convex requires 'use node' files to only export actions/internalActions
- Separated concerns: actions in videoActions.ts, mutations/queries in videos.ts
- This follows Convex best practices for Node.js runtime functions

## Blocked
- None
