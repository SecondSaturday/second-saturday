---
issue: 70
title: Build multi-circle submission UI with auto-save and tabs
analyzed: 2026-02-17T11:36:30Z
estimated_hours: 14
parallelization_factor: 1.8
---

# Parallel Work Analysis: Issue #70

## Overview

Build the main submission screen (`MultiCircleSubmissionScreen`) integrating the existing submission components with a `useDebounce` hook for auto-save, PostHog analytics events, and full test coverage. Most building blocks are already implemented as untracked files on this branch — this task is primarily about integration and completing the missing pieces.

## What's Already Built

The following components are implemented but not yet committed:
- `src/components/submissions/CircleSubmissionTabs.tsx` — Instagram Stories-style tabs with status rings
- `src/components/submissions/AutoSaveIndicator.tsx` — saving/saved/error/offline states
- `src/components/submissions/PromptResponseCard.tsx` — text input with 500-char counter + MediaUploader
- `src/components/submissions/MediaGrid.tsx` — 3-item media preview grid with remove
- `src/components/submissions/DeadlineCountdown.tsx` — live countdown timer
- `src/components/submissions/MediaUploader.tsx` — photo + video upload (Mux)
- `src/components/submissions/VideoThumbnail.tsx` — Mux processing status
- `convex/submissions.ts` — all backend mutations/queries
- `src/hooks/useBlockingUpload.ts` — upload state management

## What's Missing

1. `src/hooks/useDebounce.ts` — debounce hook for auto-save trigger
2. `src/screens/submissions/MultiCircleSubmissionScreen.tsx` — main integration screen
3. PostHog analytics events wired into the screen
4. Unit tests for the screen and hooks
5. E2E tests for the submission flow

---

## Parallel Streams

### Stream A: useDebounce Hook
**Scope**: Create the missing debounce hook used by the auto-save feature
**Files**:
- `src/hooks/useDebounce.ts`
- `src/hooks/index.ts` (add export)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 0.5
**Dependencies**: none

### Stream B: MultiCircleSubmissionScreen
**Scope**: Main integration screen composing all existing components; manages per-circle draft state, auto-save with debounce, loading/error states, and submission actions
**Files**:
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx`
- `src/screens/submissions/index.ts` (create/update exports)
**Agent Type**: frontend-specialist
**Can Start**: after Stream A completes (needs `useDebounce`)
**Estimated Hours**: 8
**Dependencies**: Stream A

### Stream C: PostHog Analytics
**Scope**: Wire the required analytics events into `MultiCircleSubmissionScreen`:
`submission_started`, `submission_photo_added`, `submission_video_added`, `submission_saved_draft`, `submission_completed`
**Files**:
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx` (same file as Stream B)
**Agent Type**: frontend-specialist
**Can Start**: after Stream B completes
**Estimated Hours**: 1.5
**Dependencies**: Stream B

### Stream D: Tests
**Scope**: Unit tests for `useDebounce` and the submission screen logic; E2E tests for the full submission flow
**Files**:
- `test/unit/useDebounce.test.ts`
- `test/components/submissions/MultiCircleSubmissionScreen.test.tsx`
- `test/e2e/submissionFlow.test.ts` (or equivalent)
**Agent Type**: fullstack-specialist
**Can Start**: after Stream B completes (Stream C can run in parallel)
**Estimated Hours**: 4
**Dependencies**: Stream B

---

## Coordination Points

### Shared Files
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx` — Streams B and C touch the same file (must be sequential)
- `src/hooks/index.ts` — Stream A only; no conflict with others

### Sequential Requirements
1. Stream A (useDebounce hook) → Stream B (screen implementation)
2. Stream B → Stream C (analytics wiring into screen) and Stream D (tests)
3. Streams C and D can run in parallel once B is done

---

## Conflict Risk Assessment

- **Low Risk**: Streams A, B, C, D touch distinct files except B→C which are sequential by design
- **No Risk**: Hook files are untouched by other epics in flight

---

## Parallelization Strategy

**Recommended Approach**: hybrid

1. **Phase 1**: Stream A (0.5h) — fast, unblocks everything
2. **Phase 2**: Stream B (8h) — primary implementation work
3. **Phase 3**: Streams C + D in parallel (1.5h ‖ 4h = 4h wall time) — analytics and tests simultaneously

---

## Expected Timeline

With parallel execution (phases):
- Wall time: ~13.5 hours
- Total work: 14 hours
- Efficiency gain: ~3.5% (limited by sequential core; Phase 3 saves ~1.5h)

Without parallel execution:
- Wall time: 14 hours

> Note: The task description marks `parallel: false` meaning this issue doesn't run in parallel with *other* issues — internal stream parallelization is still beneficial for Phase 3.

---

## Notes

- `PromptResponseCard` already embeds `MediaUploader` — `MultiCircleSubmissionScreen` does not need to manage media state directly; it only needs to track which responses have been saved and trigger `updateResponse` via `useDebounce`.
- Per-circle draft state should be stored in a `Map<circleId, Map<promptId, string>>` in React state — Convex is the source of truth on load; local state diverges on user input until auto-saved.
- The existing `getSubmissionForCircle` query returns responses with media, so the screen can initialise draft state from the query result.
- If a submission doesn't exist yet for a circle, `createSubmission` must be called before `updateResponse`. Handle this in the auto-save effect.
- PostHog is already used elsewhere in the codebase (`useAuthAnalytics.ts`) — follow the same pattern.
