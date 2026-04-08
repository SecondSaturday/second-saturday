---
name: second-saturday-epic-6
description: Notifications & Reminders - push notifications for submission reminders, newsletter ready alerts, and admin manual reminders
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 5 (second part, combined with Epic 5: 70-90 hours total)
---

# Epic 6: Notifications & Reminders

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 5 (second part, combined with Epic 5: 70-90 hours total)
**Prerequisites:** Epic 0 (Project Setup), Epic 1 (Authentication), Epic 2 (Circle Creation), Epic 3 (Circle Membership), Epic 4 (Content Submission), Epic 5 (Newsletter Experience) must be complete

---

## Overview

This epic covers how the app communicates with users between newsletters. Notifications must be helpful, not annoying.

**Key Insight:** Users interact monthly, not daily. Well-timed reminders are essential to habit formation, but too many notifications will cause users to disable them entirely.

---

## Goals

1. **Enable submission reminders** - Automatic reminder 3 days before deadline (only to non-submitters)
2. **Notify newsletter ready** - Push notification when newsletter is compiled and sent
3. **Support admin manual reminders** - Admin can send reminders to specific members (max 3 per cycle)
4. **Provide notification preferences** - Users can toggle reminders and newsletter notifications on/off
5. **Respect quiet hours** - No notifications during user-defined quiet times (P2)

## Carried Over from Epic 3

The following items were deferred from Epic 3 (Circle Membership) as they require notification infrastructure:

- **3.5.6** — One-tap "Send reminder" to individual member from admin submission dashboard
- **3.5.7** — Option to send reminder to all non-submitters at once
- **3.5.8** — Limit admin to max 3 manual reminders per cycle (count resets after newsletter sends)

The admin submission dashboard UI shell already exists (`src/components/AdminSubmissionDashboard.tsx`) with a "Send Reminder" button that currently shows a "Coming soon" toast. This epic must wire that button to actual notification delivery and implement the reminder count tracking/enforcement.

---

## Implementation Plan

### Phase 1: Design (Days 1-2 of Week 5, ~9-11 hours for Epic 6)

**Goal:** Define notification screens and push notification appearance.

**Activities:**

1. **Identify screens and components needed**
   - Notification preferences screen (global toggles)
   - Push notification UI (system notifications - document appearance only)
   - In-app notification banner (if needed)

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Design notification preferences screen with clear toggles
   - Document push notification appearance (system-level, not customizable)
   - Apply tweakcn theme tokens

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code (NotificationPreferences, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for 3 Epic 6 screens
- Push notification appearance documentation
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5 of Week 5, ~18-23 hours for Epic 6)

**Goal:** Build notification features following approved designs.

**Activities:**

1. **Set up Convex schema**
   - Create notificationPreferences table in schema.ts
     - Fields: userId, circleId (optional, for per-circle overrides), submissionReminders, newsletterReady, createdAt, updatedAt
   - Create adminReminders table in schema.ts (carried from Epic 3: 3.5.8)
     - Fields: circleId, adminUserId, targetUserId (optional, null = all non-submitters), cycleId, sentAt
     - Index: by_circle_cycle for counting reminders per cycle
     - Enforces max 3 reminders per admin per cycle
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create updateNotificationPreferences mutation
   - Create sendPushNotification action (calls OneSignal API)
   - Set up Convex cron job for submission reminders (runs 3 days before deadline)
   - Implement reminder logic (only send to non-submitters)
   - Implement admin manual reminder tracking (max 3 per cycle)

3. **Build UI components**
   - Build NotificationPreferences screen
     - Global toggles for submission reminders
     - Global toggles for newsletter ready notifications
     - Per-circle overrides (P1)
   - Integrate OneSignal SDK (initialize on app load)
   - Register OneSignal player ID in Convex (store in users table)
   - Implement push notification handlers
     - On notification received (in-app)
     - On notification clicked (deep linking)
   - Implement deep linking from push notifications
     - Reminder notification → opens submission screen for that circle
     - Newsletter notification → opens newsletter for that circle

