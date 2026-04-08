---
issue: 100
title: Write unit tests, integration tests, and E2E tests
analyzed: 2026-02-22T05:13:40Z
estimated_hours: 8
parallelization_factor: 3.0
---

# Parallel Work Analysis: Issue #100

## Overview
Comprehensive test coverage for the newsletter feature across three layers: unit tests for business logic (compilation, formatting, date handling), integration tests for Convex functions (queries, mutations, actions, cron), and E2E tests for user-facing flows (web view, archive, auth, unsubscribe).

## Parallel Streams

### Stream A: Unit Tests — Newsletter Business Logic
**Scope**: Test pure business logic: newsletter compilation (response grouping by prompt, empty prompt omission, member name formatting), date formatting in user timezone, issue number auto-increment, 0-submission detection, email template rendering.
**Files**:
- `test/unit/newsletter.test.ts` (new)
- `test/unit/newsletterEmails.test.ts` (new)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

**Tests to write**:
- `compileNewsletter` logic: organizes responses by prompt correctly
- `compileNewsletter` logic: omits prompts with zero responses
- Member name formatting (fallbacks, truncation)
- Date formatting in user's local timezone
- Issue number auto-increment (first issue = 1, subsequent increments)
- 0-submission detection triggers missed-month flow
- NewsletterEmail template renders sections with media
- MissedMonthEmail template renders with next deadline

**Source files to test against**:
- `convex/newsletters.ts` — `compileNewsletter` internal mutation
- `convex/newsletterEmails.ts` — `sendNewsletter`, `sendMissedMonthEmail`, `processNewsletters`
- `convex/newsletterHelpers.ts` — `getNewsletterSendData`, `getCircleSendData`, `getAllActiveCircles`
- `src/emails/NewsletterEmail.tsx` — email template
- `src/emails/MissedMonthEmail.tsx` — missed-month template

### Stream B: Integration Tests — Convex Functions
**Scope**: Test Convex query/mutation logic: `getNewsletterById` with auth checks, `getNewslettersByCircle` ordering and read status, unsubscribe/resubscribe mutations, `markNewsletterRead` idempotency, `getNewslettersByDate` month filtering, cron second-Saturday check.
**Files**:
- `test/integration/newsletters.test.ts` (new)
- `test/integration/newsletterReads.test.ts` (exists — extend)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

**Tests to write**:
- `getNewsletterById` returns newsletter with read status and circle info
- `getNewsletterById` rejects unauthenticated users
- `getNewslettersByCircle` returns published newsletters newest first
- `getNewslettersByCircle` includes read status per newsletter
- `unsubscribeFromEmail` sets emailSubscribed to false
- `resubscribeToEmail` sets emailSubscribed to true
- `compileNewsletter` with mock submission data (sections structure)
- `sendNewsletter` action mocks Resend API (no real emails)
- Newsletter with 0 submissions triggers missed-month flow
- `updateRecipientCount` updates correctly after send
- `getAllActiveCircles` excludes archived circles
- `processNewsletters` only proceeds on second Saturday
- Extend existing `newsletterReads.test.ts` if gaps found

**Source files to test against**:
- `convex/newsletters.ts` — queries and mutations
- `convex/newsletterEmails.ts` — actions
- `convex/newsletterHelpers.ts` — internal queries/mutations
- `convex/newsletterReads.ts` — read tracking
- `convex/crons.ts` — cron schedule

### Stream C: E2E Tests — User-Facing Flows
**Scope**: Test Playwright flows: newsletter web view loads with correct content, newsletter archive displays past issues, newsletter requires authentication, "View in App" navigation from email link, unsubscribe link functionality.
**Files**:
- `e2e/newsletter-view.spec.ts` (new)
- `e2e/newsletter-archive.spec.ts` (new)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none (tests seed their own data or are resilient to empty states)

**Tests to write**:
- Newsletter web view page loads at `/dashboard/circles/[circleId]/newsletter/[newsletterId]`
- Newsletter web view requires authentication (redirect if not logged in)
- Newsletter shows circle name, issue number, and publication date
- Newsletter displays prompt sections with member responses
- Newsletter archive on circle home shows past issues
- Newsletter archive shows read/unread indicators
- "View in App" link navigates to correct newsletter page
- Unsubscribe link functionality (if exposed as web route)
- Back navigation returns to circle dashboard

**Source files tested**:
- `src/app/dashboard/circles/[circleId]/newsletter/[newsletterId]/page.tsx`
- `src/components/newsletter/NewsletterArchive.tsx`
- `src/components/newsletter/NewsletterView.tsx`

## Coordination Points

### Shared Files
None — each stream writes to separate test directories:
- Stream A: `test/unit/newsletter*.test.ts`
- Stream B: `test/integration/newsletter*.test.ts`
- Stream C: `e2e/newsletter*.spec.ts`

### Sequential Requirements
None — all three streams test different layers against the same source code without modifying it. They can run fully in parallel.

## Conflict Risk Assessment
- **Low Risk**: All streams write to different directories with no overlapping files. No source code modifications needed.

## Parallelization Strategy

**Recommended Approach**: parallel

Launch all three streams simultaneously. Each writes tests in its own directory with no shared state or files.

## Expected Timeline

With parallel execution:
- Wall time: 3 hours (limited by longest stream: A or B)
- Total work: 8 hours
- Efficiency gain: 62%

Without parallel execution:
- Wall time: 8 hours

## Notes
- Existing `test/integration/newsletterReads.test.ts` already has 9 tests for read tracking. Stream B should extend, not duplicate.
- Mock Resend API in integration tests — never send real emails.
- E2E tests should be resilient to empty states (skip if no newsletter data exists, like other e2e tests in the codebase).
- Follow existing test patterns: Vitest for unit/integration, Playwright with Clerk testing tokens for E2E.
- The `compileNewsletter` function is an internal mutation — unit tests should replicate its logic in isolation (same pattern as `test/integration/prompts.test.ts`).
