---
name: v0-redesigns
status: in_progress
created: 2026-02-25T00:07:09Z
updated: 2026-02-25T03:20:00Z
progress: 78%
prd: .claude/prds/v0-redesigns.md
github: https://github.com/SecondSaturday/second-saturday/issues/171
---

# Epic: v0-redesigns

## Overview

Visual redesigns for the app's core screens now that Epic 2 (v0-navigation) structural changes are in place. Covers newsletter view, circle settings tab contents, submission input, Clerk integration, date picker, and one missed security fix. This is the most design-heavy epic — several tasks are gated on Figma mockups or reference screenshots.

## Architecture Decisions

- **Newsletter header:** Use `ProfileHeaderImageLayout` (display mode) from Epic 2 for the cover+icon banner. Fix PL4 (null image URLs) in the same task to pass actual `circle.iconUrl`/`circle.coverUrl` from queries.
- **Serif font:** Add a serif font (e.g., `Playfair Display` or `Lora` via next/font) for newsletter headings and circle name. Used in `NewsletterView` and `PromptSection`.
- **Clerk `<UserProfile />`:** Replace ~170 lines of custom password/email code with Clerk's built-in component. Theme with existing `clerkAppearance` from `providers.tsx`. This deletes significant code.
- **ProfileHeaderImageLayout adaptation (PL3):** The component currently accepts `onCoverUpload(file: File)` but CircleSettings needs `onUpload(storageId: Id<'_storage'>)`. Resolve by wrapping `ProfileHeaderImageLayout` with upload logic at the call site (keep the component's File-based API clean, handle Convex upload in the parent).
- **Three-dot menus:** Use existing shadcn `DropdownMenu` component for member row actions and media upload action sheet.
- **Month picker:** Replace the 12-date list with a month-name grid. Wire selected month to filter which newsletter is displayed. Default to most recent past second Saturday.
- **Prompt library:** Move from inline rendering in `PromptsEditor` to a dedicated route `/prompts/library` with category tabs.

## Technical Approach

### Newsletter View Redesign (FR1-FR5)

| File | Change |
|------|--------|
| `dashboard/page.tsx` | Pass actual `circle.iconUrl`/`circle.coverUrl` instead of null (PL4 fix) |
| `[circleId]/page.tsx` | Same PL4 fix |
| `NewsletterView.tsx` (89 lines) | Redesign header: `ProfileHeaderImageLayout` display mode + serif name + month picker + settings gear |
| `PromptSection.tsx` (37 lines) | Serif heading styling |
| `MemberResponse.tsx` | Add avatar, card grouping, dividers |
| Newsletter page wrapper | Simplify or remove redundant header bar |

### Settings Details Tab (FR6-FR9)

| File | Change |
|------|--------|
| `CircleSettings.tsx` | Replace stacked ImageUploads with `ProfileHeaderImageLayout` edit mode (with upload wrapper), redesign stat tiles to 3 separate squares, remove "Danger Zone" heading, full-width leave button |
| `ImageCropModal.tsx` (64 lines) | Accept `aspect` prop, use 3:1 for cover, 1:1 for icon |
| `ImageUpload.tsx` | Pass `shape` through to crop modal as `aspect` |

### Settings Members Tab (FR12)

| File | Change |
|------|--------|
| `CircleSettings.tsx` | Members section: three-dot menu per row, "You" label, inline role text, remove joined date, "Members (N)" header |

### Settings Prompts Tab (FR10-FR11)

| File | Change |
|------|--------|
| `PromptsEditor.tsx` | Remove inline library, add "Browse Prompt Library" row + "Current Prompts N/8" heading |
| `prompts/library/page.tsx` (new) | Dedicated library page with category tabs and add buttons |

### Submission Input (FR13-FR15)

| File | Change |
|------|--------|
| `PromptResponseCard.tsx` (129 lines) | Remove text prerequisite for media upload, dark bubble styling |
| `MediaUploader.tsx` (580 lines) | Replace 3 buttons with single "+" button + action sheet |

### Clerk + Date Picker (FR16-FR17)

| File | Change |
|------|--------|
| `settings/page.tsx` (540 lines) | Full-page Clerk `<UserProfile />` with custom Notifications page via slot API. Delete all custom profile editing. Keep sign-out + delete account below. |
| `DatePicker.tsx` (78 lines) | Month picker grid, default to last published, wire to filter newsletter |

### Security Fix (FR18)

| File | Change |
|------|--------|
| `convex/videos.ts` | Add auth to `getVideosByCircle` (missed in Epic 1) |

## Implementation Strategy

**Task grouping by file proximity and design gates:**

Tasks are grouped so each can proceed once its design gate is satisfied. The security fix and Clerk integration have no design gates and can start immediately.

**Risk mitigation:**
- Serif font addition touches global CSS/layout — test across all pages
- Clerk `<UserProfile />` deletion is large (170+ lines) — verify all edge cases (password change, email change, verification flow) work via Clerk's built-in UI
- `PromptResponseCard` media prerequisite removal may affect auto-save timing — test carefully

**Testing approach:**
- Existing tests must pass
- New tests for: media upload without text, month picker filtering
- Manual verification of all redesigned screens at 375px and 1024px+

## Task Breakdown Preview

- [ ] Task 1: Security fix — add auth to `getVideosByCircle` (FR18) [no design gate]
- [ ] Task 2: Clerk UserProfile integration — replace custom password/email code (FR16) [no design gate]
- [ ] Task 3: Newsletter header redesign — PL4 fix, cover+icon header, serif font, simplified top bar (FR1, FR3, FR5)
- [ ] Task 4: Newsletter month picker + settings gear + response cards (FR2, FR4)
- [ ] Task 5: Settings Details tab — ProfileHeaderImageLayout, cover crop 3:1, stat tiles, leave button (FR6, FR7, FR8, FR9)
- [ ] Task 6: Settings Members tab UX — three-dot menus, role labels, header (FR12)
- [ ] Task 7: Prompts tab + library page — "Browse Prompt Library" row, dedicated library page (FR10, FR11)
- [ ] Task 8: Submission input — media without text, "+" action sheet, dark bubble styling (FR13, FR14, FR15)
- [ ] Task 9: Date picker — month picker grid, filter newsletter, default to last published (FR17)

## Dependencies

- **Requires:** Epic 2 (v0-navigation) complete — tab layout, newsletter landing, shared components must exist. (Done.)
- **Design gates:** Tasks 3-5, 7-9 need design input. Tasks 1, 2, 6 can start immediately.
- **Internal chain:** Task 3 (serif font, PL4 fix) before Task 4 (month picker needs updated header).
- **Downstream:** Epic 4 (v0-polish) builds on redesigned screens.

## Success Criteria (Technical)

- Newsletter view: cover banner, serif name, month picker, settings gear, response cards with avatars
- Settings Details: ProfileHeaderImageLayout edit mode, 3:1 cover crop, 3 stat tiles, clean leave button
- Settings Members: three-dot menus, "You" label, inline roles, no joined dates, "Members (N)" header
- Settings Prompts: "Browse Prompt Library" row, dedicated library page with category tabs
- Submission: media upload without text, "+" action sheet, dark bubble input
- Clerk `<UserProfile />` replaces custom code, themed correctly
- Date picker filters newsletter display, defaults to last published
- `getVideosByCircle` has auth check
- All existing tests pass
- All screens responsive at 375px and 1024px+

## Tasks Created
- [x] #172 - Add auth to getVideosByCircle (parallel: true) ✅
- [x] #173 - Replace custom auth code with Clerk UserProfile (parallel: true) ✅
- [ ] #174 - Newsletter header redesign with serif font (parallel: true) - design-gated
- [ ] #175 - Newsletter month picker and response cards (parallel: false, depends on #174) - design-gated
- [x] #176 - Settings Details tab polish (parallel: true) ✅
- [x] #177 - Members tab UX redesign (parallel: true) ✅
- [x] #178 - Prompts tab and dedicated library page (parallel: true) ✅
- [x] #179 - Submission input rework (parallel: true) ✅
- [x] #180 - Date picker as functional month picker (parallel: true) ✅

Total tasks: 9
Completed: 7
Remaining: 2 (#174, #175 - design-gated)

## Estimated Effort

- **9 tasks**, 8 parallelizable + 1 sequential (004 → 003)
- **Immediately startable (no design gate):** Tasks 1, 2, 6
- **Design-gated:** Tasks 3, 4, 5, 7, 8, 9
- **Critical path:** Tasks 3 → 4 (newsletter header before month picker)
- **Largest deletions:** Task 2 (Clerk — removes ~170 lines of custom code)
- **Largest additions:** Task 4 (response cards) and Task 8 (submission input rework)
