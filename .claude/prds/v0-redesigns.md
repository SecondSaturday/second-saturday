---
name: v0-redesigns
description: Visual redesigns for newsletter view, settings tab contents, submission input, Clerk integration, and date picker
status: backlog
created: 2026-02-24T21:54:14Z
---

# PRD: v0-redesigns

## Executive Summary

Redesign the core screens of the app now that the structural navigation changes (Epic 2) are in place. This epic covers the newsletter view, circle settings tab contents, submission input, Clerk component integration, and date picker. It is the most design-heavy epic — major visual changes require Figma mockups or reference screenshots before implementation. Two punch list items from Epic 2 validation (PL3: ProfileHeaderImageLayout interface mismatch, PL4: newsletter null image URLs) are folded into the tasks that depend on them.

## Problem Statement

With the navigation restructured (Epic 2), the app's page shells are correct but the content within them needs visual refinement:

1. **Newsletter view** is the new default circle landing but its header is minimal (small icon + sans-serif text), responses have no avatars or card grouping, and there's no way to switch between issues or access settings.
2. **Circle Settings tabs** have the right structure (4 tabs) but the Details tab still uses old stacked image uploads, stats are in a single card instead of tiles, and the Members/Prompts tabs need UX refinements.
3. **Submission input** requires text before media can be uploaded, uses three stacked full-width buttons, and has plain form styling instead of the desired chat-bubble feel.
4. **Settings page** has ~170 lines of custom password/email code that Clerk's `<UserProfile />` handles better.
5. **Date picker** is interactive but filters nothing and defaults to the wrong date.

## User Stories

### US1: Newsletter Reader
**When** I open a circle's newsletter,
**I want** to see a beautiful header with the circle's cover image and icon, and easily browse past issues via a month picker,
**So that** the newsletter feels like a curated publication, not a data dump.

**Acceptance Criteria:**
- Cover image banner at top with circle icon overlapping bottom edge
- Circle name in large serif font, slug/tagline below
- Month picker + settings gear below name
- Prompt section headings in serif font
- Each prompt's responses grouped in a rounded card with member avatars and dividers
- Circle's actual icon and cover URLs passed through (not null)

### US2: Circle Admin Managing Settings
**When** I manage my circle's settings,
**I want** the details tab to look polished with proper image layout, clean stat tiles, and consistent styling,
**So that** managing my circle feels intentional, not like a debug panel.

**Acceptance Criteria:**
- ProfileHeaderImageLayout component (edit mode) replaces stacked uploads
- 3 separate stat tiles: Members, Issues Sent, Created (month-year only)
- Cover image crop uses 3:1 aspect ratio
- Full-width destructive leave button, no "Danger Zone" heading

### US3: Member Browsing the Member List
**When** I view the members tab in settings,
**I want** a clean list with inline role labels, no clutter,
**So that** I can quickly see who's in the circle.

**Acceptance Criteria:**
- Three-dot menu per row instead of always-visible Remove button
- "You" shown for current user's row
- Inline "Admin" or "Member" role labels (plain text, no Badge component)
- No joined date shown
- Header shows "Members (3)" with inline count

### US4: Monthly Submitter
**When** I write my monthly response,
**I want** to upload photos/videos without typing text first, and have a compact clean input,
**So that** submitting feels quick and personal, not like filling out a form.

**Acceptance Criteria:**
- Media upload available immediately without text prerequisite
- Single "+" button opens action sheet (Take Photo, Choose Photo, Choose Video)
- Text input styled as dark card/bubble with "+" at bottom-left

### US5: Any User Managing Account
**When** I want to change my password or email,
**I want** Clerk's polished built-in UI instead of custom forms,
**So that** the experience is reliable and consistent with industry standards.

**Acceptance Criteria:**
- Clerk `<UserProfile />` rendered inline replacing custom password/email sections
- Themed with existing `clerkAppearance` config
- Custom name/avatar, notifications, sign-out, and deletion kept as-is

## Requirements

### Functional Requirements

#### Newsletter View

