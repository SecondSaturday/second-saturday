---
name: v0-polish
status: completed
created: 2026-02-25T03:25:20Z
updated: 2026-02-25T04:42:55Z
completed: 2026-02-25T04:42:55Z
progress: 100%
prd: .claude/prds/v0-polish.md
github: https://github.com/SecondSaturday/second-saturday/issues/181
---

# Epic: v0-polish

## Overview

Final polish pass before V0 ships. Mix of design-driven UI improvements (circle creation flow, onboarding, invite page) and autonomous cleanup (dead code, accessibility, data integrity). All changes are incremental modifications to existing screens and components — no new architecture required.

## Architecture Decisions

- **FloatingLabelInput**: New shared component for animated label pattern (FR13). Justified by reuse potential in future forms.
- **StepProgressIndicator**: New shared component for 3-step wizard indicator (FR2). Reused across create flow.
- **No schema migration for name fields**: Store `firstName`/`lastName` separately in Convex users table for clean data model (FR12).
- **SSO pre-population**: Read from Clerk `useUser()` hook on mount — no backend changes needed for avatar/name pre-fill.
- **FAB rename**: File rename + import updates only — no logic changes.

## Technical Approach

### Frontend Components

- **`StepProgressIndicator`**: New component, 3 numbered circles + connecting line, current/completed/future states
- **`FloatingLabelInput`**: New component, Material Design floating label animation via CSS transition
- **Circle creation intro splash**: New route or state-gated view at `/dashboard/create`
- **Complete profile**: SSO data pre-population via `useUser()`, split to first/last name fields, floating labels, mobile-only logo
- **Invite page**: Apply `ProfileHeaderImageLayout` in display mode, rewrite copy, fix pluralization
- **Loading skeletons**: Members list skeleton in `CircleSettings`, newsletter skeleton in `NewsletterView`

### Backend Services

- **`convex/schema.ts`**: Add `['circleId', 'publishedAt']` compound index to newsletters table (FR25)
- **`convex/users.ts`**: Evaluate adding `firstName`/`lastName` fields (FR12 — compose at save time if schema change is too risky)

### Infrastructure

No deployment or infrastructure changes required.

## Implementation Strategy

### Development Phases

1. **Autonomous cleanup** (no design gates): Dead code removal, FAB rename, aria-labels, save button guard, newsletter index, member count pluralization, back arrow fix, date picker centering — all can ship immediately
2. **Onboarding polish** (no Figma needed): SSO pre-population, first/last name split, mobile-only logo — reference Clerk docs only
3. **Invite page polish**: ProfileHeaderImageLayout + warm copy — reuses existing component
4. **Creation flow** (design-gated): Intro splash, step indicator, max-width containers, fixed CTA bars — needs Figma/screenshot references

### Risk Mitigation

- FR12 name field split: Store both fields separately but compose full name on save to avoid breaking existing queries
- E1 dropdown-menu.tsx: Check imports before deleting — if used by Epic 3 menus, keep

### Testing Approach

- Update test IDs for renamed FAB component
- Delete `VideoThumbnail` test with component (E2)
- Run full test suite before committing each task group

## Task Breakdown Preview

- [ ] Task 1: Autonomous cleanup — FAB rename, dead code (E1-E4), save guard (R1), newsletter index (R2), aria-labels (Q1), pluralization (C3), back arrow (H4), date picker centering (F7)
- [ ] Task 2: Loading skeletons — members list (Q2) and newsletter view (Q3)
- [ ] Task 3: Invite page — ProfileHeaderImageLayout + warm copy (M1, M2)
- [ ] Task 4: Onboarding — SSO pre-population, first/last name, floating labels, mobile-only logo (N1-N5)
- [ ] Task 5: Circle creation flow — intro splash, step indicator, max-width containers, fixed CTA bars, warmer copy (FR1-FR10)

## Dependencies

- Epic 3 (v0-redesigns) must be substantially complete — redesigned screens must be in place
- `ProfileHeaderImageLayout` interface must be resolved (confirmed in Epic 3 G9)
- Clerk `useUser()` hook available in `complete-profile` page

## Success Criteria (Technical)

- All dead code confirmed removed or in-use (no unused imports, files, or functions)
- `aria-label` on all icon-only buttons (verified via JSX audit)
- SSO fields pre-populate on mount without flash of empty state
- Skeleton components match layout of content they replace
- FAB component renamed, all test IDs updated, tests pass
- Convex newsletter index added and schema validates
- Save button disabled during in-flight mutation
- Creation flow has intro splash, step indicator, max-width form, fixed CTAs

## Estimated Effort

- **Task 1 (cleanup)**: Largest task, but all mechanical — search + replace, delete, add attributes
- **Task 2 (skeletons)**: Medium — requires matching existing layout dimensions
- **Task 3 (invite)**: Small — reuses existing component, copy changes only
- **Task 4 (onboarding)**: Medium — new FloatingLabelInput component + SSO integration
- **Task 5 (creation flow)**: Largest design effort — new components + gated on Figma/screenshots
- **Critical path**: Task 5 is design-gated; Tasks 1-4 can proceed in parallel

## Tasks Created

- [x] #182 - Autonomous Cleanup — FAB rename, dead code, data integrity, accessibility, nav fixes (parallel: true)
- [x] #183 - Loading Skeletons — members list and newsletter view (parallel: true)
- [x] #184 - Invite Page — ProfileHeaderImageLayout and warm copy (parallel: true)
- [x] #185 - Onboarding — SSO pre-population, first/last name fields, floating labels, mobile-only logo (parallel: true)
- [x] #186 - Circle Creation Flow — intro splash, step indicator, max-width containers, fixed CTAs, warmer copy (parallel: false)

Total tasks: 5
Parallel tasks: 4 (001, 002, 003, 004)
Sequential tasks: 1 (005 — design-gated)
Estimated total effort: 14-21 hours
