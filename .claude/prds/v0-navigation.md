---
name: v0-navigation
description: Restructure app navigation — new submission route, newsletter as circle landing, 4-tab settings, shared components
status: completed
created: 2026-02-24T15:39:18Z
---

# PRD: v0-navigation

## Executive Summary

Restructure the app's core navigation and page architecture for V0 launch. This epic creates new routes, changes how users access key features, and builds the structural shells that all subsequent UI work depends on. It runs as the hands-on stream (with design input) in parallel with the autonomous v0-plumbing epic.

## Problem Statement

The current navigation has 4 fundamental issues:

1. **The FAB (primary action button) navigates to circle creation** — but the primary user action is making submissions, not creating circles. Circle creation is rare; submissions happen monthly.
2. **Submissions are buried** inside individual circle routes — users must select a circle, open it, find the "Make Submission" card, then tap it. There's no top-level submission entry point.
3. **Clicking a circle shows CircleHome** (stats, prompts, nav cards) — but users come to the app to read newsletters, not to see circle metadata. The newsletter is buried in an archive at the bottom of CircleHome.
4. **Circle Settings is a flat scrollable page** — prompts, members, and admin submission status all live at separate routes requiring multiple navigation hops. There's no cohesive settings experience.

Additionally, the dashboard header has dead UI elements (non-functional bell icon, non-functional three-dot menu) that mislead users.

## User Stories

### US1: Monthly Submitter
**When** I open the app around the second Saturday to submit my monthly update,
**I want** to tap one button and land on a submission form showing all my circles,
**So that** I can quickly write and submit responses without navigating through multiple screens.

**Acceptance Criteria:**
- FAB navigates to `/dashboard/submit` (not `/dashboard/create`)
- `/dashboard/submit` shows horizontal tabs for all user's circles with icons and names
- Selected tab shows that circle's prompts as response cards
- Existing `MultiCircleSubmissionScreen` behavior is preserved at the new route

### US2: Newsletter Reader
**When** I tap a circle in the sidebar/dashboard,
**I want** to immediately see the latest newsletter with all my friends' responses,
**So that** I don't have to navigate through a landing page to find the content I came for.

**Acceptance Criteria:**
- Clicking a circle loads the latest published newsletter for that circle
- If no newsletter exists yet, show an appropriate empty state
- CircleHome page is no longer the default landing
- Newsletter view shows circle name, cover image, and prompt sections with responses

### US3: Circle Admin
**When** I want to manage my circle's settings, prompts, members, and view submission status,
**I want** all of these in one tabbed settings page,
**So that** I don't have to navigate to 4 different routes.

**Acceptance Criteria:**
- Circle Settings has 4 tabs: Details, Prompts, Members, Status (admin-only)
- Stats tiles visible above tabs on all tab views
- Each tab contains the full functionality currently spread across separate routes
- Non-admin users see 3 tabs (no Status tab)

### US4: New Circle Creator
**When** I want to create a new circle,
**I want** to find the option in a logical place,
**So that** I can start a circle even after the FAB has been repurposed for submissions.

**Acceptance Criteria:**
- Three-dot menu in dashboard header opens a dropdown with "Create a circle" option
- Navigates to existing `/dashboard/create` flow
- Empty state on dashboard still shows "Create a circle" CTA as fallback

### US5: Any User
**When** the app encounters an error (crash, network failure, bad data),
**I want** to see a helpful error page with a way to recover,
**So that** I'm not stuck on a white screen.

**Acceptance Criteria:**
- `error.tsx` exists at app level, dashboard level, and circle level
- `global-error.tsx` catches root layout/provider failures
- `not-found.tsx` shows a styled 404 page
- All error pages have a "Try again" or "Go to Dashboard" button

## Requirements

### Functional Requirements

#### FR1: Three-Dot Menu (F4) [P1]
**Current:** MoreVertical button in `DashboardHeader.tsx:48-50` has `onClick={onMenuOpen}` but parent never passes the prop.
**Change:** Implement a dropdown/popover menu anchored to the three-dot button. First menu item: "Create a circle" → navigates to `/dashboard/create`. Wire the `onMenuOpen` prop from `dashboard/page.tsx`.
**Design input:** Verbal direction (simple dropdown).
**Files:** `src/components/dashboard/DashboardHeader.tsx`, `src/app/dashboard/page.tsx`

#### FR2: Top-Level Submission Page (F2) [P0]
**Current:** No `/dashboard/submit` route exists. Submissions are only at `/dashboard/circles/[circleId]/submit`.
**Change:** Create `src/app/dashboard/submit/page.tsx` that:
1. Fetches all circles the user belongs to via `api.circles.getCirclesByUser`
2. Renders `MultiCircleSubmissionScreen` with all circles as horizontal icon tabs
3. Each tab shows circle icon + short name, selected tab is underlined
4. Switching tabs loads that circle's prompts
**Design input:** Reference screenshot for tab layout (mirrors existing `MultiCircleSubmissionScreen` but as a standalone page).
**Files:** `src/app/dashboard/submit/page.tsx` (new), `src/screens/submissions/MultiCircleSubmissionScreen.tsx` (adapt if needed)

