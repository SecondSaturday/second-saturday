---
issue: 106
title: Wire admin manual reminders in AdminSubmissionDashboard
analyzed: 2026-02-22T06:23:08Z
estimated_hours: 4
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #106

## Overview
Replace "Coming soon" toast in AdminSubmissionDashboard.tsx with real reminder functionality. Wire individual + bulk reminder mutations, show remaining count, disable when limit reached.

## Parallel Streams

### Stream A: Dashboard Wiring
**Scope**: All UI changes in AdminSubmissionDashboard.tsx
**Files**:
- `src/components/AdminSubmissionDashboard.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

## Parallelization Strategy

**Recommended Approach**: sequential

Single file modification. No parallelization benefit.

## Expected Timeline

- Wall time: 4 hours
- Total work: 4 hours

## Notes
- Existing "Send Reminder" button at line ~93-101, calls handleSendReminder which shows "Coming soon" toast
- Replace with useMutation(api.notifications.sendAdminReminder) and useMutation(api.notifications.sendBulkAdminReminder)
- Add useQuery(api.notifications.getAdminReminderCount) for remaining count display
- Need current cycleId — use existing deadline calculation logic (lines 14-35)
- Follow existing toast/button patterns in the component
