---
name: second-saturday-epic-1
description: Authentication & Identity - user signup, login, password recovery, profile management, and account deletion
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 2 (60-80 hours)
---

# Epic 1: Authentication & Identity

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 2 (60-80 hours)
**Prerequisites:** Epic 0 (Project Setup & Infrastructure) must be complete

---

## Overview

This epic covers how users establish and manage their identity in the system. Authentication must feel lightweight (this is a personal app, not enterprise software) while providing enough security for personal content.

**Key Insight:** Most new users will arrive via invite link, not organic discovery. The signup flow is the first impression and the highest-friction moment. Every additional step loses users.

---

## Goals

1. **Minimize signup friction** - OAuth users complete signup in under 60 seconds
2. **Enable secure identity** - Email verification, OAuth providers (Google, Apple)
3. **Support password recovery** - Email-based reset
4. **Enable profile customization** - Name and photo management
5. **Enable account deletion** - GDPR compliance with data removal
6. **Maintain persistent sessions** - 30+ days on mobile, 7 days on web

---

## Implementation Plan

### Phase 1: Design (Days 1-2, ~15-20 hours)

**Goal:** Define authentication screens and user flows before writing code.

**Activities:**

1. **Identify screens and components needed**
   - Signup screen (email/password variant)
   - Signup screen (OAuth variant - Google/Apple buttons)
   - Email verification pending screen
   - Login screen (email/password + OAuth options)
   - Password reset screen (email-based)
   - Profile settings screen (name, photo, password sections)
   - Account deletion confirmation modal

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Apply tweakcn theme tokens (colors, typography, spacing)
   - Ensure touch targets are 44px+ for accessibility
   - Design clear error states and loading states

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility (contrast, touch targets)
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code for quality (SignupForm, LoginForm, ProfileForm, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for all 7 auth screens
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5, ~30-40 hours)

**Goal:** Build authentication features following approved designs.

**Activities:**

1. **Set up Convex schema**
   - Create users table in schema.ts (synced from Clerk via webhook)
   - Define user fields: clerkId, email, name, avatarUrl, timezone, oneSignalPlayerId
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create Clerk webhook endpoint (HTTP action for user.created, user.updated)
   - Test webhook: signup in Clerk → verify user appears in Convex
   - Create getUserByClerkId query
   - Create updateUserProfile mutation
   - Create deleteUserAccount mutation

3. **Build UI components**
   - Build SignupForm component (email/password + OAuth buttons)
   - Integrate Clerk useSignUp hook
   - Build email verification pending screen
   - Build LoginForm component with Clerk useSignIn hook
   - Build PasswordResetForm (email-based)
   - Build ProfileSettings component
   - Implement profile photo upload to Convex storage with browser-image-compression
   - Build AccountDeletionModal with confirmation
   - Implement account deletion (call Clerk API + delete from Convex)
   - Add client-side validation (email format, password strength)
   - Handle loading and error states

4. **Add analytics events** (PostHog)
   - Track `user_signed_up` (with method: email/Google/Apple)
   - Track `user_logged_in` (with method: email/Google/Apple)
   - Track `user_reset_password` (method: email)
   - Track `profile_updated` (with field: name/photo)
   - Track `account_deleted`

5. **Manual testing in dev**
   - Test on web (Chrome, Safari)
   - Test on mobile (iOS simulator, Android emulator)
   - Test OAuth flows on real devices (Clerk dev mode)
   - Test Clerk → Convex sync in real-time
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (users table)
- Convex functions (webhook handler, queries, mutations)
- UI components with Clerk integration
- Analytics events tracking
- Working authentication flows in dev environment

---

### Phase 3: Testing (Days 6-7, ~15-20 hours)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test phone number validation logic (E.164 format)
   - Test email validation logic
   - Test profile photo file size/type validation
   - Test password strength validation
   - Target: 80% coverage for validation logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test Clerk webhook → Convex user sync (mock webhook payload)
   - Test signup flow (email/password)
   - Test signup flow (OAuth - mock Clerk hooks)
   - Test login flow
   - Test password reset flow
   - Test profile update (name, photo)
   - Test account deletion
   - Test error handling (invalid email, weak password, etc.)

3. **Write E2E tests** (Playwright)
   - Test full signup flow (email/password + phone verification)
   - Test Google OAuth signup flow
   - Test Apple Sign-In flow
   - Test login flow (email/password)
   - Test password reset via email
   - Test password reset via SMS
   - Test profile photo upload
   - Test account deletion
   - Test session persistence (return after days)

4. **Manual QA testing**
   - Test on real iOS device (phone verification SMS)
   - Test on real Android device
   - Test OAuth on real devices (not just simulators)
   - Test edge cases (SMS not received, expired reset link, etc.)
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for validation logic)
- Integration tests for all Convex functions
- E2E tests for critical authentication paths
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create pull request with Figma links and screenshots
2. Code review (backend dev reviews frontend code, vice versa)
3. Address review comments
4. CI validation (GitHub Actions runs lint, type check, tests)
5. Fix any CI failures
6. Deploy to Vercel preview and test on preview environment
7. Merge to main (squash and merge after approval)
8. Auto-deploy to production (Vercel)
9. Smoke test production auth flows
10. Monitor Sentry for errors
11. Monitor PostHog for signup events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 1 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 1.1: First-Time Signup

