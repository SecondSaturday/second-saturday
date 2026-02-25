---
issue: 109
title: Add PostHog analytics events for notifications
analyzed: 2026-02-22T06:34:43Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #109

## Overview
Add `trackEvent()` calls to 4 files for notification analytics: push sent (backend), push clicked (frontend), preferences updated (frontend), admin reminder sent (frontend). Small, scattered additions.

## Parallel Streams

### Stream A: Analytics Events
**Scope**: Add trackEvent calls to 4 existing files
**Files**:
- `convex/notificationPush.ts` — track `push_notification_sent`
- `src/providers/onesignal-provider.tsx` — track `push_notification_clicked`
- `src/components/NotificationPreferences.tsx` — track `notification_settings_updated`
- `src/components/AdminSubmissionDashboard.tsx` — track `admin_manual_reminder_sent`
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Parallelization Strategy

**Recommended Approach**: sequential

Tiny additions to 4 files — single agent, ~2 hours. No parallelization benefit.

## Notes
- Frontend: use existing `trackEvent()` from `src/lib/analytics.ts`
- Backend (Convex action): use `console.log` with structured data for PostHog server-side ingestion (no PostHog SDK in Convex runtime), or skip backend tracking and rely on frontend click events
- Check `src/lib/analytics.ts` for the exact `trackEvent` signature
