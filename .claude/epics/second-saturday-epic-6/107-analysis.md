---
issue: 107
title: Build NotificationPreferences UI screen
analyzed: 2026-02-22T06:23:08Z
estimated_hours: 3
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #107

## Overview
Create NotificationPreferences component with global toggles for submission reminders and newsletter notifications. Add to settings page.

## Parallel Streams

### Stream A: Preferences UI
**Scope**: Create component and integrate into settings page
**Files**:
- `src/components/NotificationPreferences.tsx` (new)
- `src/app/dashboard/settings/page.tsx` (add section)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

## Parallelization Strategy

**Recommended Approach**: sequential

Small task, two files with natural dependency (component then integration).

## Expected Timeline

- Wall time: 3 hours
- Total work: 3 hours

## Notes
- Follow CircleSettings.tsx patterns for UI style
- Use shadcn Switch component for toggles
- Use sonner toast for confirmation
- useQuery(api.notifications.getNotificationPreferences) for current state
- useMutation(api.notifications.updateNotificationPreferences) for saves
- Save immediately on toggle (no submit button)
