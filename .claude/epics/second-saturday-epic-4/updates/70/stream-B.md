---
issue: 70
stream: MultiCircleSubmissionScreen
agent: frontend-specialist
started: 2026-02-18T10:15:15Z
status: completed
---

# Stream B: MultiCircleSubmissionScreen

## Scope
Main integration screen composing all existing submission components with per-circle draft state, auto-save with 2-second debounce, loading/error states, and submission actions.

## Files
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx`
- `src/screens/submissions/index.ts`

## Completed
- Created `src/screens/submissions/MultiCircleSubmissionScreen.tsx` with full auto-save integration
- Per-circle `draftTexts` map preserves state across tab switches
- `useDebounce` with 2000ms on active circle draft map triggers auto-save
- Creates submission on first save if none exists, then upserts responses
- `saveStatus` transitions: idle → saving → saved (→ idle after 3s) or error
- Progress computed as answered prompts / total prompts for CircleSubmissionTabs ring
- Loading spinner when queries are undefined; disabled cards for locked/submitted circles
- Header row with `AutoSaveIndicator` and `DeadlineCountdown`
- Created `src/screens/submissions/index.ts` barrel export

## Working On
- None

## Blocked
- None
