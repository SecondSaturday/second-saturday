---
issue: 104
title: Add submission reminder cron and newsletter-ready trigger
analyzed: 2026-02-22T06:23:08Z
estimated_hours: 4
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #104

## Overview
Add a cron job to `convex/crons.ts` for automatic submission reminders (Wednesday before second Saturday). Create `sendSubmissionReminder` internal action. Hook newsletter-ready notification into `convex/newsletters.ts` after compilation. Clean up adminReminders after newsletter sends.

## Parallel Streams

### Stream A: Cron + Reminder + Newsletter Trigger
**Scope**: All backend changes — cron job, reminder action, newsletter hook, admin reminder cleanup
**Files**:
- `convex/crons.ts` (add reminder cron)
- `convex/notifications.ts` (add sendSubmissionReminder + sendNewsletterReadyNotification internal actions)
- `convex/newsletters.ts` (trigger newsletter-ready notification after compileNewsletter, clean up adminReminders)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

## Parallelization Strategy

**Recommended Approach**: sequential

Single stream — files are tightly coupled (cron calls notification action, newsletter triggers notification). No benefit from splitting.

## Expected Timeline

- Wall time: 4 hours
- Total work: 4 hours

## Notes
- Existing crons: lockPastDeadlineSubmissions at 10:59 UTC Saturdays, processNewsletters at 11:00 UTC Saturdays
- Reminder cron: run Wednesdays 11:00 UTC, check if coming Saturday is second Saturday
- Use existing `getNonSubmitters` internal query from notifications.ts
- Check user notification preferences before sending (submissionReminders / newsletterReady)
- Admin reminder cleanup: delete adminReminders rows for cycle after newsletter sends
