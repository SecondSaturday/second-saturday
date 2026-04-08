---
issue: 69
title: Build video upload UI with Mux and blocking progress
analyzed: 2026-02-16T16:27:29Z
estimated_hours: 15-19
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #69

## Overview
Implement video upload UI that integrates with Mux, showing a blocking progress indicator during upload and preventing navigation until complete. This extends the existing MediaUploader component to support video files using Capacitor Camera for mobile selection.

## Parallel Streams

### Stream A: Video Upload Integration
**Scope**: Add video selection and upload capabilities to MediaUploader component
**Files**:
- `src/components/submissions/MediaUploader.tsx` (extend existing)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 5-6
**Dependencies**: none

**Tasks**:
- Add video file type support to MediaUploader
- Integrate Capacitor Camera for video selection (camera + gallery)
- Implement video file validation (MP4, MOV formats)
- Call uploadVideoToMux Convex action
- Add size guidance for large video files
- Basic upload flow with simple loading state

### Stream B: Blocking Progress Modal
**Scope**: Create reusable blocking modal overlay with progress tracking
**Files**:
- `src/components/ui/blocking-modal.tsx` (new)
- `src/components/ui/progress.tsx` (new or extend existing)
- `src/hooks/useBlockingUpload.ts` (new)
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 4-5
**Dependencies**: none

**Tasks**:
- Create blocking modal overlay component (prevents interaction)
- Build progress bar component with percentage display
- Implement navigation prevention logic
- Add cancel upload confirmation dialog
- Create custom hook for managing blocking upload state
- Handle upload completion and navigation unlock

### Stream C: Integration & Polish
**Scope**: Integrate blocking modal with video upload and add Mux processing features
**Files**:
- `src/components/submissions/MediaUploader.tsx` (integration)
- `src/components/submissions/VideoThumbnail.tsx` (new)
- `src/hooks/useVideoProcessing.ts` (new, optional)
**Agent Type**: frontend-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 3-4
**Dependencies**: Streams A, B

**Tasks**:
- Integrate blocking modal into MediaUploader video upload flow
- Implement Mux processing status polling
- Display video thumbnails after Mux processing completes
- Add error handling UI for failed uploads
- Ensure upload completion triggers navigation unlock
- Polish user experience and edge cases

### Stream D: E2E Testing
**Scope**: Comprehensive testing for video upload functionality
**Files**:
- `test/components/submissions/MediaUploader.video.test.tsx` (new)
- `test/e2e/video-upload.spec.ts` (new)
**Agent Type**: fullstack-specialist
**Can Start**: after Stream C completes
**Estimated Hours**: 3-4
**Dependencies**: Stream C

**Tasks**:
- Write E2E tests for complete video upload flow
- Test blocking UI behavior (navigation prevention)
- Test progress bar accuracy
- Test error handling and recovery
- Test upload cancellation with confirmation
- Test video thumbnail display
- Test iOS/Android device compatibility (if CI supports)

## Coordination Points

### Shared Files
Files that multiple streams need to modify:
- `src/components/submissions/MediaUploader.tsx` - Streams A & C (A implements core upload, C integrates blocking UI)
  - **Coordination**: Stream A creates the foundation, Stream C adds blocking behavior
  - **Risk**: Medium - Sequential dependency reduces conflict risk

### Sequential Requirements
Work that must happen in specific order:
1. **Streams A & B in parallel** - Video upload logic and blocking modal can be built independently
2. **Stream C after A & B** - Integration requires both components to exist
3. **Stream D after C** - Testing requires complete implementation

## Conflict Risk Assessment
- **Low Risk**: Streams A & B work on completely different files
- **Medium Risk**: Stream C modifies MediaUploader.tsx after Stream A, but with clear integration points
- **Note**: This task conflicts with issue #68 (photo upload UI) which also modifies MediaUploader.tsx
  - Recommend completing #68 first or coordinating changes carefully

## Parallelization Strategy

**Recommended Approach**: hybrid

**Phase 1 (Parallel)**: Launch Streams A and B simultaneously
- Stream A: Video upload core functionality
- Stream B: Blocking modal components
- Wall time: ~5-6 hours (max of both streams)

**Phase 2 (Sequential)**: Execute Stream C
- Integrate A & B together
- Wall time: ~3-4 hours

**Phase 3 (Sequential)**: Execute Stream D
- E2E testing
- Wall time: ~3-4 hours

## Expected Timeline

**With parallel execution**:
- Wall time: 11-14 hours (6h + 4h + 4h)
- Total work: 15-19 hours
- Efficiency gain: ~26-35%

**Without parallel execution**:
- Wall time: 15-19 hours (sequential)

## Notes

**Critical Considerations**:
- Task 67 (Mux integration) must be completed before starting this work
- Capacitor Camera plugin must be configured and tested
- Issue #68 conflicts with this task - coordinate MediaUploader.tsx changes
- Consider completing #68 first to avoid merge conflicts

**Technical Recommendations**:
- Keep blocking modal component generic and reusable for future upload scenarios
- Use custom hook pattern for blocking upload state management
- Implement proper cleanup on component unmount (cancel ongoing uploads)
- Add comprehensive error messages for different failure scenarios
- Test memory usage with large video files

**Mobile Testing**:
- Ensure video formats work on both iOS and Android
- Test camera permission handling
- Verify gallery access on both platforms
- Consider network conditions (slow connections, interruptions)