4. **Notification implementation**
   - Implement submission reminder notification (3 days before deadline)
     - Only send to members who haven't submitted
     - Include circle name and deadline in notification
   - Implement newsletter ready notification
     - Send when newsletter is compiled and sent
     - Include circle name in notification
   - Implement admin manual reminder (carried from Epic 3: 3.5.6, 3.5.7, 3.5.8)
     - Wire existing "Send Reminder" button in `src/components/AdminSubmissionDashboard.tsx` (currently shows "Coming soon" toast)
     - Create `sendAdminReminder` mutation: sends push to individual member (3.5.6)
     - Create `sendBulkAdminReminder` mutation: sends push to all non-submitters at once (3.5.7)
     - Create `getAdminReminderCount` query: returns reminders sent this cycle
     - Track reminder count per admin per cycle in adminReminders table (max 3) (3.5.8)
     - Show remaining reminder count in dashboard UI (e.g., "2 of 3 reminders remaining")
     - Reset count after newsletter sends (delete adminReminders for completed cycle)

5. **Add analytics events** (PostHog)
   - Track `push_notification_sent` (type: reminder/newsletter_ready)
   - Track `push_notification_clicked` (type: reminder/newsletter_ready)
   - Track `notification_settings_updated`

6. **Manual testing in dev**
   - Test push notifications on iOS simulator
   - Test push notifications on Android emulator
   - Test deep linking from notifications
   - Test notification preferences
   - Test admin manual reminders
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (notificationPreferences table)
- Convex functions (updateNotificationPreferences, sendPushNotification, cron job)
- UI components with OneSignal integration
- Push notification handlers with deep linking
- Analytics events tracking
- Working notifications in dev environment

---

### Phase 3: Testing (Days 6-7 of Week 5, ~9-12 hours for Epic 6)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test notification preference validation
   - Test reminder count tracking logic
   - Test reminder recipient filtering (only non-submitters)
   - Target: 80% coverage for business logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test updateNotificationPreferences mutation
   - Test sendPushNotification action (mock OneSignal API)
   - Test submission reminder logic (only non-submitters)
   - Test admin manual reminder count tracking
   - Test reminder count reset after newsletter sends

3. **Write E2E tests** (Playwright)
   - Test submission reminder received (3 days before deadline)
   - Test newsletter ready notification received
   - Test notification deep linking (opens correct screen)
   - Test notification preferences (toggle off, verify no notifications)
   - Test admin manual reminder (max 3 limit)

4. **Manual QA testing**
   - Test push notifications on real iOS device (OneSignal)
   - Test push notifications on real Android device
   - Test notification deep linking on iOS/Android
   - Test notification preferences sync across devices
   - Test admin manual reminder workflow end-to-end
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for business logic)
- Integration tests for all Convex functions
- E2E tests for notification flows
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create PR with Figma links
2. Code review
3. Address review comments
4. CI validation
5. Fix any CI failures
6. Deploy to Vercel preview and test
7. Merge to main after approval
8. Auto-deploy to production
9. Smoke test notifications in production
10. Monitor OneSignal dashboard for push delivery stats
11. Monitor Sentry for notification errors
12. Monitor PostHog for notification events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 6 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 6.1: Submission Reminders

**When** I haven't submitted yet and the deadline is approaching,
**I want to** receive a friendly reminder,
**So I can** remember to contribute before it's too late.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.1.1 | Automatic reminder notification before deadline (push via OneSignal) | P0 |
| 6.1.2 | Default reminder: 3 days before deadline | P0 |
| 6.1.3 | Reminder only sent to members who haven't submitted | P0 |
| 6.1.4 | User can configure reminder timing (1 day, 3 days, 1 week before) | P1 |
| 6.1.5 | User can disable reminders entirely per circle | P0 |
| 6.1.6 | Reminder includes circle name and direct link to submission | P0 |
| 6.1.7 | Second reminder 24 hours before deadline (optional, off by default) | P1 |
| 6.1.8 | SMS reminder option (user can opt-in) | P1 |

**Acceptance Criteria:**
- Reminders arrive at reasonable times (not 3am local time)
- Reminder clearly states deadline date/time in user's local timezone
- One tap from reminder goes directly to submission screen
- No reminder sent if user has already submitted
- SMS reminders deferred to P1; push is default for V0
- **Note:** SMS features (P1) will require phone number collection to be added in a future release (not included in V0)

---

### JTBD 6.2: Newsletter Ready Notification

