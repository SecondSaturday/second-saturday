---
name: v0-polish
description: Final polish pass — circle creation flow, onboarding, invite page, accessibility, dead code cleanup
status: backlog
created: 2026-02-24T21:54:14Z
---

# PRD: v0-polish

## Executive Summary

Final polish pass before V0 ships. This epic covers the circle creation flow redesign, profile setup onboarding improvements, invite page warmth, dashboard polish, accessibility gaps, dead code cleanup, and data integrity fixes. It is a mix of design-driven work (creation flow, onboarding) and autonomous cleanup (dead code, accessibility, data integrity). PL5 (FAB component naming) from Epic 2 validation is folded in.

## Problem Statement

After Epics 1-3, all core flows work and screens are redesigned, but the first-impression experiences (circle creation, profile setup, invite acceptance) lack polish:

1. **Circle creation** has no intro context, no step indicator, edge-to-edge form layout, and inline prompt library instead of the redesigned browse pattern.
2. **Profile setup** doesn't leverage SSO data — users re-enter names and upload photos that Clerk already has from Google/Apple.
3. **Invite page** looks transactional instead of warm and personal.
4. **Accessibility** gaps exist (missing aria-labels, no loading skeletons).
5. **Dead code** from pre-refactor components lingers in the codebase.
6. **Data integrity** has minor gaps (concurrent save button clicks, missing database index).

## User Stories

### US1: New Circle Creator
**When** I decide to create a circle for my friend group,
**I want** a guided, polished creation experience with clear steps,
**So that** I feel confident about what I'm setting up and excited to invite friends.

**Acceptance Criteria:**
- Intro splash screen with heading, subtitle, and "Get Started" button
- 3-step progress indicator visible on every step
- Form content in centered max-width container
- Profile-header image layout (cover + overlapping icon)
- Fixed bottom CTA bar with border separator
- "Browse Prompt Library" row instead of inline library
- Warmer setup-complete copy
- Adequate bottom padding on all CTAs

### US2: New User from SSO
**When** I sign up via Google or Apple and reach the profile setup page,
**I want** my name and photo pre-filled from my Google/Apple account,
**So that** I can skip re-entering information the system already knows.

**Acceptance Criteria:**
- Avatar pre-populated from Clerk `user.imageUrl` (SSO profile image)
- Name fields pre-populated from Clerk `firstName` / `lastName`
- Two fields (First Name, Last Name) instead of single Display Name
- Manual upload remains available to override SSO photo
- Logo visible only on mobile (desktop already shows right panel branding)
- Floating label input pattern (label animates up on focus/fill)

### US3: Invited User
**When** I open a friend's invite link,
**I want** the page to feel like a personal invitation, not a system notification,
**So that** I'm excited to join rather than skeptical.

**Acceptance Criteria:**
- Cover image banner with icon overlay (ProfileHeaderImageLayout display mode)
- Warm copy: "You've been invited to join {circleName}"
- "A group of {memberCount} friends sharing monthly updates"
- "{adminName} started this circle"
- "1 member" (singular) when count is 1

### US4: Screen Reader User
**When** I navigate the app using a screen reader,
**I want** all buttons to be properly labeled,
**So that** I know what each button does.

**Acceptance Criteria:**
- All icon-only buttons have `aria-label` attributes
- Loading states use skeleton components (not just spinners)

## Requirements

### Functional Requirements

#### Circle Creation Flow

##### FR1: Intro Splash Screen (L1) [P1]
**Current:** Tapping "Create a circle" lands directly on a form with no context.
**Change:** Show an intro splash first: large serif heading "Create Your Group"; subtitle "Every second Saturday, connect meaningfully"; line "Set prompts, invite friends, and receive monthly newsletters"; centered "Get Started" button advancing to Step 1. Back arrow in top-left returns to dashboard.
**Design input:** Figma recommended.
**Files:** `src/app/dashboard/create/page.tsx` or new sub-route

##### FR2: Step Progress Indicator (L2) [P2]
**Current:** No progress indicator across the 3-step wizard.
**Change:** Horizontal numbered step indicator below header on every step: 3 circles connected by line, labeled "1 Basic Info", "2 Prompts", "3 Members". Current step filled with primary accent. Completed steps show checkmark. Future steps muted gray.
**Design input:** Reference screenshot.
**Files:** New shared component, used across create page, prompts page, setup-complete page

##### FR3: Form Max-Width Container (L3) [P2]
**Current:** Form stretches edge-to-edge with only 24px padding, no max-width.
**Change:** Wrap in centered `max-w-lg` container matching Circle Settings width.
**Files:** `src/app/dashboard/create/page.tsx`

##### FR4: Fixed Bottom CTA Bar (L5) [P2]
**Current:** "Create Circle" button uses `mt-auto`, flush at bottom edge.
**Change:** Move CTA to fixed bottom bar with `border-t border-border` and `px-4 py-4` padding. Button floats above content.
**Files:** `src/app/dashboard/create/page.tsx`

