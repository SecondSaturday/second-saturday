# Media Upload Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken media upload pipeline — working retry, unified gallery with video + multi-select, instant video thumbnails, and backend hardening.

**Architecture:** Four stories executed bottom-up. Story 1 fixes retry foundations. Story 2 replaces the Capacitor Camera gallery with `@capawesome/capacitor-file-picker` for unified photo+video multi-select. Story 3 adds client-side video thumbnail extraction. Story 4 locks down Mux CORS and adds orphaned storage cleanup.

**Tech Stack:** React, Convex (backend), Capacitor (iOS native), `@capawesome/capacitor-file-picker`, Mux (video processing)

**Spec:** `docs/superpowers/specs/2026-04-07-media-upload-improvements-design.md`

---

## Task 1: Fix broken retry + error handling

**Files:**
- Modify: `src/components/submissions/MediaUploader.tsx:54-99` (add refs, update retry logic)
- Modify: `convex/submissions.ts:370-430` (add duplicate guard in `addMediaToResponse`)

### Steps

- [ ] **Step 1: Add refs to store failed upload context**

In `MediaUploader.tsx`, after the existing `abortControllerRef` (line 54), add:

```tsx
const lastFailedFileRef = useRef<File | null>(null)
const lastFailedMediaTypeRef = useRef<MediaType | null>(null)
const lastStorageIdRef = useRef<Id<'_storage'> | null>(null)
```

- [ ] **Step 2: Store the file before upload attempts**

In `uploadPhoto()` (line 161), at the top of the function before the try block, add:

```tsx
lastFailedFileRef.current = file
lastFailedMediaTypeRef.current = 'photo'
```

In `uploadVideo()` (line 307), at the top of the function before the try block, add:

```tsx
lastFailedFileRef.current = file
lastFailedMediaTypeRef.current = 'video'
```

- [ ] **Step 3: Store storageId after successful blob upload**

In `uploadPhoto()`, after the `storageId` is received from the upload response (around line 217), add:

```tsx
lastStorageIdRef.current = storageId
```

- [ ] **Step 4: Clear refs on successful completion**

In `uploadPhoto()`, after `onUploadComplete` is called (around line 236), add:

```tsx
lastFailedFileRef.current = null
lastFailedMediaTypeRef.current = null
lastStorageIdRef.current = null
```

In `uploadVideo()`, after `onUploadComplete` is called (around line 394), add the same three lines.

Also add these three lines to `resetUpload()` (line 79).

- [ ] **Step 5: Update uploadPhoto to accept optional storageId for retry**

Change `uploadPhoto` signature from:

```tsx
const uploadPhoto = async (file: File) => {
```

to:

```tsx
const uploadPhoto = async (file: File, existingStorageId?: Id<'_storage'>) => {
```

Inside the function, if `existingStorageId` is provided, skip the compress+upload steps and jump straight to calling `addMediaToResponse` with the existing `storageId`:

```tsx
// If retrying with an already-uploaded blob, skip compression and upload
let storageId: Id<'_storage'>
if (existingStorageId) {
  storageId = existingStorageId
  setStage('uploading')
  setProgress(80)
} else {
  // ... existing compress + upload logic ...
  // storageId = ... (from response.json())
  lastStorageIdRef.current = storageId
}
```

- [ ] **Step 6: Add duplicate media guard in addMediaToResponse**

In `convex/submissions.ts`, inside the `addMediaToResponse` handler, after the media count check (line 408) and before the insert, add a duplicate guard:

```tsx
// Guard against duplicate media on retry
if (args.storageId) {
  const existing = existingMedia.find((m) => m.storageId === args.storageId)
  if (existing) return existing._id
}
```

This prevents duplicate records if the mutation succeeded on the server but the client got a network error and retries.

- [ ] **Step 7: Make uploadPhoto and uploadVideo return success/failure**

Change both functions to return a boolean so callers (batch upload in Task 2) can detect failures:

```tsx
// uploadPhoto signature:
const uploadPhoto = async (file: File, existingStorageId?: Id<'_storage'>): Promise<boolean> => {
  // ... existing logic ...
  // At end of try block, after onUploadComplete:
  return true
  // In catch blocks, after handleError:
  return false
}

// uploadVideo signature:
const uploadVideo = async (file: File): Promise<boolean> => {
  // ... existing logic ...
  // At end of try block, after onUploadComplete:
  return true
  // In catch blocks, after handleError:
  return false
}
```

