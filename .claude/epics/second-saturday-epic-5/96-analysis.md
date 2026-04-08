---
issue: 96
title: Build newsletter send action and cron job
analyzed: 2026-02-21T10:41:12Z
estimated_hours: 3
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #96

## Overview
Create sendNewsletter and sendMissedMonthEmail internal actions in Convex, plus the cron job that triggers newsletter compilation and sending on second Saturdays.

## Parallel Streams

### Stream A: Send Actions + Cron (Single Stream)
**Scope**: Email send logic and cron job setup
**Files**:
- `convex/newsletterEmails.ts` (new file — separate from newsletters.ts since this needs `'use node'`)
- `convex/crons.ts` (add newsletter cron)
**Agent Type**: backend-specialist
**Can Start**: immediately (all deps #93, #94, #95 done)
**Estimated Hours**: 3
**Dependencies**: none remaining

## Coordination Points

### Shared Files
- `convex/crons.ts` — existing file with one cron, add second cron entry

### Sequential Requirements
1. Send actions need `'use node'` — must be in a SEPARATE file from `convex/newsletters.ts` (which has no `'use node'` and uses internalMutation requiring db access)
2. Cron calls internal functions from both `newsletters.ts` (compile) and the new email file (send)

## Conflict Risk Assessment
- **Low Risk**: New file + small addition to crons.ts

## Parallelization Strategy
**Recommended Approach**: sequential (single stream)

## Notes
- CRITICAL: Cannot add `'use node'` to `convex/newsletters.ts` — it already has `internalMutation` which requires Convex runtime (not Node). Must create a separate file for Node-dependent email actions.
- Pattern from `convex/emails.ts`: `'use node'` at top, import `internalAction`, use Resend
- React Email `render()` function: import from `@react-email/components` or `@react-email/render`
- Cron schedule: `'0 11 * * 6'` (every Saturday 11:00 UTC) with second-Saturday guard inside action
- The cron action should: check if today is second Saturday → get all circles → for each circle, compile → send or send missed-month
- Use `ctx.runMutation(internal.newsletters.compileNewsletter, ...)` from the cron action to trigger compilation
