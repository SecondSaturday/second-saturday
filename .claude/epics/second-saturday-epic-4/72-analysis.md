---
issue: 72
title: Write comprehensive tests and perform manual QA
analyzed: 2026-02-18T15:06:06Z
estimated_hours: 20
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #72

## Overview
Write complete test coverage and perform manual QA for all submission functionality. Most unit and integration tests are already written; the remaining work is missing component tests, E2E test setup, bug fixes from test runs, and the manual QA checklist/process.

## Already Implemented (do not re-do)

### Unit Tests ✅
- `test/unit/submissions.test.ts` — validation logic (500-char limit, media count/type/order, cycle IDs, lock)
- `test/unit/deadlineCalculations.test.ts` — `getSecondSaturdayDeadline` / `getTimeRemaining`
- `test/unit/useDebounce.test.ts` — auto-save debounce logic
- `test/unit/imageCompression.test.ts` — image compression
- `test/unit/image.test.ts` — image utilities

### Integration Tests ✅
- `test/integration/submissions.test.ts` — createSubmission, updateResponse, lockSubmission, addMedia, removeMedia, queries
- `test/integration/mux-webhooks.test.ts` — Mux webhook signature verification and event processing
- `test/integration/mux-upload.test.ts` — Mux upload flow

### Component Tests ✅
- `test/components/submissions/MultiCircleSubmissionScreen.test.tsx`
- `test/components/submissions/DeadlineCountdown.test.tsx`
- `test/components/submissions/MediaUploader.test.tsx`
- `test/components/submissions/VideoThumbnail.test.tsx`
- `test/components/ui/blocking-modal.test.tsx`

## Remaining Work

### What's Missing
1. **Component tests** for `AutoSaveIndicator`, `CircleSubmissionTabs`, `MediaGrid`, `PromptResponseCard`
2. **E2E tests** — no Playwright/Cypress setup or E2E test files exist yet
3. **Test run + bug fixes** — run all tests, surface failures, fix
4. **Manual QA checklist** — document device QA procedures

## Parallel Streams

### Stream A: Missing Component Tests
**Scope**: Write unit/component tests for the 4 untested submission components
**Files**:
- `test/components/submissions/AutoSaveIndicator.test.tsx` (create)
- `test/components/submissions/CircleSubmissionTabs.test.tsx` (create)
- `test/components/submissions/MediaGrid.test.tsx` (create)
- `test/components/submissions/PromptResponseCard.test.tsx` (create)
- Read: `src/components/submissions/AutoSaveIndicator.tsx`
- Read: `src/components/submissions/CircleSubmissionTabs.tsx`
- Read: `src/components/submissions/MediaGrid.tsx`
- Read: `src/components/submissions/PromptResponseCard.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

### Stream B: E2E Test Setup & Tests
**Scope**: Set up Playwright or Cypress, write E2E tests for critical submission flows
**Files**:
- `e2e/` or `test/e2e/` directory (create)
- E2E config file (playwright.config.ts or cypress.config.ts)
- `test/e2e/submission-text.test.ts` — text-only submission flow
- `test/e2e/submission-photo.test.ts` — photo with compression
- `test/e2e/submission-video.test.ts` — video with progress
- `test/e2e/multi-circle.test.ts` — multi-circle tab switching
- `test/e2e/deadline-locking.test.ts` — deadline countdown + lock
- `package.json` (may add dev dependency for Playwright/Cypress)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 8
**Dependencies**: none (implementation complete per #68–#71)

### Stream C: Test Run, Bug Hunt & Fixes
**Scope**: Run the full test suite (unit + integration + component), analyze failures, fix bugs, retest
**Files**:
- Any source files with bugs found: `src/`, `convex/`
- Bug fix commits as needed
**Agent Type**: fullstack-specialist
**Can Start**: after Stream A completes (needs all tests to exist before a comprehensive run)
**Estimated Hours**: 6
**Dependencies**: Stream A

### Stream D: Manual QA Checklist & Documentation
**Scope**: Write the manual QA checklist for real-device testing. Perform QA if devices are available.
**Files**:
- `test/qa/manual-qa-checklist.md` (create)
- `test/qa/device-test-results.md` (create, filled in manually)
**Agent Type**: fullstack-specialist
**Can Start**: immediately (parallel with A & B)
**Estimated Hours**: 2
**Dependencies**: none (checklist writing is independent; actual QA requires human + devices)

## Coordination Points

### Shared Files
- `package.json` — Stream B may add E2E framework dep; coordinate with any other dep changes
- `src/components/submissions/*.tsx` — Stream C may patch bugs; do not conflict with Stream A reads

### Sequential Requirements
1. Stream A must complete before Stream C starts (so all component tests exist)
2. Stream B can start immediately; Stream C should also incorporate E2E failures if B finishes first
3. Stream D (checklist) is independent throughout

## Conflict Risk Assessment
- **Low Risk**: Streams A, B, D work on entirely separate directories
- **Medium Risk**: Stream C writes to `src/` files; may conflict if Stream B is still active when C starts
- **Mitigation**: Start C only after A finishes; coordinate with B's status before touching shared source files

## Parallelization Strategy

**Recommended Approach**: hybrid

- Launch Streams A, B, D simultaneously
- Start Stream C when Stream A completes (B may or may not be done; pull B's work first)

## Expected Timeline

With parallel execution:
- Wall time: ~10 hours (Stream B is the critical path at 8h; C follows A at 4h → 10h total)
- Total work: 20 hours
- Efficiency gain: ~50%

Without parallel execution:
- Wall time: 20 hours

## Notes
- E2E tests require a running dev environment (Convex + Expo/React Native); confirm infra before Stream B starts
- Manual QA on real devices (iOS + Android) is a human task; the agent writes the checklist only
- Existing tests should all pass before closing this issue — Stream C is the gating stream
- The `parallel: false` flag in the task file refers to this issue depending on prior issues (#68–#71), not to internal parallelism within this issue; those are now complete
