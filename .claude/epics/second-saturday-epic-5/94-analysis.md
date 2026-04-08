---
issue: 94
title: Build newsletter compilation action
analyzed: 2026-02-21T10:31:38Z
estimated_hours: 4
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #94

## Overview
Create `compileNewsletter` internal action in Convex that gathers submissions for a circle's cycle, organizes by prompt, resolves media URLs, and stores the compiled newsletter.

## Parallel Streams

### Stream A: Compilation Action (Single Stream)
**Scope**: All compilation logic in convex/newsletters.ts
**Files**:
- `convex/newsletters.ts` (add internalMutation + internal helpers)
**Agent Type**: backend-specialist
**Can Start**: immediately (depends on #93, already done)
**Estimated Hours**: 4
**Dependencies**: none remaining

## Coordination Points

### Shared Files
- `convex/newsletters.ts` - already modified by #93 (queries/mutations). This task adds internal functions to the same file.

### Sequential Requirements
1. Must use schema fields from #93 (done)
2. Must query submissions, responses, media, prompts tables
3. Must resolve storage URLs and Mux thumbnail URLs

## Conflict Risk Assessment
- **Low Risk**: Single stream, single file addition

## Parallelization Strategy
**Recommended Approach**: sequential (single stream, no parallelization benefit)

## Notes
- Key patterns from `convex/submissions.ts`: query submissions by `by_user_circle_cycle`, responses by `by_submission`, media by `by_response`, prompts by `by_circle`
- Use `ctx.storage.getUrl()` for image URLs
- Use Mux thumbnail format: `https://image.mux.com/{playbackId}/thumbnail.jpg`
- `computeDeadlineTimestamp()` helper exists in submissions.ts for second Saturday calculation
- Newsletter `issueNumber` = count of existing newsletters for circle + 1
- Must handle 0-submission edge case
