---
name: v0-plumbing
description: Backend bug fixes, security hardening, error handling, validation, and cleanup for V0 launch
status: completed
created: 2026-02-24T15:37:53Z
---

# PRD: v0-plumbing

## Executive Summary

Fix all backend bugs, security vulnerabilities, error handling gaps, validation issues, and dead code before V0 launch. These are code-only changes with no UI modifications — the entire epic runs autonomously in a separate worktree without design input. It runs in parallel with the hands-on UI navigation epic (v0-navigation).

## Problem Statement

The V0 codebase has 22 issues across 5 categories that must be fixed before launch:

- **3 P0 data bugs** that can cause duplicate newsletters, orphaned submissions, and confusing error states
- **6 P1 security vulnerabilities** where Convex queries/mutations have no authorization checks, allowing any user to read, create, or delete other users' data
- **5 P1 error handling gaps** where mutations fail silently with no user feedback
- **2 P1 validation gaps** where users can save empty or invalid data
- **6 P2 hygiene issues** including leaked API keys in console, debug logging in production, and memory leaks

These issues were identified through automated codebase scanning (6 parallel agents) and manual code review, documented in `.claude/v0-launch-issues.md`.

## User Stories

### US1: Newsletter Admin
**When** the newsletter compilation cron retries after a transient failure,
**I want** the system to not create duplicate newsletters,
**So that** my circle members don't receive the same newsletter twice.

**Acceptance Criteria:**
- `compileNewsletter` checks for existing newsletter with matching `circleId + cycleId` before inserting
- If a newsletter already exists for that cycle, return the existing one without creating a duplicate
- Existing newsletter email sending logic remains unchanged

### US2: International User
**When** I create a submission near a month boundary in a timezone far from UTC (e.g., UTC+13),
**I want** my submission to be assigned to the correct cycle,
**So that** it appears in the right month's newsletter.

**Acceptance Criteria:**
- Client-side `cycleId` computation uses `getUTCFullYear()` and `getUTCMonth()` instead of local time methods
- `cycleId` matches the server-side convention used in `convex/newsletterEmails.ts`

### US3: Submitting User
**When** I type a response and immediately click Submit,
**I want** the submission to succeed without showing a false error,
**So that** I don't think my submission failed when it actually went through.

**Acceptance Criteria:**
- Pending debounced auto-save is either cancelled or flushed before `lockSubmission` is called
- No error indicator appears after a successful submission
- If submission genuinely fails, a toast error message is shown (B3)

### US4: Any User
**When** a backend operation fails (profile save, account deletion, image upload, clipboard copy),
**I want** to see a clear error message,
**So that** I know the action didn't succeed and can try again.

**Acceptance Criteria:**
- B3: `lockSubmission` failure shows `toast.error()`
- B4: Profile save failure shows `toast.error()` instead of only `console.error()`
- B5: Account deletion failure shows `toast.error()` instead of only `console.error()`
- B6: CircleSettings image upload wrapped in try/catch with `toast.error()` on failure
- B7: Clipboard copy wrapped in try/catch with fallback or error toast

### US5: Circle Admin
**When** I look at the submission dashboard after the deadline,
**I want** to see which members explicitly submitted vs which were auto-locked by the system,
**So that** I know who actually participated.

**Acceptance Criteria:**
- Status derivation checks both `submittedAt` and `lockedAt` independently
- Cron sets only `lockedAt` (not `submittedAt`) when auto-locking submissions where the user never explicitly submitted
- UI shows lock icon for cron-locked submissions, checkmark for user-submitted ones

## Requirements

### Functional Requirements

#### FR1: Newsletter Idempotency (A1) [P0]
- Add idempotency guard to `compileNewsletter` in `convex/newsletters.ts:283-324`
- Query for existing newsletter matching `circleId + cycleId` before inserting
- If exists, return early with existing newsletter ID
- **File:** `convex/newsletters.ts`

