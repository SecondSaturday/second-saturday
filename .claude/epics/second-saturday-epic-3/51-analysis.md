---
issue: 51
analyzed: 2026-02-10T18:25:38Z
---

# Issue #51 Analysis: Extend memberships schema and update existing queries

## Work Streams

### Stream A: Schema + Query Updates (Single stream - no parallelism needed)

**Files:**
- `convex/schema.ts` — Add `leftAt`, `blocked` fields to memberships
- `convex/memberships.ts` — Update `getCircleMembers`, `getMembershipCount`, `joinCircle`
- `convex/circles.ts` — Update `getCirclesByUser`, `requireMembership`

**Approach:**
1. Update schema first (add optional fields)
2. Update memberships.ts queries/mutations
3. Update circles.ts helpers and queries

**Notes:**
- Single stream since all changes are tightly coupled
- Optional fields ensure backward compatibility with existing data
