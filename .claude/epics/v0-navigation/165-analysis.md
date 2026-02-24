---
issue: 165
title: Add error boundaries at all route levels
analyzed: 2026-02-24T19:13:35Z
estimated_hours: 1
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #165

## Overview

Create 5 new error boundary files: 3 route-level `error.tsx`, 1 `global-error.tsx`, 1 `not-found.tsx`. All are new files with no modifications to existing code. Each follows the same Next.js App Router pattern.

## Parallel Streams

### Stream A: All error boundaries (single stream)
**Scope**: Create all 5 files in one pass — they're all small, templated, and independent
**Files**:
- `src/app/error.tsx` (new)
- `src/app/dashboard/error.tsx` (new)
- `src/app/dashboard/circles/[circleId]/error.tsx` (new)
- `src/app/global-error.tsx` (new)
- `src/app/not-found.tsx` (new)
**Agent Type**: frontend
**Can Start**: immediately
**Estimated Hours**: 1
**Dependencies**: none

## Coordination Points

### Shared Files
None — all files are new. No existing files modified.

### Sequential Requirements
None — each file is independent.

## Conflict Risk Assessment
- **Low Risk**: All new files in directories no other task touches.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

Five ~25-line files following the same pattern. One agent, one commit.

### Implementation:
1. `src/app/error.tsx` — client component, receives `{ error, reset }`, styled "Something went wrong" + "Try again" button
2. `src/app/dashboard/error.tsx` — same pattern, "Try again" button
3. `src/app/dashboard/circles/[circleId]/error.tsx` — same pattern but recovery links to `/dashboard`
4. `src/app/global-error.tsx` — STANDALONE: own `<html><body>`, inline styles, "Reload" button via `window.location.reload()`, ZERO external imports
5. `src/app/not-found.tsx` — server component, styled 404, "Go to Dashboard" link

## Expected Timeline

- Wall time: 1 hour
- Total work: 1 hour

## Notes
- `global-error.tsx` MUST use inline styles (Tailwind CSS may not load if root layout errored)
- `global-error.tsx` MUST include `<html>` and `<body>` tags
- `not-found.tsx` can be a server component (doesn't need 'use client')
- All `error.tsx` files must be client components ('use client' directive)
