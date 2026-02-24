---
issue: 166
title: Extract PromptsEditor shared component
analyzed: 2026-02-24T19:17:20Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #166

## Overview

Extract the prompts editor logic (lines 32-188 + lines 214-274 of prompts/page.tsx) into a shared `PromptsEditor.tsx` component. The page becomes a thin wrapper that parses route params and passes props. This is a pure refactor — no behavioral changes.

## Parallel Streams

### Stream A: Extract and refactor (single stream)
**Scope**: Move editor logic to shared component, update page to use it
**Files**:
- `src/components/PromptsEditor.tsx` (new — ~230 lines)
- `src/app/dashboard/circles/[circleId]/prompts/page.tsx` (refactor — ~50 lines)
**Agent Type**: frontend
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Coordination Points

### Shared Files
None — creates one new file, modifies one existing file.

### Sequential Requirements
1. Create PromptsEditor component with all extracted logic
2. Refactor page.tsx to import and render PromptsEditor
3. Verify identical behavior

## Conflict Risk Assessment
- **Low Risk**: Only touches prompts-related files. No other v0-navigation task modifies these.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

One refactoring operation — split a file in two. Cannot be parallelized.

### Extraction plan:

**Into `PromptsEditor.tsx`:**
- `PromptItem` interface (lines 32-36)
- `SortablePrompt` sub-component (lines 38-86)
- All editor state/logic: `prompts`, `saving`, `error` state; `sensors`; `handleDragEnd`, `addPrompt`, `removePrompt`, `updatePromptText`, `handleSave`
- All editor UI: DndContext, sortable list, add button, prompt library, error text, save button
- Props: `circleId: Id<'circles'>`, `mode: 'setup' | 'settings'`, `onComplete?: () => void`
- `mode` controls save button label ('Continue' vs 'Save Prompts')
- `onComplete` called after successful save (replaces router.push logic)

**Stays in page.tsx:**
- Route param parsing (`useParams`, `useSearchParams`)
- `isSetup` derivation
- Header with back arrow and title
- Loading state
- Passes `circleId`, `mode`, `onComplete` to PromptsEditor
- `onComplete` callback: `router.push(isSetup ? setup-complete : /dashboard)`

## Expected Timeline

- Wall time: 2 hours
- Total work: 2 hours

## Notes
- The `onComplete` callback pattern decouples navigation from the editor — the settings tab can provide a different callback (e.g., toast + stay on tab)
- The `SortablePrompt` sub-component moves with the editor (it's only used there)
- All Convex queries/mutations (`getCirclePrompts`, `getPromptLibrary`, `updatePrompts`) move to the PromptsEditor
- The page wrapper only needs `useParams`, `useSearchParams`, `useRouter`, and the PromptsEditor import
