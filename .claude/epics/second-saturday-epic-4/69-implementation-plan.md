---
issue: 69
title: Build video upload UI with Mux and blocking progress
created: 2026-02-16T16:35:41Z
status: in-progress
approach: hybrid-extension
---

# Implementation Plan: Issue #69

## Context from Conflict Analysis

**Issue #68 Status**: Photo upload working with inline progress UI
**Conflict**: MediaUploader is photo-only, needs extension for video
**Strategy**: Hybrid approach - keep photo flow intact, add video with blocking modal

## Architecture Decision

**Chosen Approach**: Progressive Enhancement
- ✅ Keep existing photo upload flow unchanged (inline UI)
- ✅ Add video upload with blocking modal (new flow)
- ✅ Extract shared logic to reusable components
- ✅ Enable future unification without forcing it now

**Why**: Minimizes risk to working #68 code while delivering #69 requirements

## Implementation Phases

### Phase 1: Blocking Progress Modal (Stream B)
**Goal**: Create reusable blocking modal component for video uploads

**Tasks**:
- [ ] Create `src/components/ui/blocking-modal.tsx`
  - Full-screen overlay that prevents navigation
  - Portal-based to ensure proper z-index
  - Escape key disabled during upload
  - Cannot be dismissed while active

- [ ] Create or extend `src/components/ui/progress.tsx`
  - Progress bar with percentage
  - Smooth animation
  - Show current stage label

- [ ] Create `src/hooks/useBlockingUpload.ts`
  - Manage blocking state
  - Prevent navigation during upload
  - Handle upload lifecycle
  - AbortController for cancellation

**Deliverables**:
- BlockingProgressModal component (tested in isolation)
- Progress bar component
- useBlockingUpload hook

**Estimated Time**: 4-5 hours

### Phase 2: Video Upload Integration (Stream A)
**Goal**: Extend MediaUploader to support video selection and upload to Mux

**Tasks**:
- [ ] Add video file type detection to MediaUploader
  - Accept MP4, MOV formats
  - Validate MIME types: `video/mp4`, `video/quicktime`
  - Add file size guidance (suggest < 100MB for user experience)

- [ ] Add video selection UI
  - "Record Video" button (CameraSource.Camera, mediaType: video)
  - "Choose Video" button (CameraSource.Photos, mediaType: video)
  - Place alongside existing photo buttons

- [ ] Implement `uploadVideo` function
  - Call `uploadVideoToMux` Convex action (from #67)
  - Handle upload stages: selecting → uploading → processing
  - Use BlockingProgressModal for progress display
  - Store media record with `type: 'video'`

- [ ] Add video-specific error handling
  - File too large (suggest compression/shorter video)
  - Unsupported format
  - Mux upload failures
  - Network timeouts

**Deliverables**:
- MediaUploader supports both photo and video
- Video selection works on web
- Videos upload to Mux successfully

**Estimated Time**: 5-6 hours

**Dependencies**: Phase 1 (needs BlockingProgressModal)

### Phase 3: Video Processing & Thumbnails (Stream C)
**Goal**: Display video status and thumbnails after Mux processing

**Tasks**:
- [ ] Create `src/components/submissions/VideoThumbnail.tsx`
  - Display Mux video thumbnail
  - Show processing status (uploading → processing → ready)
  - Handle missing thumbnails gracefully

- [ ] Implement Mux status polling
  - Poll `api.videos.getVideo` after upload
  - Check for `playback_id` and `thumbnail_url`
  - Update UI when processing completes
  - Stop polling after max attempts or success

- [ ] Add video preview in MediaGrid (if exists)
  - Show video thumbnail in submission
  - Indicate it's a video (play icon overlay)
  - Link to playback URL when ready

**Deliverables**:
- Video thumbnails display after processing
- Processing status visible to user
- Videos appear in submission media grid

**Estimated Time**: 3-4 hours

**Dependencies**: Phase 2 (needs video upload working)

### Phase 4: E2E Testing (Stream D)
**Goal**: Comprehensive tests for video upload flow

**Tasks**:
- [ ] Create `test/components/submissions/MediaUploader.video.test.tsx`
  - Test video file selection
  - Test video upload flow
  - Test blocking modal behavior
  - Test error scenarios (invalid format, upload failure)
  - Test cancellation

- [ ] Create `test/e2e/video-upload.spec.ts`
  - Full video upload flow
  - Navigation prevention during upload
  - Upload completion and unlock
  - Thumbnail display after processing
  - Error recovery

- [ ] Mobile testing checklist
  - Test on iOS Safari (if possible)
  - Test on Android Chrome (if possible)
  - Document any platform-specific issues

**Deliverables**:
- Unit tests for video upload logic
- E2E tests for complete flow
- Test coverage report

**Estimated Time**: 3-4 hours

**Dependencies**: Phase 3 (needs complete implementation)

## File Changes Summary

### New Files
- `src/components/ui/blocking-modal.tsx`
- `src/components/ui/progress.tsx` (or extend existing)
- `src/hooks/useBlockingUpload.ts`
- `src/components/submissions/VideoThumbnail.tsx`
- `test/components/submissions/MediaUploader.video.test.tsx`
- `test/e2e/video-upload.spec.ts`

### Modified Files
- `src/components/submissions/MediaUploader.tsx` - Add video support
- `src/components/submissions/MediaGrid.tsx` (if exists) - Show videos
- Package dependencies (if needed)

## Risk Mitigation

**High Risk: Breaking Photo Upload**
- Mitigation: Keep photo code path unchanged
- Testing: Run existing #68 tests before and after
- Rollback: Video changes are additive, can be feature-flagged

**Medium Risk: Mux Integration Issues**
- Mitigation: Verify #67 (Mux integration) is complete first
- Testing: Test with real video files, not just mocks
- Fallback: Clear error messages if Mux fails

**Medium Risk: Mobile Compatibility**
- Mitigation: Test Capacitor Camera video support early
- Testing: Use iOS/Android simulators if devices unavailable
- Documentation: Note any platform limitations

## Success Criteria

- [ ] Video selection works (camera + gallery)
- [ ] Videos upload to Mux successfully
- [ ] Blocking UI prevents navigation during upload
- [ ] Progress bar shows accurate percentage
- [ ] Upload completion unlocks navigation
- [ ] Video thumbnails display after Mux processing
- [ ] Photo upload still works (no regression)
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Code ready for review

## Timeline

**Parallel Work (Phases 1 & 2 start together)**: ~6 hours wall time
**Sequential Work (Phases 3 & 4)**: ~7-8 hours wall time
**Total Wall Time**: ~13-14 hours
**Total Effort**: ~15-19 hours

## Next Steps

1. ✅ Issue started and plan created
2. Start Phase 1: Build BlockingProgressModal
3. Start Phase 2 in parallel: Extend MediaUploader for video
4. Merge Phase 1 & 2 outputs
5. Execute Phase 3: Thumbnails and polling
6. Execute Phase 4: Testing
7. Create PR for review
