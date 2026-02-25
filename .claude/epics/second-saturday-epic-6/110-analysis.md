---
issue: 110
title: Write unit, integration, and E2E tests for notifications
analyzed: 2026-02-22T06:38:43Z
estimated_hours: 8
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #110

## Overview
Write comprehensive tests for the notification system: unit/integration tests for Convex notification functions (business logic, mutations, queries) and E2E tests for notification preferences and admin reminder UI flows.

## Parallel Streams

### Stream A: Unit & Integration Tests (Convex)
**Scope**: Test notification business logic — preference defaults, admin reminder counting, bulk reminders, non-submitter filtering
**Files**:
- `convex/__tests__/notifications.test.ts`
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

### Stream B: E2E Tests (Playwright)
**Scope**: Test notification preferences toggle flow and admin manual reminder flow in the browser
**Files**:
- `e2e/notifications.spec.ts`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

## Coordination Points

### Shared Files
None — streams work on completely different directories (`convex/__tests__/` vs `e2e/`).

### Sequential Requirements
None — both streams are fully independent.

## Conflict Risk Assessment
- **Low Risk**: Streams work on different directories with zero overlap

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A and B simultaneously. No coordination needed.

## Expected Timeline

With parallel execution:
- Wall time: 4 hours
- Total work: 8 hours
- Efficiency gain: 50%

Without parallel execution:
- Wall time: 8 hours

## Notes
- No existing unit/integration tests in `convex/__tests__/` — directory needs to be created
- E2E tests follow established Playwright + Clerk pattern from `e2e/settings.spec.ts`
- Unit tests: use `convexTest()` from `convex-test` if available, otherwise mock ctx objects
- Integration tests: mock OneSignal REST API (don't send real pushes)
- Notification preferences UI is on `/dashboard/settings` page
- Admin reminder UI is on circle detail page (AdminSubmissionDashboard component)
