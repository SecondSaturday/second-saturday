---
issue: 71
title: Implement deadline countdown and submission locking
analyzed: 2026-02-12T11:19:25Z
estimated_hours: 9
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #71

## Overview
Build a deadline enforcement system with a real-time countdown component, automatic submission locking at 10:59 AM UTC on the second Saturday, and locked-state UI. The backend schema (`lockedAt` field) and locking mutations already exist — this issue focuses on the countdown UI, scheduled locking, and locked-state enforcement in the frontend.

## Parallel Streams

### Stream A: Date Utilities & Scheduled Locking Backend
**Scope**: Extend date utilities with deadline-aware functions, add Convex scheduled function for automatic locking, add deadline query
**Files**:
- `src/lib/dates.ts`
- `convex/submissions.ts`
- `convex/crons.ts` (new - Convex cron job)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

Key work:
- Add `getDeadlineForCycle(cycleId: string): Date` returning 10:59 AM UTC on second Saturday
- Add `getTimeRemaining(deadline: Date): { days, hours, minutes, seconds }`
- Create Convex cron or scheduled function to lock all unlocked submissions at deadline
- Add query `getDeadlineStatus` returning deadline timestamp and lock state

### Stream B: DeadlineCountdown Component & UI
**Scope**: Build the countdown display component, locked-state UI, and integrate into submission pages
**Files**:
- `src/components/submissions/DeadlineCountdown.tsx` (new)
- `src/hooks/useDeadlineCountdown.ts` (new)
- `src/app/dashboard/circles/[circleId]/submissions/page.tsx`
- `src/components/AdminSubmissionDashboard.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately (can stub date utils initially)
**Estimated Hours**: 4
**Dependencies**: none (uses date utils from Stream A but can stub)

Key work:
- `useDeadlineCountdown` hook with `setInterval` for real-time updates
- `DeadlineCountdown` component showing days/hours/minutes/seconds
- Locked state badge and disabled editing UI
- Timezone-aware display (convert UTC deadline to user local)
- Visual urgency indicators (color changes as deadline approaches)

### Stream C: Tests
**Scope**: Unit tests for date calculations, component tests for countdown, integration test for locking
**Files**:
- `test/unit/deadlineCountdown.test.ts` (new)
- `test/unit/dates.test.ts` (new or extend)
- `test/components/submissions/DeadlineCountdown.test.tsx` (new)
**Agent Type**: test-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 2
**Dependencies**: Stream A, Stream B

## Coordination Points

### Shared Files
- `src/lib/dates.ts` - Stream A writes utility functions, Stream B imports them
- `convex/submissions.ts` - Stream A adds query, Stream B consumes it

### Sequential Requirements
1. Stream A date utilities before Stream C tests
2. Stream B component before Stream C component tests
3. Streams A & B can run fully in parallel

## Conflict Risk Assessment
- **Low Risk**: Streams work on mostly different files. Only `src/lib/dates.ts` and `convex/submissions.ts` are shared, and Stream A owns the writes while Stream B only reads.

## Parallelization Strategy

**Recommended Approach**: hybrid

Launch Streams A & B simultaneously. Start Stream C when both A and B complete.

## Expected Timeline

With parallel execution:
- Wall time: 6 hours (max of A+C or B+C)
- Total work: 9 hours
- Efficiency gain: 33%

Without parallel execution:
- Wall time: 9 hours

## Notes
- The `lockedAt` field and `lockSubmission` mutation already exist in `convex/submissions.ts` — no schema changes needed
- Existing `updateResponse`, `addMediaToResponse`, `removeMediaFromResponse` already check for locked state
- Convex supports cron jobs via `convex/crons.ts` — preferred over client-side locking
- The admin dashboard already has a deadline display placeholder that can be enhanced
- Circle schema includes a `timezone` field that may be useful for display
