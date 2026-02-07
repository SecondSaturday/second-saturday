---
issue: 6
started: 2026-02-07T05:43:40Z
last_sync: 2026-02-07T05:51:03Z
completion: 100%
---

# Issue #6: Configure External Services

## Summary
Task completed successfully. All three external services (Resend, Mux, OneSignal) have been integrated.

## Work Completed

### Stream A: Resend Email Integration
- Installed `resend` and `@react-email/components` packages
- Created `src/lib/email.ts` with email sending utilities
- Added helper functions for welcome, invite, and reminder emails
- Updated `.env.example` with RESEND_FROM_EMAIL

### Stream B: Mux Video Integration
- Installed `@mux/mux-node` and `browser-image-compression` packages
- Created `src/lib/video.ts` with Mux upload and playback utilities
- Created `convex/videos.ts` with video mutations and queries
- Updated `convex/schema.ts` with videos table
- Updated `convex/http.ts` with complete Mux webhook handler
- Added webhook signature verification

### Stream C: OneSignal Push Notifications
- Created `src/lib/push.ts` with OneSignal REST API integration
- Added helper functions for circle invites, event reminders, new photos
- Updated `.env.example` with ONESIGNAL_REST_API_KEY
- Note: Capacitor plugin installation deferred to issue #7

### Additional
- Created `src/lib/image.ts` for browser-side image compression

## Files Changed
- `package.json` - Added dependencies
- `src/lib/email.ts` - Resend integration (new)
- `src/lib/video.ts` - Mux integration (new)
- `src/lib/push.ts` - OneSignal integration (new)
- `src/lib/image.ts` - Image compression utilities (new)
- `convex/schema.ts` - Added videos table
- `convex/videos.ts` - Video mutations/queries (new)
- `convex/http.ts` - Mux webhook handler
- `.env.example` - Added new environment variables

## External Setup Required
1. **Resend**: Create account, verify domain (24-48hr DNS propagation)
2. **Mux**: Create account, get API tokens, configure webhook URL
3. **OneSignal**: Create app, configure FCM (Android) and APNs (iOS)

## Notes
- Convex schema updated with videos table - run `npx convex dev` to sync
- OneSignal Capacitor plugin will be installed with issue #7 (Capacitor setup)

<!-- SYNCED: 2026-02-07T05:51:03Z -->
