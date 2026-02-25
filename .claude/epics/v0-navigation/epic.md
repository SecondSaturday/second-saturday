---
name: v0-navigation
status: completed
created: 2026-02-24T18:42:51Z
progress: 100%
prd: .claude/prds/v0-navigation.md
github: https://github.com/SecondSaturday/second-saturday/issues/163
---

# Epic: v0-navigation

## Overview

Restructure the app's core navigation and page architecture for V0 launch. The FAB becomes a submission entry point, newsletters replace CircleHome as the default circle landing, and Circle Settings consolidates into a 4-tab layout. Two shared components are extracted (PromptsEditor, ProfileHeaderImageLayout), and error boundaries are added at all route levels. All changes are routing and component structure — no Convex schema changes.

## Architecture Decisions

- **Reuse MultiCircleSubmissionScreen:** The existing component (398 lines) already handles multi-circle tabs with prompts, auto-save, media uploads. The new `/dashboard/submit` page wraps it with a data-fetching layer — no rewrite needed.
- **shadcn Tabs for settings:** The `Tabs` component already exists in `src/components/ui/tabs.tsx` with a `"line"` variant. Use it directly for the 4-tab Circle Settings layout.
- **Delete CircleHome, don't archive:** Once the newsletter becomes the circle landing, CircleHome (152 lines) is dead code. Delete it cleanly rather than keeping it as a fallback.
- **PromptsEditor extraction:** The 290-line prompts page is split into a reusable component (~200 lines) and a thin page wrapper (~40 lines). The component accepts `circleId`, `mode`, and `onComplete` props.
- **Error boundaries:** Minimal self-contained pages using existing app styling. `global-error.tsx` has zero external dependencies (no providers, no Convex). Each error page has a single action button.
- **Newsletter as circle landing:** The circle `[circleId]/page.tsx` (currently 33 lines) fetches the latest newsletter via an existing or new `getLatestNewsletter` query and renders `NewsletterView`. No new component needed — just route-level data fetching.

## Technical Approach

### Route Changes

| Route | Before | After |
|-------|--------|-------|
| `/dashboard/submit` | Does not exist | New page: wraps `MultiCircleSubmissionScreen` with all user circles |
| `/dashboard/circles/[circleId]` | Renders `CircleHome` | Renders latest newsletter via `NewsletterView` |
| `/dashboard/circles/[circleId]/settings` | Flat scrollable `CircleSettings` | 4-tab layout (Details, Prompts, Members, Status) |
| `/dashboard/circles/[circleId]/members` | Standalone member list | Orphaned — embedded in Settings Members tab |
| `/dashboard/circles/[circleId]/prompts` | Full prompts editor | Thin wrapper around shared `PromptsEditor` component |

### New Components

| Component | Purpose | Estimated Size |
|-----------|---------|---------------|
| `src/app/dashboard/submit/page.tsx` | Top-level submission page | ~40 lines |
| `src/components/PromptsEditor.tsx` | Shared prompts editor (extracted from prompts page) | ~200 lines |
| `src/components/ProfileHeaderImageLayout.tsx` | Shared cover+icon image layout | ~80 lines |
| `src/app/error.tsx` | App-level error boundary | ~30 lines |
| `src/app/dashboard/error.tsx` | Dashboard error boundary | ~30 lines |
| `src/app/dashboard/circles/[circleId]/error.tsx` | Circle error boundary | ~30 lines |
| `src/app/global-error.tsx` | Root error boundary (no providers) | ~25 lines |
| `src/app/not-found.tsx` | Styled 404 page | ~25 lines |

### Modified Components

