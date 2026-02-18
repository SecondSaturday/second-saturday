---
issue: 71
stream: Date Utilities & Scheduled Locking Backend
agent: backend-specialist
started: 2026-02-18T05:38:02Z
status: completed
---

# Stream A: Date Utilities & Scheduled Locking Backend

## Scope
Extend date utilities with deadline-aware functions, add Convex scheduled function for automatic locking, add deadline query

## Files
- `src/lib/dates.ts`
- `convex/submissions.ts`
- `convex/crons.ts` (new - Convex cron job)

## Completed
- Added `getSecondSaturdayDeadline(date)` to `src/lib/dates.ts`
- Added `getTimeRemaining(deadline)` to `src/lib/dates.ts`
- Added `getDeadlineStatus` query to `convex/submissions.ts`
- Created `convex/crons.ts` with `lockPastDeadlineSubmissions` internal mutation running at 10:59 AM UTC every Saturday
