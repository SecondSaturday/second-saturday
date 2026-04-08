---
issue: 51
stream: Schema + Query Updates
agent: main
started: 2026-02-10T18:25:38Z
status: completed
---

# Stream A: Schema + Query Updates

## Completed
- Added `leftAt` and `blocked` fields to memberships schema
- Updated `getCircleMembers` to filter active members only
- Updated `getMembershipCount` to count active members only
- Updated `joinCircle` with rejoin logic (clear `leftAt`) and block check
- Updated `requireMembership` in circles.ts to reject left members
- Updated `getCirclesByUser` to filter left memberships
- Updated `getCircle` member count to exclude left members
- Updated `getCircleByInviteCode` member count to exclude left members
- TypeScript compiles with no errors
