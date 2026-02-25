---
issue: 183
title: Loading Skeletons — members list and newsletter view
analyzed: 2026-02-25T03:53:40Z
estimated_hours: 2.5
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #183

## Overview

Replace basic spinners with skeleton loading UI in two places: the Members tab in CircleSettings and the NewsletterView. No existing `Skeleton` primitive exists in `src/components/ui/` — both streams should build inline skeleton markup using `animate-pulse bg-muted` Tailwind classes directly (no shared component needed for two use sites).

## Parallel Streams

### Stream A: Members List Skeleton
**Scope**: Add skeleton rows to the Members tab loading state in CircleSettings
**Files**:
- `src/components/CircleSettings.tsx` — replace spinner in Members tab with skeleton rows
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.0
**Dependencies**: none

**Implementation detail**: While members query is loading, render 3-4 skeleton rows. Each row: `rounded-full` circle (avatar size ~40px), two `rounded` bars (name ~120px wide, role ~60px wide). Use `animate-pulse` with `bg-muted` fill. Match the padding/spacing of real member rows to avoid layout shift.

### Stream B: Newsletter View Skeleton
**Scope**: Add skeleton loading state to NewsletterView
**Files**:
- `src/components/newsletter/NewsletterView.tsx` — replace spinner with skeleton layout
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

**Implementation detail**: Skeleton should match newsletter layout: full-width `rounded-lg` cover block (match cover image height), two heading bars (wide + narrow), 2-3 card-shaped blocks for article cards. Use `animate-pulse` with `bg-muted`. Check what the actual loading condition is (Convex query `isLoading` or similar).

## Coordination Points

### Shared Files
None — the two streams touch entirely separate files.

### Sequential Requirements
None — both can proceed simultaneously.

## Conflict Risk Assessment

- **Low Risk**: Completely separate files, zero overlap.

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A and B simultaneously. Both are short, independent, and touch different files.

**Note on Skeleton primitive**: No shared `Skeleton` component is needed for two use sites. Both agents should inline their skeleton markup using Tailwind `animate-pulse bg-muted` classes. If a shared component is desired in future, it can be extracted then.

## Expected Timeline

With parallel execution:
- Wall time: 1.5 hours (longest stream)
- Total work: 2.5 hours
- Efficiency gain: ~40%

Without parallel execution:
- Wall time: 2.5 hours

## Notes

- Neither file currently has a Skeleton import — agents should NOT import from a non-existent `skeleton.tsx`
- The correct loading check pattern depends on how each component currently shows a spinner — agents should read the file first to find the existing loading condition and replace it
- Stream B (NewsletterView) is slightly larger because the newsletter layout has more visual complexity (cover + heading + cards vs. simple list rows)
