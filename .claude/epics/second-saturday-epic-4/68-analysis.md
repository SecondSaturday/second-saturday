---
issue: 68
title: Build photo upload with Capacitor Camera and compression
analyzed: 2026-02-12T05:23:08Z
estimated_hours: 12
parallelization_factor: 1.3
---

# Parallel Work Analysis: Issue #68

## Overview
Implement photo upload functionality using Capacitor Camera for native mobile camera/gallery access, with client-side compression before uploading to Convex storage. Primary work focuses on a single component (`MediaUploader.tsx`) with supporting configuration and testing.

## Parallel Streams

### Stream A: Configuration & Dependencies
**Scope**: Set up Capacitor Camera plugin, configure permissions, install dependencies
**Files**:
- `package.json`
- `capacitor.config.ts`
- `ios/App/Info.plist` (camera permissions)
- `android/app/src/main/AndroidManifest.xml` (camera permissions)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Tasks**:
1. Install @capacitor/camera (^8.0.0) and browser-image-compression (^2.0.2)
2. Add iOS camera permissions to Info.plist (NSCameraUsageDescription, NSPhotoLibraryUsageDescription)
3. Add Android camera permissions to AndroidManifest.xml (CAMERA, READ_EXTERNAL_STORAGE)
4. Verify Capacitor config includes camera plugin
5. Run `npx cap sync` to sync native projects

### Stream B: Component Implementation
**Scope**: Build MediaUploader component with camera integration, compression, and upload logic
**Files**:
- `src/components/submissions/MediaUploader.tsx` (primary)
- `src/utils/imageCompression.ts` (optional utility)
- `src/hooks/useMediaUpload.ts` (optional hook)
**Agent Type**: frontend-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 7
**Dependencies**: Stream A

**Tasks**:
1. Create MediaUploader component structure
2. Integrate Capacitor Camera API (Camera.getPhoto())
3. Implement photo source selection (camera vs gallery)
4. Add client-side compression (maxSizeMB: 0.2, maxWidthOrHeight: 1200)
5. Integrate Convex upload (generateUploadUrl)
6. Store storageId in media table (linked to responseId)
7. Add upload progress indicator
8. Implement error handling (permissions, compression failures, upload failures)
9. Add cancel upload functionality
10. Support JPEG and PNG formats

### Stream C: Testing
**Scope**: Write unit tests for compression logic and E2E tests for upload flow
**Files**:
- `src/components/submissions/MediaUploader.test.tsx`
- `src/utils/imageCompression.test.ts`
- `e2e/photo-upload.spec.ts`
**Agent Type**: fullstack-specialist
**Can Start**: when Stream B is 70% complete (compression logic available)
**Estimated Hours**: 4
**Dependencies**: Stream B (partial)

**Tasks**:
1. Unit tests for compression logic (verify size reduction, format preservation)
2. Unit tests for MediaUploader component (UI interactions, error states)
3. E2E tests for photo upload flow (select, compress, upload, verify storage)
4. Device testing documentation (iOS/Android test checklist)

## Coordination Points

### Shared Files
- `package.json` - Stream A modifies (add dependencies), Stream B may reference
- `src/components/submissions/MediaUploader.tsx` - Stream B creates, Stream C tests

### Sequential Requirements
1. Dependencies installed (Stream A) before component implementation (Stream B)
2. Camera permissions configured (Stream A) before device testing (Stream C)
3. Compression logic implemented (Stream B) before compression tests (Stream C)
4. Upload logic implemented (Stream B) before E2E tests (Stream C)

## Conflict Risk Assessment
- **Low Risk**: Minimal file overlap between streams
- **Stream A → B**: Sequential dependency (A must complete first)
- **Stream B → C**: Partial overlap possible (testing can start when core logic is ready)

## Parallelization Strategy

**Recommended Approach**: hybrid

**Phase 1** (2 hours):
- Stream A: Configuration & Dependencies (solo)

**Phase 2** (7 hours):
- Stream B: Component Implementation (solo)
- Stream C: Can start unit tests when compression logic is ready (~5 hours into Stream B)

**Phase 3** (2 hours):
- Stream C: Complete E2E tests and device testing (after Stream B completes)

**Overlap Opportunity**:
- Stream C can begin writing unit tests for compression once Stream B has implemented the compression utility (~5 hours into implementation), saving ~2 hours of wall time

## Expected Timeline

**With parallel execution**:
- Wall time: ~10 hours (2h config + 7h implementation + 1h testing overlap)
- Total work: 13 hours
- Efficiency gain: 23%

**Without parallel execution**:
- Wall time: 13 hours (sequential: A → B → C)

## Notes

### Technical Considerations
- **Mobile Testing Required**: This task requires testing on actual iOS/Android devices (not just web)
- **Permission Handling**: Capacitor Camera requires runtime permissions on mobile (handle rejection gracefully)
- **Network Conditions**: Test upload progress under varying network speeds
- **File Size Validation**: Ensure compression achieves <200KB target consistently

### Blocked By
- Task #66 (Backend schema) must be completed - media table must exist
- Convex storage must be configured and accessible

### Conflicts With
- Task #69 (video upload) - both modify MediaUploader.tsx (coordinate or do sequentially)

### Platform-Specific Work
- iOS testing requires Mac + Xcode
- Android testing requires Android Studio + emulator or physical device
- Web testing (camera API fallback) should also work

### Success Metrics
- Upload completes in <5 seconds on typical mobile connection
- Compression reduces file sizes to <200KB (target 1200px max width)
- Works on iOS, Android, and web
- All acceptance criteria met
