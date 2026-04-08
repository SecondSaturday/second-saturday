---
issue: 176
title: Settings Details tab polish
analyzed: 2026-02-25T02:02:59Z
estimated_hours: 3.0
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #176

## Overview
Polish the Settings Details tab with multiple UI improvements: integrate ProfileHeaderImageLayout in edit mode, add 3:1 aspect ratio for cover crop, redesign stat tiles as 3 separate squares, and clean up the leave button section.

## Parallel Streams

### Stream A: Image Crop Aspect Ratio
**Scope**: Add configurable aspect ratio to ImageCropModal and ImageUpload components
**Files**:
- `src/components/circles/ImageCropModal.tsx`
- `src/components/circles/ImageUpload.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 0.5
**Dependencies**: none

### Stream B: Settings Tab Redesign
**Scope**: Replace ImageUpload components with ProfileHeaderImageLayout, redesign stat tiles, and update leave button
**Files**:
- `src/components/CircleSettings.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately (can work in parallel, ProfileHeaderImageLayout integration doesn't depend on aspect ratio changes)
**Estimated Hours**: 2.5
**Dependencies**: none (can use ProfileHeaderImageLayout independently of ImageCropModal changes)

## Coordination Points

### Shared Files
None - each stream works on distinct files.

### Sequential Requirements
None - both streams can run in parallel:
1. Stream A modifies crop modal and ImageUpload components
2. Stream B modifies CircleSettings to use ProfileHeaderImageLayout (which has its own upload handling)

The ProfileHeaderImageLayout component already exists and handles uploads independently of ImageUpload.

## Conflict Risk Assessment
- **Low Risk**: Streams work on completely different files
- No shared type files or configuration conflicts expected
- ProfileHeaderImageLayout uses its own upload callbacks, not ImageUpload

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A & B simultaneously. No dependencies between them.

```
Timeline:
├── Stream A: Image Crop Aspect Ratio (0.5h) ─────┬──┐
├── Stream B: Settings Tab Redesign (2.5h) ───────┴──┘
```

## Expected Timeline

With parallel execution:
- Wall time: 2.5 hours (limited by Stream B)
- Total work: 3.0 hours
- Efficiency gain: 17%

Without parallel execution:
- Wall time: 3.0 hours

## Notes
- Issue 176 conflicts with issue 177 (per local task file) — coordinate if both are in progress
- PL3 resolution: ProfileHeaderImageLayout accepts `onCoverUpload(file: File)` / `onIconUpload(file: File)` but CircleSettings needs storageId. Wrap at call site to upload file to Convex storage first.
- The existing `handleImageUpload` function in CircleSettings takes a storageId and calls `updateCircle`
- Stat tiles should use: Members, Issues Sent, Created (in that order)
- Created date format: `toLocaleDateString('en-US', { month: 'short', year: 'numeric' })`
