---
issue: 102
stream: Schema Changes
agent: backend-specialist
started: 2026-02-22T06:06:18Z
status: completed
---

# Stream A: Schema Changes

## Scope
Add notificationPreferences, adminReminders tables and oneSignalPlayerId to users table in convex/schema.ts

## Files
- convex/schema.ts

## Progress
- Added `oneSignalPlayerId: v.optional(v.string())` to users table
- Added `notificationPreferences` table with `by_user` index
- Added `adminReminders` table with `by_circle_cycle` and `by_admin_circle_cycle` indexes
- TypeScript compilation verified
