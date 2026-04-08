---
issue: 56
created: 2026-02-10T23:15:47Z
---

# Issue #56 Analysis: Write tests for membership mutations and UI flows

## Stream A: Integration tests for membership business logic
- **Files**: `test/integration/memberships.test.ts`
- **Scope**: Extend existing test file with leaveCircle, removeMember, joinCircle rejoin/blocked, getCircleMembers filtering, getSubmissionStatus admin-only
- **Pattern**: Pure logic validation (same pattern as existing tests)

## Stream B: Component tests for membership UI
- **Files**: `test/components/LeaveCircleModal.test.tsx`, `test/components/RemoveMemberModal.test.tsx`, `test/components/MemberList.test.tsx`, `test/components/InvitePreview.test.tsx`
- **Scope**: Render tests with mocked Convex hooks
- **Pattern**: Same mock pattern as CircleList.test.tsx

## Notes
- Single stream execution (tests are sequential by nature)
- Existing `test/integration/memberships.test.ts` has basic joinCircle + count tests — extend it
- Follow existing mock pattern from `test/components/CircleList.test.tsx`