- [ ] **Step 8: Replace the retry button handler**

Replace the retry button's `onClick` (line 585):

```tsx
// Before:
onClick={resetUpload}

// After:
onClick={() => {
  const file = lastFailedFileRef.current
  const type = lastFailedMediaTypeRef.current
  setError(null)
  setStage('idle')

  if (!file || !type) {
    // No file saved — reset to picker
    resetUpload()
    return
  }

  if (type === 'photo') {
    uploadPhoto(file, lastStorageIdRef.current ?? undefined)
  } else {
    uploadVideo(file)
  }
}}
```

**Note:** The file ref is lost if the component unmounts (e.g., navigating away). This is acceptable — retry is only available while the error is visible on screen.

- [ ] **Step 9: Test manually**

1. Start dev server: `npm run dev`
2. Navigate to a circle → submit → attach a photo
3. Simulate a failure: temporarily throw in `addMediaToResponse` or disconnect network during upload
4. Verify "Retry" re-attempts the upload without re-opening the picker
5. Verify "Retry" after a selection-phase error resets to idle
6. Verify retrying a mutation failure (blob already uploaded) skips re-upload and reuses the blob

- [ ] **Step 10: Commit**

```bash
git add src/components/submissions/MediaUploader.tsx convex/submissions.ts
git commit -m "fix: retry button re-attempts upload instead of just resetting"
```

---

## Task 2: Unified gallery with `@capawesome/capacitor-file-picker`

**Files:**
- Modify: `package.json` — add dependency
- Modify: `src/components/submissions/MediaUploader.tsx` — replace gallery handler, remove video input, add multi-upload logic

### Steps

- [ ] **Step 1: Install the file picker plugin**

```bash
npm install @capawesome/capacitor-file-picker
npx cap sync
```

- [ ] **Step 2: Add the gallery handler function**

In `MediaUploader.tsx`, add a new import at the top:

```tsx
import { FilePicker } from '@capawesome/capacitor-file-picker'
```

Add a new function after `handlePhotoCapture`:

```tsx
const handleGalleryPick = async () => {
  if (!canUploadMore) {
    handleError(`Maximum ${maxMedia} media items allowed per response`)
    return
  }

  try {
    await onEnsureResponse?.()

    const result = await FilePicker.pickMedia({
      multiple: true,
      readData: false,
    })

    if (!result.files || result.files.length === 0) return

    // Reject entire selection if it exceeds remaining slots
    const remainingSlots = maxMedia - currentMediaCount
    if (result.files.length > remainingSlots) {
      handleError(`You can only add ${remainingSlots} more item${remainingSlots === 1 ? '' : 's'}`)
      return
    }

    // Process files sequentially — stop on first failure
    const totalFiles = result.files.length
    for (let i = 0; i < totalFiles; i++) {
      const picked = result.files[i]!
      if (!picked.path) continue

      // Update progress display
      setProgress(0)
      setBatchStatus({ current: i + 1, total: totalFiles })

      // Convert PickedFile to File object
      // On iOS Capacitor, picked.path is a local file URI
      const response = await fetch(picked.path)
      const blob = await response.blob()
      const file = new File([blob], picked.name || `media-${Date.now()}`, {
        type: picked.mimeType || 'application/octet-stream',
      })

      let success: boolean
      if (picked.mimeType?.startsWith('video/')) {
        setMediaType('video')
        success = await uploadVideo(file)
      } else {
        setMediaType('photo')
        success = await uploadPhoto(file)
      }

      // Stop batch on failure — user can retry the failed file via retry button
      if (!success) {
        setBatchStatus(null)
        return
      }
    }

    setBatchStatus(null)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg?.includes('cancel') || msg?.includes('Cancel')) {
      resetUpload()
      return
    }
    handleError('Failed to pick media', err)
    setBatchStatus(null)
  }
}
```

- [ ] **Step 3: Add batch status state**

After the existing state declarations (around line 53), add:

