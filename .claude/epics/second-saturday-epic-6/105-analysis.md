---
issue: 105
title: Integrate OneSignal SDK with Capacitor
analyzed: 2026-02-22T06:08:21Z
estimated_hours: 6
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #105

## Overview
Initialize OneSignal SDK on app load, register player ID in Convex, and handle push notification events. Existing `src/lib/push.ts` has stubs. Cordova plugins already installed (`@awesome-cordova-plugins/onesignal`, `onesignal-cordova-plugin`). Follow `PostHogProvider` pattern for client-side initialization.

## Parallel Streams

### Stream A: OneSignal Initialization & Player Registration
**Scope**: SDK init, permission request, player ID storage
**Files**:
- `src/lib/onesignal.ts` (SDK initialization, helpers)
- `src/providers/onesignal-provider.tsx` (React provider component)
- `src/app/providers.tsx` (add provider to tree)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

Implementation:
- Create `src/providers/onesignal-provider.tsx` following `posthog-provider.tsx` pattern
- Init OneSignal with app ID from env
- Request push permission on first launch
- On subscription change, call `registerOneSignalPlayerId` mutation
- Add to provider tree in `src/app/providers.tsx`

### Stream B: Notification Event Handlers
**Scope**: Handle notification received (foreground) and clicked (deep link prep) events
**Files**:
- `src/lib/onesignal.ts` (event handler functions)
**Agent Type**: frontend-specialist
**Can Start**: after Stream A (needs SDK initialized)
**Estimated Hours**: 2
**Dependencies**: Stream A

Implementation:
- Foreground notification handler (show in-app banner or suppress)
- Click handler: extract payload `{ type, circleId }` for deep linking (actual navigation handled in #108)
- Permission denial handling (graceful fallback, settings prompt)

## Coordination Points

### Shared Files
- `src/lib/onesignal.ts` — both streams, but Stream B extends Stream A's file
- `src/app/providers.tsx` — Stream A only (add OneSignal provider)

### Sequential Requirements
1. SDK must be initialized (Stream A) before event handlers can be attached (Stream B)

## Conflict Risk Assessment
- **Low Risk**: Stream B extends Stream A's work, natural sequential flow

## Parallelization Strategy

**Recommended Approach**: sequential (single agent)

Stream B depends on Stream A. Single agent working through init → handlers is most efficient.

## Expected Timeline

- Wall time: 6 hours
- Total work: 6 hours

## Notes
- Cordova plugins: `@awesome-cordova-plugins/onesignal` v8.1.0, `onesignal-cordova-plugin` v5.3.1
- For web/dev: OneSignal web SDK may be needed separately; Cordova plugins only work in Capacitor native builds
- Follow PostHogProvider pattern: useEffect for init, Suspense boundary, useAuth for user context
- Player ID registration uses `registerOneSignalPlayerId` mutation from #103
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` env var needed for client-side access
- Deep linking navigation deferred to #108 — click handler here just extracts payload
