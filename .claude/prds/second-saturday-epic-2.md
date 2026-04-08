---
name: second-saturday-epic-2
description: Circle Creation & Setup - home dashboard, creating circles, configuring prompts, managing settings, and generating invite links
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 3 (first part, combined with Epic 3: 70-90 hours total)
---

# Epic 2: Circle Creation & Setup

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 3 (first part, combined with Epic 3: 70-90 hours total)
**Prerequisites:** Epic 0 (Project Setup), Epic 1 (Authentication) must be complete

---

## Overview

This epic covers the home dashboard where users see all their circles, and how users create and configure new circles. The circle creator becomes the admin and is responsible for setting the tone through prompts and inviting members.

**Key Insight:** The dashboard is the user's home base—it should show what needs attention at a glance (submission status) and make circle access instant. Circle creation should feel like naming a group chat, not creating a corporate workspace.

---

## Goals

1. **Provide a home dashboard** - Users see all their circles with submission status at a glance
2. **Enable circle creation** - Users can create circles with name, icon, and cover image
3. **Configure prompts** - Admin can select from library or write custom prompts (1-8 prompts)
4. **Generate invite links** - Automatic invite link generation with context
5. **Manage circle settings** - Edit name, images, prompts, regenerate invite link
6. **Enforce 3-member minimum** - Circles need 3+ members before first newsletter sends

---

## Implementation Plan

### Phase 1: Design (Days 1-2 of Week 3, ~9-11 hours for Epic 2)

**Goal:** Define circle creation screens and user flows before writing code.

**Activities:**

1. **Identify screens and components needed**
   - **Home dashboard** (circle list with status indicators, header with avatar/notifications/menu)
   - Circle creation form (name, icon upload, cover upload, description)
   - Prompt selection screen (library + custom prompts)
   - Prompt reorder screen (drag-and-drop interface)
   - Circle settings screen (edit name, images, regenerate invite link)
   - Invite link share modal (copy button with context)
   - Empty state (no circles yet, CTA to create first circle)

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Apply tweakcn theme tokens
   - **Design home dashboard with circle list, submission status dots, and FAB**
   - **Design desktop sidebar layout (circle list + main content area)**
   - Design image upload with preview and cropping
   - Design prompt library with categories

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code (CircleForm, PromptSelector, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for 7 Epic 2 screens (including home dashboard)
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5 of Week 3, ~17-22 hours for Epic 2)

**Goal:** Build circle creation features following approved designs.

**Activities:**

1. **Set up Convex schema**
   - Create circles table in schema.ts
     - Fields: name, iconImageId, coverImageId, description, adminId, inviteCode, timezone, createdAt, archivedAt
   - Create prompts table in schema.ts
     - Fields: circleId, text, order, active, createdAt
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create createCircle mutation (auto-generates invite code)
   - Create updateCircle mutation (name, images, description)
   - Create generateInviteLink mutation (UUID-based, regenerates code)
   - Create getCirclesByUser query (returns circles with member previews and read/unread status)
   - Create markNewsletterRead mutation (clears unread indicator for a circle)
   - Create getNewslettersByDate query (filters newsletters by selected month/second saturday)
   - Create getCirclePrompts query
   - Create updatePrompts mutation (add, remove, reorder)
   - Add 3-member minimum check logic