#### FR2: UTC CycleId (A2) [P0]
- Change `src/app/dashboard/circles/[circleId]/submit/page.tsx:17-19` from `getFullYear()`/`getMonth()` to `getUTCFullYear()`/`getUTCMonth()`
- **File:** `src/app/dashboard/circles/[circleId]/submit/page.tsx`

#### FR3: Auto-save Race Condition (A3) [P0]
- Cancel or flush pending debounced auto-save when user clicks Submit
- Options: cancel the debounce timer on submit, or flush saves synchronously before locking, or check if submission is already locked before debounced save fires
- **File:** `src/screens/submissions/MultiCircleSubmissionScreen.tsx:137-219`

#### FR4: Locked Status Derivation (A4) [P1]
- Update status derivation in `submit/page.tsx:41-45` to check both `submittedAt` and `lockedAt`
- If `lockedAt` exists and `submittedAt === lockedAt` (cron set both), derive `'locked'`
- If `submittedAt < lockedAt` (user submitted before deadline), derive `'submitted'`
- Update cron in `convex/crons.ts:36` to NOT set `submittedAt` when user never explicitly submitted — change `submittedAt: submission.submittedAt ?? now` to only set `lockedAt`
- **Files:** `src/app/dashboard/circles/[circleId]/submit/page.tsx`, `convex/crons.ts`

#### FR5: Security — Video Functions Auth (P1-P4) [P1]
- `createVideo` (`convex/videos.ts:5-24`): Remove `userId` parameter. Extract from `ctx.auth.getUserIdentity()` using `getAuthUser` helper pattern. Reject unauthenticated calls.
- `getVideo` (`convex/videos.ts:113-118`): Add auth check. Verify caller is video owner or circle member.
- `getVideosByUser` (`convex/videos.ts:121-130`): Add auth check. Restrict to caller's own videos or verify shared circle membership.
- `deleteVideo` (`convex/videos.ts:145-151`): Add auth check. Verify caller is video owner or circle admin.
- **File:** `convex/videos.ts`
- **Pattern to follow:** Same `getAuthUser` + `requireMembership` pattern used in `convex/submissions.ts:7-33`

#### FR6: Security — User/Membership Auth (P5-P6) [P1]
- `getUserByClerkId` (`convex/users.ts:55-63`): Add auth check via `ctx.auth.getUserIdentity()`. Restrict to caller's own record or make internal-only.
- `getMembershipCount` (`convex/memberships.ts:81-91`): Add auth check. Require caller to be a member of the circle, or make internal-only.
- **Files:** `convex/users.ts`, `convex/memberships.ts`
- **Note:** `getCircleMembers` at `memberships.ts:44` already has auth — only `getMembershipCount` is missing it.

#### FR7: Error Handling (B3-B7) [P1]
- B3: Add `catch` block to `handleSubmit` in `MultiCircleSubmissionScreen.tsx:72-83` with `toast.error()`.
- B4: Add `toast.error('Failed to save profile.')` in catch block at `settings/page.tsx:77-78`.
- B5: Add `toast.error('Failed to delete account.')` in catch block at `settings/page.tsx:188-190`.
- B6: Wrap `updateCircle` calls in `CircleSettings.tsx:136-143` with async try/catch and `toast.error()`.
- B7: Wrap `navigator.clipboard.writeText()` in `CircleSettings.tsx:72-79` with try/catch. Fallback to `document.execCommand('copy')` or show toast with manual copy instruction.
- **Files:** `src/screens/submissions/MultiCircleSubmissionScreen.tsx`, `src/app/dashboard/settings/page.tsx`, `src/components/CircleSettings.tsx`

#### FR8: Validation (C1-C2) [P1]
- C1: Add `name.trim().length < 1` check before save in `settings/page.tsx:62-81`. Show `toast.error('Name cannot be empty')`.
- C2: Add `name.trim().length < 3` check in `CircleSettings.tsx:96-121` to match create flow validation. Show `toast.error('Name must be at least 3 characters')`.
- **Files:** `src/app/dashboard/settings/page.tsx`, `src/components/CircleSettings.tsx`

