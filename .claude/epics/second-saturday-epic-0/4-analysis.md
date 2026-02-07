---
issue: 4
title: Configure Convex Backend
analyzed: 2026-02-07T05:09:50Z
estimated_hours: 5
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #4

## Overview
Set up Convex for real-time database, serverless functions, and file storage. This involves initializing the Convex project, creating schema, configuring providers in Next.js, setting up file storage, and creating HTTP actions for webhooks.

## Parallel Streams

### Stream A: Core Setup & Schema
**Scope**: Initialize Convex, create schema, configure environment variables
**Files**:
- `convex/schema.ts`
- `convex/tsconfig.json`
- `convex/_generated/*` (auto-generated)
- `.env.local` (add Convex vars)
- `package.json` (convex dependency)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 2.0
**Dependencies**: none

### Stream B: Provider Integration
**Scope**: Configure ConvexProvider in Next.js app, create providers wrapper
**Files**:
- `src/app/providers.tsx`
- `src/app/layout.tsx` (wrap with providers)
**Agent Type**: fullstack-specialist
**Can Start**: after Stream A (needs generated types)
**Estimated Hours**: 1.0
**Dependencies**: Stream A

### Stream C: File Storage & Actions
**Scope**: Set up file storage for photos/videos, create upload URL action
**Files**:
- `convex/files.ts`
- `convex/storage.ts`
**Agent Type**: backend-specialist
**Can Start**: after Stream A (needs schema)
**Estimated Hours**: 1.0
**Dependencies**: Stream A

### Stream D: HTTP Actions for Webhooks
**Scope**: Create HTTP action endpoints for external webhooks (Clerk, Mux, etc.)
**Files**:
- `convex/http.ts`
**Agent Type**: backend-specialist
**Can Start**: after Stream A (needs schema)
**Estimated Hours**: 1.0
**Dependencies**: Stream A

## Coordination Points

### Shared Files
- `package.json` - Stream A adds convex dependency
- `.env.local` - Stream A adds Convex env vars
- `convex/_generated/*` - Auto-generated, all streams read

### Sequential Requirements
1. Convex must be initialized before any other work
2. Schema must exist before file storage or HTTP actions
3. Generated types must exist before provider integration

## Conflict Risk Assessment
- **Low Risk**: After initial setup (Stream A), remaining streams work on separate files
- The `convex/` directory is well-partitioned by functionality
- No overlapping file modifications expected between B, C, D

## Parallelization Strategy

**Recommended Approach**: hybrid

1. Complete Stream A first (core setup - 2h)
2. Launch Streams B, C, D in parallel (all depend on A)
3. Streams B, C, D can complete simultaneously (~1h each)

```
Stream A (2h) ──┬── Stream B (1h)
                ├── Stream C (1h)
                └── Stream D (1h)
```

## Expected Timeline

With parallel execution:
- Wall time: 3.0 hours (A sequential, then B+C+D parallel)
- Total work: 5.0 hours
- Efficiency gain: 40%

Without parallel execution:
- Wall time: 5.0 hours

## Notes
- Convex initialization is interactive (requires login) - may need manual intervention
- Stream A should verify `npx convex dev` works before spawning parallel streams
- Convex paid plan upgrade ($25/mo) is a manual step outside this scope
- The `conflicts_with: [5]` (Clerk integration) is because Clerk webhooks need Convex HTTP actions ready