3. **Build UI components**
   - Build HomeDashboard page
     - CircleList component (displays all user's circles)
     - CircleListItem component (icon, name, member preview, read/unread dot)
     - DashboardHeader component (avatar, date picker, notifications, menu)
     - DatePicker component (scrollable list of past issues, filters main content)
     - CreateCircleFAB component (shows next deadline date)
     - Desktop: sidebar layout with main content area
     - Mobile: full-screen list layout
     - Empty state component (no circles CTA)
   - Build CircleCreationForm component
     - Name input (3-50 chars validation)
     - Icon upload with browser-image-compression
     - Cover upload with browser-image-compression (3:1 aspect ratio)
     - Optional description field
   - Build PromptSelector component
     - Display 4 default prompts pre-selected
     - Prompt library with suggested prompts
     - Custom prompt input (200 char limit)
     - Support 1-8 active prompts
   - Build PromptReorder component with dnd-kit (drag-and-drop)
   - Build CircleSettings screen
     - Edit name, icon, cover
     - View creation date and issue count
     - Regenerate invite link with warning
   - Implement invite link generation and copy-to-clipboard
     - Add context: "Jordan invited you to College Friends - [link]"
   - Build empty state (no circles yet)
   - Implement 3-member minimum warning UI

4. **Add analytics events** (PostHog)
   - Track `circle_created`
   - Track `circle_updated` (field: name/cover/prompts)
   - Track `invite_link_generated`
   - Track `invite_link_copied`

5. **Manual testing in dev**
   - Test circle creation on web and mobile
   - Test image upload and compression
   - Test prompt selection and reordering
   - Test invite link generation
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (circles, prompts tables)
- Convex functions (createCircle, updateCircle, getCirclesByUser, markNewsletterRead, getNewslettersByDate, etc.)
- Home dashboard with circle list and real-time status
- UI components with Convex integration
- Analytics events tracking
- Working circle creation in dev environment

---

### Phase 3: Testing (Days 6-7 of Week 3, ~8-11 hours for Epic 2)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test invite link generation (UUID format)
   - Test circle name validation (3-50 chars)
   - Test image file size/type validation
   - Test prompt text validation (200 char limit)
   - Test 3-member minimum logic
   - Target: 80% coverage for validation logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test createCircle mutation (with defaults)
   - Test updateCircle mutation (name, icon, cover)
   - Test prompt CRUD operations
   - Test invite link regeneration
   - Test getCirclesByUser query
   - Test getCirclePrompts query

3. **Write E2E tests** (Playwright)
   - Test home dashboard loads with user's circles
   - Test read/unread indicator (colored dot) shows for unread newsletters, clears after viewing
   - Test date picker filters newsletters correctly
   - Test tap circle navigates to circle detail
   - Test FAB opens circle creation flow
   - Test full circle creation flow (name, upload icon, add custom prompt)
   - Test invite link copy includes context
   - Test prompt library selection
   - Test prompt reordering via drag-and-drop
   - Test circle settings update
   - Test 3-member minimum warning appears

4. **Manual QA testing**
   - Test image upload on real iOS/Android devices
   - Test invite link sharing via WhatsApp, iMessage
   - Test prompt drag-and-drop reorder on mobile
   - Test 3-member minimum warning
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for validation logic)
- Integration tests for all Convex functions
- E2E tests for critical circle creation paths
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create pull request with Figma links
2. Code review (backend dev reviews frontend code, vice versa)
3. Address review comments
4. CI validation (GitHub Actions runs lint, type check, tests)
5. Fix any CI failures
6. Deploy to Vercel preview and test
7. Merge to main after approval
8. Auto-deploy to production
9. Smoke test circle creation in production
10. Monitor Sentry for errors
11. Monitor PostHog for circle_created events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 2 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 2.0: Home Dashboard

**When** I open the app after logging in,
**I want to** see all my circles at a glance with their current status,
**So I can** quickly navigate to a circle or understand what needs my attention.

**Context:** This is the primary landing page for logged-in users. It serves as the hub for all circle activity. Users need to see submission status at a glance and access any circle quickly.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.0.1 | Display list of all circles user belongs to (as member or admin) | P0 |
| 2.0.2 | Show circle icon/thumbnail for each circle | P0 |
| 2.0.3 | Show circle name (bold) | P0 |
| 2.0.4 | Show member names preview ("You, Alex, Dio, Shaun...") with truncation | P0 |
| 2.0.5 | Show read/unread indicator per circle (colored dot = unread newsletter, no dot = read) - like Snapchat | P0 |
| 2.0.6 | Tap circle row to navigate to circle detail/home screen | P0 |
| 2.0.7 | Header shows user avatar (tap for profile/settings) | P0 |
| 2.0.8 | Header shows current cycle date (e.g., "Sep 13") with dropdown to filter newsletters by month/second saturday; picker shows scrollable list of past issues for easy selection | P0 |
| 2.0.9 | Header shows notification bell icon | P0 |
| 2.0.10 | Header shows more options menu (⋮) | P0 |
| 2.0.11 | FAB (floating action button) to create new circle, shows next deadline date (e.g., "+ Oct 11") | P0 |
| 2.0.12 | Desktop: sidebar with circle list, main area shows selected circle's newsletter archive | P1 |
| 2.0.13 | Mobile: full-screen circle list, tap to navigate to circle detail | P0 |
| 2.0.14 | Empty state when user has no circles (CTA to create or join) | P0 |
| 2.0.15 | Sort circles by most recent activity or alphabetically | P2 |

**Acceptance Criteria:**
- Dashboard loads within 2 seconds
- Read/unread status updates in real-time (Convex subscription)
- Colored dot disappears after user views the newsletter (like Snapchat)
- Date picker shows all past issues in a scrollable list, easy to select any month
- Selecting a date filters the main content area to show that issue's newsletters
- Member names truncate gracefully on mobile (ellipsis after ~5 names)
- User can access any circle in 1 tap
- FAB is always visible and accessible
- Empty state clearly explains how to get started (create circle or join via invite link)
- Desktop layout: circle list sidebar (fixed width ~260px), main content area for newsletter archive
- Mobile layout: full-width circle list with clear tap targets

