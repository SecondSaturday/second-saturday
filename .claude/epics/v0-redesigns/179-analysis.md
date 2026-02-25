---
issue: 179
title: Submission input rework
analyzed: 2026-02-25T02:35:00Z
estimated_hours: 1.5
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #179

## Overview
Rework the submission input: make text optional (media-only responses allowed), replace 3 stacked buttons with a single "+" dropdown menu inside the textarea, make the textarea compact, and move media grid above the textarea. Keep existing design library — no custom dark styling.

## Design (Approved)

**New Layout:**
```
┌─────────────────────────────┐
│ Prompt Text                 │
├─────────────────────────────┤
│ [Media Grid if any]         │
│                             │
│ ┌─────────────────────────┐ │
│ │ Add text or tap +...    │ │
│ │                         │ │
│ │ [+]           {counter} │ │  ← counter only on focus
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Key Changes:**
- Text is optional — media-only responses are valid
- "+" button inside textarea at bottom-left, opens dropdown menu
- Compact textarea (~80px initial height)
- Character counter visible only on focus
- Media grid inside card, above textarea
- On-demand response creation when upload starts

## Single Stream (Sequential)

### Stream A: Complete Rework
**Scope**: All changes in sequence — tightly coupled, not worth parallelizing
**Files**:
- `src/components/submissions/PromptResponseCard.tsx`
- `src/components/submissions/MediaUploader.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

## Implementation Checklist

### 1. MediaUploader: "+" Dropdown Button
1. Add imports: `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` from shadcn
2. Add import: `Plus` from lucide-react
3. Replace 3-button layout (lines 438-487) with:
   ```tsx
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <Button variant="ghost" size="icon" className="size-8" disabled={!canUploadMore}>
         <Plus className="size-4" />
       </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="start">
       <DropdownMenuItem onClick={() => handlePhotoCapture(CameraSource.Camera)}>
         <CameraIcon className="mr-2 size-4" /> Take Photo
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => handlePhotoCapture(CameraSource.Photos)}>
         <ImageIcon className="mr-2 size-4" /> Choose Photo
       </DropdownMenuItem>
       <DropdownMenuItem onClick={handleVideoSelect}>
         <VideoIcon className="mr-2 size-4" /> Choose Video
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
   ```
4. Keep hidden video input
5. Add `onEnsureResponse?: () => Promise<void>` prop
6. Call `onEnsureResponse?.()` at start of `handlePhotoCapture` and `handleVideoSelect` before proceeding

### 2. PromptResponseCard: Layout Restructure
1. Make `responseId` prop optional: `responseId?: Id<'responses'>`
2. Add `onEnsureResponse?: () => Promise<void>` prop
3. Add `isFocused` state for character counter visibility
4. Move MediaGrid above the textarea (inside CardContent)
5. Restructure textarea area:
   ```tsx
   <div className="relative">
     <Textarea
       className="min-h-[80px] resize-none pb-10 pr-16"
       placeholder="Add text or tap + for photos..."
       onFocus={() => setIsFocused(true)}
       onBlur={() => setIsFocused(false)}
       ...
     />
     {/* "+" button at bottom-left */}
     <div className="absolute bottom-2 left-2">
       <MediaUploader
         responseId={responseId}
         onEnsureResponse={onEnsureResponse}
         ...
       />
     </div>
     {/* Counter at bottom-right, only on focus */}
     {isFocused && (
       <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
         {charCount}/{maxLength}
       </div>
     )}
   </div>
   ```
6. Remove the conditional that shows "Start typing to enable..." message (lines 111-124)

### 3. MultiCircleSubmissionScreen: On-Demand Response
1. Add `handleEnsureResponse` callback:
   ```tsx
   const handleEnsureResponse = async (promptId: string) => {
     let submissionId = submissionData?._id
     if (!submissionId) {
       submissionId = await createSubmission({ circleId, cycleId })
     }
     await updateResponse({ submissionId, promptId, text: '' })
   }
   ```
2. Pass `onEnsureResponse` to PromptResponseCard

## Conflict Risk Assessment
- **Low Risk**: Single stream, sequential changes
- Both files are modified but changes are straightforward

## Expected Timeline
- Wall time: 1.5 hours
- No parallelization benefit — changes are tightly coupled

## Notes
- Size: M (reduced from L — no custom styling)
- Keep existing Card/CardContent components
- Text validation must allow empty text when media exists
- Test: photo capture, video upload, text-only, media-only submissions