#### FR3: FAB Repurpose (F1) [P0]
**Current:** `CreateCircleFAB.tsx:17` has `href="/dashboard/create"`.
**Change:** Change to `href="/dashboard/submit"`. The FAB label (showing next Second Saturday date) remains appropriate for the submission context.
**Depends on:** FR1 (three-dot menu must exist first so circle creation has a home), FR2 (submit page must exist).
**Design input:** None (route change only).
**Files:** `src/components/dashboard/CreateCircleFAB.tsx`

#### FR4: Remove Bell Icon (F3) [P1]
**Current:** Bell icon button in `DashboardHeader.tsx:45-47` renders with no `onClick` handler. Dead button.
**Change:** Remove the bell icon button entirely. In-app notification center is deferred to V0.1.
**Design input:** None.
**Files:** `src/components/dashboard/DashboardHeader.tsx`

#### FR5: Extract Shared PromptsEditor Component (S1) [STRUCTURAL]
**Current:** Prompts editor logic lives entirely in `src/app/dashboard/circles/[circleId]/prompts/page.tsx` (290 lines). Used during circle creation setup and for editing prompts in settings.
**Change:** Extract the prompts editor UI and logic (drag-drop list, add/remove prompts, save handler) into a shared component `PromptsEditor.tsx`. The component accepts props:
- `circleId` — which circle's prompts to manage
- `mode: 'setup' | 'settings'` — controls navigation behavior (setup mode shows "Continue" and advances to next step; settings mode shows "Save" and stays in place)
- `onComplete` — callback when user finishes
**Depends on:** Nothing. Must be done before G1 (tab layout) so the Prompts tab can embed it.
**Design input:** None (refactor, no visual changes).
**Files:** `src/components/PromptsEditor.tsx` (new), `src/app/dashboard/circles/[circleId]/prompts/page.tsx` (refactor to use shared component)

#### FR6: Newsletter as Default Circle Landing (F6) [P1]
**Current:** Clicking a circle in sidebar renders `CircleHome` (stats, prompts, nav cards, archive). Newsletter is buried at the bottom of CircleHome in an archive list.
**Change:** When a user selects a circle:
1. Fetch the latest published newsletter for that circle via `api.newsletters.getLatestNewsletter`
2. If a published newsletter exists, render `NewsletterView` with that newsletter's data
3. If no newsletter exists, show an empty state ("No newsletters yet — submissions are open until [deadline]")
4. `CircleHome.tsx` becomes orphaned and can be deleted
**Design input:** Live review — you'll want to click through the new flow and confirm it feels right.
**Files:** `src/app/dashboard/page.tsx`, `src/app/dashboard/circles/[circleId]/page.tsx`, `src/components/CircleHome.tsx` (delete or archive)

#### FR7: Remove Make Submission Nav Card (J2) [P1]
**Current:** "Make Submission" navigation card in `CircleHome.tsx` is the primary submission entry point.
**Change:** Since CircleHome is being replaced by the newsletter view (FR6), and submissions are now accessed via the FAB (FR3), this nav card is orphaned. Remove it along with CircleHome, or de-emphasize it if CircleHome is kept as a secondary view.
**Depends on:** FR6 (newsletter landing).
**Design input:** Verbal.
**Files:** `src/components/CircleHome.tsx`

#### FR8: 4-Tab Settings Layout (G1) [P1]
**Current:** CircleSettings is a flat scrollable page with everything stacked vertically.
**Change:** Restructure into a tabbed layout:
- **Tab bar** with 4 tabs: "Details", "Prompts", "Members", "Status"
- **"Status" tab** is only visible to circle admins (check `membership.role === 'admin'`)
- **Stats tiles** (member count, issues sent, created date) rendered above the tab bar, always visible
- **Details tab:** Circle name, images (using ProfileHeaderImageLayout in edit mode), invite link, leave button
- **Prompts tab:** Embeds the shared `PromptsEditor` component (from FR5)
- **Members tab:** Embeds the member list with admin controls (from current `/members` page)
- **Status tab (admin):** Embeds `AdminSubmissionDashboard` component
- Use shadcn `Tabs` component for the tab UI
**Depends on:** FR5 (shared PromptsEditor must exist for Prompts tab).
**Design input:** Figma or reference screenshot for the tab layout structure.
**Files:** `src/components/CircleSettings.tsx` (major refactor), `src/app/dashboard/circles/[circleId]/settings/page.tsx`

#### FR9: Remove Configure Prompts Row (G2) [P1]
**Current:** Details section has a tappable nav row "Edit, reorder, or add prompts" linking to `/prompts`.
**Change:** Remove this row entirely. Prompt management lives in the Prompts tab (FR8).
**Depends on:** FR8 (tab layout).
**Files:** `src/components/CircleSettings.tsx`

