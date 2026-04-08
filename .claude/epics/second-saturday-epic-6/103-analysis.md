---
issue: 103
title: Implement notification Convex functions
analyzed: 2026-02-22T06:08:21Z
estimated_hours: 8
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #103

## Overview
Create `convex/notifications.ts` with all notification queries, mutations, and actions. Includes preference management, push notification sending via OneSignal REST API, and admin reminder tracking (max 3 per cycle). Existing `src/lib/push.ts` already has OneSignal REST API stubs to reference.

## Parallel Streams

### Stream A: Preference & Registration Functions
**Scope**: Notification preference queries/mutations and OneSignal player ID registration
**Files**:
- `convex/notifications.ts` (preference-related functions)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

Functions:
- `getNotificationPreferences` query (return user prefs with defaults if none set)
- `updateNotificationPreferences` mutation (create/update)
- `registerOneSignalPlayerId` mutation (store on users table)

### Stream B: Push Sending & Admin Reminder Functions
**Scope**: OneSignal push sending action, admin reminder mutations with count enforcement
**Files**:
- `convex/notifications.ts` (push + admin reminder functions)
**Agent Type**: backend-specialist
**Can Start**: immediately (same file but independent functions)
**Estimated Hours**: 5
**Dependencies**: none

Functions:
- `sendPushNotification` action (OneSignal REST API, follows newsletterEmails.ts pattern with `internalAction` + `'use node'`)
- `sendAdminReminder` mutation (individual, tracks in adminReminders, enforces max 3)
- `sendBulkAdminReminder` mutation (all non-submitters, counts as 1 reminder)
- `getAdminReminderCount` query (count for current cycle)
- Helper: `getNonSubmitters` internal query (active members who haven't submitted)

## Coordination Points

### Shared Files
- `convex/notifications.ts` — both streams write to same file, must be merged

### Sequential Requirements
1. Both streams can develop independently but must merge into single file
2. `sendAdminReminder` calls `sendPushNotification` — Stream B is self-contained

## Conflict Risk Assessment
- **Medium Risk**: Both streams write to same file, but functions are independent — can be written sequentially by same agent

## Parallelization Strategy

**Recommended Approach**: sequential (single agent)

Since both streams target the same file, a single agent writing all functions sequentially is more practical than coordinating two agents on the same file. The 2.0x factor comes from the two logical groups being independently testable.

## Expected Timeline

- Wall time: 8 hours (sequential, single file)
- Total work: 8 hours

## Notes
- Follow `convex/newsletterEmails.ts` pattern for `internalAction` with `'use node'`
- Use `ctx.runQuery()` / `ctx.runMutation()` for data access within actions
- Existing `src/lib/push.ts` has OneSignal REST API patterns to reference
- Member resolution: follow `newsletterHelpers.ts` pattern (filter by `!leftAt && !blocked`)
- Non-submitter filtering: query submissions by circle+cycle, exclude submitted members
- Environment vars: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
