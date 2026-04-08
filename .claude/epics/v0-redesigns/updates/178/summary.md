---
issue: 178
completed: 2026-02-25T02:24:02Z
status: completed
---

# Issue #178: Prompts tab and dedicated library page

## Completed Changes

### Stream A: PromptsEditor Simplification
- Added imports: `ChevronRight` from lucide-react, `Link` from next/link
- Removed imports: `cn` (no longer needed)
- Removed `promptLibrary` query (no longer needed inline)
- Removed `hasAvailableLibrary` logic and inline library section (lines 231-262)
- Added "Current Prompts {count}/8" section heading above the sortable list
- Added "Browse Prompt Library >" navigation row linking to `/dashboard/circles/${circleId}/prompts/library`

### Stream B: Prompt Library Page
- Created `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx`
- Back arrow header linking to prompts page
- Tabs with 4 categories: Fun, Gratitude, Reflection, Check-in (mapped from API: fun, gratitude, reflection, deep)
- Queries `api.prompts.getPromptLibrary` for available prompts
- Queries `api.prompts.getCirclePrompts` to check which are already added
- Each prompt displays with "+" button (disabled if already added or at max 8)
- Adding a prompt calls `updatePrompts` mutation and navigates back

## Files Modified
- `src/components/PromptsEditor.tsx` (simplified)

## Files Created
- `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx` (new)

## Tests
All 909 tests passing.