#### FR10: Members Into Settings Tab (G3) [P1]
**Current:** Member management is a standalone page at `/dashboard/circles/[circleId]/members`.
**Change:** Embed the member list and admin controls (viewing, removing, blocking) into the Members tab within CircleSettings. The standalone `/members` route becomes orphaned.
**Depends on:** FR8 (tab layout).
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx` (extract logic), `src/components/CircleSettings.tsx`

#### FR11: ProfileHeaderImageLayout Component (S2) [STRUCTURAL]
**Current:** Circle icon and cover image are rendered as two separate stacked upload components across multiple pages with no visual consistency.
**Change:** Create a shared `ProfileHeaderImageLayout` component with two modes:
- **Edit mode:** Cover image as full-width banner with pencil/edit overlay (top-right), circle icon overlapping bottom edge of cover with pencil/edit overlay (bottom-right). Used in CircleSettings and CreateCircle.
- **Display mode:** Same visual layout but no edit overlays. Used in invite page and newsletter view header.
Props: `coverImageUrl`, `iconUrl`, `onCoverUpload?`, `onIconUpload?`, `editable: boolean`
**Design input:** Figma recommended — this component sets the visual tone across 4 pages.
**Files:** `src/components/ProfileHeaderImageLayout.tsx` (new)

#### FR12: Error Boundaries (B1, B2, B8) [P0/P2]
**Current:** Zero error boundary files in the app.
**Change:**
- B1 [P0]: Create `src/app/error.tsx`, `src/app/dashboard/error.tsx`, `src/app/dashboard/circles/[circleId]/error.tsx` — each shows styled error with "Try again" button calling `reset()`.
- B2 [P0]: Create `src/app/global-error.tsx` — minimal self-contained page (no providers) with "Reload" button.
- B8 [P2]: Create `src/app/not-found.tsx` — styled 404 with "Go to Dashboard" link.
**Design input:** None (follow app styling patterns).
**Files:** All new files listed above

### Non-Functional Requirements

- **Route preservation:** Old routes (`/circles/[id]/submit`, `/circles/[id]/members`) should either redirect to new locations or return 404 — no silent broken links
- **No data model changes:** All changes are routing, component structure, and UI. Convex schema unchanged.
- **Mobile responsive:** New tab layouts and submission page must work on mobile (375px) and desktop (1024px+)
- **Real-time updates:** Newsletter view and tab contents must use Convex subscriptions for live data (no stale reads)

## Success Criteria

- FAB navigates to `/dashboard/submit` and loads all user's circles
- Three-dot menu opens with "Create a circle" option
- Clicking a circle shows the latest newsletter (not CircleHome)
- Circle Settings renders 4 tabs (3 for non-admins) with correct content in each
- `ProfileHeaderImageLayout` component exists and renders in edit/display modes
- `PromptsEditor` shared component works in both settings and setup contexts
- Error boundaries catch and display errors at all route levels
- No dead buttons remain in the dashboard header
- All existing tests still pass
- Navigation flows verified on mobile and desktop

## Constraints & Assumptions

- **Tab component:** Use shadcn `Tabs` component (already in the project)
- **MultiCircleSubmissionScreen reuse:** The existing component handles multi-circle tabs and prompt rendering — adapt it for the top-level route rather than rewriting
- **CircleHome deletion:** After FR6, `CircleHome.tsx` becomes dead code. It should be deleted to avoid confusion, not kept as a fallback.
- **Orphaned routes:** `/circles/[id]/members` and `/circles/[id]/prompts` pages become dead after embedding in settings tabs. Keep `/prompts` for now (used by prompt library sub-route) but `/members` can be deleted.

## Out of Scope

- Visual redesign of newsletter view (Epic 3: v0-redesigns)
- Settings tab content polish — stat tiles, image layouts, member list styling (Epic 3)
- Submission input redesign — media buttons, dark bubble styling (Epic 3)
- Circle creation flow redesign — splash screen, step indicator (Epic 4: v0-polish)
- Onboarding / profile setup (Epic 4)
- In-app notification center (V0.1)

## Dependencies

- **No blockers:** This epic can start immediately
- **Parallel with:** Epic 1 (v0-plumbing) — different file sets, minimal conflict
- **Enables:** Epic 3 (v0-redesigns) depends on this epic's structural changes being in place
- **Internal dependency chain:** FR1 → FR2 → FR3 (menu → submit page → FAB), FR5 → FR8 (shared prompts → tab layout)

## Design Gates

Before the agent starts each phase, you provide designs:

| Gate | Items | Format | When |
|------|-------|--------|------|
| Submit page tab layout | FR2 | Reference screenshot | Before Phase 2a |
| Settings tab structure | FR8 | Figma or reference | Before Phase 2c |
| ProfileHeaderImageLayout | FR11 | Figma | Before Phase 2c |

Phases without design gates (FR1, FR3, FR4, FR5, FR6, FR7, FR9, FR10, FR12) proceed with verbal direction or live review.