**When** the newsletter is compiled and sent,
**I want to** receive a notification,
**So I can** read it right away if I want to.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.2.1 | Push notification when newsletter is ready (via OneSignal) | P0 |
| 6.2.2 | Notification includes circle name | P0 |
| 6.2.3 | Tap notification opens newsletter in app | P0 |
| 6.2.4 | User can disable newsletter notifications per circle | P1 |

**Acceptance Criteria:**
- Notification sent simultaneously with email
- Notification groups if user is in multiple circles (or sends separately per circle)

---

### JTBD 6.3: Managing Notification Preferences

**When** I'm getting too many or too few notifications,
**I want to** adjust my notification settings,
**So I can** control how the app communicates with me.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.3.1 | Global notification settings in account settings | P0 |
| 6.3.2 | Per-circle notification overrides | P1 |
| 6.3.3 | Toggle for submission reminders (on/off) | P0 |
| 6.3.4 | Toggle for newsletter ready notifications (on/off) | P0 |
| 6.3.5 | Email notification preferences (can opt out of email, keep push) | P1 |
| 6.3.6 | SMS notification preferences (opt-in for reminders) | P1 |
| 6.3.7 | Quiet hours setting (no notifications during certain times) | P2 |

**Acceptance Criteria:**
- Settings sync across devices (via Convex)
- Changes take effect immediately
- Unsubscribing from email via link updates app preferences
- SMS is P1 (deferred); push notifications are P0
- **Note:** SMS features (P1) will require phone number collection to be added in a future release
- Phone number display (masked) will be shown in SMS settings once phone collection is implemented

---

### JTBD 6.4: Admin Manual Reminders (Carried from Epic 3)

**When** the deadline is approaching and some members haven't submitted,
**I want to** send targeted reminders from the submission dashboard,
**So I can** nudge specific people or all stragglers without leaving the app.

**Context:** Deferred from Epic 3 (3.5.6, 3.5.7, 3.5.8). The admin submission dashboard UI already exists at `src/components/AdminSubmissionDashboard.tsx` with a "Send Reminder" button that shows a "Coming soon" toast. This JTBD wires that button to actual notification delivery.

**Functional Requirements:**

| ID | Requirement | Priority | Origin |
|----|-------------|----------|--------|
| 6.4.1 | One-tap "Send reminder" to individual member from submission dashboard | P0 | Epic 3: 3.5.6 |
| 6.4.2 | Option to send reminder to all non-submitters at once | P0 | Epic 3: 3.5.7 |
| 6.4.3 | Limit admin to max 3 manual reminders per cycle | P0 | Epic 3: 3.5.8 |
| 6.4.4 | Show remaining reminder count (e.g., "2 of 3 reminders remaining") | P0 | Epic 3: 3.5.8 |
| 6.4.5 | Reminder count resets after newsletter sends | P0 | Epic 3: 3.5.8 |
| 6.4.6 | Manual reminder sends push notification via OneSignal | P0 | New |
| 6.4.7 | Disable "Send Reminder" button when 0 reminders remaining | P0 | New |

**Acceptance Criteria:**
- Admin can send reminder to individual member from submission dashboard
- Admin can send bulk reminder to all non-submitters
- Dashboard shows "X of 3 reminders remaining" with live count
- After 3 reminders sent, button is disabled with "No reminders remaining" tooltip
- Reminder count resets when newsletter for that cycle is sent
- Each reminder sends a push notification to the target member(s)
- Sending a bulk reminder counts as 1 reminder (not 1 per member)

---

## Analytics Events

Track notification sending and engagement:

**Epic 6 (Notifications):**
- `push_notification_sent` (type: reminder/newsletter_ready)
- `push_notification_clicked` (type: reminder/newsletter_ready)
- `notification_settings_updated`
- `admin_manual_reminder_sent` (target: individual/all, reminders_remaining: number)

**Implementation:** Track events at key moments:
- When push notification is sent to user
- When user taps notification (opens app)
- When user updates notification preferences
- When admin sends manual reminder (individual or bulk)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test notification preference validation
- Test reminder count tracking logic
- Test reminder recipient filtering (only non-submitters)
- Target: 80% coverage for business logic

### Integration Tests (Vitest + Testing Library)
- Test updateNotificationPreferences mutation
- Test sendPushNotification action (mock OneSignal API)
- Test submission reminder logic
- Test admin manual reminder count tracking
- Test reminder count reset after newsletter sends

