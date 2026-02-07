---
name: second-saturday-epic-3
description: Circle Membership - joining via invite links, viewing members, leaving circles, and admin member management
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 3 (second part, combined with Epic 2: 70-90 hours total)
---

# Epic 3: Circle Membership

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 3 (second part, combined with Epic 2: 70-90 hours total)
**Prerequisites:** Epic 0 (Project Setup), Epic 1 (Authentication), Epic 2 (Circle Creation) must be complete

---

## Overview

This epic covers how users join circles, view fellow members, and manage their participation. This includes admin functions for managing the group.

**Key Insight:** Transparency about membership builds trust, especially for privacy-concerned users like Alex who need to know exactly who sees their content.

---

## Goals

1. **Enable seamless joining** - Users can join circles via invite link in 2 taps (if logged in)
2. **Transparent membership** - All members can see who else is in the circle
3. **Graceful exit** - Users can leave circles voluntarily without drama
4. **Admin control** - Admins can remove members (with option to keep or delete contributions)
5. **Submission tracking** - Admin dashboard shows who submitted, who hasn't (admin-only)

---

## Implementation Plan

### Phase 1: Design (Days 1-2 of Week 3, ~9-11 hours for Epic 3)

**Goal:** Define membership screens and user flows before writing code.

**Activities:**

1. **Identify screens and components needed**
   - Invite link preview page (before signup/login - shows circle details)
   - Circle home screen (shows prompts, member list, deadline countdown)
   - Member list view (avatars, names, admin badge, submission status for admin)
   - Leave circle confirmation modal
   - Admin member removal modal (with keep/delete options)
   - Admin submission status dashboard

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Apply tweakcn theme tokens
   - Design invite preview with trust-building elements
   - Design member list with clear admin indication
   - Design admin submission dashboard with status indicators

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code (MemberList, InvitePreview, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for 6 Epic 3 screens
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5 of Week 3, ~18-23 hours for Epic 3)

**Goal:** Build membership features following approved designs.

**Activities:**

1. **Set up Convex schema**
   - Create memberships table in schema.ts
     - Fields: circleId, userId, role (admin/member), joinedAt, leftAt
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create joinCircle mutation (via invite link)
   - Create leaveCircle mutation (soft delete, sets leftAt)
   - Create removeMember mutation (with keep/delete contributions option)
   - Create getCircleMembers query (active members only)
   - Create getSubmissionStatus query (admin-only)
   - Add logic to preserve user's past contributions when rejoining

3. **Build UI components**
   - Build InviteLinkPreview page
     - Public page (no login required)
     - Show circle name, cover, member count, admin name
     - "Join Circle" button for logged-in users
     - "Sign up to Join" button for new users
     - "Log in to Join" option for logged-out users
   - Build circle home screen
     - Shows prompts
     - Deadline countdown
     - Link to member list
     - Admin sees submission status dashboard link
   - Build MemberList component
     - Shows active members with avatars and names
     - Admin badge indicator
     - Sorted: admin first, then alphabetical
   - Build LeaveCircleModal with confirmation
     - Explain consequences (temporary loss of access)
     - Option to rejoin later
   - Build RemoveMemberModal (admin-only)
     - Two options: "Remove" (keeps contributions) or "Remove & Block" (deletes contributions)
     - Confirmation dialog
   - Build AdminSubmissionDashboard
     - Shows each member's submission status (Submitted, In Progress, Not Started)
     - Shows submission timestamp
     - Shows days/hours remaining until deadline
     - Option to send manual reminders (max 3 per cycle)

4. **Add analytics events** (PostHog)
   - Track `invite_link_viewed`
   - Track `circle_joined` (source: link/direct)
   - Track `circle_left`
   - Track `member_removed` (keep_contributions: true/false)

5. **Manual testing in dev**
   - Test invite link flow for new users
   - Test invite link flow for existing users
   - Test member list display
   - Test leave circle flow
   - Test admin remove member (both keep and delete options)
   - Test admin submission dashboard real-time updates
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (memberships table)
- Convex functions (joinCircle, leaveCircle, removeMember, etc.)
- UI components with Convex integration
- Analytics events tracking
- Working membership flows in dev environment

