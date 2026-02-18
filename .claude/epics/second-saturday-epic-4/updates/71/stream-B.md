---
issue: 71
stream: DeadlineCountdown Component & UI
agent: frontend-specialist
started: 2026-02-18T05:38:02Z
status: completed
---

# Stream B: DeadlineCountdown Component & UI

## Scope
Build the countdown display component, locked-state UI, and integrate into submission pages

## Files
- `src/components/submissions/DeadlineCountdown.tsx` (new)
- `src/hooks/useDeadlineCountdown.ts` (new)
- `src/app/dashboard/circles/[circleId]/submissions/page.tsx`
- `src/components/AdminSubmissionDashboard.tsx`

## Completed
- Created `useDeadlineCountdown` hook with 1s interval, `isPast` and `isUrgent` flags
- Built `DeadlineCountdown` component with color urgency indicators
- Integrated `DeadlineCountdown` into admin submissions page
- Enhanced `AdminSubmissionDashboard` with deadline countdown
- Exported `useDeadlineCountdown` from `src/hooks/index.ts`
