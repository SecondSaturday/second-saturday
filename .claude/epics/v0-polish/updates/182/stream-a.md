---
issue: 182
stream: Backend & Schema Cleanup
agent: fullstack-specialist
started: 2026-02-25T03:43:18Z
completed: 2026-02-25T04:15:00Z
status: completed
---

# Stream A: Backend & Schema Cleanup

## Scope
Dead code removal in lib files, Convex schema index, FAB component rename (file + imports)

## Files
- `src/lib/push.ts` — delete 3 unused push notification wrappers
- `src/lib/email.ts` — delete 3 unused email template wrappers
- `src/components/submissions/VideoThumbnail.tsx` — delete component
- `src/components/submissions/VideoThumbnail.test.tsx` (or similar) — delete test
- `src/components/ui/dropdown-menu.tsx` — evaluate usage, delete if unused
- `convex/schema.ts` — add `by_circle_published` compound index to newsletters table
- `src/components/dashboard/CreateCircleFAB.tsx` → rename to `SubmitFAB.tsx`, update `data-testid`
- `src/app/dashboard/page.tsx` — update import from `CreateCircleFAB` to `SubmitFAB`
- Any test files referencing `create-circle-button` testid

## Results

### Completed Tasks

1. **FAB Component Rename** (Commit b972169)
   - Renamed `CreateCircleFAB.tsx` → `SubmitFAB.tsx`
   - Updated component name from `CreateCircleFAB` to `SubmitFAB`
   - Changed `data-testid` from `create-circle-button` to `submit-button`
   - Updated import in `src/app/dashboard/page.tsx`
   - Renamed and updated test file: `test/components/SubmitFAB.test.tsx`

2. **VideoThumbnail Dead Code Removal** (Commit 3a17f7c)
   - Deleted `src/components/submissions/VideoThumbnail.tsx`
   - Deleted `test/components/submissions/VideoThumbnail.test.tsx`
   - Removed export from `src/components/submissions/index.ts`

3. **Push Notification Wrappers Cleanup** (Commit 060c749)
   - Removed 3 unused wrappers from `src/lib/push.ts`:
     - `sendCircleInviteNotification`
     - `sendEventReminderNotification`
     - `sendNewPhotoNotification`
   - Kept `sendPushNotification`, `sendPushToUser`, and `sendPushToUsers` (still in use)

4. **Email Template Wrappers Cleanup** (Commit a12393e)
   - Removed 3 unused wrappers from `src/lib/email.ts`:
     - `sendWelcomeEmail`
     - `sendCircleInviteEmail`
     - `sendEventReminderEmail`
   - Kept base `sendEmail` function and interface

5. **Dropdown Menu Evaluation**
   - **KEPT** `src/components/ui/dropdown-menu.tsx`
   - Reason: Still in active use by 4 files:
     - `src/components/CircleSettings.tsx`
     - `src/components/dashboard/DashboardHeader.tsx`
     - `src/components/submissions/MediaUploader.tsx`
     - `src/components/newsletter/NewsletterView.tsx`

6. **Schema Index Addition** (Commit 0780271)
   - Added compound index to `convex/schema.ts` newsletters table:
     - `.index('by_circle_published', ['circleId', 'publishedAt'])`
   - This index optimizes queries filtering newsletters by circle and published date

## Commit SHAs

All commits made in worktree branch `epic/v0-polish`:

- `b972169` - fix(#182): rename CreateCircleFAB to SubmitFAB
- `3a17f7c` - fix(#182): delete VideoThumbnail dead code
- `060c749` - fix(#182): remove unused push notification wrappers
- `a12393e` - fix(#182): remove unused email template wrappers
- `0780271` - fix(#182): add newsletter publishedAt index to schema

## Notes

- All tasks completed successfully
- No issues encountered during implementation
- dropdown-menu.tsx was correctly kept as it's actively used
- All commit messages follow clean conventional commit format without Claude attribution
