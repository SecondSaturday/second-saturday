---
name: second-saturday-epic-6
status: backlog
created: 2026-02-22T05:51:36Z
progress: 0%
prd: .claude/prds/second-saturday-epic-6.md
github: https://github.com/SecondSaturday/second-saturday/issues/101
---

# Epic: Notifications & Reminders

## Overview

Implement push notifications and reminders for the Second Saturday app using OneSignal (already in dependencies). This covers automatic submission reminders, newsletter-ready alerts, admin manual reminders (carried from Epic 3: 3.5.6-3.5.8), and notification preferences. The existing `AdminSubmissionDashboard.tsx` has a stub "Send Reminder" button that needs wiring up.

## Architecture Decisions

- **Push service:** OneSignal (already installed: `@awesome-cordova-plugins/onesignal`, `@capacitor/push-notifications`)
- **Backend:** Convex mutations/actions for all notification logic; OneSignal REST API called from Convex actions
- **Cron:** Add submission reminder cron to existing `convex/crons.ts` (runs 3 days before second Saturday deadline)
- **Preferences:** New `notificationPreferences` table in Convex schema; global toggles per user with per-circle overrides (P1)
- **Analytics:** PostHog via existing `trackEvent()` pattern in `src/lib/analytics.ts`
- **Deep linking:** Capacitor deep links to route notification taps to correct screens

## Technical Approach

### Database Layer
- Add `notificationPreferences` table: userId, submissionReminders (bool), newsletterReady (bool), createdAt, updatedAt
- Add `adminReminders` table: circleId, adminUserId, targetUserId (optional), cycleId, sentAt
  - Index `by_circle_cycle` for counting reminders per cycle (max 3)
- Add `oneSignalPlayerId` field to `users` table for push token storage

### Backend Services (Convex)
- `notifications.ts` — mutations/actions:
  - `updateNotificationPreferences` mutation
  - `getNotificationPreferences` query
  - `sendPushNotification` action (calls OneSignal API)
  - `sendSubmissionReminder` internal action (cron-triggered, filters non-submitters)
  - `sendNewsletterReadyNotification` internal action (called after newsletter compilation)
  - `sendAdminReminder` mutation (individual member, Epic 3: 3.5.6)
  - `sendBulkAdminReminder` mutation (all non-submitters, Epic 3: 3.5.7)
  - `getAdminReminderCount` query (reminders sent this cycle, Epic 3: 3.5.8)
- Update `convex/crons.ts` — add cron for submission reminders (3 days before deadline)
- Update `convex/newsletters.ts` — trigger newsletter-ready notification after `compileNewsletter`

### Frontend Components
- `NotificationPreferences` screen — global toggles for submission reminders and newsletter notifications
- OneSignal SDK initialization on app load (Capacitor plugin)
- Register OneSignal player ID in Convex users table
- Push notification tap handlers with deep linking (reminder → submission screen, newsletter → newsletter view)
- Wire `AdminSubmissionDashboard.tsx` "Send Reminder" button to actual `sendAdminReminder` mutation
- Add "Send to all non-submitters" option and remaining reminder count display

## Implementation Strategy

1. Schema + backend first (tables, mutations, cron job)
2. OneSignal integration (SDK init, player ID registration, push sending)
3. Wire admin reminders in existing dashboard UI
4. Build notification preferences screen
5. Deep linking from notifications
6. Analytics events
7. Testing

## Task Breakdown Preview

- [ ] Task 1: Add notification schema tables and indexes (notificationPreferences, adminReminders, oneSignalPlayerId on users)
- [ ] Task 2: Implement notification Convex functions (queries, mutations, actions for preferences, push sending, admin reminders)
- [ ] Task 3: Add submission reminder cron job and newsletter-ready notification trigger
- [ ] Task 4: Integrate OneSignal SDK (Capacitor init, player ID registration, push handlers)
- [ ] Task 5: Wire admin manual reminders in AdminSubmissionDashboard (individual + bulk + count tracking)
- [ ] Task 6: Build NotificationPreferences UI screen with global toggles
- [ ] Task 7: Implement deep linking from push notifications (reminder → submit, newsletter → view)
- [ ] Task 8: Add PostHog analytics events for notifications
- [ ] Task 9: Write unit, integration, and E2E tests for notification flows

## Dependencies

### External
- OneSignal account configured with FCM (Android) and APNs (iOS) credentials
- `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` environment variables

### Internal (Must be complete)
- Epic 0: Project setup (Convex, Capacitor)
- Epic 1: Authentication (user identity)
- Epic 2: Circle creation
- Epic 3: Circle membership (admin dashboard UI exists)
- Epic 4: Content submission (submission status for filtering)
- Epic 5: Newsletter compilation (trigger point for newsletter-ready notification)

## Success Criteria (Technical)

- Push notifications delivered via OneSignal on iOS and Android
- Submission reminders sent only to non-submitters, 3 days before deadline
- Newsletter-ready notification sent after compilation
- Admin can send up to 3 manual reminders per cycle; count resets after newsletter sends
- Notification preferences persist in Convex and sync across devices
- Deep linking opens correct screen on notification tap
- 80%+ test coverage for notification business logic
- All analytics events firing correctly

## Estimated Effort

- **Schema + backend:** ~8 hours
- **OneSignal integration:** ~6 hours
- **UI (preferences + admin wiring):** ~6 hours
- **Deep linking:** ~4 hours
- **Testing:** ~8 hours
- **Total:** ~32-36 hours
- **Critical path:** OneSignal SDK setup → push sending → cron job → deep linking

## Tasks Created

- [ ] #102 - Add notification schema tables and indexes (parallel: true)
- [ ] #103 - Implement notification Convex functions (parallel: false, depends: #102)
- [ ] #104 - Add submission reminder cron and newsletter-ready trigger (parallel: false, depends: #103)
- [ ] #105 - Integrate OneSignal SDK with Capacitor (parallel: true, depends: #102)
- [ ] #106 - Wire admin manual reminders in AdminSubmissionDashboard (parallel: true, depends: #103)
- [ ] #107 - Build NotificationPreferences UI screen (parallel: true, depends: #103)
- [ ] #108 - Implement deep linking from push notifications (parallel: false, depends: #105)
- [ ] #109 - Add PostHog analytics events for notifications (parallel: true, depends: #103, #106, #107)
- [ ] #110 - Write unit, integration, and E2E tests for notifications (parallel: false, depends: #103, #104, #106, #107, #108)

Total tasks: 9
Parallel tasks: 5
Sequential tasks: 4
Estimated total effort: 41 hours