#### FR9: Console Log Cleanup (D1-D2) [P2]
- D1: Remove `console.log` at `onesignal.ts:89` (leaks App ID) and `onesignal.ts:103` (leaks subscription ID). Either remove entirely or gate behind `process.env.NODE_ENV === 'development'`.
- D2: Remove all debug `console.log` statements in: `src/lib/onesignal.ts` (6 logs), `src/providers/capacitor-provider.tsx` (3 logs), `src/lib/image.ts:48` (1 log), `src/providers/onesignal-provider.tsx:71` (1 log). Keep `console.error` in catch blocks.
- **Files:** `src/lib/onesignal.ts`, `src/providers/capacitor-provider.tsx`, `src/lib/image.ts`, `src/providers/onesignal-provider.tsx`

#### FR10: Demo Page Guard (D3) [P2]
- Add `if (process.env.NODE_ENV !== 'development') notFound()` at top of `src/app/demo-submissions/page.tsx`, or delete the page entirely.
- **File:** `src/app/demo-submissions/page.tsx`

#### FR11: ObjectURL Memory Leak (D4) [P2]
- In `src/components/circles/ImageUpload.tsx:72`, revoke previous ObjectURL before creating new one: `if (preview) URL.revokeObjectURL(preview)`.
- **File:** `src/components/circles/ImageUpload.tsx`

#### FR12: Orphan Media Cleanup (A5) [P2]
- Handle `video.asset.errored` webhook in `convex/http.ts` to delete the corresponding media record from the `media` table when Mux processing fails.
- Alternatively, add a scheduled job that cleans up media records stuck in "processing" state for more than 1 hour.
- **Files:** `convex/http.ts`, `convex/videos.ts`

### Non-Functional Requirements

- **Zero UI changes:** All fixes are backend, validation, or console-level. No component styling or layout changes.
- **Backward compatible:** No schema migrations required. Auth checks are additive.
- **Test coverage:** Each fix should include or update a corresponding unit/integration test.
- **No breaking changes to existing API contracts:** Frontend callers of secured Convex functions may need updates if parameter signatures change (e.g., `createVideo` removing `userId` param).

## Success Criteria

- All 3 P0 bugs fixed and verified (newsletter idempotency, UTC cycleId, auto-save race)
- All 6 security vulnerabilities patched (every public Convex query/mutation has auth checks)
- All 5 error handling gaps show user-facing toast errors instead of silent failures
- Both validation gaps enforce minimum lengths
- Zero `console.log` statements leak sensitive data in production
- Demo page not accessible in production
- All existing tests still pass (926/926)
- New tests added for: idempotency guard, auth checks on video functions, validation logic

## Constraints & Assumptions

- **Convex auth pattern:** Follow the existing `getAuthUser` + `requireMembership` pattern from `convex/submissions.ts` and `convex/memberships.ts` for consistency
- **Toast library:** Use the existing `toast` import from sonner (already used across the app)
- **No schema changes:** Auth checks are code-level, not schema-level. The `createVideo` mutation signature changes (removes `userId` param) — all callers must be updated
- **Frontend callers of `createVideo`:** `src/components/submissions/MediaUploader.tsx` passes `userId` to `createVideo` — this call must be updated to omit `userId` after the mutation extracts it from auth

## Out of Scope

- UI changes of any kind
- New features
- Rate limiting (deferred to V0.1)
- Notification history/storage (deferred to V0.1)
- Offline support
- Schema migrations

## Dependencies

- **No blockers:** This epic has zero dependencies on other V0 epics
- **Enables:** Must merge before Epic 3 (Screen Redesigns) starts, so backend fixes are in place for UI work
- **Parallel with:** Epic 2 (Navigation & Structure) — different files, minimal merge conflict risk
