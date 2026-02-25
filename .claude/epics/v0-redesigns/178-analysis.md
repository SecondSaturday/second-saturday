---
issue: 178
title: Prompts tab and dedicated library page
analyzed: 2026-02-25T02:16:06Z
estimated_hours: 1.5
parallelization_factor: 1.8
---

# Parallel Work Analysis: Issue #178

## Overview
Simplify PromptsEditor by removing the inline prompt library and adding a "Browse Prompt Library" navigation row. Create a new `/dashboard/circles/[circleId]/prompts/library` page with category tabs and per-prompt add buttons.

## Parallel Streams

### Stream A: PromptsEditor Simplification
**Scope**: Remove inline library, add section heading and browse row
**Files**:
- `src/components/PromptsEditor.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 0.5
**Dependencies**: none

Changes:
1. Remove the `hasAvailableLibrary && promptLibrary` block (lines 232-262)
2. Add "Current Prompts {count}/8" heading above sortable list
3. Add "Browse Prompt Library ›" row linking to library page
4. Need to expose circleId for navigation (already available via props)
5. Keep the `addPrompt` function — it will be called from library page via URL params

### Stream B: Prompt Library Page
**Scope**: Create new dedicated library page with category tabs
**Files**:
- `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx` (new)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.0
**Dependencies**: none

Implementation:
1. Create page.tsx following settings page pattern
2. Back arrow + "Prompt Library" header
3. Tabs component with 4 categories: Fun, Gratitude, Reflection, Check-in
4. Query `api.prompts.getPromptLibrary` for categories
5. Query `api.prompts.getCirclePrompts` to know which are already added
6. Each prompt as row with "+" button
7. Add prompt via mutation, then navigate back to prompts page

## Coordination Points

### Shared Files
None — Stream A modifies PromptsEditor, Stream B creates new file

### Sequential Requirements
None — streams work on different files and can run in parallel

## Conflict Risk Assessment
- **Low Risk**: Streams work on completely separate files
- Both use the same Convex API (`api.prompts.getPromptLibrary`) but only for reading
- No direct file conflicts

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A and B simultaneously. They modify different files and have no dependencies.

## Expected Timeline

With parallel execution:
- Wall time: 1.0 hours (max of Stream A 0.5h and Stream B 1.0h)
- Total work: 1.5 hours
- Efficiency gain: 33%

Without parallel execution:
- Wall time: 1.5 hours

## Implementation Checklist

### Stream A: PromptsEditor Changes
1. Add `ChevronRight` import from lucide-react
2. Add `Link` import from next/link
3. Add section heading before DndContext: "Current Prompts {prompts.length}/8"
4. Remove the prompt library section (lines 232-262)
5. Add "Browse Prompt Library ›" navigation row after the "Add custom prompt" button
6. The row should link to `/dashboard/circles/${circleId}/prompts/library`

### Stream B: Library Page
1. Create `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx`
2. Follow the settings page layout pattern (safe-area, header with back arrow)
3. Use shadcn Tabs with variant="line" (matching CircleSettings pattern)
4. Categories from PROMPT_LIBRARY: reflection, fun, gratitude, deep (note: spec says "Check-in" but API has "deep")
5. Display prompts that aren't already in the circle's prompt list
6. "+" button calls addPrompt mutation and navigates back
7. Consider using searchParams to pass the added prompt back, or just re-query

## Notes
- Size: M (medium)
- The PROMPT_LIBRARY categories are: reflection, fun, gratitude, deep
- The spec mentions "Check-in" but the actual category is "deep" — follow the code
- PromptsEditor already has the `addPrompt` function for adding prompts
- The library page can use the same `updatePrompts` mutation for adding a single prompt
