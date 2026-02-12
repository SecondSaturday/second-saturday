---
issue: 66
title: Set up Convex schema and core mutations/queries
analyzed: 2026-02-12T04:34:38Z
estimated_hours: 14
parallelization_factor: 1.3
---

# Parallel Work Analysis: Issue #66

## Overview
Implement the complete Convex data layer for submissions, including schema definitions for three tables (submissions, responses, media) and all required mutations/queries for creating and managing submission data. This includes input validation, proper indexing, and comprehensive test coverage.

## Parallel Streams

### Stream A: Schema Definition
**Scope**: Define Convex schema for all three tables with proper relationships and indexes
**Files**:
- `convex/schema.ts`
**Agent Type**: database-specialist
**Can Start**: immediately
**Estimated Hours**: 3-4
**Dependencies**: none

**Deliverables**:
- Submissions table (circleId, userId, cycleId, submittedAt, lockedAt)
- Responses table (submissionId, promptId, text, updatedAt)
- Media table (responseId, storageId, muxAssetId, type, thumbnailUrl, order, uploadedAt)
- Proper indexes for performance
- Foreign key relationships via IDs
- Timestamps (createdAt/updatedAt)

### Stream B: Backend Implementation
**Scope**: Implement all mutations and queries with input validation
**Files**:
- `convex/submissions.ts`
**Agent Type**: backend-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 5-6
**Dependencies**: Stream A (needs schema types)

**Deliverables**:
- createSubmission mutation
- updateResponse mutation (with auto-save support)
- getSubmissionForCircle query
- lockSubmission mutation
- Input validation for all mutations/queries
- Enforce constraints (one submission per user per circle per cycle, one response per prompt, up to 3 media per response)

### Stream C: Unit Tests
**Scope**: Write unit tests for validation logic using TDD approach
**Files**:
- `test/unit/submissions.test.ts` (or appropriate test directory)
**Agent Type**: fullstack-specialist
**Can Start**: immediately (parallel with Stream B using TDD)
**Estimated Hours**: 3-4
**Dependencies**: none (can write tests based on specs, then run against implementation)

**Deliverables**:
- Unit tests for validation logic
- 80%+ code coverage
- Test cases for edge cases and error conditions
- Validation of constraints

### Stream D: Integration Tests
**Scope**: Write integration tests for Convex functions end-to-end
**Files**:
- `test/integration/submissions.test.ts` (or appropriate test directory)
**Agent Type**: fullstack-specialist
**Can Start**: after Stream B completes
**Estimated Hours**: 2-3
**Dependencies**: Stream B (needs working implementation)

**Deliverables**:
- Integration tests for all Convex functions
- End-to-end workflow tests
- Test data validation
- Schema deployment verification

## Coordination Points

### Shared Files
None - all streams work on different files

### Sequential Requirements
1. Schema must be defined before backend implementation (Stream A → Stream B)
2. Backend implementation must exist before integration tests (Stream B → Stream D)
3. Unit tests (Stream C) can be written in parallel with implementation (Stream B) using TDD approach

## Conflict Risk Assessment
- **Low Risk**: All streams work on different files
- **No shared file conflicts**: Schema, implementation, unit tests, and integration tests are in separate files
- **Clean separation**: Each stream has clear boundaries

## Parallelization Strategy

**Recommended Approach**: hybrid

**Execution Plan**:
1. Start Stream A (Schema) - 3-4h
2. When Stream A completes, launch Stream B (Implementation) and Stream C (Unit Tests) in parallel - 5-6h max
3. When Stream B completes, launch Stream D (Integration Tests) - 2-3h

**Rationale**: Stream C can write unit tests based on the specification while Stream B implements the actual code. This follows TDD principles and allows parallel work without file conflicts.

## Expected Timeline

With parallel execution:
- Wall time: 10-13 hours
- Total work: 13-17 hours
- Efficiency gain: ~23-30%

Without parallel execution:
- Wall time: 13-17 hours

## Notes
- Schema definition (Stream A) is the critical path and must complete first
- Unit tests (Stream C) can be written in parallel with implementation (Stream B) if using test-driven development approach
- All streams work on separate files, minimizing conflict risk
- Integration tests (Stream D) require working implementation and must wait for Stream B
- Consider deploying schema to Convex development environment after Stream A completes to unblock Stream B
