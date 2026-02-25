---
name: second-saturday-epic-5
status: complete
created: 2026-02-21T09:53:16Z
updated: 2026-02-23T00:00:00Z
progress: 100%
completed: 2026-02-23T00:00:00Z
prd: .claude/prds/second-saturday-epic-5.md
github: https://github.com/SecondSaturday/second-saturday/issues/135
---

# Epic: Newsletter Experience

## Overview

Build the newsletter compilation, delivery, and viewing system. After the second Saturday deadline (10:59 AM UTC), submissions are compiled into a newsletter organized by prompt, sent via email (Resend + React Email), and viewable in-app with an archive of past issues.

**Key leverage:** The `newsletters` and `newsletterReads` tables already exist in the schema (shell), unread badges already work on the circle list, email infrastructure (Resend) is configured, `@react-email/components` is installed, and PostHog analytics is fully wired.

## Architecture Decisions

- **Newsletter content storage:** Add `htmlContent`, `cycleId`, and `issueNumber` fields to existing `newsletters` table. Store compiled HTML for both email and web rendering.
- **Email approach:** Use `@react-email/components` (already installed, unused) to create React Email templates. Send via Resend `internalAction` pattern (matching `convex/emails.ts`).
- **Compilation trigger:** Add a second cron job in `convex/crons.ts` at 11:00 AM UTC on second Saturdays (1 minute after submission lock at 10:59). Reuse the existing `cycleId` (YYYY-MM) format.
- **Web view:** New Next.js page at `dashboard/circles/[circleId]/newsletter/[newsletterId]` following existing routing patterns.
- **Video in email:** Mux thumbnails with play button overlay linking to web view (videos only playable in-app).
- **Unsubscribe:** Track email preference per membership; unsubscribe stops email but keeps circle membership and in-app access.

## Technical Approach

### Backend (Convex)

- Extend `newsletters` table schema with `cycleId`, `htmlContent`, `issueNumber`, `recipientCount`, `submissionCount`
- Add `emailUnsubscribed` field to `memberships` table
- Create `convex/newsletters.ts` with queries: `getNewsletterById`, `getNewslettersByCircle` (archive), `getLatestNewsletter`
- Create `compileNewsletter` internal action: gather submissions → organize by prompt → generate HTML content → store newsletter
- Create `sendNewsletter` internal action: get active members → filter unsubscribed → send via Resend → update newsletter status
- Create `handleMissedMonth` action: detect 0 submissions → send missed-month email
- Add cron job for newsletter compilation (11:00 AM UTC, second Saturdays)
- Add unsubscribe mutation

### Frontend (Next.js + React)

- `NewsletterView` component: renders compiled newsletter (header, prompt sections, member responses with inline media)
- `NewsletterArchive` component: lists past issues by date
- Newsletter web view page with auth check
- Integrate newsletter link into `CircleHome.tsx` navigation

### Email (React Email + Resend)

- `NewsletterEmail.tsx` - React Email template: responsive (600px max), inline CSS, video thumbnails, "View in App" CTA, unsubscribe link
- `MissedMonthEmail.tsx` - Encouraging email with sad puppy gif when 0 submissions

### Analytics (PostHog)

- Track: `newsletter_compiled`, `newsletter_sent`, `newsletter_opened`, `newsletter_clicked`

## Task Breakdown Preview

- [x] Task 1: Extend schema and create newsletter Convex queries/mutations
- [x] Task 2: Build newsletter compilation action (organize submissions by prompt, generate content)
- [x] Task 3: Create React Email templates (newsletter + missed month)
- [x] Task 4: Build newsletter send action, unsubscribe flow, and cron job
- [x] Task 5: Build newsletter web view page and UI components
- [x] Task 6: Build newsletter archive and integrate into circle navigation
- [x] Task 7: Add analytics events for newsletter lifecycle
- [x] Task 8: Write unit tests, integration tests, and E2E tests

## Dependencies

### Blockers
- **Epic 0 (Project Setup)** - Resend, React Email, Convex, Mux infrastructure (DONE)
- **Epic 1 (Authentication)** - User identity for personalization (DONE)
- **Epic 2 (Circle Creation)** - Circles and prompts must exist (DONE)
- **Epic 3 (Circle Membership)** - Member list for sending (DONE)
- **Epic 4 (Content Submission)** - Submissions to compile into newsletter (in progress)

### Enables
- **Epic 6 (Notifications & Reminders)** - Newsletter-ready notification depends on compilation

## Success Criteria (Technical)

- Newsletter compiles automatically after 10:59 AM UTC deadline
- Submissions organized by prompt; empty prompts omitted
- Email sends to all active members (respecting unsubscribe)
- Email renders correctly in Gmail, Outlook, Apple Mail (inline CSS, <5MB)
- Video thumbnails display with play button; click opens web view
- "View in App" button and unsubscribe link work
- Missed month email sends when 0 submissions
- Newsletter archive shows past issues, newest first
- Newsletter loads in <3 seconds on mobile
- 80%+ test coverage for business logic
- All newsletter flows have E2E tests

## Estimated Effort

- Schema + queries/mutations: ~3 hours
- Compilation action: ~4 hours
- React Email templates: ~4 hours
- Send action + cron: ~3 hours
- Web view + components: ~5 hours
- Archive + navigation: ~3 hours
- Analytics: ~1 hour
- Testing: ~8 hours
- **Total: ~31 hours**

## Tasks Created
- [x] #136 - Extend schema and create newsletter Convex queries/mutations (parallel: true) ✅
- [x] #137 - Build newsletter compilation action (parallel: false, depends: #136) ✅
- [x] #138 - Create React Email templates (parallel: true) ✅
- [x] #139 - Build newsletter send action and cron job (parallel: false, depends: #136, #137, #138) ✅
- [x] #140 - Build newsletter web view page and UI components (parallel: true, depends: #136) ✅
- [x] #141 - Build newsletter archive and integrate into circle navigation (parallel: false, depends: #136, #140) ✅
- [x] #142 - Add analytics events for newsletter lifecycle (parallel: false, depends: #137, #139, #140) ✅
- [x] #143 - Write unit tests, integration tests, and E2E tests (parallel: false, depends: all) ✅

Total tasks: 8
Parallel tasks: 3 (#93, #95, #97 can start immediately)
Sequential tasks: 5
Estimated total effort: 31 hours