```tsx
const [batchStatus, setBatchStatus] = useState<{ current: number; total: number } | null>(null)
```

Also add to `resetUpload()`:

```tsx
setBatchStatus(null)
```

- [ ] **Step 4: Update the uploading indicator to show batch progress**

Replace the uploading indicator text (around line 562) to include batch info:

```tsx
<span className="text-xs text-muted-foreground">
  {batchStatus && batchStatus.total > 1 && `(${batchStatus.current}/${batchStatus.total}) `}
  {stage === 'selecting' && 'Selecting...'}
  {stage === 'compressing' && 'Compressing...'}
  {stage === 'uploading' && 'Uploading...'}
  {stage === 'processing' && 'Processing...'}
</span>
```

- [ ] **Step 5: Replace the gallery button handler**

Change the "Choose photo" button's `onClick` (around line 475-477):

```tsx
// Before:
onClick={() => {
  setMenuOpen(false)
  handlePhotoCapture(CameraSource.Photos)
}}

// After:
onClick={() => {
  setMenuOpen(false)
  handleGalleryPick()
}}
```

Update the icon import — replace `Image as ImageIcon` with a more appropriate icon:

```tsx
import { Camera as CameraIcon, ImagePlus as GalleryIcon, X, Loader2, Plus } from 'lucide-react'
```

Update the gallery button to use `GalleryIcon` instead of `ImageIcon` and change the aria-label:

```tsx
<GalleryIcon className="size-6 text-primary" />
// aria-label="Choose from gallery"
```

- [ ] **Step 6: Remove the hidden video input and dead code**

Delete the hidden `<input>` element (around line 550-556):

```tsx
// DELETE THIS:
<input
  ref={videoInputRef}
  type="file"
  accept="video/mp4,video/quicktime,video/x-m4v"
  className="hidden"
  onChange={handleVideoFileChange}
/>
```

Also remove:
- `videoInputRef` declaration
- `handleVideoSelect` function
- `handleVideoFileChange` function
- `CameraSource.Photos` from the `@capacitor/camera` import (only `CameraSource.Camera` remains for the camera button). Keep `CameraSource` import only if `CameraSource.Camera` is still used.

- [ ] **Step 7: Fix videoId linkage in uploadVideo**

In `uploadVideo()`, update the `addMediaToResponse` call (around line 384) to pass `videoId`:

```tsx
// Before:
const mediaId = await addMediaToResponse({
  responseId: responseId!,
  type: 'video',
})

// After:
const mediaId = await addMediaToResponse({
  responseId: responseId!,
  type: 'video',
  videoId: videoIdRef.current ?? undefined,
})
```

- [ ] **Step 8: Test manually**

1. On iOS simulator or device: `npx cap run ios`
2. Camera button → should open camera for photo capture (existing behavior)
3. Gallery button → should open iOS photo library showing BOTH photos and videos
4. Select 2 photos and 1 video → should upload sequentially with "(1/3)", "(2/3)", "(3/3)" progress
5. Try selecting 4 files when only 2 slots remain → should show error before uploading
6. Simulate failure on file 2 of 3 → should stop, show error with retry for file 2, file 3 never starts
7. Verify the old video file input and handlers are gone

**Note on batch retry limitation:** When a batch upload fails mid-way, retry only re-attempts the failed file. Files that hadn't started yet are lost and the user would need to pick them again. This is acceptable for max-3 items.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/components/submissions/MediaUploader.tsx
git commit -m "feat: unified gallery picker with photo+video multi-select"
```

---

## Task 3: Video thumbnail/preview

**Files:**
- Create: `src/lib/video.ts` — thumbnail extraction utility
- Modify: `src/components/submissions/MediaUploader.tsx` — call thumbnail extraction before video upload
- Modify: `convex/submissions.ts:370-430` — add `thumbnailStorageId` arg, resolve URL server-side

### Steps

- [ ] **Step 1: Create the thumbnail extraction utility**

Create `src/lib/video.ts`:

```tsx
/**
 * Extract a thumbnail frame from a video file.
 * Creates a hidden <video> element, seeks to 0.5s, draws to canvas (max 640px wide), exports as JPEG.
 * Returns null if extraction fails (e.g., unsupported codec in WKWebView).
 */