---

### Phase 3: Testing (Days 6-7 of Week 3, ~9-12 hours for Epic 3)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test member removal logic (keep vs delete contributions)
   - Test rejoining logic (restores access)
   - Test admin-only access control
   - Target: 80% coverage for business logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test joinCircle mutation (via invite link)
   - Test leaveCircle mutation (preserves contributions)
   - Test removeMember mutation (keep contributions)
   - Test removeMember mutation (delete contributions)
   - Test getCircleMembers query (active members only)
   - Test getSubmissionStatus query (admin-only)
   - Test rejoining after leaving (restores full access)

3. **Write E2E tests** (Playwright)
   - Test join circle via invite link (new user signup flow)
   - Test join circle via invite link (existing user login flow)
   - Test leave circle (confirm contributions stay)
   - Test admin remove member (keep contributions)
   - Test admin remove member (delete contributions, shows [Removed])
   - Test admin submission dashboard shows correct statuses
   - Test rejoining after leaving (full access restored)

4. **Manual QA testing**
   - Test invite link sharing via WhatsApp, iMessage
   - Test admin dashboard real-time updates (Convex subscription)
   - Test member removal with delete contributions (verify all data cleaned up)
   - Test rejoining seamlessly
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for business logic)
- Integration tests for all Convex functions
- E2E tests for critical membership paths
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create pull request with Figma links
2. Code review
3. Address review comments
4. CI validation
5. Fix any CI failures
6. Deploy to Vercel preview and test
7. Merge to main after approval
8. Auto-deploy to production
9. Smoke test invite flow and membership in production
10. Monitor Sentry for errors
11. Monitor PostHog for membership events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 3 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 3.1: Joining a Circle via Invite Link

**When** a friend sends me an invite link to their circle,
**I want to** click it and join seamlessly,
**So I can** start participating in their newsletter without complicated setup.

**Context:** This is the primary growth mechanism. The invite link flow must handle both existing users and new signups gracefully.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.1.1 | Invite link opens circle preview page (name, cover, member count) | P0 |
| 3.1.2 | Invite link includes context when copied | P0 |
| 3.1.3 | "Join Circle" button for logged-in users | P0 |
| 3.1.4 | "Sign up to Join" button for new users | P0 |
| 3.1.5 | "Log in to Join" option for logged-out users | P0 |
| 3.1.6 | After joining, redirect to circle home | P0 |
| 3.1.7 | Prevent duplicate joins | P0 |
| 3.1.8 | Invite links do not expire by default | P0 |
| 3.1.9 | Member list preview on invite page (before joining) | P1 |
| 3.1.10 | Admin can set invite link to expire | P2 |

**Acceptance Criteria:**
- Entire join flow (for logged-in user) completes in 2 taps
- New user signup + join completes in under 90 seconds (OAuth) or 2 minutes (email/password)
- User cannot join a circle they're already in
- **Joining mid-month:** user can submit for current cycle; same deadline applies
- New member sees prompts immediately after joining with deadline countdown

---

### JTBD 3.2: Viewing Circle Members

**When** I'm in a circle and want to see who else is part of it,
**I want to** view a list of all members,
**So I can** know who I'm sharing with and who to expect in the newsletter.

**Context:** Transparency about membership builds trust, especially for Alex who needs to know exactly who sees their content.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.2.1 | View list of all active circle members with name and photo | P0 |
| 3.2.2 | Indicate which member is the admin | P0 |
| 3.2.3 | Show member join date | P1 |
| 3.2.4 | Submission status NOT visible to regular members (admin-only) | P0 |
| 3.2.5 | Tap member to view their profile | P1 |

**Acceptance Criteria:**
- Member list accessible from circle home screen
- Admin indicated with badge or label, not just position
- Member count shows only active members (excludes those who have left)
- Submission status dashboard is admin-only; regular members cannot see others' progress
- Member list sorted by: admin first, then alphabetical or by join date

---

### JTBD 3.3: Leaving a Circle

**When** I no longer want to be part of a circle,
**I want to** leave it voluntarily,
**So I can** stop receiving newsletters and remove my obligation to participate.

