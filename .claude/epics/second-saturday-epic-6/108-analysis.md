---
issue: 108
title: Implement deep linking from push notifications
analyzed: 2026-02-22T06:29:21Z
estimated_hours: 4
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #108

## Overview
Add navigation logic to the OneSignal notification click handler so tapping a push notification routes to the correct screen. Submission reminders → `/dashboard/circles/[circleId]/submit`, newsletter-ready → `/dashboard/circles/[circleId]` (circle page shows latest newsletter).

## Parallel Streams

### Stream A: Deep Linking Implementation
**Scope**: Add router-based navigation to notification click handler in OneSignalProvider
**Files**:
- `src/providers/onesignal-provider.tsx` (add useRouter + navigation logic in click handler)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

Implementation:
1. Import `useRouter` from `next/navigation`
2. In `onNotificationClicked` callback, navigate based on `payload.type`:
   - `submission_reminder` → `router.push(/dashboard/circles/${circleId}/submit)`
   - `newsletter_ready` → `router.push(/dashboard/circles/${circleId})`
3. Add cold-start handling: store pending deep link if router not ready
4. Graceful handling: verify circle exists before navigating (or let the target page handle 404)

## Parallelization Strategy

**Recommended Approach**: sequential

Single file change, small scope. No parallelization needed.

## Expected Timeline

- Wall time: 4 hours (estimate generous — mostly 1-2 hours of actual code)
- Total work: 4 hours

## Notes
- Newsletter route is `/dashboard/circles/[circleId]/newsletter/[newsletterId]` which needs a specific newsletterId — route to circle page instead which shows latest newsletter
- Cold start: Next.js app with Capacitor handles initial routing via the router — pending notification data persists through OneSignal SDK
- Edge cases: if circle is deleted or user left, the target page itself handles the error (existing pattern)
