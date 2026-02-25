---
issue: 98
title: Build newsletter archive and integrate into circle navigation
analyzed: 2026-02-21T10:41:12Z
estimated_hours: 3
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #98

## Overview
Create NewsletterArchive component listing past newsletters and add newsletter navigation to CircleHome.tsx.

## Parallel Streams

### Stream A: Archive + Navigation (Single Stream)
**Scope**: Archive component and CircleHome integration
**Files**:
- `src/components/newsletter/NewsletterArchive.tsx` (new)
- `src/components/CircleHome.tsx` (modify — add newsletter link)
**Agent Type**: frontend-specialist
**Can Start**: immediately (all deps #93, #97 done)
**Estimated Hours**: 3
**Dependencies**: none remaining

## Coordination Points

### Shared Files
- `src/components/CircleHome.tsx` — existing file, add navigation entry

### Sequential Requirements
None — straightforward additions

## Conflict Risk Assessment
- **Low Risk**: One new file + small modification to CircleHome

## Parallelization Strategy
**Recommended Approach**: sequential (single stream)

## Notes
- Use `api.newsletters.getNewslettersByCircle` query (returns list with `isRead` status)
- Archive items link to `/dashboard/circles/{circleId}/newsletter/{newsletterId}`
- Use existing Card, Badge components for UI
- Unread indicator: purple dot or badge when `isRead === false`
- Empty state: "No newsletters yet" message
- CircleHome navigation: add alongside existing "Make Submission", "Members", "Submission Status" links
- Date formatting: use `toLocaleDateString()` for user's timezone