---

### JTBD 2.1: Creating a New Circle

**When** I want to start a newsletter with a group of friends,
**I want to** create a circle with a name that represents our group,
**So I can** establish a shared space and start inviting people.

**Context:** Jordan initiates this. The circle name and cover image set the emotional tone. This should feel like naming a group chat, not creating a corporate workspace.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.1.1 | Create circle with custom name (required, 3-50 chars) | P0 |
| 2.1.2 | Upload optional circle icon/image (square) | P0 |
| 2.1.3 | Upload optional cover image (3:1 aspect ratio) | P0 |
| 2.1.4 | Images compressed client-side before upload | P0 |
| 2.1.5 | Creator automatically becomes circle admin | P0 |
| 2.1.6 | Circle created with 4 default prompts pre-selected | P0 |
| 2.1.7 | Generate unique invite link immediately upon creation | P0 |
| 2.1.8 | Store admin's timezone for displaying local times | P0 |
| 2.1.9 | Optional circle description/tagline | P1 |

**Acceptance Criteria:**
- Circle creation completes in under 30 seconds
- Cover image auto-cropped/resized; supports JPG, PNG, HEIC; compressed client-side
- Circle name must be unique per user (same user can't have two circles with identical names)
- Invite link generated is URL-safe and not guessable (UUID or similar)
- Invite links are public (anyone with link can join) for V0; security improvements in V0.1+
- **Minimum 3 members required** before first newsletter is sent (admin counts as 1)
- Circles with fewer than 3 members show "Invite more friends to start your newsletter" prompt
- **Grandfathering:** If circle drops below 3 members after newsletters have started, newsletters continue (no pause)

---

### JTBD 2.2: Configuring Circle Prompts

**When** I've created a circle and want to customize what we share,
**I want to** select or write prompts that fit our group's vibe,
**So I can** guide conversations toward meaningful topics without being too prescriptive.

**Context:** Prompts are the heart of the product. Good prompts lower the barrier to sharing (Alex) while enabling depth (Maya). Admin can set once and forget, or refresh monthly.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.2.1 | Select from library of suggested prompts | P0 |
| 2.2.2 | Write custom prompts (max 200 chars each) | P0 |
| 2.2.3 | Set 1-8 active prompts per circle | P0 |
| 2.2.4 | Reorder prompts (drag-and-drop) to control newsletter flow | P0 |
| 2.2.5 | Prompts persist month-to-month unless admin changes them | P0 |
| 2.2.6 | Preview how prompts will appear in newsletter | P1 |
| 2.2.7 | Prompt categories in library (reflection, fun, gratitude, deep) | P1 |
| 2.2.8 | "Seasonal" or "special occasion" prompts | P2 |

**Acceptance Criteria:**
- Default prompts pre-filled for new circles: "What did you do this month?", "One Good Thing", "On Your Mind", "What are you listening to?"
- Changes to prompts take effect for the current cycle (if before deadline) or next cycle
- Removing a prompt mid-cycle does not delete already-submitted responses for that prompt
- Empty prompts (no one answered) are omitted from newsletter

---

### JTBD 2.3: Managing Circle Settings

**When** I want to adjust how my circle operates,
**I want to** access settings for the circle I admin,
**So I can** update the name, image, or other configuration as our group evolves.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.3.1 | Edit circle name | P0 |
| 2.3.2 | Edit/replace circle cover image | P0 |
| 2.3.3 | Edit/replace circle icon image | P0 |
| 2.3.4 | View circle creation date and issue count | P0 |
| 2.3.5 | Regenerate invite link (invalidates old link) | P0 |
| 2.3.6 | Archive circle (stops newsletters, preserves history) | P1 |
| 2.3.7 | Delete circle permanently (requires confirmation) | P1 |
| 2.3.8 | Transfer admin role to another member | P1 |

**Acceptance Criteria:**
- Settings changes reflect immediately
- Regenerating invite link shows warning that old links will stop working
- Archived circles remain visible in member's circle list but marked as inactive
- Circle deletion requires typing circle name to confirm

---

## Analytics Events

Track user actions throughout circle creation:

**Epic 2 (Circles):**
- `dashboard_viewed`
- `circle_selected` (from dashboard)
- `newsletter_read` (when unread indicator clears)
- `date_filter_changed` (when user selects different month)
- `circle_created`
- `circle_updated` (field: name/cover/prompts)
- `invite_link_generated`
- `invite_link_copied`

**Implementation:** Track events at key moments:
- After circle creation completes
- After circle settings update
- When invite link is generated or regenerated
- When invite link is copied to clipboard

---

## Testing Strategy

### Unit Tests (Vitest)
- Test invite link generation (UUID format)
- Test circle name validation (3-50 chars)
- Test image file size/type validation
- Test prompt text validation (200 char limit)
- Test 3-member minimum logic
- Target: 80% coverage for validation functions

### Integration Tests (Vitest + Testing Library)
- Test createCircle mutation (with defaults)
- Test updateCircle mutation (name, icon, cover)
- Test prompt CRUD operations
- Test invite link regeneration
- Test getCirclesByUser query
- Test getCirclePrompts query

### E2E Tests (Playwright)
- Test full circle creation flow (name, upload icon, add custom prompt)
- Test invite link copy includes context
- Test prompt library selection
- Test prompt reordering via drag-and-drop
- Test circle settings update
- Test 3-member minimum warning appears

### Manual QA Testing
- Test image upload on real iOS/Android devices
- Test invite link sharing via WhatsApp, iMessage
- Test prompt drag-and-drop reorder on mobile
- Test 3-member minimum warning

**Coverage Target:** 80%+ for validation logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires Convex, UI framework, Figma MCP
- **Epic 1 (Authentication & Identity)** - Users must be authenticated to create circles

### Enables (What this epic unlocks)
- **Epic 3 (Circle Membership)** - Requires circles to exist before users can join
- **Epic 4 (Content Submission)** - Requires circles and prompts to exist
- **Epic 5 (Newsletter Experience)** - Requires circles and prompts for newsletter generation
- **Epic 6 (Notifications & Reminders)** - Requires circles for notification context

---

## Week 3 Timeline Breakdown (Epic 2 portion)

### Days 1-2: Design (9-11 hours for Epic 2 screens)
- Create wireframes for 7 Epic 2 screens in Figma (including home dashboard)
- Design home dashboard with circle list, status dots, FAB
- Design desktop sidebar layout
- Apply tweakcn theme tokens
- Design for mobile (375px) and desktop (1024px+)
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (17-22 hours for Epic 2)
- Create circles and prompts tables in Convex schema
- Create circle CRUD mutations and queries
- Create getCirclesByUser and getUserSubmissionStatus queries
- **Build HomeDashboard page with CircleList, status indicators, and FAB**
- **Build desktop sidebar layout**
- Build CircleCreationForm component
- Implement image upload with browser-image-compression
- Build PromptSelector component (4 defaults pre-selected)
- Build PromptReorder component with dnd-kit
- Build CircleSettings screen
- Implement invite link generation and copy
- Implement 3-member minimum logic
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (8-11 hours for Epic 2)
- Write unit tests for validation logic
- Write integration tests for Convex functions
- Write E2E tests for circle creation flows
- Manual QA on iOS/Android
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

1. **Image upload/compression on mobile devices** - HEIC format, file size limits
   - Mitigation: Use browser-image-compression library; test on real devices early

2. **Invite link security** - Public in V0, no auth check before preview
   - Mitigation: Document as known limitation; plan security improvements for V0.1

3. **Prompt library UX** - Could feel overwhelming with too many options
   - Mitigation: Start with 4 defaults; categorize library prompts clearly

4. **3-member minimum enforcement** - Complex logic with grandfathering
   - Mitigation: Write comprehensive tests; document edge cases

---

## Success Criteria

- [ ] Home dashboard displays all user's circles with icons, names, and member previews
- [ ] Read/unread indicator (colored dot) shows correctly per circle, clears after viewing
- [ ] Date picker filters newsletters by selected month/second saturday
- [ ] Dashboard loads within 2 seconds
- [ ] Tap circle navigates to circle detail screen
- [ ] FAB creates new circle and shows next deadline date
- [ ] Desktop layout shows sidebar + main content area
- [ ] Empty state displays when user has no circles
- [ ] Users can create circles with name, icon, and cover image
- [ ] Circle creation completes in under 30 seconds
- [ ] Images auto-compress to <200KB client-side
- [ ] 4 default prompts pre-selected on circle creation
- [ ] Users can select from prompt library or write custom prompts
- [ ] Prompts can be reordered via drag-and-drop
- [ ] Invite links are unique (UUID) and not guessable
- [ ] Invite link copy includes context (admin name + circle name)
- [ ] 3-member minimum warning displays for circles with <3 members
- [ ] Circle settings can be edited (name, images, prompts)
- [ ] Invite links can be regenerated with warning
- [ ] All circle creation flows have E2E tests
- [ ] 80%+ test coverage for validation logic
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
