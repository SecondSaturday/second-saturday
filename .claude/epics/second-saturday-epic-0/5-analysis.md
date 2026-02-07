---
issue: 5
title: Integrate Clerk Authentication
analyzed: 2026-02-07T05:20:38Z
estimated_hours: 5
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #5

## Overview
Configure Clerk for authentication with OAuth providers (Google, Apple) and email verification. Set up Clerk webhooks to sync user data to Convex. This involves installing Clerk, configuring providers, setting up middleware, and implementing the webhook sync to Convex.

## Parallel Streams

### Stream A: Clerk Setup & Provider Integration
**Scope**: Install Clerk, configure ClerkProvider, update providers.tsx, set up environment variables
**Files**:
- `src/app/providers.tsx` (update to wrap with ClerkProvider)
- `.env.local` (add Clerk vars)
- `package.json` (add @clerk/nextjs)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

### Stream B: Middleware & Route Protection
**Scope**: Configure Clerk middleware for protected routes
**Files**:
- `src/middleware.ts`
**Agent Type**: fullstack-specialist
**Can Start**: immediately (parallel with A)
**Estimated Hours**: 1.0
**Dependencies**: none

### Stream C: Webhook Integration
**Scope**: Update Convex HTTP actions to handle Clerk webhooks, implement user sync
**Files**:
- `convex/http.ts` (update Clerk webhook handler)
- `convex/users.ts` (create user mutations for sync)
**Agent Type**: backend-specialist
**Can Start**: immediately (parallel with A, B)
**Estimated Hours**: 2.0
**Dependencies**: none

### Stream D: Auth UI Components
**Scope**: Create sign-in/sign-up pages using Clerk components
**Files**:
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
**Agent Type**: frontend-specialist
**Can Start**: after Stream A (needs ClerkProvider)
**Estimated Hours**: 0.5
**Dependencies**: Stream A

## Coordination Points

### Shared Files
- `src/app/providers.tsx` - Stream A owns, others read
- `convex/http.ts` - Stream C updates existing file from issue #4
- `.env.local` - Stream A adds Clerk vars

### Sequential Requirements
1. ClerkProvider must be configured before auth UI pages
2. Webhook handler can be built independently
3. Middleware can be built independently

## Conflict Risk Assessment
- **Low Risk**: Most streams work on separate files
- **Medium Risk**: `convex/http.ts` was created in issue #4, Stream C updates it
- Stream A touches `providers.tsx` which exists from issue #4

## Parallelization Strategy

**Recommended Approach**: hybrid

1. Launch Streams A, B, C simultaneously
2. Start Stream D after Stream A completes

```
Stream A (1.5h) ──── Stream D (0.5h)
Stream B (1.0h) ────────┘
Stream C (2.0h) ────────┘
```

## Expected Timeline

With parallel execution:
- Wall time: 2.5 hours (C is longest, then D after A)
- Total work: 5.0 hours
- Efficiency gain: 50%

Without parallel execution:
- Wall time: 5.0 hours

## Notes
- Clerk dashboard configuration (Google OAuth, Apple Sign-In) is manual and outside code scope
- Apple Sign-In requires Apple Developer account which may not be ready
- Webhook secret must be configured in Clerk dashboard after deployment
- Test with email/password first, then OAuth providers
- The `conflicts_with: [4]` in task file is outdated - issue #4 is now complete
