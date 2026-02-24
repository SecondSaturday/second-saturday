---
issue: 169
title: ProfileHeaderImageLayout shared component
analyzed: 2026-02-24T20:55:05Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #169

## Overview

Create a single new component: `ProfileHeaderImageLayout.tsx`. Cover image banner + overlapping circle icon with optional edit overlays. No existing files modified — purely additive. Integration into other pages happens in future tasks.

## Parallel Streams

### Stream A: Component creation (single stream)
**Scope**: Build the ProfileHeaderImageLayout component
**Files**:
- `src/components/ProfileHeaderImageLayout.tsx` (new — ~80 lines)
**Agent Type**: frontend
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Coordination Points

### Shared Files
None — single new file.

## Conflict Risk Assessment
- **Low Risk**: No existing files modified.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

### Implementation plan:

1. Create `src/components/ProfileHeaderImageLayout.tsx` with:
   - Props interface: `coverImageUrl`, `iconUrl`, `onCoverUpload?`, `onIconUpload?`, `editable?`, `className?`
   - Cover image: full-width banner, 150px mobile / 200px desktop, gray placeholder if no image
   - Circle icon: 80px circle, positioned overlapping bottom edge of cover by ~40px, absolute positioned
   - Edit overlays (when `editable=true`): pencil icon buttons positioned at top-right of cover and bottom-right of icon
   - Hidden file inputs triggered by edit overlay buttons
   - Placeholder states for missing images (gray background with camera icon)
   - The component does NOT handle upload logic — it calls `onCoverUpload(file)` / `onIconUpload(file)` with the selected file

2. Use existing patterns:
   - `ImageUpload` component exists at `src/components/circles/ImageUpload.tsx` — study its file handling
   - Or use raw `<input type="file">` with accept="image/*" and ref-based click triggering (simpler)
   - Use `Pencil` icon from lucide-react for edit overlays

## Expected Timeline

- Wall time: 2 hours
- Total work: 2 hours

## Notes
- PRD marks this as a design gate — Figma recommended for exact specs
- For now, build with sensible defaults that can be adjusted after design review
- The component is purely presentational + file-input triggering — no Convex queries, no upload logic
- Integration into CircleSettings, CreateCircle, invite page, newsletter header happens in other tasks