| Component | Change |
|-----------|--------|
| `DashboardHeader.tsx` (54 lines) | Remove bell icon, wire three-dot menu as dropdown with "Create a circle" |
| `CreateCircleFAB.tsx` (26 lines) | Change `href` from `/dashboard/create` to `/dashboard/submit` |
| `CircleSettings.tsx` (315 lines) | Major refactor: 4-tab layout with Details, Prompts, Members, Status |
| `src/app/dashboard/circles/[circleId]/page.tsx` (33 lines) | Replace CircleHome with newsletter landing |
| `src/app/dashboard/circles/[circleId]/prompts/page.tsx` (290 lines) | Extract logic to PromptsEditor, become thin wrapper |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/CircleHome.tsx` (152 lines) | Replaced by newsletter landing |
| `src/app/dashboard/circles/[circleId]/members/page.tsx` (142 lines) | Embedded in Settings Members tab |

## Implementation Strategy

**Dependency chain determines order:**
1. Header fixes (FR1, FR4) and error boundaries (FR12) — zero dependencies, immediate start
2. PromptsEditor extraction (FR5) — prerequisite for settings tabs
3. Submit page + FAB repurpose (FR2, FR3) — depends on FR1 (three-dot menu as new circle creation home)
4. Newsletter as circle landing (FR6, FR7) — independent of above
5. ProfileHeaderImageLayout (FR11) — independent shared component
6. Settings 4-tab refactor (FR8, FR9, FR10) — depends on FR5 (PromptsEditor), heaviest task

**Risk mitigation:**
- FR8 (settings refactor) is the largest task — touches 315 lines + embeds 3 sub-components. Break it into clear tab sections.
- FR6 (newsletter landing) may need a new Convex query (`getLatestNewsletter`) — check if one exists first.
- `MultiCircleSubmissionScreen` currently receives `circles` as a prop — the new submit page must fetch circles and compute cycleId.

**Testing approach:**
- Existing tests must pass (925 total)
- Manual verification of all navigation flows on mobile and desktop
- Error boundaries tested by throwing in dev mode

## Task Breakdown Preview

- [ ] Task 1: Dashboard header fixes — remove bell icon, implement three-dot dropdown menu (FR1, FR4)
- [ ] Task 2: Error boundaries — create error.tsx at all levels, global-error.tsx, not-found.tsx (FR12)
- [ ] Task 3: Extract PromptsEditor shared component from prompts page (FR5)
- [ ] Task 4: Top-level submit page + FAB repurpose (FR2, FR3)
- [ ] Task 5: Newsletter as circle landing + delete CircleHome (FR6, FR7)
- [ ] Task 6: ProfileHeaderImageLayout shared component (FR11)
- [ ] Task 7: Circle Settings 4-tab refactor — Details, Prompts, Members, Status tabs (FR8, FR9, FR10)

## Dependencies

- **External:** None. No new packages needed (shadcn Tabs, @dnd-kit already installed).
- **Internal dependency chain:** Task 1 before Task 4 (menu before FAB). Task 3 before Task 7 (PromptsEditor before settings tabs).
- **Prerequisite:** v0-plumbing epic should be merged first (backend fixes in place), but can start in parallel on different files.
- **Downstream:** Epic 3 (v0-redesigns) depends on this epic's structural changes.
- **Design gates:** Tasks 4, 6, 7 may need design input (submit page tabs, ProfileHeaderImageLayout, settings tab structure). Tasks 1, 2, 3, 5 can proceed with verbal direction.

## Success Criteria (Technical)

- FAB navigates to `/dashboard/submit` and shows all user circles as tabs
- Three-dot menu dropdown opens with "Create a circle" option
- Bell icon removed from header
- Clicking a circle shows the latest newsletter (not CircleHome)
- `CircleHome.tsx` deleted
- Circle Settings renders 4 tabs (3 for non-admins), each with correct content
- `PromptsEditor` works in both setup and settings modes
- `ProfileHeaderImageLayout` renders in edit and display modes
- Error boundaries catch errors at app, dashboard, and circle route levels
- `global-error.tsx` works without any providers
- `not-found.tsx` shows styled 404
- All 925 existing tests pass
- No dead buttons in dashboard header
- Orphaned `/members` page cleaned up

## Tasks Created
- [ ] #164 - Dashboard header fixes (parallel: true)
- [ ] #165 - Add error boundaries at all route levels (parallel: true)
- [ ] #166 - Extract PromptsEditor shared component (parallel: true)
- [ ] #167 - Top-level submit page and FAB repurpose (parallel: false, depends on #164)
- [ ] #168 - Newsletter as circle landing page (parallel: true)
- [ ] #169 - ProfileHeaderImageLayout shared component (parallel: true)
- [ ] #170 - Circle Settings 4-tab refactor (parallel: false, depends on #166)

Total tasks: 7
Parallel tasks: 5
Sequential tasks: 2 (#167 depends on #164, #170 depends on #166)

## Estimated Effort

- **7 tasks**, 5 parallelizable + 2 sequential
- **Critical path:** Task 7 (settings 4-tab refactor) is the heaviest — depends on Task 3 and touches the most code
- **Lowest risk:** Tasks 1, 2 (header fixes, error boundaries) are small isolated changes
- **Design-blocked:** Tasks 4, 6, 7 may need design input before starting