##### FR5: Prompts Step Max-Width (L6) [P2]
**Current:** Prompts editor stretches edge-to-edge with 16px padding.
**Change:** Wrap in centered max-width container matching Settings width.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

##### FR6: Prompts CTA Bottom Padding (L7) [P2]
**Current:** "Continue" CTA has minimal bottom spacing.
**Change:** Add bottom padding / safe-area inset for breathing room.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

##### FR7: Setup Complete Bottom Padding (L9) [P2]
**Current:** "Go to Dashboard" CTA feels crowded at bottom.
**Change:** Increase bottom padding (e.g., `pb-6` or `pb-8`).
**Files:** `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx`

##### FR8: Setup Complete Warmer Copy (L10) [P3]
**Current:** "{circleName} is ready!" + "Now invite your friends to join." — reads like a system message.
**Change:** Warmer, celebratory copy, e.g., "You're all set! {circleName} is ready for your crew." Exact wording TBD.
**Files:** `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx`

#### Profile Setup / Onboarding

##### FR9: Logo Mobile-Only (N1) [P1]
**Current:** Logo icon shows on all screen sizes including desktop where right panel has full branding.
**Change:** Add `md:hidden` (or equivalent) to logo container so it only appears on mobile.
**Files:** `src/app/complete-profile/page.tsx`

##### FR10: Pre-populate Avatar from SSO (N2) [P1]
**Current:** Avatar starts blank (dashed circle + camera icon). User must upload manually.
**Change:** Check Clerk `user.imageUrl` on mount. If available (SSO provider image), display it as the default avatar. Manual upload remains as override.
**Files:** `src/app/complete-profile/page.tsx`

##### FR11: Pre-populate Name from SSO (N3) [P1]
**Current:** Name starts as empty string `useState('')`.
**Change:** Initialize from Clerk user object: `user.firstName` and `user.lastName`. Pre-fill the fields so SSO users can just click Continue.
**Files:** `src/app/complete-profile/page.tsx`

##### FR12: First Name / Last Name Fields (N4) [P2]
**Current:** Single "Display Name" input.
**Change:** Two fields: "First Name" and "Last Name", both pre-populated from Clerk SSO. Store composed full name. May require updating `convex/users.ts` schema to store `firstName`/`lastName` separately, or compose at save time.
**Files:** `src/app/complete-profile/page.tsx`, potentially `convex/users.ts`

##### FR13: Floating Label Input Pattern (N5) [P2]
**Current:** Static label above input, placeholder inside.
**Change:** Material Design floating label: when empty/unfocused, label text sits inside input as placeholder; on focus or when value exists, label animates up to become small label above input border. No separate static label.
**Design input:** Reference screenshot.
**Files:** `src/app/complete-profile/page.tsx`, potentially new shared `FloatingLabelInput` component

#### Invite Page

##### FR14: ProfileHeaderImageLayout on Invite (M1) [P2]
**Current:** Circle icon avatar centered in white card, no cover image.
**Change:** Apply `ProfileHeaderImageLayout` in display mode: cover image as banner across top of card, icon overlapping bottom edge. Muted placeholder banner if no cover exists.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

##### FR15: Warmer Invite Copy (M2) [P2]
**Current:** Circle name heading, "{memberCount} members" with Users icon, "Created by {adminName}". Transactional tone.
**Change:** Heading: "You've been invited to join {circleName}". Member line: "A group of {memberCount} friends sharing monthly updates". Creator: "{adminName} started this circle". Warm, personal tone.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

##### FR16: Member Count Pluralization (C3) [P2]
**Current:** Shows "1 members" when count is 1.
**Change:** "1 member" (singular) when count === 1, "{n} members" (plural) otherwise.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

#### Dashboard + Nav Polish

##### FR17: Center Date Picker (F7) [P2]
**Current:** Date picker button positioned left next to avatar.
**Change:** Center horizontally between avatar (left) and menu icon (right).
**Files:** `src/components/dashboard/DashboardHeader.tsx`

##### FR18: Prompts Back Arrow Destination (H4) [P2]
**Current:** Back arrow on prompts page navigates to `/dashboard`.
**Change:** Navigate to `/dashboard/circles/[circleId]/settings` since prompts is conceptually within settings.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

##### FR19: Rename FAB Component (PL5) [P2]
**Current:** Component named `CreateCircleFAB` with `data-testid="create-circle-button"` even though it now navigates to `/dashboard/submit`.
**Change:** Rename to `SubmitFAB`, update file name, test ID to `"submit-button"`, update all imports.
**Files:** `src/components/dashboard/CreateCircleFAB.tsx` → `src/components/dashboard/SubmitFAB.tsx`, `src/app/dashboard/page.tsx`, test files

#### Accessibility & Loading States

