---
issue: 184
stream: Invite Page Redesign
agent: general-purpose
started: 2026-02-25T04:01:33Z
completed: 2026-02-25T04:15:00Z
status: completed
---

# Stream A: Invite Page Redesign

## Scope
ProfileHeaderImageLayout integration, warm copy, pluralization fix

## Files
- `src/app/invite/[inviteCode]/page.tsx`

## Results

### Implementation Complete

**Cover Image Field**: Not found in `getCircleByInviteCode` query - passed `coverImageUrl={null}` as the circle object returned by this query only includes `iconUrl`, not a cover image URL.

**States Updated**:
1. Already-member state (lines 127-154)
2. Not-signed-in state (lines 156-188)
3. Main join state (lines 190-214)

**Changes Made**:
- Added `ProfileHeaderImageLayout` import
- Replaced Avatar blocks with `ProfileHeaderImageLayout` component in all 3 states
- Changed card padding from `p-8` to `px-8 pb-8` to accommodate the layout's visual weight
- Replaced old heading/description blocks with warm, personalized copy:
  - "You've been invited to join {circle.name}"
  - "{X members} sharing monthly updates"
  - "{adminName} started this circle"
- Removed unused `Users` icon import (no longer needed)
- Left Avatar imports intact (still used in blocked state)
- Blocked state unchanged as instructed

**Commit**: `807e2e4` - feat(#184): apply ProfileHeaderImageLayout and warm copy to invite page
