---
issue: 99
title: Add analytics events for newsletter lifecycle
analyzed: 2026-02-21T10:50:12Z
estimated_hours: 1
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #99

## Overview
Add PostHog analytics events across the newsletter feature: client-side events in the web view page, and server-side console.log events in Convex actions (PostHog server SDK not available in Convex).

## Parallel Streams

### Stream A: Analytics Instrumentation (Single Stream)
**Scope**: Add trackEvent calls to existing files
**Files**:
- `src/app/dashboard/circles/[circleId]/newsletter/[newsletterId]/page.tsx` (add newsletter_opened, newsletter_clicked)
- `convex/newsletters.ts` (add console.log for newsletter_compiled)
- `convex/newsletterEmails.ts` (add console.log for newsletter_sent)
- `convex/newsletters.ts` (add event in unsubscribeFromEmail for newsletter_unsubscribed — client-side via caller)
**Agent Type**: fullstack-specialist
**Can Start**: immediately (all deps done)
**Estimated Hours**: 1
**Dependencies**: none remaining

## Coordination Points

### Shared Files
- Multiple files modified with small additions (trackEvent calls)

### Sequential Requirements
None — all additions are independent trackEvent calls

## Conflict Risk Assessment
- **Low Risk**: Small additions to existing files, no structural changes

## Parallelization Strategy
**Recommended Approach**: sequential (XS task, single stream, 1 hour)

## Notes
- Client-side: use `trackEvent()` from `src/lib/analytics.ts` (already imported in many components)
- Server-side (Convex): PostHog JS SDK won't work in Convex runtime. Use `console.log` with structured format for now, or skip server-side events (they can be inferred from DB records)
- The existing `newsletter_read` event in CircleHome.tsx is a misnomer — consider leaving it as-is to avoid breaking existing analytics, and add proper `newsletter_opened` in the newsletter view page
- UTM params for email click tracking: add `?utm_source=email&utm_medium=newsletter` to viewInAppUrl in email template
