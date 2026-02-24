---
issue: 168
title: Newsletter as circle landing page
analyzed: 2026-02-24T19:31:11Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #168

## Overview

Replace CircleHome with the latest newsletter as the default circle landing. `getLatestNewsletter` query already exists in `convex/newsletters.ts`. `NewsletterView` component already exists. Main work is rewiring the circle page + dashboard split view, parsing newsletter content, and deleting CircleHome.

## Parallel Streams

### Stream A: Newsletter landing + CircleHome deletion (single stream)
**Scope**: Rewrite circle page, update dashboard, delete CircleHome
**Files**:
- `src/app/dashboard/circles/[circleId]/page.tsx` (rewrite — newsletter view)
- `src/app/dashboard/page.tsx` (replace CircleHome in desktop split view)
- `src/components/CircleHome.tsx` (delete)
**Agent Type**: frontend
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Coordination Points

### Shared Files
- `src/app/dashboard/page.tsx` is also used in the v0-plumbing epic but only for the header area (already done). The content area where CircleHome is rendered is safe to modify.

## Conflict Risk Assessment
- **Low Risk**: CircleHome deletion is clean since no other task needs it. Dashboard page modification is in the content area (not header).

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

### Implementation plan:

1. **Rewrite `src/app/dashboard/circles/[circleId]/page.tsx`:**
   - Replace `CircleHome` import with `NewsletterView` and Convex queries
   - Query `api.newsletters.getLatestNewsletter({ circleId })` — already has auth + membership checks
   - Parse `htmlContent` using `parseNewsletterContent()` (copy from newsletter/[newsletterId] page or extract to shared util)
   - Also query `api.circles.getCircle({ circleId })` for circle info
   - Render `NewsletterView` with parsed sections, circle info, issue number
   - Empty state if `getLatestNewsletter` returns null: "No newsletters yet"
   - Mark as read via `markNewsletterRead` mutation
   - Keep header with back arrow + circle name + settings icon

2. **Update `src/app/dashboard/page.tsx`:**
   - Replace `CircleHome` in the desktop split view (lines 64-71) with the same newsletter rendering
   - OR simplify: navigate to the circle page on desktop too (removing the split-view complexity)
   - Simplest approach: keep split view but render newsletter content instead of CircleHome

3. **Delete `src/components/CircleHome.tsx` (152 lines)**

4. **Consider extracting `parseNewsletterContent` to a shared util** if it'll be duplicated.

## Expected Timeline

- Wall time: 2 hours
- Total work: 2 hours

## Notes
- `getLatestNewsletter` returns the full newsletter doc with `htmlContent`, `issueNumber`, `status`, `isRead`
- Newsletter content is JSON stored in `htmlContent` field, parsed as `{ sections: Section[] }`
- `NewsletterView` expects: `circle: CircleInfo`, `issueNumber`, `publishedAt`, `sections`
- The dashboard split view (desktop) currently renders `CircleHome` — needs to render newsletter instead
- `parseNewsletterContent` function should ideally be extracted to `src/lib/newsletter.ts` for reuse