##### FR1: Newsletter Header Redesign (K2 + PL4) [P1]
**Current:** Small 32px circle icon inline with sans-serif name, "Issue #1 · Date" subtitle. The circle's `iconUrl` and `coverUrl` are available from the query but hardcoded to `null` when passed to `NewsletterView` (PL4).
**Change:** (1) Fix PL4: pass actual `circle.iconUrl` and `circle.coverUrl` from the query in `dashboard/page.tsx` and `[circleId]/page.tsx` instead of null. (2) Redesign header: full-width cover image banner at top, circle icon overlapping bottom edge of cover by half its height (using `ProfileHeaderImageLayout` in display mode), circle name in large serif font centered below icon, slug/tagline in smaller muted text below name.
**Design input:** Figma recommended.
**Files:** `src/app/dashboard/page.tsx`, `src/app/dashboard/circles/[circleId]/page.tsx`, `src/components/newsletter/NewsletterView.tsx`

##### FR2: Month Picker + Settings Gear (K3) [P1]
**Current:** No month picker or settings access in newsletter view.
**Change:** Add centered row below circle name/slug: (1) month picker dropdown showing current issue's month — tapping opens selector to browse past issues (queries all newsletters for circle); (2) settings gear icon — navigates to `/dashboard/circles/[circleId]/settings`.
**Design input:** Reference screenshot for picker style.
**Files:** `src/components/newsletter/NewsletterView.tsx`

##### FR3: Simplify Newsletter Header Bar (K4) [P2]
**Current:** Top bar shows "← Circle Name - Month Year" repeating the integrated header.
**Change:** Simplify to just a back arrow (←), or remove entirely with back arrow overlaid on cover image.
**Files:** Newsletter page wrapper

##### FR4: Response Cards with Avatars and Dividers (K5) [P2]
**Current:** Responses are bold name + plain text in a flat list. No container, no avatar, no separation.
**Change:** All responses for a prompt grouped inside a single rounded card (`bg-card`/`bg-muted/30`, `rounded-xl`, padding). Each response shows circular avatar (with initials fallback) left of bold name, response text below. Thin horizontal divider between responses within the same card.
**Design input:** Figma recommended.
**Files:** `src/components/newsletter/NewsletterView.tsx` or new `PromptSection.tsx`, `MemberResponse.tsx`

##### FR5: Serif Prompt Headings (K7) [P2]
**Current:** Prompt headings in default sans-serif bold.
**Change:** Serif font, slightly larger, appropriate spacing above/below. Matches circle name's serif style from FR1.
**Files:** `src/components/newsletter/NewsletterView.tsx` or `PromptSection.tsx`

#### Settings Details Tab

##### FR6: ProfileHeaderImageLayout Integration (G9 + PL3) [P2]
**Current:** CircleSettings Details tab uses two separate `ImageUpload` components (lines 226-237). `ProfileHeaderImageLayout` exists but expects `File` objects while `ImageUpload` passes Convex `Id<'_storage'>` (PL3 interface mismatch).
**Change:** (1) Resolve PL3: adapt `ProfileHeaderImageLayout` to handle the full upload-to-storage flow internally — accept `onUpload` callbacks that return storage IDs matching the `ImageUpload` pattern, OR wrap the component with upload logic at the call site. (2) Replace the two `ImageUpload` components in the Details tab with `ProfileHeaderImageLayout` in edit mode.
**Files:** `src/components/ProfileHeaderImageLayout.tsx`, `src/components/CircleSettings.tsx`

##### FR7: Fix Cover Image Crop Aspect Ratio (G4) [P1]
**Current:** `ImageCropModal.tsx:48` hardcodes `aspect={1}` for all crops. Cover should be 3:1.
**Change:** Pass `shape` prop from `ImageUpload` through to `ImageCropModal`. Use `aspect={3}` for rectangle/cover, `aspect={1}` for circle/icon.
**Files:** `src/components/circles/ImageCropModal.tsx`, `src/components/circles/ImageUpload.tsx`