export async function extractVideoThumbnail(
  file: File,
  maxWidth = 640
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    // Timeout: if we can't extract in 5s, give up
    const timeout = setTimeout(() => {
      cleanup()
      resolve(null)
    }, 5000)

    const cleanup = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      video.remove()
    }

    video.addEventListener('error', () => {
      cleanup()
      resolve(null)
    })

    video.addEventListener('loadeddata', () => {
      // Seek to 0.5s for a meaningful frame (not a black intro)
      video.currentTime = Math.min(0.5, video.duration || 0)
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve(null)
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            cleanup()
            resolve(blob)
          },
          'image/jpeg',
          0.7
        )
      } catch {
        cleanup()
        resolve(null)
      }
    })

    // Load the video
    video.load()
  })
}
```

- [ ] **Step 2: Add thumbnailStorageId to addMediaToResponse**

In `convex/submissions.ts`, update `addMediaToResponse`:

Add to args (after line 377):

```tsx
thumbnailStorageId: v.optional(v.id('_storage')),
```

In the handler, before the `ctx.db.insert` call (before line 416), resolve the thumbnail URL server-side:

```tsx
// Resolve thumbnail URL from storage ID if provided
let resolvedThumbnailUrl = args.thumbnailUrl
if (!resolvedThumbnailUrl && args.thumbnailStorageId) {
  resolvedThumbnailUrl = (await ctx.storage.getUrl(args.thumbnailStorageId)) ?? undefined
}
```

Then update the insert to use `resolvedThumbnailUrl`:

```tsx
thumbnailUrl: resolvedThumbnailUrl,
```

- [ ] **Step 3: Integrate thumbnail extraction into uploadVideo**

In `MediaUploader.tsx`, add the import:

```tsx
import { extractVideoThumbnail } from '@/lib/video'
```

In `uploadVideo()`, after the Mux upload succeeds and before calling `addMediaToResponse` (around line 380), add thumbnail extraction and upload:

```tsx
// Extract and upload thumbnail (best-effort)
let thumbnailStorageId: Id<'_storage'> | undefined
try {
  const thumbnailBlob = await extractVideoThumbnail(file)
  if (thumbnailBlob) {
    const thumbUploadUrl = await generateUploadUrl()
    const thumbResponse = await fetch(thumbUploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: thumbnailBlob,
    })
    if (thumbResponse.ok) {
      const result = await thumbResponse.json()
      thumbnailStorageId = result.storageId
    }
  }
} catch {
  // Thumbnail extraction is best-effort — continue without it
}

videoUpload.setProgress(85)
setProgress(85)
```

Then update the `addMediaToResponse` call to pass the thumbnail storage ID:

```tsx
const mediaId = await addMediaToResponse({
  responseId: responseId!,
  type: 'video',
  videoId: videoIdRef.current ?? undefined,
  thumbnailStorageId,
})
```

- [ ] **Step 4: Test manually**

1. Upload a video via the gallery picker
2. Check MediaGrid immediately — thumbnail should appear (a frame from the video, max 640px wide)
3. Wait for Mux webhook — thumbnail should update to Mux-generated one
4. Test with a video that might fail extraction (if possible) — should show blank thumbnail (no crash), same as current behavior

- [ ] **Step 5: Commit**

```bash
git add src/lib/video.ts src/components/submissions/MediaUploader.tsx convex/submissions.ts
git commit -m "feat: instant video thumbnails via client-side frame extraction"
```

---

## Task 4: Mux CORS lockdown + orphaned storage cleanup

**Files:**
- Modify: `convex/videoActions.ts:44` — use env var for CORS
- Create: `convex/cleanup.ts` — cleanup mutations
- Modify: `convex/crons.ts` — add daily cleanup cron

### Steps

- [ ] **Step 1: Lock down Mux CORS**

In `convex/videoActions.ts`, line 44, replace:

```tsx
// Before:
cors_origin: process.env.SITE_URL || '*',

// After:
cors_origin: process.env.MUX_CORS_ORIGIN || 'capacitor://localhost',
```

**Environment variable setup** (per-environment, since Mux accepts a single origin string):
- **Dev (iOS simulator):** `MUX_CORS_ORIGIN=capacitor://localhost`
- **Dev (browser testing):** `MUX_CORS_ORIGIN=http://localhost:3000`
- **Prod:** `MUX_CORS_ORIGIN=https://yourdomain.com`

