---
issue: 102
title: Add notification schema tables and indexes
analyzed: 2026-02-22T06:05:17Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #102

## Overview
Add `notificationPreferences` and `adminReminders` tables plus `oneSignalPlayerId` field to users table in `convex/schema.ts`. This is a single-file, foundational task.

## Parallel Streams

### Stream A: Schema Changes
**Scope**: All schema modifications in one pass
**Files**:
- `convex/schema.ts`
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Implementation Details**:
1. Add `oneSignalPlayerId: v.optional(v.string())` to `users` table (line ~13)
2. Add `notificationPreferences` table after `media` table:
   - userId: `v.id('users')`
   - submissionReminders: `v.boolean()` (default true in app logic)
   - newsletterReady: `v.boolean()` (default true in app logic)
   - createdAt: `v.number()`
   - updatedAt: `v.number()`
   - Index: `by_user` on `['userId']`
3. Add `adminReminders` table:
   - circleId: `v.id('circles')`
   - adminUserId: `v.id('users')`
   - targetUserId: `v.optional(v.id('users'))` (null = bulk reminder)
   - cycleId: `v.string()` (format: YYYY-MM, matches existing pattern)
   - sentAt: `v.number()`
   - Index: `by_circle_cycle` on `['circleId', 'cycleId']`
   - Index: `by_admin_circle_cycle` on `['adminUserId', 'circleId', 'cycleId']`

## Coordination Points

### Shared Files
- `convex/schema.ts` — only file modified, single stream

### Sequential Requirements
None — this is a single atomic change.

## Conflict Risk Assessment
- **Low Risk**: Single file, single stream, no other tasks touch schema yet

## Parallelization Strategy

**Recommended Approach**: sequential

Single stream, ~2 hours. No benefit from parallelization.

## Expected Timeline

- Wall time: 2 hours
- Total work: 2 hours

## Notes
- Follow existing patterns: `v.id('users')` for foreign keys, `v.number()` for timestamps, `v.optional()` for nullable fields
- cycleId format is `YYYY-MM` (matches submissions and newsletters tables)
- Validate with `npx convex dev` after changes