##### FR8: Stat Tiles Redesign (G5, G6, G7, G8) [P2]
**Current:** Single bordered card with 3 inline items. Order: Created, Issues sent, Members. "Issues sent" lowercase. Created shows "Feb 21, 2026".
**Change:** 3 separate white square tiles side by side. Each: large bold number on top, muted label below. Order: Members, Issues Sent, Created. "Issues Sent" title case. Created shows "Feb 2026" (month-year only, drop day).
**Design input:** Reference screenshot.
**Files:** `src/components/CircleSettings.tsx`

##### FR9: Leave Button and Danger Zone (G10 + G11) [P2]
**Current:** Small text-only destructive link in "Danger Zone" section with visible heading.
**Change:** Remove "Danger Zone" heading. Replace link with full-width destructive button reading "Leave this circle".
**Files:** `src/components/CircleSettings.tsx`

#### Settings Prompts Tab

##### FR10: Browse Prompt Library Row (H1) [P1]
**Current:** Prompt Library renders inline with category headings and pill buttons, making the page long.
**Change:** Remove inline library. Replace with single tappable row "Browse Prompt Library ›" at bottom of prompt list. Add "Current Prompts 6/8" section heading above list (H3).
**Note:** This change applies to the shared `PromptsEditor` component, covering both settings and setup flows.
**Files:** `src/components/PromptsEditor.tsx`