Set in Convex dashboard → Settings → Environment Variables.

- [ ] **Step 2: Create the cleanup module**

Create `convex/cleanup.ts`:

```tsx
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours
const BATCH_SIZE = 100

/**
 * Clean up orphaned media records whose parent response no longer exists.
 * Deletes the media record and its associated storage blob.
 *
 * Limitation: Convex does not expose a direct _storage query API, so we cannot
 * find storage blobs that were uploaded but never linked to any record. This
 * cleanup only handles media records orphaned by deleted responses.
 * Unlinked blobs would require a separate approach (e.g., tracking uploads in
 * a dedicated table).
 */
export const cleanupOrphanedStorage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS

    const allMedia = await ctx.db.query('media').collect()
    const orphanedMedia = allMedia.filter(
      (m) => m.storageId && m.createdAt < cutoff
    )

    let deletedCount = 0
    for (const m of orphanedMedia.slice(0, BATCH_SIZE)) {
      const response = await ctx.db.get(m.responseId)
      if (!response) {
        // Response was deleted — clean up storage blob and media record
        if (m.storageId) {
          await ctx.storage.delete(m.storageId)
        }
        await ctx.db.delete(m._id)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})

/**
 * Clean up orphaned Mux video records with no matching media entry.
 * Schedules Mux asset deletion via the deleteMuxAsset internal action.
 */
export const cleanupOrphanedVideos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - GRACE_PERIOD_MS

    const allVideos = await ctx.db.query('videos').collect()
    let deletedCount = 0

    for (const video of allVideos.slice(0, BATCH_SIZE)) {
      if (video.createdAt > cutoff) continue // Within grace period

      // Check if any media record references this video
      const mediaRef = await ctx.db
        .query('media')
        .withIndex('by_video', (q) => q.eq('videoId', video._id))
        .first()

      if (!mediaRef) {
        // Schedule Mux asset deletion (same pattern as removeMediaFromResponse)
        if (video.assetId) {
          await ctx.scheduler.runAfter(0, internal.videoActions.deleteMuxAsset, {
            assetId: video.assetId,
          })
        }
        await ctx.db.delete(video._id)
        deletedCount++
      }
    }

    return { deletedCount }
  },
})
```

- [ ] **Step 3: Add cron jobs**

In `convex/crons.ts`, add after the existing cron entries (before `export default crons`):

```tsx
crons.daily(
  'cleanup orphaned storage',
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.cleanupOrphanedStorage
)

crons.daily(
  'cleanup orphaned videos',
  { hourUTC: 3, minuteUTC: 30 },
  internal.cleanup.cleanupOrphanedVideos
)
```

- [ ] **Step 4: Set environment variable**

In your Convex dashboard, set:
- `MUX_CORS_ORIGIN` = `capacitor://localhost` (for dev/iOS simulator)

- [ ] **Step 5: Test manually**

1. Deploy to dev: `npx convex dev`
2. Verify video upload still works (CORS should allow `capacitor://localhost`)
3. Check Convex dashboard → Functions → crons — verify the two new crons appear
4. Optionally trigger cleanup manually via Convex dashboard to verify it runs without errors

- [ ] **Step 6: Commit**

```bash
git add convex/videoActions.ts convex/cleanup.ts convex/crons.ts
git commit -m "feat: lock down Mux CORS and add orphaned storage cleanup cron"
```

---

## Summary

| Task | Story | Key Change | Dependencies |
|------|-------|------------|--------------|
| 1 | Fix retry | Store failed file in ref, re-attempt on retry click, duplicate guard | None |
| 2 | Unified gallery | `@capawesome/capacitor-file-picker`, multi-select, sequential upload with batch stop on failure | Task 1 |
| 3 | Video thumbnails | Client-side frame extraction, `thumbnailStorageId` resolved server-side | None (can parallel with Task 2) |
| 4 | Backend hardening | CORS env var (per-environment), daily orphan cleanup crons with `deleteMuxAsset` scheduling | None |
