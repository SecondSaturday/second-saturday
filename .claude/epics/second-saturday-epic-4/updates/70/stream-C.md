---
issue: 70
stream: PostHog Analytics
agent: frontend-specialist
started: 2026-02-18T10:15:15Z
status: completed
---

# Stream C: PostHog Analytics

## Scope
Wire the required PostHog analytics events into MultiCircleSubmissionScreen.

## Files
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx`

## Completed
- Updated `MediaUploader.onUploadComplete` to pass `'image' | 'video'` type alongside mediaId
- Updated `PromptResponseCard.onMediaUpload` to thread type through `handleMediaUploadComplete`
- Added `trackEvent` import from `@/lib/analytics` to `MultiCircleSubmissionScreen`
- `submission_started` fires on `activeCircleId` change (fire-and-forget)
- `submission_photo_added` / `submission_video_added` fire in `handleMediaUpload` callback
- `submission_saved_draft` fires after each successful auto-save with prompts_answered/total_prompts
- `submission_completed` fires when all prompts are answered on successful save
- All analytics calls wrapped in try/catch to avoid breaking UI on analytics failure
