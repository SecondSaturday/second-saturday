---
issue: 179
completed: 2026-02-25T02:50:00Z
status: completed
---

# Issue #179: Submission input rework

## Completed Changes

### MediaUploader Changes
- Added imports: `Plus` from lucide-react, `Button` from shadcn, `DropdownMenu` components from shadcn
- Made `responseId` prop optional to support on-demand response creation
- Added `onEnsureResponse` prop - callback to create response before upload starts
- Replaced 3-button layout (Take Photo, Choose Photo, Choose Video) with single "+" dropdown menu
- Called `onEnsureResponse` at start of `handlePhotoCapture` and `handleVideoSelect`

### PromptResponseCard Changes
- Made `responseId` prop optional
- Added `onEnsureResponse` prop
- Added `isFocused` state for character counter visibility
- Changed textarea placeholder from "Share your thoughts..." to "Add text or tap + for photos..."
- Reduced textarea min-height from 120px to 80px for compact layout
- Added padding (`pb-10 pr-16`) to textarea for embedded controls
- Moved MediaGrid above textarea (inside card, before textarea)
- Positioned "+" button (MediaUploader) at bottom-left of textarea (absolute positioning)
- Character counter now only visible when textarea is focused
- Removed conditional check that hid MediaUploader for temp IDs
- Removed "Start typing to enable photo & video uploads" message

### MultiCircleSubmissionScreen Changes
- Added `handleEnsureResponse` callback that creates submission/response on-demand
- Passes `onEnsureResponse` to PromptResponseCard
- Changed `responseId` prop to use `serverResponse?._id` (optional) instead of temp ID pattern

### Test Updates
- Updated `MediaUploader.test.tsx` to test dropdown menu instead of 3 buttons
- Updated `PromptResponseCard.test.tsx` for new placeholder text and focus-based counter visibility
- Added new test for `onEnsureResponse` callback
- All 912 tests pass

## Files Modified
- `src/components/submissions/MediaUploader.tsx`
- `src/components/submissions/PromptResponseCard.tsx`
- `src/screens/submissions/MultiCircleSubmissionScreen.tsx`
- `test/components/submissions/MediaUploader.test.tsx`
- `test/components/submissions/PromptResponseCard.test.tsx`

## Design Notes
- Text is now optional - users can submit media-only responses
- "+" button inside textarea at bottom-left opens dropdown menu
- Compact textarea with 80px min-height
- Character counter only visible on focus
- Media grid appears inside card, above textarea
- Uses existing design library (no custom dark bubble styling)
