---
issue: 182
title: Autonomous Cleanup — FAB rename, dead code, data integrity, accessibility, nav fixes
analyzed: 2026-02-25T03:42:38Z
estimated_hours: 3.5
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #182

## Overview

Mechanical cleanup pass with no design input required. All changes are independent: file deletes, import renames, small targeted edits to individual files. The tasks naturally split into two streams — one touching backend/schema/lib files, one touching frontend UI components.

## Parallel Streams

### Stream A: Backend & Schema Cleanup
**Scope**: Dead code removal in lib files, Convex schema index, FAB component rename (file + imports)
**Files**:
- `src/lib/push.ts` — delete 3 unused push notification wrappers
- `src/lib/email.ts` — delete 3 unused email template wrappers
- `src/components/submissions/VideoThumbnail.tsx` — delete component
- `src/components/submissions/VideoThumbnail.test.tsx` (or similar) — delete test
- `src/components/ui/dropdown-menu.tsx` — evaluate usage, delete if unused
- `convex/schema.ts` — add `by_circle_published` compound index to newsletters table
- `src/components/dashboard/CreateCircleFAB.tsx` → rename to `SubmitFAB.tsx`, update `data-testid`
- `src/app/dashboard/page.tsx` — update import from `CreateCircleFAB` to `SubmitFAB`
- Any test files referencing `create-circle-button` testid
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

### Stream B: Frontend UI Polish
**Scope**: Accessibility audit and fixes, nav routing fix, date picker centering, save button guard
**Files**:
- `src/components/dashboard/DashboardHeader.tsx` — add `aria-label="Menu"` to three-dot button; center date picker with flex layout
- `src/app/dashboard/circles/[circleId]/prompts/page.tsx` — update back arrow href to `/dashboard/circles/${circleId}/settings`
- `src/components/CircleSettings.tsx` — disable save button when `saving === true`, show "Saving..." label
- Global JSX audit for other icon-only buttons missing `aria-label`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 2.0
**Dependencies**: none

## Coordination Points

### Shared Files
None — the two streams touch entirely different files.

### Sequential Requirements
None — all items in both streams are independent.

## Conflict Risk Assessment

- **Low Risk**: Streams A and B work on completely different files with zero overlap. No merge conflicts expected.

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A and B simultaneously. Both can complete independently. Merge order doesn't matter.

**E1 decision (dropdown-menu.tsx)**: Stream A should `grep -r "dropdown-menu" src/` before deleting. If used, skip deletion and note it.

## Expected Timeline

With parallel execution:
- Wall time: 2.0 hours (longest stream)
- Total work: 3.5 hours
- Efficiency gain: ~43%

Without parallel execution:
- Wall time: 3.5 hours

## Notes

- FAB rename: file rename + import update in `dashboard/page.tsx` + test ID update all belong together in Stream A to avoid broken imports mid-stream
- `dropdown-menu.tsx` deletion is conditional — Stream A agent must check imports first
- Convex schema change (R2) is additive only (new index), no risk of breaking existing queries
- Aria-label audit should cover the whole app (not just DashboardHeader) — Stream B agent should `grep` for icon-only buttons
