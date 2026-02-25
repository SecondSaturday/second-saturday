---
issue: 70
stream: Tests
agent: fullstack-specialist
started: 2026-02-18T10:15:15Z
updated: 2026-02-18T05:09:17Z
status: completed
---

# Stream D: Tests

## Scope
Unit tests for useDebounce hook and MultiCircleSubmissionScreen logic.

## Files
- `test/unit/useDebounce.test.ts`
- `test/components/submissions/MultiCircleSubmissionScreen.test.tsx`

## Completed

### test/unit/useDebounce.test.ts (9 tests)
- Returns the initial value immediately
- Updates to new value after the delay
- Does NOT update before the delay expires
- Resets the timer when value changes rapidly (debounce behaviour)
- Cleans up the timer on unmount
- Does not update the debounced value after unmount
- Works with a short delay
- Works with a long delay
- Works with object values

### test/components/submissions/MultiCircleSubmissionScreen.test.tsx (18 tests)

**Loading state:**
- Renders a loading spinner when queries are undefined
- Renders a loading spinner when only submissionData is undefined
- Renders a loading spinner when only promptsData is undefined

**Prompts rendering:**
- Renders prompt cards when data is loaded
- Shows "no prompts available" when submission is null and prompts list is empty

**Circle tabs:**
- Shows circle tab names for all circles
- Shows the first circle tab as active by default
- Switches active circle when a tab is clicked

**Draft text preservation:**
- Preserves draft text state when switching tabs and back

**Auto-save debounce:**
- Does not call updateResponse before the debounce delay elapses
- Calls updateResponse mutation after the 2000ms debounce delay
- Does not call updateResponse if text has not changed from server data
- Creates a submission if none exists before calling updateResponse

**AutoSaveIndicator statuses:**
- Shows "Saving..." indicator while the mutation is in-flight
- Shows "Saved" indicator after successful save

**Locked / submitted circles:**
- Disables prompt cards when circle status is locked
- Disables prompt cards when circle status is submitted
- Does not disable prompt cards when circle status is not-started

## Test Framework
- Vitest with `@testing-library/react`
- `vi.useFakeTimers()` for controlling debounce timing
- `vi.hoisted()` for stable mock refs used in hoisted `vi.mock()` factories
- Convex `useQuery`/`useMutation` fully mocked via stable object references
