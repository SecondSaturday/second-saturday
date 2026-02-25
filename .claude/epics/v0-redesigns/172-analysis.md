---
issue: 172
title: Add auth to getVideosByCircle
analyzed: 2026-02-25T00:20:00Z
estimated_hours: 0.25
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #172

## Overview

Add 2 lines to `convex/videos.ts:184-193` — `getAuthUser(ctx)` + `requireMembership()`. Helpers already exist in the file. Single stream, ~15 minutes.

## Parallel Streams

### Stream A: Add auth (single stream)
**Scope**: 2 lines added to one function
**Files**: `convex/videos.ts`
**Agent Type**: backend
**Can Start**: immediately
**Estimated Hours**: 0.25
**Dependencies**: none

## Parallelization Strategy
**Recommended Approach**: sequential — too trivial to split