**Context:** Life changes. People should be able to leave gracefully without drama or asking permission.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.3.1 | "Leave Circle" option in circle settings | P0 |
| 3.3.2 | Confirmation dialog explaining consequences | P0 |
| 3.3.3 | Upon leaving, user removed from future newsletters immediately | P0 |
| 3.3.4 | User's past contributions remain visible to remaining members | P0 |
| 3.3.5 | User who left loses access to circle content while not a member | P0 |
| 3.3.6 | User can rejoin via invite link and regains full access | P0 |
| 3.3.7 | If admin leaves, prompt to transfer or delete circle | P0 |
| 3.3.8 | No notification sent to other members when someone leaves | P0 |

**Acceptance Criteria:**
- Leaving is instant; no waiting period
- Left circles removed from user's circle list immediately
- Past newsletters remain intact for remaining members with departed user's contributions
- Departed user cannot access circle content while not a member
- **Rejoining restores full access** to all past newsletters and their own previous contributions
- Rejoining mid-cycle allows user to submit for current cycle
- Admin cannot leave without transferring admin role or deleting circle

---

### JTBD 3.4: Admin Removing a Member

**When** someone in my circle is no longer part of our friend group or is causing issues,
**I want to** remove them from the circle,
**So I can** maintain a safe and relevant group for everyone else.

**Context:** Rare but necessary. Friendships end, people become inactive, or someone was added by mistake. Admin has control over whether to preserve or erase the removed member's history.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.4.1 | Admin can remove any member except themselves | P0 |
| 3.4.2 | Confirmation dialog with removal options | P0 |
| 3.4.3 | Removed member no longer receives newsletters | P0 |
| 3.4.4 | Admin chooses: keep contributions OR delete them | P0 |
| 3.4.5 | If keep: removed member can rejoin via invite link | P0 |
| 3.4.6 | If delete: member blocked, past content shows "[Removed]" | P0 |
| 3.4.7 | Deletion of contributions is immediate and irreversible | P0 |
| 3.4.8 | No notification sent to removed member in V0 | P0 |
| 3.4.9 | Admin can restore blocked member's ability to rejoin | P2 |

**Acceptance Criteria:**
- Removal is instant
- Removal dialog presents two options: "Remove" (keeps contributions) or "Remove & Block" (deletes contributions)
- Removed user sees circle disappear from their list
- Other members not notified of removal
- Removed user's current-cycle draft is discarded (not included in newsletter)
- If blocked: past newsletters show "[Removed]" where their content was; member cannot rejoin even with new invite link

---

### JTBD 3.5: Admin Viewing Submission Status

**When** the deadline is approaching and I want to know who hasn't submitted yet,
**I want to** see a dashboard of submission status,
**So I can** send friendly reminders to specific people via our group chat.

**Context:** Jordan uses this to nudge stragglers. Should show who, not what (no peeking at content before newsletter).

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.5.1 | Admin dashboard shows each member's submission status | P0 |
| 3.5.2 | Status options: "Submitted", "In Progress", "Not Started" | P0 |
| 3.5.3 | Show submission timestamp for those who've submitted | P1 |
| 3.5.4 | Do NOT show content preview | P0 |
| 3.5.5 | Show days/hours remaining until deadline | P0 |
| 3.5.6 | One-tap "Send reminder" to individual member | P1 |
| 3.5.7 | Option to send reminder to all non-submitters at once | P1 |
| 3.5.8 | Limit admin to max 3 manual reminders per cycle | P0 |

**Acceptance Criteria:**
- Dashboard accessible from circle home for admin only
- Regular members cannot see submission status of others
- Status updates in real-time (via Convex subscriptions)
- Admin sees remaining manual reminder count (e.g., "2 of 3 reminders remaining")
- Manual reminder limit resets after newsletter sends

---

## Analytics Events

Track user actions throughout membership flows:

**Epic 3 (Membership):**
- `invite_link_viewed`
- `circle_joined` (source: link/direct)
- `circle_left`
- `member_removed` (keep_contributions: true/false)