##### FR11: Dedicated Prompt Library Page (H2) [P1]
**Current:** No dedicated page exists.
**Change:** Create `/dashboard/circles/[circleId]/prompts/library` with: back arrow header "Prompt Library"; 4 category tabs (Fun, Gratitude, Reflection, Check-in); vertical list per category; "+" button per row to add prompt.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx` (new)

#### Settings Members Tab

##### FR12: Members Tab UX (I1, I2, I3, I5, I6) [P1/P2]
**Current:** Inline Remove button on every row, actual name for all users, Badge component for admin, "Joined [date]" subtitle, separate icon + count header.
**Change:**
- I1 [P1]: Replace inline Remove with three-dot menu (MoreVertical) → action sheet with Remove option
- I2 [P2]: Show "You" for current user's row
- I3 [P2]: Unified plain text role labels ("Admin" / "Member") inline next to name — no Badge, no Shield icon, no separate line
- I5 [P2]: Remove joined date line entirely
- I6 [P2]: Header "Members (3)" with inline count in parentheses
**Files:** `src/components/CircleSettings.tsx` (Members tab section)

#### Submission Input

##### FR13: Media Upload Without Text Prerequisite (J1) [P1]
**Current:** Upload buttons only appear after text auto-saves and assigns a real `responseId`. Placeholder "Start typing to enable photo & video uploads" shown otherwise.
**Change:** Remove prerequisite. Media upload available immediately. If no response record exists, create one on-demand when user initiates upload.
**Files:** `src/components/submissions/PromptResponseCard.tsx`

##### FR14: Single "+" Button with Action Sheet (J3) [P2]
**Current:** Three full-width stacked buttons: Take Photo, Choose Photo, Choose Video.
**Change:** Single "+" icon button. Tapping opens action sheet/popover with the three options.
**Files:** `src/components/submissions/MediaUploader.tsx`

##### FR15: Dark Card/Bubble Input Styling (J4) [P2]
**Current:** Standard Textarea with "Share your thoughts..." placeholder, default light styling.
**Change:** Dark background, lighter text, rounded corners. "+" media button at bottom-left of card. Chat compose bubble feel.
**Design input:** Reference screenshot.
**Files:** `src/components/submissions/PromptResponseCard.tsx`

#### Clerk + Date Picker

##### FR16: Clerk UserProfile Full-Page (O1) [P1]
**Current:** ~170 lines custom password change and email change in settings using low-level Clerk SDK. 15+ useState hooks. Custom name/avatar editing inline.
**Change:** Rewrite `/dashboard/settings` as a full-page Clerk `<UserProfile />`. Avatar tap in DashboardHeader navigates here. Clerk handles all profile editing (avatar, name, email, password, connected accounts). Add custom "Notifications" page inside UserProfile via `<UserProfile.Page>` slot API to embed `NotificationPreferences`. Sign Out and Delete Account rendered below the UserProfile component. All custom profile editing code (ImageUpload, name Input, save button, timezone) deleted.
**Files:** `src/app/dashboard/settings/page.tsx`

##### FR17: Month Picker Functional (F5) [P1]
**Current:** DatePicker opens modal with 12 raw Second Saturday dates. Selected date never passed to any query. Defaults to next upcoming Saturday.
**Change:** (1) Replace date list with month picker UI (grid/wheel showing month names). (2) Default to most recent past Saturday (last delivered newsletter). (3) Wire selected value to filter displayed newsletter when circle is selected.
**Design input:** Reference screenshot for picker style.
**Files:** `src/components/dashboard/DatePicker.tsx`, `src/app/dashboard/page.tsx`

#### Security

##### FR18: getVideosByCircle Auth (PL1) [P1]
**Current:** `convex/videos.ts:184-193` has no auth check. Missed during Epic 1.
**Change:** Add `getAuthUser(ctx)` + `requireMembership(ctx, user._id, args.circleId)`.
**Files:** `convex/videos.ts`

### Non-Functional Requirements

- **Design-gated:** Visual FRs do not start until design input is provided
- **Test updates:** Any changed component behavior (J1 media prerequisite removal, F5 date filtering) needs test updates
- **Mobile responsive:** All redesigned screens must work at 375px and 1024px+
- **Accessibility:** New interactive elements (three-dot menus, action sheets, month picker) must be keyboard-navigable

## Success Criteria

- Newsletter view shows cover image header with icon overlay, serif name, month picker, and settings gear
- Response cards display member avatars with card grouping and dividers
- ProfileHeaderImageLayout renders in edit mode in Settings Details tab
- Cover image crops at 3:1 aspect ratio
- Stats display as 3 separate tiles in correct order
- Members tab has three-dot menus, unified role labels, no joined dates
- Prompts tab has "Browse Prompt Library" row and dedicated library page
- Media upload works without typing text first
- Clerk `<UserProfile />` replaces custom password/email code
- Date picker filters newsletter display and defaults to last published issue
- All existing tests pass + new tests for changed behavior

## Constraints & Assumptions

- **ProfileHeaderImageLayout adaptation:** PL3 interface mismatch resolved within G9 — the component adapts to accept storage ID callbacks matching the existing `ImageUpload` pattern
- **Newsletter image URLs:** PL4 resolved within K2 — actual `circle.iconUrl`/`circle.coverUrl` passed from queries instead of null
- **Clerk theming:** `<UserProfile />` respects `clerkAppearance` already configured in `providers.tsx`
- **Shared PromptsEditor:** Already extracted in Epic 2 — changes to prompt library UI (H1) modify this shared component
- **DropdownMenu component:** Currently unused `dropdown-menu.tsx` (E1) may be used for I1 three-dot menus and J3 action sheets — evaluate before removing in Epic 4

## Out of Scope

- Circle creation flow redesign (Epic 4)
- Profile setup / onboarding (Epic 4)
- Invite page redesign (Epic 4)
- Dead code cleanup (Epic 4)
- Loading skeletons (Epic 4)
- Resizable sidebar (Epic 4)

## Dependencies

- **Requires:** Epic 2 (v0-navigation) complete — tab layout, new routes, shared components must exist
- **Parallel with:** Nothing — this is the primary work stream
- **Enables:** Epic 4 (v0-polish) — polish work builds on redesigned screens

## Design Gates

| Gate | FRs | Format | Blocks |
|------|-----|--------|--------|
| Newsletter header + response cards | FR1, FR4 | Figma | Newsletter group |
| Stat tiles | FR8 | Reference screenshot | Settings details group |
| Submission dark bubble | FR15 | Reference screenshot | Submission group |
| Month picker | FR2, FR17 | Reference screenshot | Newsletter + date picker |
| Prompt Library page | FR11 | Reference screenshot | Prompts group |
