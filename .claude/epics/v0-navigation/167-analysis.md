---
issue: 167
title: Top-level submit page and FAB repurpose
analyzed: 2026-02-24T19:21:33Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #167

## Overview

Create `/dashboard/submit` page that fetches all user circles and renders `MultiCircleSubmissionScreen` with all of them as tabs. Change the FAB href from `/dashboard/create` to `/dashboard/submit`. Dependency on #164 (header menu) is already complete.

## Parallel Streams

### Stream A: Submit page + FAB (single stream)
**Scope**: New page + 1-line FAB change
**Files**:
- `src/app/dashboard/submit/page.tsx` (new — ~60 lines)
- `src/components/dashboard/CreateCircleFAB.tsx` (1-line href change)
**Agent Type**: frontend
**Can Start**: immediately (#164 complete)
**Estimated Hours**: 2
**Dependencies**: none remaining

## Coordination Points

### Shared Files
None — new file + trivial edit to FAB component (no other task touches it).

## Conflict Risk Assessment
- **Low Risk**: New page in unused route, minimal FAB edit.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

### Implementation plan:

1. **Create `src/app/dashboard/submit/page.tsx`:**
   - Client component with `'use client'`
   - `cycleId` computed via `useMemo` using UTC methods (same pattern as existing submit page)
   - Fetch circles via `useQuery(api.circles.getCirclesByUser)` (exists, takes no args)
   - For each circle, also fetch submission status via `useQuery(api.submissions.getSubmissionForCircle, { circleId, cycleId })`
   - OR use a batch query if one exists
   - Map circles to `Circle[]` format: `{ id, name, iconUrl, status }`
   - Status derivation: `submittedAt → 'submitted'`, `lockedAt → 'locked'`, submission exists → `'in-progress'`, else `'not-started'`
   - Loading state while data fetches
   - Empty state if no circles: "Join or create a circle to start"
   - Render `MultiCircleSubmissionScreen` with `circles` and `cycleId`
   - Header with back arrow to `/dashboard`

2. **Challenge: fetching submission status for ALL circles**
   - The existing per-circle submit page queries `getSubmissionForCircle` once
   - The new page needs submission status for N circles — can't call useQuery N times (hooks)
   - Solutions: (a) create a new batch query `getSubmissionsForAllCircles`, or (b) fetch without status and let `MultiCircleSubmissionScreen` handle it internally, or (c) use a map of queries
   - Check if `MultiCircleSubmissionScreen` fetches its own submission data internally — if so, just pass circles with `status: 'not-started'` as default

3. **Change FAB href:**
   - `CreateCircleFAB.tsx`: change `href="/dashboard/create"` to `href="/dashboard/submit"`

## Expected Timeline

- Wall time: 2 hours
- Total work: 2 hours

## Notes
- The submission status fetch is the main complexity — need to understand if MultiCircleSubmissionScreen handles its own data or relies on the `status` prop for initial display
- `getCirclesByUser` returns rich data (name, iconUrl, member count) — may not need additional queries
- Test the FAB test (`CreateCircleFAB.test.tsx`) — it may assert the href value
