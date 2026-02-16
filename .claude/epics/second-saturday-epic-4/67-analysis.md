---
issue: 67
title: Implement Mux video integration and webhook handler
analyzed: 2026-02-16T14:04:53Z
estimated_hours: 12
parallelization_factor: 1.8
---

# Parallel Work Analysis: Issue #67

## Overview
Set up complete Mux video integration for the submission system. This includes SDK integration, upload action, webhook handler for processing events, and thumbnail generation. Provides backend infrastructure for video hosting.

## Parallel Streams

### Stream A: Mux SDK & Upload Action
**Scope**: Install Mux SDK and implement video upload action
**Files**:
- `package.json` - Add @mux/mux-node dependency
- `convex/videos.ts` - Create uploadVideoToMux action
- `convex/http.ts` - HTTP endpoints (if needed)
- `.env.local` - Mux credentials configuration
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 5-6
**Dependencies**: none

**Tasks**:
- Install and configure Mux SDK
- Implement uploadVideoToMux Convex action
- Handle direct upload URL generation
- Store Mux asset ID and playback ID in videos table
- Implement error handling for upload failures
- Add video metadata extraction (duration, resolution)

### Stream B: Webhook Handler & Validation
**Scope**: Create webhook endpoint and signature validation
**Files**:
- `convex/http.ts` - Webhook endpoint setup
- `convex/videos.ts` - Webhook handler mutations
- `lib/mux.ts` - Webhook signature validation utilities
**Agent Type**: backend-specialist
**Can Start**: immediately (can work parallel with Stream A)
**Estimated Hours**: 4-5
**Dependencies**: none (shares videos.ts with Stream A - coordinate edits)

**Tasks**:
- Create `/api/webhooks/mux` endpoint in Convex HTTP
- Implement webhook signature validation using Mux webhook secret
- Parse `video.asset.ready` event payload
- Extract thumbnail URL from event
- Update videos table with thumbnail, playback ID, status
- Handle `video.asset.errored` events
- Implement error logging and recovery

### Stream C: Testing & Integration
**Scope**: End-to-end testing and verification
**Files**:
- `test/integration/mux-upload.test.ts` - Upload flow tests
- `test/integration/mux-webhooks.test.ts` - Webhook handler tests
- `test/fixtures/mux-events.json` - Mock webhook payloads
**Agent Type**: fullstack-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 3-4
**Dependencies**: Streams A & B must be complete

**Tasks**:
- Write integration tests for uploadVideoToMux action
- Test webhook handler with Mux test events
- Verify thumbnail generation end-to-end
- Test error scenarios (failed uploads, webhook failures)
- Validate video playback URLs work correctly
- Test webhook signature validation
- Verify video metadata storage

## Coordination Points

### Shared Files
Files that multiple streams need to modify:
- `convex/videos.ts` - Streams A & B both add functions here
  - **Stream A**: Adds `uploadVideoToMux` action
  - **Stream B**: Adds `updateVideoAsset`, `updateVideoReady`, `updateVideoError` mutations
  - **Coordination**: Use clear function boundaries, avoid editing same functions
- `convex/http.ts` - Stream B adds webhook endpoint
- `package.json` - Stream A adds Mux SDK dependency

### Sequential Requirements
What must happen in order:
1. Stream A completes upload action → Stream C can test uploads
2. Stream B completes webhook handler → Stream C can test webhook flow
3. Both A & B complete → Stream C runs full end-to-end tests

### Integration Points
- Upload action (Stream A) returns Mux upload URL and asset ID
- Webhook handler (Stream B) updates the same video record created by Stream A
- Both streams need access to same videos table schema

## Conflict Risk Assessment
- **Low Risk**: Streams A & B work on different functions in videos.ts
- **Medium Risk**: Both streams may need to update video status field - coordinate status enum
- **Low Risk**: Testing stream is sequential, no parallel conflicts

## Parallelization Strategy

**Recommended Approach**: hybrid

**Phase 1 (Parallel)**: Launch Streams A and B simultaneously
- Stream A focuses on upload flow
- Stream B focuses on webhook handling
- Coordinate on shared videos.ts file (different functions)
- Estimated wall time: 5-6 hours (max of both streams)

**Phase 2 (Sequential)**: Stream C after A & B complete
- Run comprehensive integration tests
- Verify end-to-end flow
- Estimated wall time: 3-4 hours

## Expected Timeline

With parallel execution:
- **Phase 1**: 5-6 hours (A & B parallel)
- **Phase 2**: 3-4 hours (C sequential)
- **Wall time**: 8-10 hours
- **Total work**: 12-15 hours
- **Efficiency gain**: ~25-30%

Without parallel execution:
- **Wall time**: 12-15 hours (sequential)

## Notes

**Environment Setup Required**:
- Mux API credentials (Token ID, Token Secret)
- Mux Webhook signing secret
- Environment variables configured in `.env.local`

**Mux Account Prerequisites**:
- Mux account must be set up (Epic 0 dependency)
- Direct uploads must be enabled
- Webhook endpoint must be registered in Mux dashboard

**Testing Considerations**:
- Use Mux test environment for development
- Mock webhook events for unit tests
- Real Mux integration for E2E tests
- Consider video file size limits for tests

**Video Table Schema**:
Already exists in convex/schema.ts:
- `uploadId`: Mux upload ID
- `assetId`: Mux asset ID
- `playbackId`: Mux playback ID
- `status`: uploading, processing, ready, error

**Security**:
- Webhook signature validation is CRITICAL
- Never trust unsigned webhook payloads
- Validate all webhook data before database updates
