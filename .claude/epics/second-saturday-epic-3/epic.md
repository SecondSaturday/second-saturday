---
name: second-saturday-epic-3
status: complete
created: 2026-02-10T18:03:22Z
updated: 2026-02-11T11:35:08Z
progress: 100%
completed: 2026-02-11T11:35:08Z
prd: .claude/prds/second-saturday-epic-3.md
github: https://github.com/SecondSaturday/second-saturday/issues/50
---

# Epic: Circle Membership

## Overview

Implement circle membership flows: joining via invite link, viewing members, leaving circles, admin member management, and admin submission status dashboard. Significant backend already exists (`joinCircle`, `getCircleMembers`, `getCircleByInviteCode`) — this epic extends the schema for leave/remove functionality and builds the missing UI pages and components.

## Architecture Decisions

- **Soft-delete for leaving** — Add `leftAt` field to memberships table; filter active members by `leftAt === undefined`. Allows seamless rejoin by clearing `leftAt`.
- **Block via separate field** — Add `blocked` boolean to memberships for "Remove & Block" scenarios. Blocked members cannot rejoin.
- **Convex subscriptions** — Use real-time queries for admin submission dashboard (no polling needed).
- **Public invite preview** — `getCircleByInviteCode` already works without auth; extend to show admin name.
- **Leverage existing patterns** — Follow `circles.ts` auth helpers (`getAuthUser`, `requireAdmin`, `requireMembership`).

## Technical Approach

### Backend (Convex)

**Schema changes:**
- Add `leftAt: v.optional(v.number())` to memberships table
- Add `blocked: v.optional(v.boolean())` to memberships table

**New mutations/queries in `memberships.ts`:**
- `leaveCircle` — Sets `leftAt`, handles admin transfer prompt
- `removeMember` — Admin removes member; optionally blocks and deletes contributions
- `getSubmissionStatus` — Admin-only query showing member submission progress

**Modify existing:**
- `getCircleMembers` — Filter out members with `leftAt` set
- `joinCircle` — Handle rejoin (clear `leftAt`); block check
- `getMembershipCount` — Filter active members only

### Frontend (Next.js + React)

**New pages:**
- `/invite/[inviteCode]` — Public invite preview page
- `/dashboard/circles/[circleId]/members` — Member list page

**New components:**
- `InvitePreview` — Circle preview with join/signup/login buttons
- `MemberList` — Active members with avatars, admin badge, sorted
- `LeaveCircleModal` — Confirmation dialog
- `RemoveMemberModal` — Admin removal with keep/block options
- `AdminSubmissionDashboard` — Submission status per member (admin-only)

### Analytics (PostHog)
- Track: `invite_link_viewed`, `circle_joined`, `circle_left`, `member_removed`

## Implementation Strategy

1. **Schema + backend first** — Extend memberships schema and mutations
2. **Invite flow** — Build public invite page and join flow
3. **Member list + leave** — Member list UI and leave circle flow
4. **Admin features** — Remove member and submission dashboard
5. **Analytics + testing** — PostHog events and test coverage

## Task Breakdown Preview

- [x] Task 1: Extend memberships schema (add `leftAt`, `blocked` fields) and update existing queries to filter active members
- [x] Task 2: Implement `leaveCircle` and `removeMember` mutations with contribution handling
- [x] Task 3: Add `getSubmissionStatus` admin query
- [x] Task 4: Build invite preview page (`/invite/[inviteCode]`) with join/signup/login flows
- [x] Task 5: Build member list page and component
- [x] Task 6: Build LeaveCircleModal and RemoveMemberModal components
- [x] Task 7: Build AdminSubmissionDashboard component
- [x] Task 8: Add PostHog analytics events for membership flows
- [x] Task 9: Write tests for membership mutations and UI flows

## Dependencies

### Blockers
- **Epic 0** (Project Setup) — Complete
- **Epic 1** (Authentication) — Complete
- **Epic 2** (Circle Creation) — Complete (current branch)

### Enables
- **Epic 4** (Content Submission) — Requires membership to submit
- **Epic 5** (Newsletter Experience) — Needs member list for generation
- **Epic 6** (Notifications) — Needs membership data

## Success Criteria (Technical)

- Join flow completes in 2 taps for logged-in users
- Invite preview works without authentication
- Active member list excludes left/removed members
- Rejoin restores full access (clears `leftAt`)
- Blocked members cannot rejoin
- Admin submission dashboard updates in real-time via Convex subscriptions
- 80%+ test coverage for membership business logic

## Estimated Effort

- **Schema + mutations**: ~4 hours (Tasks 1-3)
- **Invite flow UI**: ~4 hours (Task 4)
- **Member list + modals**: ~6 hours (Tasks 5-6)
- **Admin dashboard**: ~4 hours (Task 7)
- **Analytics + tests**: ~4 hours (Tasks 8-9)
- **Total**: ~22 hours
- **Critical path**: Schema changes → mutations → UI pages

## Tasks Created
- [x] #51 - Extend memberships schema and update existing queries (parallel: false) ✅
- [x] #52 - Implement leaveCircle and removeMember mutations (parallel: false) ✅
- [x] #53 - Add getSubmissionStatus admin query (parallel: true) ✅
- [x] #57 - Build invite preview page (parallel: true) ✅
- [x] #62 - Build member list page and component (parallel: true) ✅
- [x] #63 - Build LeaveCircleModal and RemoveMemberModal (parallel: true) ✅
- [x] #54 - Build AdminSubmissionDashboard component (parallel: true) ✅
- [x] #55 - Add PostHog analytics events for membership flows (parallel: true) ✅
- [x] #56 - Write tests for membership mutations and UI flows (parallel: false) ✅

Total tasks: 9
Parallel tasks: 6
Sequential tasks: 3
Estimated total effort: 25 hours