### E2E Tests (Playwright)
- Test submission reminder received (3 days before deadline)
- Test newsletter ready notification received
- Test notification deep linking
- Test notification preferences
- Test admin manual reminder (max 3 limit)

### Manual QA Testing
- Test push notifications on real iOS device
- Test push notifications on real Android device
- Test notification deep linking on iOS/Android
- Test notification preferences sync across devices

**Coverage Target:** 80%+ for business logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires OneSignal configured
- **Epic 1 (Authentication & Identity)** - User identity needed (V0 uses email + OAuth, no phone number)
- **Epic 2 (Circle Creation & Setup)** - Circles must exist for notification context
- **Epic 3 (Circle Membership)** - Membership data needed for reminders
- **Epic 4 (Content Submission)** - Submission status needed for reminder filtering
- **Epic 5 (Newsletter Experience)** - Newsletter ready notification depends on compilation

### Enables (What this epic unlocks)
- Completes MVP feature set

---

## Week 5 Timeline Breakdown (Epic 6 portion)

### Days 1-2: Design (9-11 hours for Epic 6 screens)
- Create wireframes for 3 Epic 6 screens in Figma
- Document push notification appearance
- Apply tweakcn theme tokens
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (18-23 hours for Epic 6)
- Create notificationPreferences table in Convex
- Create notification mutations and queries
- Set up Convex cron job for submission reminders
- Implement reminder logic (only non-submitters)
- Build NotificationPreferences screen
- Integrate OneSignal SDK
- Register OneSignal player ID in Convex
- Implement push notification handlers
- Implement deep linking from notifications
- Implement submission reminder notification
- Implement newsletter ready notification
- Wire admin manual reminder buttons in existing AdminSubmissionDashboard (Epic 3 carryover)
- Implement admin reminder count tracking and enforcement
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (9-12 hours for Epic 6)
- Write unit tests for notification logic
- Write integration tests for Convex functions
- Write E2E tests for notification flows
- Manual QA on real iOS/Android devices
- Test notification deep linking
- Test admin manual reminder workflow
- Fix bugs found during testing
- Retest to verify fixes

### Continuous: Review & Deploy
- Create PR with Figma links
- Code review
- CI validation
- Deploy to Vercel preview
- Merge to main
- Smoke test production
- Monitor OneSignal and PostHog

**Note:** Epic 5 and Epic 6 are developed together in Week 5 for a combined 70-90 hours.

---

## Key Risks

1. **OneSignal push notification reliability** - FCM/APNs integration complexity
   - Mitigation: Follow OneSignal documentation carefully; test on real devices early

2. **Notification timing accuracy** - Convex cron job must run at correct times
   - Mitigation: Test cron job timing; monitor execution; add retry logic

3. **Deep linking complexity** - Must open correct screen in app
   - Mitigation: Test deep linking thoroughly on iOS/Android; handle edge cases

4. **Notification permission denial** - Users may deny push notification permissions
   - Mitigation: Gracefully handle permission denial; provide clear messaging

5. **Notification fatigue** - Too many notifications will cause users to disable them
   - Mitigation: Limit to 2 automatic notifications per cycle; allow customization

---

## Success Criteria

- [ ] Submission reminders sent 3 days before deadline (only to non-submitters)
- [ ] Newsletter ready notifications sent when newsletter is compiled
- [ ] Reminders include circle name and deadline
- [ ] Tapping notification opens correct screen (deep linking works)
- [ ] Notification preferences screen allows toggling reminders on/off
- [ ] Admin can send manual reminder to individual member from submission dashboard (Epic 3: 3.5.6)
- [ ] Admin can send bulk reminder to all non-submitters (Epic 3: 3.5.7)
- [ ] Manual reminders limited to max 3 per cycle (Epic 3: 3.5.8)
- [ ] Dashboard shows remaining reminder count
- [ ] Reminder count resets after newsletter sends
- [ ] Notification preferences sync across devices
- [ ] OneSignal player ID registered in Convex on app load
- [ ] Push notifications work on iOS and Android
- [ ] Deep linking works on iOS and Android
- [ ] All notification flows have E2E tests
- [ ] 80%+ test coverage for business logic
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
- [ ] Convex cron job for reminders triggers at correct time
- [ ] No notification sent if user has disabled reminders

**Note:** SMS reminders are P1 (deferred to post-V0); push notifications are the primary notification mechanism for MVP.
