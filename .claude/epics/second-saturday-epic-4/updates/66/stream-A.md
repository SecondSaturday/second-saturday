---
issue: 66
stream: Schema Definition
agent: database-specialist
started: 2026-02-12T04:37:54Z
status: completed
---

# Stream A: Schema Definition

## Scope
Define Convex schema for all three tables with proper relationships and indexes

## Files
- `convex/schema.ts`

## Deliverables
- Submissions table (circleId, userId, cycleId, submittedAt, lockedAt)
- Responses table (submissionId, promptId, text, updatedAt)
- Media table (responseId, storageId, muxAssetId, type, thumbnailUrl, order, uploadedAt)
- Proper indexes for performance
- Foreign key relationships via IDs
- Timestamps (createdAt/updatedAt)

## Progress
- ✅ Defined submissions table schema with proper indexes
- ✅ Defined responses table schema with proper indexes
- ✅ Defined media table schema with proper indexes
- ✅ Added foreign key relationships via IDs
- ✅ Added timestamps (createdAt/updatedAt) to all tables
- ✅ Added composite indexes for performance optimization
- ✅ Ensured one submission per user per circle per cycle via index
- ✅ Ensured one response per prompt per submission via index
- ✅ Added order field to media for supporting up to 3 items

## Completed
All schema definitions for Issue #66 are complete.
