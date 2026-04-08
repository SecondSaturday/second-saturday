# Media Upload Improvements — Design Spec

## Overview

Four stories to fix and improve the media upload pipeline in submissions. Ordered bottom-up: fix foundations first, then add features, then harden.

**Platform**: Capacitor native app (iOS App Store). Not web/PWA.

## Current State

- Images: upload via `@capacitor/camera` (photo capture + gallery). Compressed to <200KB, stored in Convex storage.
- Videos: upload code exists (`uploadVideo`, Mux integration, webhooks) but **no UI button triggers it**. Hidden `<input type="file">` is unreachable.
- Gallery picker (`Camera.getPhoto()`) only shows images — Capacitor Camera limitation.
- Multi-select: not supported. One file at a time.
- Retry button: resets UI state but doesn't re-attempt the upload.
- Max 3 media items per response (enforced in `addMediaToResponse`).
- Media table already has `thumbnailUrl: v.optional(v.string())` field.
- `addMediaToResponse` accepts `videoId` but current `uploadVideo()` does not pass it.

## Stories

### Story 1: Fix broken retry + error handling

**Problem**: "Retry" button calls `resetUpload()` — clears error and resets state but doesn't re-attempt. User must start over.

**Solution**:
- Store the last failed `File` in a ref (`lastFailedFileRef`)
- Store the media type (`'photo' | 'video'`) of the failed upload
- On retry click:
  - If file ref exists, call `uploadPhoto(file)` or `uploadVideo(file)` again
  - If file ref is null (failure was during selection), fall back to reset
- If `addMediaToResponse` fails after blob is already uploaded, store the `storageId` and reuse on retry instead of re-uploading
- Guard against duplicate media records on retry: check for existing media with same `storageId` before inserting

**Note**: The file ref is lost if the component unmounts (e.g., navigating away). This is acceptable — retry is only available while the error is visible on screen.

**Files**:
- `src/components/submissions/MediaUploader.tsx`

**Acceptance criteria**:
- Clicking "Retry" after a network error during upload re-attempts the upload without re-selecting the file
- Clicking "Retry" after a selection-phase error resets to the picker
- If the Convex mutation fails but the blob uploaded, retry reuses the blob
- No duplicate media records created on retry

---

### Story 2: Unified gallery with multi-select

**Problem**: Gallery only shows images. No video selection from gallery. No multi-select. Video upload UI is unreachable.

**Solution**:
- Install `@capawesome/capacitor-file-picker`
- Replace "Choose photo" gallery button with unified "Gallery" button
- Gallery opens iOS photo library filtered to `["image/*", "video/*"]` with `multiple: true`
- **PickedFile conversion**: The FilePicker plugin returns `PickedFile` objects (with `path`, `name`, `mimeType`), not web `File` objects. On iOS, read the file from the returned `path` URI using Capacitor Filesystem or fetch the URI to get a `Blob`, then construct a `File` object for the existing upload functions.
- For each selected file:
  - Images → `uploadPhoto()` (compress + Convex storage)
  - Videos → `uploadVideo()` (validate + Mux). Must pass `videoId` from `uploadVideoToMux` to `addMediaToResponse` for proper Mux linkage.
- Sequential uploads (not parallel) to avoid overwhelming connection and respect 3-media limit
- Show progress: "Uploading 2 of 3..." in inline status area
- Remove hidden `<input type="file" accept="video/*">` and `handleVideoSelect` — no longer needed
- **Max-3 enforcement**: If user selects more files than remaining slots, reject the entire selection with an error message (e.g., "You can only add 2 more items"). Do not partially upload.
- Keep Camera button as-is (`@capacitor/camera`, photo capture only)
- **Batch cancellation**: If an upload fails mid-batch, stop remaining uploads and show error. User can retry the failed file (Story 1 retry logic applies).

**UI**: Menu stays 2 buttons — Camera (photo capture) and Gallery (photos + videos, multi-select). Same layout, different gallery behavior.

**Files**:
- `package.json` — add `@capawesome/capacitor-file-picker`
- `src/components/submissions/MediaUploader.tsx` — replace gallery handler, remove video input, add sequential multi-upload
- Capacitor sync handles native side (`npx cap sync`)