**When** I click an invite link from a friend and don't have an account yet,
**I want to** create an account with minimal friction,
**So I can** join my friend's circle without losing momentum or abandoning the flow.

**Context:** Most new users will arrive via invite link, not organic discovery. The signup flow is the first impression and the highest-friction moment. Every additional step loses users.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.1.1 | Support email/password signup with email verification | P0 |
| 1.1.2 | Support Google OAuth as alternative signup method | P0 |
| 1.1.3 | Support Apple Sign-In (required for iOS App Store) | P0 |
| 1.1.4 | OAuth users skip email verification (verified by provider) | P0 |
| 1.1.5 | Email/password users must verify email before accessing circles | P0 |
| 1.1.6 | Preserve invite link context through signup flow | P0 |
| 1.1.7 | Collect display name during signup (required) | P0 |
| 1.1.8 | Collect profile photo during signup (optional, can skip) | P0 |
| 1.1.9 | Auto-join circle upon successful account creation | P0 |
| 1.1.10 | Auto-detect user timezone from browser during signup | P0 |

**Acceptance Criteria:**
- OAuth users can complete signup in under 60 seconds (no email verification wait)
- Email/password users can complete signup in under 90 seconds (including email verification)
- Email verification sent within 30 seconds (for email/password signups only)
- User is automatically redirected to circle after signup if they arrived via invite link
- If email already exists, prompt to login instead with clear messaging

**Edge Cases:**
- User clicks invite link, starts signup, abandons, returns later: invite link should remain valid
- User already has account but clicks invite link while logged out: after login, should auto-join the circle
- User enters email that's already registered: show "This email is already associated with an account. Please log in instead."

---

### JTBD 1.2: Returning User Login

**When** I return to the app after being away (days or weeks),
**I want to** get back into my circles quickly,
**So I can** check if the newsletter is out or submit my update without re-authenticating every time.

**Context:** Users interact monthly, not daily. Session persistence is critical. Re-authentication friction could cause users to skip a month.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.2.1 | Support login via email/password | P0 |
| 1.2.2 | Support login via Google OAuth | P0 |
| 1.2.3 | Support login via Apple Sign-In | P0 |
| 1.2.4 | Maintain persistent sessions (30+ days on mobile, 7 days on web) | P0 |
| 1.2.5 | Support "Remember me" option on web | P0 |
| 1.2.6 | Implement secure token refresh without requiring re-login | P0 |
| 1.2.7 | Deep link support: redirect to intended destination after login | P0 |

**Acceptance Criteria:**
- Returning user on mobile app should not need to re-authenticate for at least 30 days
- Login via social provider completes in 2 taps
- Failed login shows specific error (wrong password vs. no account found)
- After 3 failed login attempts, show password reset option prominently

---

### JTBD 1.3: Password Recovery

**When** I forget my password and can't log in,
**I want to** reset it via email,
**So I can** regain access to my circles and content without losing my account.

**Context:** With monthly usage, password forgets are common. This flow must be bulletproof.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.3.1 | "Forgot password" link on login screen | P0 |
| 1.3.2 | Send password reset email within 30 seconds | P0 |
| 1.3.3 | Reset link expires after 1 hour | P0 |
| 1.3.4 | Reset link is single-use | P0 |
| 1.3.5 | After reset, user is logged in automatically | P0 |
| 1.3.6 | Generic message if email not found (security) | P0 |

**Acceptance Criteria:**
- Password reset completes in under 2 minutes end-to-end
- Reset email includes clear CTA button, not just a link
- New password must meet minimum security requirements (8+ chars)
- Old sessions are invalidated after password change
- Rate limit: max 3 reset attempts per email per hour

---

### JTBD 1.4: Profile Management

**When** I want to update how I appear to my circles,
**I want to** change my display name or photo,
**So I can** present myself authentically.

**Context:** Users may want different names in different contexts (full name for family circle, nickname for college friends). MVP uses single identity; per-circle customization is P2.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.4.1 | Edit display name from settings | P0 |
| 1.4.2 | Upload/change profile photo from settings | P0 |
| 1.4.3 | Profile photo cropping (square aspect ratio) | P0 |
| 1.4.4 | View current email address (read-only in MVP) | P0 |
| 1.4.5 | Change password (if using email auth) | P0 |
| 1.4.6 | Change email address | P1 |
| 1.4.7 | Per-circle display name override | P2 |

**Acceptance Criteria:**
- Profile changes reflect immediately across all circles
- Photo upload supports JPG, PNG, HEIC; max 10MB; auto-compressed client-side to <200KB
- Name changes show in next newsletter (not retroactively in past issues)

---

### JTBD 1.5: Account Deletion

**When** I decide I no longer want to use Second Saturday,
**I want to** delete my account and data,
**So I can** remove my personal information from the platform.

