---
issue: 184
title: Invite Page — ProfileHeaderImageLayout and warm copy
analyzed: 2026-02-25T04:00:33Z
estimated_hours: 1.5
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #184

## Overview

Transform the invite page (`src/app/invite/[inviteCode]/page.tsx`) from a transactional card UI to a warm, personal invite experience. The page currently shows a plain Avatar + name + "Created by" text in each state (not-signed-in, already-member, main join flow). The changes are:
1. Replace the plain `Avatar` at the top of each card with `ProfileHeaderImageLayout` (display mode) for the cover+icon banner treatment
2. Rewrite copy to be warmer per acceptance criteria
3. Fix `{circle.memberCount} members` → singular/plural aware

All changes are in a **single file**. No parallelization benefit exists.

## Parallel Streams

### Stream A: Invite Page Redesign (Single Stream)
**Scope**: All three changes — ProfileHeaderImageLayout, warm copy, pluralization — in the invite page
**Files**:
- `src/app/invite/[inviteCode]/page.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

**Implementation detail**:
- `ProfileHeaderImageLayout` is at `src/components/ProfileHeaderImageLayout.tsx`. Props: `coverImageUrl`, `iconUrl`, `editable` (default `false` = display mode). No `circleName` prop — add a `<h1>` below the layout for the circle name.
- The invite page has 4 rendered states: loading (spinner — leave as-is), invalid link (leave as-is), blocked (leave as-is), already-member (update), not-signed-in (update), signed-in join (update).
- Only the "already-member", "not-signed-in", and main signed-in join card states need the copy + layout update. The blocked state just shows a destructive banner — it does NOT need ProfileHeaderImageLayout treatment (keep it minimal).
- For each updated state, replace the Avatar block at the top with `<ProfileHeaderImageLayout coverImageUrl={circle.coverImageUrl} iconUrl={circle.iconUrl} className="rounded-t-lg" />` and remove the card's top padding (the layout provides its own).
- Then below the layout:
  - Heading: `"You've been invited to join {circle.name}"`
  - Member line: `"A group of {circle.memberCount === 1 ? '1 member' : \`${circle.memberCount} members\`} sharing monthly updates"`
  - Creator line: `"{circle.adminName} started this circle"`
- Remove the `Users` icon import if no longer used after the rewrite.
- Check if `circle.coverImageUrl` exists on the Convex circle type — if the field is named differently, use whatever field holds the cover image URL.

## Coordination Points

### Shared Files
None — single file touched.

### Sequential Requirements
None.

## Conflict Risk Assessment

- **No Risk**: Single file, single stream.

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

No parallelization benefit for a single-file task. Launch one agent.

## Expected Timeline

With single agent:
- Wall time: 1.5 hours
- Total work: 1.5 hours
- Efficiency gain: N/A

## Notes

- `editable` defaults to `false` in ProfileHeaderImageLayout — no need to pass `editable={false}` explicitly
- The card container uses `rounded-lg` — the layout's top should be `rounded-t-lg` to match
- The blocked state is intentionally excluded from the redesign: it's a destructive/warning state that should stay minimal, not warm
- `circle.coverImageUrl` — verify this field name against the actual Convex type returned by `api.circles.getCircleByInviteCode`; it may be `coverUrl` or similar