**Acceptance criteria**:
- Gallery button opens iOS photo library showing both photos and videos
- User can select multiple files in one picker session
- Each file uploads correctly (images compressed, videos to Mux with `videoId` linkage)
- Uploads are sequential with "Uploading X of Y" progress
- Entire selection rejected if it exceeds remaining media slots
- Mid-batch failure stops remaining uploads and shows error with retry
- Camera button still works for photo capture only

---

### Story 3: Video thumbnail/preview

**Problem**: After video upload, thumbnail in MediaGrid is blank until Mux webhook fires (seconds to minutes). Images show previews immediately.

**Solution**:
- After user selects a video file, extract a thumbnail client-side before uploading:
  - Create hidden `<video>` element with `src = URL.createObjectURL(file)`
  - Wait for `loadeddata`, seek to 0.5s, draw frame to `<canvas>` (max 640px wide)
  - Export canvas as JPEG blob
  - **Fallback**: If frame extraction fails (e.g., HEVC codec issues in WKWebView), use a static video placeholder icon instead of a blank thumbnail
- Upload thumbnail blob to Convex storage, resolve to URL
- Pass the resolved `thumbnailUrl` (string) to `addMediaToResponse` — uses the **existing** `thumbnailUrl` field in the media table (no schema change needed)
- When Mux webhook fires later with its own thumbnail URL, it overwrites the client-generated one
- Existing `MediaGrid` logic (`media.thumbnailUrl ?? media.url`) handles display — thumbnail URL is now populated immediately

**No schema change required** — the `thumbnailUrl: v.optional(v.string())` field already exists.

**Files**:
- `src/components/submissions/MediaUploader.tsx` — frame extraction utility, upload thumbnail, pass URL to mutation
- `convex/submissions.ts` — accept `thumbnailUrl` in `addMediaToResponse` if not already supported

**Acceptance criteria**:
- Video thumbnail appears in MediaGrid immediately after upload (before Mux processing)
- Thumbnail is a frame from the video (max 640px wide), or a placeholder if extraction fails
- Mux-generated thumbnail overwrites client-generated one via webhook
- No schema migration required

---

### Story 4: Mux CORS lockdown + orphaned storage cleanup

**Problem**: Two backend hygiene issues:
1. Mux direct upload CORS set to `"*"` — anyone can upload
2. Failed mutations after successful uploads leave orphaned blobs forever

**Solution**:

**CORS lockdown**:
- Replace `"*"` with allowed origins from env var `MUX_CORS_ORIGINS`
- Must include: production URL, `localhost:3000` (dev), and `capacitor://localhost` (iOS native WebView origin)

**Orphaned storage cleanup**:
- Convex cron job running daily
- Scans **all storage reference fields** to build the in-use set:
  - `media.storageId` (image blobs)
  - `circles.iconImageId`, `circles.coverImageId` (circle images)
  - `users.avatarStorageId` (if exists)
  - Any other `_storage` references
- Deletes `_storage` blobs not in the in-use set and older than 24 hours
- For Mux: scans `videos` table for records with no matching `media` entry older than 24 hours, calls `deleteMuxAsset`
- 24-hour grace period prevents deleting mid-upload blobs
- **Batching**: Process deletions in batches of 100 to stay within Convex function execution limits. If more remain, schedule a follow-up run.

**Files**:
- `convex/videoActions.ts` — CORS env var
- `convex/crons.ts` (new or existing) — scheduled cleanup
- `convex/cleanup.ts` (new) — cleanup mutation logic

**Acceptance criteria**:
- Mux uploads only accept requests from allowed origins (including `capacitor://localhost`)
- Orphaned Convex storage blobs older than 24h are cleaned up daily
- Orphaned Mux assets older than 24h are cleaned up daily
- Active uploads are not affected (grace period)
- Cleanup handles large datasets via batching

## Dependencies

- Story 2 depends on Story 1 (retry must work before reworking upload flow)
- Story 3 is independent (can run in parallel with Story 2 if needed)
- Story 4 is independent (backend-only, no UI changes)

## Out of Scope

- Camera video recording — Capacitor Camera plugin does not support it; would require `@capacitor-community/camera-preview` or similar. Can be added later.
- Drag-and-drop — not relevant for native app
- Media reordering UI
- Image cropping in submissions
- Parallel uploads — sequential is simpler and sufficient for max 3 files