**Context:** GDPR and CCPA compliance. Also builds trust that users control their data.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.5.1 | "Delete account" option in settings | P0 |
| 1.5.2 | Confirmation step with clear warning about data loss | P0 |
| 1.5.3 | Require password or re-authentication before deletion | P0 |
| 1.5.4 | Remove user from all circles upon deletion | P0 |
| 1.5.5 | Delete all user-generated content immediately | P0 |
| 1.5.6 | Past newsletters show "[Deleted User]" placeholder | P0 |
| 1.5.7 | Export data before deletion option | P2 |

**Acceptance Criteria:**
- Deletion executed immediately per GDPR "without undue delay"
- User receives email confirmation of deletion
- Past newsletters retain structure but show "[Deleted User]" with no content for removed member
- **Key distinction:** Account deletion removes all content; leaving a circle (while staying on platform) keeps contributions visible to remaining members
- User can re-register with same email/phone after deletion is complete
- No grace period; deletion is immediate and irreversible

---

## Analytics Events

Track user actions throughout authentication flows:

**Epic 1 (Auth):**
- `user_signed_up` (method: email/Google/Apple)
- `user_logged_in` (method: email/Google/Apple)
- `user_reset_password` (method: email)
- `profile_updated` (field: name/photo)
- `account_deleted`

**Implementation:** Use lib/analytics.ts wrapper created in Epic 0. Track events at key moments:
- After successful signup completion
- After successful login
- After password reset completion
- After profile field update
- Before account deletion (for funnel analysis)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test email validation logic
- Test profile photo file size/type validation
- Test password strength validation
- Target: 80% coverage for validation functions

### Integration Tests (Vitest + Testing Library)
- Test Clerk webhook → Convex user sync (mock webhook payload)
- Test signup flow (email/password)
- Test signup flow (OAuth - mock Clerk hooks)
- Test login flow
- Test password reset flow
- Test profile update (name, photo)
- Test account deletion
- Test error handling (invalid email, weak password, network errors)

### E2E Tests (Playwright)
- Test full signup flow (email/password + email verification)
- Test Google OAuth signup flow
- Test Apple Sign-In flow
- Test login flow (email/password)
- Test password reset via email
- Test profile photo upload
- Test account deletion
- Test session persistence

### Manual QA Testing
- Test on real iOS device
- Test on real Android device
- Test OAuth on real devices (Clerk dev mode)
- Test edge cases (expired reset link, slow network)
- Test Clerk → Convex sync in real-time

**Coverage Target:** 80%+ for validation logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires Clerk and Convex configured

### Enables (What this epic unlocks)
- **Epic 2 (Circle Creation & Setup)** - Users must be authenticated to create circles
- **Epic 3 (Circle Membership)** - Users must have accounts to join circles
- **Epic 4 (Content Submission)** - Users must be authenticated to submit content
- **Epic 5 (Newsletter Experience)** - User identity needed for newsletter personalization
- **Epic 6 (Notifications & Reminders)** - User email needed for notifications, push notifications via OneSignal

**All subsequent epics depend on authentication being complete.**

---

## Week 2 Timeline Breakdown

### Days 1-2: Design (15-20 hours)
- Create wireframes for 7 auth screens in Figma
- Apply tweakcn theme tokens
- Design for mobile (375px) and desktop (1024px+)
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (30-40 hours)
- Create users table in Convex schema
- Create Clerk webhook endpoint and test sync
- Build SignupForm component with Clerk integration
- Build email verification flow
- Build LoginForm component
- Build PasswordResetForm (email-based)
- Build ProfileSettings component
- Implement profile photo upload with compression
- Build AccountDeletionModal
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (15-20 hours)
- Write unit tests for validation logic
- Write integration tests for Convex functions
- Write E2E tests for auth flows
- Manual QA on iOS simulator and Android emulator
- Test OAuth on real devices
- Fix bugs found during testing
- Retest to verify fixes

### Continuous: Review & Deploy
- Create PR with Figma links and screenshots
- Code review
- CI validation
- Deploy to Vercel preview
- Merge to main
- Smoke test production
- Monitor Sentry and PostHog

**Total: 60-80 hours**

---

## Key Risks

1. **OAuth configuration complexity** - Google/Apple credentials can be tricky to set up
   - Mitigation: Follow Clerk documentation carefully; test early

2. **Clerk → Convex webhook sync reliability** - Webhook failures could leave users in inconsistent state
   - Mitigation: Add retry logic; monitor webhook failures in Sentry

3. **Account deletion must handle all user data** - GDPR compliance requires thorough cleanup
   - Mitigation: Create comprehensive deletion checklist; test thoroughly; verify no orphaned data

---

## Success Criteria

- [ ] Users can sign up via email/password, Google, and Apple
- [ ] OAuth signup completes in under 60 seconds
- [ ] Email/password signup completes in under 90 seconds
- [ ] Email verification works reliably
- [ ] Users can log in and sessions persist (30+ days mobile, 7 days web)
- [ ] Password reset works via email
- [ ] Users can update profile name and photo
- [ ] Profile photo auto-compresses to <200KB
- [ ] Account deletion removes all user data immediately
- [ ] Clerk → Convex user sync works reliably
- [ ] All authentication flows have E2E tests
- [ ] 80%+ test coverage for validation logic
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
