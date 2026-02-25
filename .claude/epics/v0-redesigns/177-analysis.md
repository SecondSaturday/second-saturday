---
issue: 177
title: Members tab UX redesign
analyzed: 2026-02-25T02:10:25Z
estimated_hours: 0.75
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #177

## Overview
Redesign the Members tab in CircleSettings: replace inline Remove buttons with three-dot menus, show "You" for current user, use plain text role labels, remove joined dates, and update the header format.

## Parallel Streams

### Stream A: Members Tab Redesign
**Scope**: All UI changes to the Members tab in CircleSettings
**Files**:
- `src/components/CircleSettings.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 0.75
**Dependencies**: none

## Coordination Points

### Shared Files
- Note: Issue #176 also modifies `CircleSettings.tsx` — coordinate if both are in progress
- However, #176 modifies the Details tab while #177 modifies the Members tab, so no direct conflicts

### Sequential Requirements
None — single stream, all changes are in one location.

## Conflict Risk Assessment
- **Low Risk**: All changes confined to the Members tab section (lines ~354-400)
- Issue #176 modifies Details tab and stats section — no overlap with Members tab

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

This is a small, focused task. All changes are in one file section and interdependent:
1. Import MoreVertical and DropdownMenu components
2. Replace Remove button with dropdown menu
3. Change name to "You" for current user
4. Replace Badge with plain text role label
5. Remove joined date line
6. Update tab header to show count

## Expected Timeline

Single stream execution:
- Wall time: 0.75 hours
- Total work: 0.75 hours

No parallelization benefit — task is atomic.

## Implementation Checklist

1. Add imports: `MoreVertical` from lucide-react (DropdownMenu already imported)
2. Remove unused imports: `Badge`, `Shield`
3. Update TabsTrigger to show `Members ({members?.length ?? 0})`
4. In member row:
   - Display "You" if `isSelf`, otherwise `member.name`
   - Remove joined date paragraph
   - Replace Badge with plain `<span className="text-xs text-muted-foreground">{role}</span>`
   - Replace Remove button with DropdownMenu containing Remove option

## Notes
- Size: S (small)
- Conflicts with issue #176 per local task file, but they modify different tab sections
- DropdownMenu components are already imported in CircleSettings.tsx
