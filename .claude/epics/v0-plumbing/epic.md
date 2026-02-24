---
name: v0-plumbing
status: completed
created: 2026-02-24T16:08:57Z
progress: 100%
prd: .claude/prds/v0-plumbing.md
github: https://github.com/SecondSaturday/second-saturday/issues/154
---

# Epic: v0-plumbing

## Overview

Backend bug fixes, security hardening, error handling, validation, and cleanup for V0 launch. All changes are code-only (no UI modifications). The work touches Convex backend functions, frontend mutation callers, and console output hygiene. Every fix follows existing codebase patterns — the `getAuthUser`/`requireMembership` helpers from `convex/submissions.ts`, the `toast` import from `sonner`, and the existing Vitest test structure.

## Architecture Decisions

- **Auth pattern:** Reuse the existing `getAuthUser` + `requireMembership` module-level helpers already in `convex/submissions.ts` and `convex/memberships.ts`. Copy them into `convex/videos.ts` and `convex/users.ts` rather than extracting a shared module (matches current codebase convention — each Convex file has its own copy).
- **Idempotency:** Query-before-insert guard in `compileNewsletter`, not a unique index (Convex doesn't support unique compound indexes on arbitrary fields).
- **Auto-save race:** Cancel the debounce timer on submit rather than flushing it. Simpler and avoids double-write. Use a ref to track lock state so the debounced effect can bail out if submission was locked.
- **`createVideo` signature change:** Remove `userId` param from the mutation args and extract from `ctx.auth` inside the handler. Update the single caller in `MediaUploader.tsx`.
- **`getUserByClerkId` / `getMembershipCount`:** Convert to `internalQuery` since they are only called from other Convex functions and webhooks, not from the frontend. This is the simplest way to lock them down.
- **Error handling:** Add `toast.error()` in existing catch blocks. No new error boundary or global handler needed.
- **Console cleanup:** Delete `console.log` lines outright (no dev-gate wrapper). The app has no structured logging anyway.

## Technical Approach

### Backend (Convex)

| File | Change |
|------|--------|
| `convex/newsletters.ts` | Add idempotency guard: query for existing newsletter by `circleId + cycleId` before insert in `compileNewsletter` |
| `convex/crons.ts` | Stop setting `submittedAt` on auto-lock: change `submittedAt: submission.submittedAt ?? now` to only patch `submittedAt` when it already exists |
| `convex/videos.ts` | Add `getAuthUser`/`requireMembership` helpers. Secure all 4 public functions: `createVideo` (remove `userId` arg, extract from auth), `getVideo` (auth + ownership/membership check), `getVideosByUser` (restrict to own videos), `deleteVideo` (auth + ownership check) |
| `convex/users.ts` | Convert `getUserByClerkId` to `internalQuery` |
| `convex/memberships.ts` | Convert `getMembershipCount` to `internalQuery` |
| `convex/http.ts` | Handle `video.asset.errored` webhook to delete orphaned media records |

### Frontend

| File | Change |
|------|--------|
| `src/app/dashboard/circles/[circleId]/submit/page.tsx` | Fix UTC cycleId (`getUTCFullYear`/`getUTCMonth`); update status derivation to distinguish user-submitted vs cron-locked |
| `src/screens/submissions/MultiCircleSubmissionScreen.tsx` | Cancel debounced auto-save on submit; add `toast.error()` on `lockSubmission` failure |
| `src/app/dashboard/settings/page.tsx` | Add `toast.error()` for profile save and account deletion failures; add `name.trim()` validation |
| `src/components/CircleSettings.tsx` | Wrap image upload and clipboard copy in try/catch with `toast.error()`; add circle name min-length validation |
| `src/components/submissions/MediaUploader.tsx` | Remove `userId` arg from `createVideo` call |

### Cleanup

| File | Change |
|------|--------|
| `src/lib/onesignal.ts` | Remove all `console.log` (keep `console.error`) |
| `src/providers/capacitor-provider.tsx` | Remove all `console.log` |
| `src/lib/image.ts` | Remove `console.log` at line 48 |
| `src/providers/onesignal-provider.tsx` | Remove `console.log` at line 71 |
| `src/app/demo-submissions/page.tsx` | Delete the file entirely (unused demo page) |
| `src/components/circles/ImageUpload.tsx` | Revoke previous ObjectURL before creating new one |

## Implementation Strategy

**Single-pass, no phases.** All changes are independent at the file level and have no ordering dependencies. The entire epic can be implemented in one pass, tested, and merged.

**Risk mitigation:**
- `createVideo` signature change is the only breaking change — grep for all callers before changing.
- Converting queries to `internalQuery` could break frontend callers — verify no frontend imports before converting.
- Run the full test suite (`npm test`) after each task to catch regressions early.

**Testing approach:**
- Add unit tests for: newsletter idempotency guard, video auth checks, validation logic, UTC cycleId computation.
- Existing 926 tests must continue to pass.

## Task Breakdown Preview

- [ ] Task 1: Fix P0 data bugs — newsletter idempotency, UTC cycleId, auto-save race condition (FR1, FR2, FR3)
- [ ] Task 2: Fix cron locked-status derivation — stop setting `submittedAt` on auto-lock, update frontend status logic (FR4)
- [ ] Task 3: Secure video functions — add auth to all 4 public functions in `convex/videos.ts`, update `MediaUploader.tsx` caller (FR5)
- [ ] Task 4: Secure user/membership queries — convert `getUserByClerkId` and `getMembershipCount` to internal queries (FR6)
- [ ] Task 5: Add error handling — toast errors for submit, profile save, account delete, image upload, clipboard copy (FR7)
- [ ] Task 6: Add validation — profile name and circle name minimum length checks (FR8)
- [ ] Task 7: Cleanup — remove console.logs, delete demo page, fix ObjectURL memory leak, handle orphaned media (FR9-FR12)
- [ ] Task 8: Add tests — unit tests for idempotency, auth, validation, and cycleId logic

## Dependencies

- **External:** None. No new packages or services required.
- **Internal:** None. This epic has zero dependencies on other V0 epics.
- **Prerequisite:** None. Can start immediately.
- **Downstream:** Must merge before Epic 3 (Screen Redesigns) so backend fixes are in place for UI work.

## Success Criteria (Technical)

- All 3 P0 bugs fixed: duplicate newsletters impossible, cycleId is UTC-consistent, auto-save doesn't race with submit
- All 6 Convex functions have auth checks (4 in videos.ts, 2 converted to internal)
- All 5 error handling gaps show `toast.error()` instead of silent console.error
- Both validation gaps enforce minimum name lengths
- Zero `console.log` statements leak sensitive data in production
- Demo page returns 404 in production
- ObjectURL memory leak fixed
- Orphaned media cleanup on Mux webhook error
- All existing tests pass + new tests for idempotency, auth, validation, cycleId

## Tasks Created
- [ ] #155 - Fix P0 data bugs (parallel: true)
- [ ] #156 - Fix cron locked-status derivation (parallel: true)
- [ ] #157 - Secure video functions with auth (parallel: true)
- [ ] #158 - Secure user and membership queries (parallel: true)
- [ ] #159 - Add error handling with toast notifications (parallel: true)
- [ ] #160 - Add input validation for names (parallel: true)
- [ ] #161 - Code cleanup and hygiene fixes (parallel: true)
- [ ] #162 - Add tests for new logic (parallel: false, depends on #155/#156/#157/#160)

Total tasks: 8
Parallel tasks: 7
Sequential tasks: 1 (#162 — tests, depends on implementation tasks)

## Estimated Effort

- **8 tasks**, 7 parallelizable + 1 sequential (tests)
- **Critical path:** Task 3 (video auth) is the largest — touches 2 files with 4 function rewrites + 1 caller update
- **Lowest risk:** Tasks 6-7 (validation, cleanup) are one-liner changes
- **Resource:** Single developer can complete all tasks sequentially; 2 developers can split backend (Tasks 1-4) and frontend (Tasks 5-7) in parallel