**Implementation:** Track events at key moments:
- When invite link preview page loads
- After user successfully joins circle
- When user leaves circle
- When admin removes member (with keep/delete option)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test member removal logic (keep vs delete contributions)
- Test rejoining logic (restores access)
- Test admin-only access control
- Target: 80% coverage for business logic

### Integration Tests (Vitest + Testing Library)
- Test joinCircle mutation (via invite link)
- Test leaveCircle mutation (preserves contributions)
- Test removeMember mutation (keep contributions)
- Test removeMember mutation (delete contributions)
- Test getCircleMembers query (active members only)
- Test getSubmissionStatus query (admin-only)
- Test rejoining after leaving (restores full access)

### E2E Tests (Playwright)
- Test join circle via invite link (new user signup flow)
- Test join circle via invite link (existing user login flow)
- Test leave circle (confirm contributions stay)
- Test admin remove member (keep contributions)
- Test admin remove member (delete contributions)
- Test admin submission dashboard shows correct statuses
- Test rejoining after leaving

### Manual QA Testing
- Test invite link sharing via WhatsApp, iMessage
- Test admin dashboard real-time updates (Convex subscription)
- Test member removal with delete contributions (verify cleanup)
- Test rejoining seamlessly

**Coverage Target:** 80%+ for business logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires Convex, UI framework
- **Epic 1 (Authentication & Identity)** - Users must be authenticated
- **Epic 2 (Circle Creation & Setup)** - Circles must exist before users can join

### Enables (What this epic unlocks)
- **Epic 4 (Content Submission)** - Users must be members to submit content
- **Epic 5 (Newsletter Experience)** - Member list needed for newsletter generation
- **Epic 6 (Notifications & Reminders)** - Membership data needed for notifications

---

## Week 3 Timeline Breakdown (Epic 3 portion)

### Days 1-2: Design (9-11 hours for Epic 3 screens)
- Create wireframes for 6 Epic 3 screens in Figma
- Apply tweakcn theme tokens
- Design for mobile (375px) and desktop (1024px+)
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (18-23 hours for Epic 3)
- Create memberships table in Convex schema
- Create membership mutations and queries
- Build InviteLinkPreview page
- Build circle home screen
- Build MemberList component
- Build LeaveCircleModal
- Build RemoveMemberModal (with keep/delete options)
- Build AdminSubmissionDashboard
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (9-12 hours for Epic 3)
- Write unit tests for membership logic
- Write integration tests for Convex functions
- Write E2E tests for invite and membership flows
- Manual QA on iOS/Android
- Test admin dashboard real-time updates
- Fix bugs found during testing
- Retest to verify fixes

### Continuous: Review & Deploy
- Create PR with Figma links
- Code review
- CI validation
- Deploy to Vercel preview
- Merge to main
- Smoke test production
- Monitor Sentry and PostHog

**Note:** Epic 2 and Epic 3 are developed together in Week 3 for a combined 70-90 hours.

---

## Key Risks

1. **Real-time submission status updates** - Convex subscription performance
   - Mitigation: Test with many concurrent users; optimize queries

2. **Member removal with delete contributions** - Must clean up all data
   - Mitigation: Create comprehensive deletion checklist; test thoroughly

3. **Invite link security** - Public in V0, no auth check before preview
   - Mitigation: Document as known limitation; plan improvements for V0.1

4. **Rejoining complexity** - Must restore all access seamlessly
   - Mitigation: Write comprehensive tests; document edge cases

---

## Success Criteria

- [ ] Users can join circles via invite link in 2 taps (if logged in)
- [ ] New user signup + join completes in under 90 seconds
- [ ] Invite link preview shows circle details (name, cover, member count)
- [ ] Member list shows all active members with admin badge
- [ ] Users can leave circles voluntarily
- [ ] Past contributions remain visible after user leaves
- [ ] Rejoining restores full access to past newsletters
- [ ] Admin can remove members with keep or delete options
- [ ] Admin submission dashboard shows real-time status
- [ ] Manual reminders limited to 3 per cycle
- [ ] All membership flows have E2E tests
- [ ] 80%+ test coverage for business logic
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
