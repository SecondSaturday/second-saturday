---
issue: 71
stream: Tests
agent: test-specialist
started: 2026-02-18T05:38:02Z
status: completed
---

# Stream C: Tests

## Scope
Unit tests for date calculations, component tests for countdown

## Files
- `test/unit/deadlineCalculations.test.ts` (new)
- `test/components/submissions/DeadlineCountdown.test.tsx` (new)

## Completed
- 9 unit tests for `getSecondSaturdayDeadline` (known dates: Feb/Jan/Mar 2026, Mar 2025, always-Saturday invariant) and `getTimeRemaining` (past, future, seconds, boundary)
- 9 component tests for `DeadlineCountdown` using `vi.useFakeTimers()`: countdown display, locked state, urgency/destructive styling, 1s interval update, className prop, default deadline
- All 18 tests pass