##### FR20: Aria Labels (Q1) [P2]
**Current:** Icon-only buttons (three-dot menu) in DashboardHeader have no `aria-label`.
**Change:** Add `aria-label="Menu"` to three-dot button. Audit all other icon-only buttons across the app and add labels.
**Files:** `src/components/dashboard/DashboardHeader.tsx`, global audit

##### FR21: Members List Loading Skeleton (Q2) [P2]
**Current:** Basic spinner while members data loads.
**Change:** Skeleton UI matching member list layout (avatar circles, name bars, role label bars).
**Files:** `src/components/CircleSettings.tsx` (Members tab)

##### FR22: Newsletter Loading Skeleton (Q3) [P2]
**Current:** Basic spinner while newsletter loads.
**Change:** Skeleton matching newsletter layout (cover placeholder, heading bars, card placeholders).
**Files:** `src/components/newsletter/NewsletterView.tsx`

#### Dead Code Cleanup

##### FR23: Cleanup Unused Components (E1-E4) [P2]
**Current:** Several unused components and functions linger:
- E1: `dropdown-menu.tsx` — evaluate if used by Epic 3 (I1 three-dot menus, J3 action sheets). If used, keep. If Epic 3 used a different pattern (Popover), delete.
- E2: `VideoThumbnail.tsx` — unused in app code, only in tests. Delete component and test.
- E3: 3 unused push notification wrappers in `push.ts`. Delete.
- E4: 3 unused email template wrappers in `email.ts`. Delete.
**Files:** `src/components/ui/dropdown-menu.tsx`, `src/components/submissions/VideoThumbnail.tsx`, `src/lib/push.ts`, `src/lib/email.ts`

#### Data Integrity

##### FR24: Save Button Concurrent Mutation Guard (R1) [P2]
**Current:** CircleSettings `handleSave` sets `setSaving(true)` but button not disabled during mutation.
**Change:** Disable save button when `saving === true`. Show "Saving..." loading text.
**Files:** `src/components/CircleSettings.tsx`

##### FR25: Newsletter PublishedAt Index (R2) [P2]
**Current:** No `['circleId', 'publishedAt']` compound index for newsletter sort queries.
**Change:** Add index to newsletters table in schema.
**Files:** `convex/schema.ts`

#### Backlog

##### FR26: Resizable Sidebar (F8) [P3]
**Current:** Sidebar has fixed `md:w-[380px]` width.
**Change:** Add drag handle on right edge for resize. Only implement if time allows.
**Files:** `src/app/dashboard/page.tsx`

### Non-Functional Requirements

- **First impressions matter:** Circle creation, profile setup, and invite page are the first things new users see. Polish must be high.
- **Schema changes:** FR12 (first/last name fields) may require adding `firstName`/`lastName` to the users table. Evaluate whether to store separately or compose at save time.
- **Shared components:** FloatingLabelInput (FR13) and StepProgressIndicator (FR2) should be reusable shared components if they have value beyond their initial use.

## Success Criteria

- Circle creation has intro splash, step indicator, max-width form, profile-header image layout, fixed CTA bar
- Profile setup pre-populates name and avatar from SSO, uses first/last name fields with floating labels
- Invite page uses ProfileHeaderImageLayout, shows warm copy, handles pluralization
- Date picker centered in header, prompts back arrow goes to settings
- FAB component properly renamed
- All icon-only buttons have aria-labels
- Loading skeletons on members list and newsletter view
- All dead code removed (or confirmed in use)
- Save button prevents concurrent mutations
- Newsletter index added to schema
- All tests pass

## Constraints & Assumptions

- **ProfileHeaderImageLayout:** Already exists and interface resolved in Epic 3 (G9). Used in display mode here for invite page (M1).
- **PromptsEditor shared component:** Already extracted in Epic 2. Prompts step changes (L6, L7) modify the page wrapper, not the component itself.
- **Clerk user object:** `user.imageUrl`, `user.firstName`, `user.lastName` are standard Clerk fields available via `useUser()` hook.
- **E1 evaluation:** Whether to delete `dropdown-menu.tsx` depends on whether Epic 3 used it for three-dot menus. Check imports before deleting.

## Out of Scope

- In-app notification center (V0.1)
- Rate limiting (V0.1)
- Web push notifications (V0.1)
- Offline support
- Per-circle notification preferences

## Dependencies

- **Requires:** Epic 3 (v0-redesigns) substantially complete — redesigned screens must be in place before polish
- **Requires:** ProfileHeaderImageLayout interface resolved in Epic 3 for M1 usage
- **Parallel:** Dead code (FR23), data integrity (FR24-FR25), and accessibility (FR20-FR22) can run autonomously while design-driven items are in progress

## Design Gates

| Gate | FRs | Format | Blocks |
|------|-----|--------|--------|
| Creation splash screen | FR1 | Figma | Circle creation group |
| Step progress indicator | FR2 | Reference screenshot | Circle creation group |
| Floating label input | FR13 | Reference screenshot | Onboarding group |
