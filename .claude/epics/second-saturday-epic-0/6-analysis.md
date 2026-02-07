---
issue: 6
title: Configure External Services
analyzed: 2026-02-07T05:42:16Z
estimated_hours: 8-10
parallelization_factor: 3.0
---

# Parallel Work Analysis: Issue #6

## Overview
Set up three external services: Resend (email), Mux (video processing), and OneSignal (push notifications). Each service requires account setup, SDK installation, and integration code. The Mux webhook handler already has a placeholder in convex/http.ts.

## Parallel Streams

### Stream A: Resend Email Integration
**Scope**: Email delivery service with React Email templates
**Files**:
- `src/lib/email.ts` (new)
- `src/emails/*.tsx` (new - email templates)
- `.env.local` (add RESEND_API_KEY)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 2-3
**Dependencies**: none
**Notes**: Domain verification (24-48hr DNS) should be started in dashboard first

### Stream B: Mux Video Integration
**Scope**: Video upload, processing, and playback integration
**Files**:
- `src/lib/video.ts` (new)
- `convex/http.ts` (update Mux webhook handler)
- `convex/videos.ts` (new - video mutations/queries)
- `.env.local` (add MUX_TOKEN_ID, MUX_TOKEN_SECRET)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 3-4
**Dependencies**: none

### Stream C: OneSignal Push Notifications
**Scope**: Push notification setup for iOS/Android via Capacitor
**Files**:
- `capacitor.config.ts` (add OneSignal config)
- `src/lib/push.ts` (new)
- `.env.local` (add ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY)
**Agent Type**: mobile-specialist
**Can Start**: immediately
**Estimated Hours**: 3-4
**Dependencies**: none (but APNs/FCM setup requires Apple Developer + Firebase accounts)
**Notes**: Capacitor not yet configured (#7), may need to defer full integration

## Coordination Points

### Shared Files
- `.env.local` - All streams (each adds different keys, no conflict)
- `.env.example` - All streams (document required keys)
- `package.json` - All streams (add dependencies)

### Sequential Requirements
1. Mux webhook signature verification before deploying to production
2. OneSignal Capacitor plugin requires Capacitor to be initialized (#7)
3. APNs requires Apple Developer account (may still be pending from Day 1)

## Conflict Risk Assessment
- **Low Risk**: Each service is independent with separate files
- **Medium Risk**: package.json will be modified by all streams (manageable)
- **Note**: Stream C (OneSignal) may be partially blocked if Capacitor (#7) isn't done

## Parallelization Strategy

**Recommended Approach**: hybrid

- **Phase 1 (Parallel)**: Launch Streams A and B simultaneously - these are fully independent
- **Phase 2 (Conditional)**: Stream C can start in parallel BUT should defer Capacitor plugin installation until issue #7 is complete. Core OneSignal setup (account, API keys, lib/push.ts) can proceed.

Alternative: Run A, B, C all in parallel with a note that C's Capacitor integration defers to #7.

## Expected Timeline

With parallel execution:
- Wall time: 3-4 hours (max of individual streams)
- Total work: 8-10 hours
- Efficiency gain: ~60%

Without parallel execution:
- Wall time: 8-10 hours

## Notes

1. **DAY 1 CRITICAL**: If not already done, start Resend domain verification immediately - DNS propagation takes 24-48 hours

2. **External Account Requirements**:
   - Resend account (free tier available)
   - Mux account (free tier available)
   - OneSignal account (free tier available)
   - Firebase project for FCM (Android push)
   - Apple Developer account for APNs (iOS push)

3. **Dependency on Issue #7**: The OneSignal Capacitor plugin (`@onesignal/onesignal-capacitor`) installation should wait for Capacitor setup. The rest of OneSignal work can proceed.

4. **Existing Mux webhook**: convex/http.ts already has a placeholder `/mux-webhook` endpoint that needs to be fleshed out with proper signature verification and event handling.

5. **browser-image-compression**: Listed in acceptance criteria - should be added as part of Stream B (video/media handling).
