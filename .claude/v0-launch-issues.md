# V0 Launch — Unified Issue List

Combined and deduplicated from: automated codebase scan (6 parallel agents) + manual bug bash walkthrough.
Each issue is self-contained with current behavior, desired behavior, and affected files.

**Sources:** [AUTO] = automated scan, [MANUAL] = manual walkthrough, [BOTH] = found by both
**Severity:** P0 = blocks core flow / data issue, P1 = broken/missing feature users will hit, P2 = polish / UX, P3 = backlog

---

## A. Backend / Data Bugs

### A1 — Newsletter compilation creates duplicates on cron retry [P0] [AUTO]
**Current:** `compileNewsletter` in `convex/newsletters.ts:283-324` always inserts a new newsletter record. There is no check for whether a newsletter already exists for the given `circleId + cycleId` combination. The issue number is calculated as `existingNewsletters.length + 1`, which means a retry creates a second newsletter with an incremented issue number.
**Problem:** If the Convex cron job retries (which Convex does automatically on action failure), or if an operator manually triggers compilation, duplicate newsletters are created and duplicate emails are sent to every active member.
**Desired:** Add an idempotency guard at the start of `compileNewsletter` that queries for an existing newsletter matching `circleId + cycleId`. If one exists, return early with the existing newsletter ID instead of inserting a new one.
**Files:** `convex/newsletters.ts`

### A2 — Submission cycleId uses local time instead of UTC [P0] [AUTO]
**Current:** In `src/app/dashboard/circles/[circleId]/submit/page.tsx:17-19`, the `cycleId` is computed using `new Date().getFullYear()` and `new Date().getMonth()`, which return the user's local timezone values. Meanwhile, the server-side code in `convex/newsletterEmails.ts:204` uses `getUTCFullYear()` and `getUTCMonth()` to compute the same `cycleId`.
**Problem:** A user in UTC+12 or UTC+13 (e.g., New Zealand) at 11:00 PM on December 31 would compute `cycleId` as `2026-01`, while the server would consider it `2025-12`. Their submission would be created against the wrong cycle and would never be picked up by the newsletter compilation cron for the intended month. The submission becomes orphaned.
**Desired:** Use `getUTCFullYear()` and `getUTCMonth()` on the client side to match the server convention, or derive `cycleId` entirely server-side.
**Files:** `src/app/dashboard/circles/[circleId]/submit/page.tsx`

### A3 — Auto-save fires after user clicks Submit, causing false error [P0] [AUTO]
**Current:** The auto-save system in `src/screens/submissions/MultiCircleSubmissionScreen.tsx:137-219` uses a 2-second debounce (`useDebounce(activeDraftObj, 2000)`). When the user types some text and then immediately clicks "Submit", the following sequence occurs: (1) user types, draft state updates immediately; (2) user clicks Submit, `lockSubmission` is called, which sets `lockedAt` and `submittedAt` on the backend; (3) approximately 2 seconds later, the debounced `updateResponse` fires, sending the pending draft to the backend; (4) the backend rejects with "Cannot modify locked submission" because `lockedAt` is now set; (5) the UI shows an error indicator (red save error state) on what was a successfully submitted entry.
**Problem:** The user sees a confusing error indicator after successfully submitting. The submission data integrity is fine (backend correctly rejects the late save), but the UX is broken.
**Desired:** Either cancel the pending debounced save when the user clicks Submit, or flush all pending saves synchronously before calling `lockSubmission`, or check if the submission is already locked before attempting the debounced save.
**Files:** `src/screens/submissions/MultiCircleSubmissionScreen.tsx`

### A4 — "Locked" submission status is unreachable dead code [P1] [AUTO]
**Current:** In `src/app/dashboard/circles/[circleId]/submit/page.tsx:41-45`, the submission status is derived as: if `submittedAt` exists → `'submitted'`; if submission doc exists → `'in-progress'`; otherwise → `'not-started'`. The status `'locked'` is never assigned. Meanwhile, `lockSubmission` in `convex/submissions.ts:227-229` sets both `lockedAt` AND `submittedAt` simultaneously, and the cron `lockPastDeadlineSubmissions` in `convex/crons.ts:36` also sets `submittedAt` via `submission.submittedAt ?? now`. In `CircleSubmissionTabs.tsx:31`, there is rendering code for `status === 'locked'` that shows a Lock icon — but this code path is unreachable because both user-submitted and cron-locked submissions end up with `submittedAt` set.
**Problem:** A deadline-locked submission (locked by cron because the user never explicitly submitted) shows a green checkmark "Submitted" instead of a lock icon. The visual distinction between "user chose to submit before deadline" and "system auto-locked at deadline" is lost.
**Desired:** Two changes required: (1) The status derivation in `submit/page.tsx` should check both `submittedAt` and `lockedAt` independently. If `lockedAt` exists and `submittedAt` equals `lockedAt` (meaning the cron set both simultaneously — the user never explicitly submitted), use `'locked'`. If `submittedAt` was set before `lockedAt` (user submitted voluntarily before deadline), use `'submitted'`. (2) The cron in `convex/crons.ts` should only set `lockedAt` when auto-locking, and should NOT set `submittedAt` when the user never explicitly submitted. Currently line 36 uses `submittedAt: submission.submittedAt ?? now` which forces `submittedAt` to be set even for users who never submitted.
**Files:** `src/app/dashboard/circles/[circleId]/submit/page.tsx`, `src/components/submissions/CircleSubmissionTabs.tsx`, `convex/crons.ts`

### A5 — Failed Mux video processing leaves orphan media records [P2] [AUTO]
**Current:** In `src/components/submissions/MediaUploader.tsx:370-377`, a media record is created in the database immediately when a video upload begins, but the actual Mux video processing happens asynchronously via webhooks. If Mux processing fails (corrupt file, encoding error), the media record persists in the database with no asset ID and no playback URL. There is no cleanup mechanism for failed video processing.
**Problem:** Orphaned media records accumulate in the database, potentially showing broken video placeholders in the UI.
**Desired:** Implement a cleanup mechanism: either a periodic job that removes media records stuck in "processing" state for more than a reasonable timeout (e.g., 1 hour), or handle the `video.asset.errored` webhook to delete the corresponding media record.
**Files:** `src/components/submissions/MediaUploader.tsx`, `convex/videos.ts`, `convex/http.ts`

---

## B. Error Handling & Resilience

### B1 — No error.tsx files anywhere in the app [P0] [AUTO]
**Current:** There are zero `error.tsx` files in the entire `src/app/` directory tree. Next.js uses `error.tsx` files as automatic React error boundaries at the route segment level.
**Problem:** If any component throws during rendering (e.g., Convex connection drops, `JSON.parse` fails on malformed newsletter content, a media URL is malformed, any unexpected null/undefined), the entire page crashes with an unrecoverable white screen. The user must manually refresh the browser. There is no way to recover or show a helpful error message.
**Desired:** Create error boundary files at minimum: `src/app/error.tsx` (global app-level), `src/app/dashboard/error.tsx` (dashboard-level), and `src/app/dashboard/circles/[circleId]/error.tsx` (circle-level). Each should show a styled error message with a "Try again" button that calls `reset()`.
**Files:** `src/app/error.tsx` (new), `src/app/dashboard/error.tsx` (new), `src/app/dashboard/circles/[circleId]/error.tsx` (new)

### B2 — No global-error.tsx for root layout failures [P0] [AUTO]
**Current:** There is no `src/app/global-error.tsx` file. This is the only error boundary that catches errors in the root layout itself (including providers like ConvexProvider, ClerkProvider).
**Problem:** If the root layout or its providers crash (Convex connection failure on startup, Clerk authentication service outage, malformed environment variables), there is absolutely no fallback UI. The user sees a blank white page or a raw Next.js error.
**Desired:** Create `src/app/global-error.tsx` with a minimal, self-contained error page (no dependency on providers since they may have crashed) that shows an error message and a "Reload" button.
**Files:** `src/app/global-error.tsx` (new)

### B3 — Submit button has no catch block — error silently swallowed [P1] [AUTO]
**Current:** In `src/screens/submissions/MultiCircleSubmissionScreen.tsx:72-83`, the `handleSubmit` function calls `await lockSubmission(...)` inside a `try { ... } finally { setIsSubmitting(false) }` block, but there is no `catch` block. If `lockSubmission` throws (e.g., submission already locked by cron, network error, Convex timeout), the error is silently swallowed. The user sees the "Submitting..." state, then the button reverts to "Submit" with zero feedback about what went wrong.
**Desired:** Add a `catch` block that shows a `toast.error()` message (e.g., "Failed to submit. Please try again.") so the user knows the submission did not go through.
**Files:** `src/screens/submissions/MultiCircleSubmissionScreen.tsx`

### B4 — Profile save failure shows no user feedback [P1] [AUTO]
**Current:** In `src/app/dashboard/settings/page.tsx:62-81`, the `handleSave` function catches errors with `catch (err) { console.error('Failed to save profile:', err) }`. The error is only logged to the browser console. The user has no idea their profile changes (name, avatar) were not saved.
**Desired:** Add `toast.error('Failed to save profile. Please try again.')` in the catch block so the user sees feedback when the save fails.
**Files:** `src/app/dashboard/settings/page.tsx`

### B5 — Account deletion failure shows no user feedback [P1] [AUTO]
**Current:** In `src/app/dashboard/settings/page.tsx:177-192`, the account deletion catch block only runs `console.error('Failed to delete account:', err)` and `setDeleting(false)`. The user sees the "Deleting..." button revert to "Delete Account" with no explanation of what happened.
**Desired:** Add `toast.error('Failed to delete account. Please try again.')` in the catch block.
**Files:** `src/app/dashboard/settings/page.tsx`

### B6 — CircleSettings image upload has no error handling [P1] [AUTO]
**Current:** In `src/components/CircleSettings.tsx:136-143`, the `updateCircle` mutation is called inline as `onUpload={(storageId) => updateCircle({ circleId, iconImageId: storageId })}` and similarly for cover images. There is no `try/catch` and no `.catch()`. If the mutation fails (network error, auth error, validation error), the rejected promise goes unhandled and the user sees no feedback.
**Desired:** Wrap the mutation calls in async handlers with try/catch, show `toast.error()` on failure.
**Files:** `src/components/CircleSettings.tsx`

### B7 — Clipboard copy fails silently on mobile [P1] [AUTO]
**Current:** In `src/components/CircleSettings.tsx:72-79`, `handleCopyLink` calls `await navigator.clipboard.writeText(shareText)` with no try/catch. The `navigator.clipboard.writeText()` API can throw if the document is not focused, if permissions are denied (common on mobile browsers and WebViews), or if the API is not available in the current context.
**Desired:** Wrap in try/catch with a fallback (e.g., `document.execCommand('copy')` or a toast explaining the copy failed with the text to copy manually).
**Files:** `src/components/CircleSettings.tsx`

### B8 — No not-found.tsx for 404 pages [P2] [AUTO]
**Current:** There are no `not-found.tsx` files anywhere in `src/app/`. When a user navigates to a non-existent route, they see the default unstyled Next.js 404 page, which is visually inconsistent with the rest of the app.
**Desired:** Create `src/app/not-found.tsx` with a styled 404 page matching the app's design, including a "Go to Dashboard" link.
**Files:** `src/app/not-found.tsx` (new)

---

## C. Validation Gaps

### C1 — Display name can be set to empty string [P1] [AUTO]
**Current:** In `src/app/dashboard/settings/page.tsx:62-81`, the `handleSave` function sends whatever `name` value is set without trimming or minimum length validation. The `Input` component has no `required` attribute and no minimum length check. A user could set their name to a single space or empty string.
**Desired:** Add validation before save: `if (name !== null && name.trim().length < 1) { toast.error('Name cannot be empty'); return; }`. Consider also enforcing a minimum of 2 characters to match reasonable display name requirements.
**Files:** `src/app/dashboard/settings/page.tsx`

### C2 — Circle name edit has no minimum length validation [P1] [AUTO]
**Current:** In `src/components/CircleSettings.tsx:96-121`, the `handleSave` function checks if the name differs from the current value but does not validate minimum length. The circle creation flow at `src/app/dashboard/create/page.tsx:35-38` enforces a minimum of 3 characters, but the settings edit flow does not. An admin could rename a circle to an empty string or a single character.
**Desired:** Add the same `name.length < 3` validation that the create flow uses: `if (name.trim().length < 3) { toast.error('Name must be at least 3 characters'); return; }`.
**Files:** `src/components/CircleSettings.tsx`

### C3 — Invite page shows "1 members" instead of "1 member" [P2] [MANUAL]
**Current:** The invite preview page at `src/app/invite/[inviteCode]/page.tsx` displays the member count using raw string interpolation without pluralization handling. When there is exactly one member, it shows "1 members" instead of "1 member".
**Desired:** Fix to display "1 member" (singular) when count is exactly 1, and "{n} members" (plural) for all other counts.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

---

## D. Security / Production Hygiene

### D1 — OneSignal leaks App ID and subscription ID to browser console [P1] [AUTO]
**Current:** In `src/lib/onesignal.ts:89`, the code logs `console.log('OneSignal: initialized with app ID', ONESIGNAL_APP_ID)` which exposes the OneSignal App ID in the browser console. At line 103, it logs `console.log('OneSignal: subscription ID', subscriptionId)` which exposes per-user subscription identifiers.
**Problem:** Anyone opening browser DevTools can see these values. While OneSignal App IDs are semi-public, subscription IDs are per-user identifiers that should not be leaked to the console in production.
**Desired:** Remove both `console.log` statements, or gate them behind a `process.env.NODE_ENV === 'development'` check.
**Files:** `src/lib/onesignal.ts`

### D2 — Debug console.log statements in production frontend [P2] [AUTO]
**Current:** Approximately 10 `console.log` statements exist across frontend production code. Notable locations: `src/lib/onesignal.ts` (6 logs including SDK initialization, permission grants, subscription events), `src/providers/capacitor-provider.tsx` (3 logs for skipped initializations), `src/lib/image.ts` (1 log for compression ratio at line 48), `src/providers/onesignal-provider.tsx` (1 log for notification received at line 71).
**Desired:** Remove all debug `console.log` statements from production code. Keep `console.error` in catch blocks for error tracking. If any logging is needed for diagnostics, gate it behind `process.env.NODE_ENV === 'development'`.
**Files:** `src/lib/onesignal.ts`, `src/providers/capacitor-provider.tsx`, `src/lib/image.ts`, `src/providers/onesignal-provider.tsx`

### D3 — Demo submissions page accessible in production [P2] [AUTO]
**Current:** `src/app/demo-submissions/page.tsx` is a development test page that uses a fake/hardcoded response ID. It is accessible to anyone who navigates to `/demo-submissions` in production.
**Desired:** Either delete the page entirely, or add a development-only guard (`if (process.env.NODE_ENV !== 'development') notFound()`) at the top of the component.
**Files:** `src/app/demo-submissions/page.tsx`

### D4 — ObjectURL memory leak in ImageUpload [P2] [AUTO]
**Current:** In `src/components/circles/ImageUpload.tsx:72`, when `enableCrop` is false, a new ObjectURL is created via `URL.createObjectURL(file)` for the preview but the previous ObjectURL is never revoked. On re-upload, the old URL leaks. The crop flow properly revokes URLs, but the non-crop path does not.
**Desired:** Before creating a new ObjectURL, revoke the previous one: `if (preview) URL.revokeObjectURL(preview)`.
**Files:** `src/components/circles/ImageUpload.tsx`

---

## E. Dead Code

### E1 — Unused dropdown-menu.tsx component [P2] [AUTO]
**Current:** `src/components/ui/dropdown-menu.tsx` is a complete shadcn/ui DropdownMenu component with all sub-components (DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent). It is exported but never imported anywhere in the `src/` directory.
**Note:** Before removing, check if any of the new UI features in this issue list (three-dot menus in F4, I1, J3) would benefit from using this component. If so, keep it and wire it up. If those features use a different pattern (e.g., Popover + action sheet), then remove this file.
**Files:** `src/components/ui/dropdown-menu.tsx`

### E2 — VideoThumbnail component unused in app [P2] [AUTO]
**Current:** `src/components/submissions/VideoThumbnail.tsx` is a fully implemented component that is exported via the barrel file at `src/components/submissions/index.ts`. It has a corresponding test at `test/components/submissions/VideoThumbnail.test.tsx`. However, it is never imported or rendered anywhere in the actual application code.
**Desired:** Determine if this component is intended for future use. If not, remove the component and its test.
**Files:** `src/components/submissions/VideoThumbnail.tsx`, `src/components/submissions/index.ts`

### E3 — Unused push notification wrapper functions [P2] [AUTO]
**Current:** `src/lib/push.ts` defines three convenience wrapper functions: `sendCircleInviteNotification()`, `sendEventReminderNotification()`, and `sendNewPhotoNotification()`. None of these are called anywhere in the codebase. The Convex backend uses `internal.notificationPush.sendPushNotification` directly instead.
**Desired:** Remove the three unused wrapper functions. Keep the base module if other functions in it are used.
**Files:** `src/lib/push.ts`

### E4 — Unused email template wrapper functions [P2] [AUTO]
**Current:** `src/lib/email.ts` defines three template functions: `sendWelcomeEmail()`, `sendCircleInviteEmail()`, and `sendEventReminderEmail()`. None are called anywhere. The Convex backend constructs email options directly using the base `SendEmailOptions` interface.
**Desired:** Remove the three unused wrapper functions. Keep the base `sendEmail()` function and the `SendEmailOptions` interface.
**Files:** `src/lib/email.ts`

---

## F. Dashboard & Navigation

### F1 — FAB button navigates to circle creation instead of submissions [P0] [MANUAL]
**Current:** The floating action button (CreateCircleFAB.tsx) labeled "+ Mar 14" (showing the next Second Saturday date) navigates to `/dashboard/create`, which is the circle creation page.
**Desired:** Change the FAB to navigate to `/dashboard/submit` instead. The FAB is the primary entry point for making submissions, not for creating circles. Circle creation will move to the three-dot menu in the dashboard header (see F4).
**Files:** `src/components/dashboard/CreateCircleFAB.tsx`

### F2 — Submission page needs restructure as top-level route [P0] [MANUAL]
**Current:** The submission page is nested inside a single circle route at `/dashboard/circles/[circleId]/submit`. The user must first select a circle from the sidebar, open it, then find and tap "Make Submission" to reach the form. This requires the user to know which circle they want to submit to before starting.
**Desired:** Create a standalone top-level submission route at `/dashboard/submit` that shows ALL circles the user belongs to as horizontal icon tabs at the top of the page. Each tab displays that circle's icon image with the circle's short name below it. The currently selected tab is visually underlined or highlighted. Tapping a different tab switches the prompt form below to that circle's prompts. This mirrors the existing `MultiCircleSubmissionScreen` behavior but makes it the primary submission entry point accessible directly from the FAB.
**Files:** `src/app/dashboard/submit/page.tsx` (new), `src/screens/submissions/MultiCircleSubmissionScreen.tsx` (adapt)

### F3 — Remove non-functional bell icon from dashboard header [P1] [BOTH]
**Current:** The bell icon button in `src/components/dashboard/DashboardHeader.tsx:45-47` renders a Bell icon from lucide-react but has no `onClick` handler attached. It is a visible, tappable button that does absolutely nothing when pressed. The notification system is push-and-forget via OneSignal — notifications are sent but never stored in the app's database. There is no notification history, no in-app notification center, and no way to display past notifications.
**Problem:** The bell icon implies functionality that does not exist. Users will tap it expecting to see notifications and get no response, creating a broken user experience.
**Desired:** Remove the bell icon entirely from the dashboard header. An in-app notification center (with notification history storage, read/unread tracking, and a notification panel) is deferred to V0.1.
**Files:** `src/components/dashboard/DashboardHeader.tsx`

### F4 — Three-dot menu button is non-functional [P1] [BOTH]
**Current:** The MoreVertical (three-dot) icon button in `src/components/dashboard/DashboardHeader.tsx:48-50` has an `onClick={onMenuOpen}` handler, but the `onMenuOpen` prop is optional and is never passed from the parent component at `src/app/dashboard/page.tsx:54-57`. The button renders but does nothing when tapped.
**Desired:** Implement a dropdown or popover menu that opens on tap. The first (and for now, only) menu item should be "Create a circle" which navigates to `/dashboard/create`. This becomes the primary way to create circles after the FAB is repurposed for submissions (see F1).
**Files:** `src/components/dashboard/DashboardHeader.tsx`, `src/app/dashboard/page.tsx`

### F5 — Date picker is interactive but filters nothing [P1] [BOTH]
**Current:** The DatePicker component at `src/components/dashboard/DatePicker.tsx` opens a modal dialog listing the last 12 Second Saturday dates as a scrollable list (`generatePastDates(12)`). The user can select a date. However, the selected date value is never passed to any Convex query — it does not filter the displayed circles, newsletters, or any other data. The component is fully interactive but entirely non-functional.
**Desired:** Three changes: (1) Replace the raw date list with a proper month picker UI (e.g., a grid showing month names or a compact month-year selector) — the user picks a month and the app resolves which Second Saturday date falls in that month internally. (2) Default to the most recent Second Saturday that has ALREADY passed (the last delivered newsletter), not the next upcoming deadline. (3) Wire the selected value to actually filter the displayed data (show the newsletter from that month when a circle is selected).
**Files:** `src/components/dashboard/DatePicker.tsx`, `src/app/dashboard/page.tsx`

### F6 — Clicking a circle should land on latest newsletter, not CircleHome [P1] [MANUAL]
**Current:** Clicking on a circle in the sidebar lands the user on the CircleHome page, which shows a stats card, a read-only list of current prompts, nav cards for "Make Submission", "Members", "Submission Status", and a "Newsletters" archive list at the bottom. The user must scroll down to the archive, find the latest issue, and tap it to read the newsletter.
**Desired:** When a user taps a circle on the dashboard, they should land directly on the latest published newsletter for that circle, rendered with the full newsletter view (cover image header, prompt sections with response cards, media). The circle detail page with prompts and nav cards should be removed or moved behind other navigation (e.g., the settings gear in the newsletter header — see K3).
**Note:** This issue is also referenced as K1 in the newsletter section. K1 has been merged here as it describes the same change from a different perspective.
**Files:** `src/components/CircleHome.tsx`, `src/app/dashboard/page.tsx`, `src/app/dashboard/circles/[circleId]/page.tsx`

### F7 — Date picker positioned left instead of centered [P2] [MANUAL]
**Current:** The month/date picker button in the dashboard header is positioned to the left of center, next to the user avatar.
**Desired:** Center the date picker button horizontally in the header bar so it sits equidistant between the avatar on the left and the bell/menu icons on the right.
**Files:** `src/components/dashboard/DashboardHeader.tsx`

### F8 — Sidebar has fixed width and is not resizable [P3] [MANUAL]
**Current:** The sidebar (circle list panel on the left side of the desktop layout) has a fixed width and cannot be resized by the user.
**Desired:** Make the sidebar resizable by adding a drag handle on its right edge so users can widen or narrow it to their preference.
**Files:** `src/app/dashboard/page.tsx` or `src/app/dashboard/layout.tsx`

---

## G. Circle Settings Redesign

### G1 — Restructure into 4-tab layout [P1] [MANUAL]
**Current:** Circle Settings is a flat scrollable page with all content stacked vertically: stats card at top, circle name input, icon upload, cover upload, "Configure Prompts" nav row, invite link section, "Danger Zone" with leave button at the bottom. The admin submission dashboard, member list, and prompts editor all live at separate routes.
**Desired:** Restructure into a 4-tab layout with tabs labeled "Details", "Prompts", "Members", and "Status" (admin-only). The stat tiles (see G5) sit above the tab bar and are always visible regardless of which tab is active. The "Details" tab contains the circle name, images, invite link, and leave button at the bottom. The "Prompts" tab contains prompt management using a shared prompts editor component (extracted from the current standalone prompts page). The "Members" tab contains the member list with admin controls (currently at a separate route). The "Status" tab (visible only to circle admins) contains the `AdminSubmissionDashboard` component showing submission status per member, deadline countdown, and manual reminder buttons — this replaces the nav card in the now-orphaned CircleHome. Non-admin users see only 3 tabs (Details, Prompts, Members).
**Files:** `src/components/CircleSettings.tsx`, `src/app/dashboard/circles/[circleId]/settings/page.tsx`, `src/components/AdminSubmissionDashboard.tsx`

### G2 — Remove "Configure Prompts" nav row from Details [P1] [MANUAL]
**Current:** The Details section of Circle Settings has a tappable navigation row with a Settings icon and subtitle "Edit, reorder, or add prompts" that navigates to the prompts page.
**Desired:** Remove this row from the Details tab entirely. Prompt management lives in the "Prompts" tab within Circle Settings (see G1). Users access it by tapping the Prompts tab, not by navigating to a separate page.
**Files:** `src/components/CircleSettings.tsx`

### G3 — Move member management into Members tab [P1] [MANUAL]
**Current:** Members management is a standalone page at `/dashboard/circles/[circleId]/members`, reached via a nav card on the CircleHome page. It exists as a completely separate route from Circle Settings.
**Desired:** Move the member list and all member management functionality (viewing members, removing members, admin controls) into the "Members" tab inside Circle Settings so it is accessible directly from the tab bar within settings without navigating to a different page.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`, `src/components/CircleSettings.tsx`

### G4 — Cover image crop modal uses wrong aspect ratio [P1] [BOTH]
**Current:** The `ImageCropModal` component at `src/components/circles/ImageCropModal.tsx:48` hardcodes `aspect={1}` for all image crops, regardless of whether the image being cropped is a circle icon (which should be 1:1) or a cover image (which should be 3:1). The `ImageUpload` component knows the `shape` prop (circle vs rectangle) but does not pass it through to the crop modal. The cover image display container correctly uses `aspect-[3/1]` in the UI, but the crop itself forces a square selection.
**Problem:** Users crop cover images as 1:1 squares, which then get stretched or distorted to fit the 3:1 display container.
**Desired:** Pass the `shape` prop from `ImageUpload` through to `ImageCropModal`, and use `aspect={3}` when cropping cover/rectangle images and `aspect={1}` when cropping icon/circle images.
**Files:** `src/components/circles/ImageCropModal.tsx`, `src/components/circles/ImageUpload.tsx`

### G5 — Stats should be 3 separate tiles instead of single card [P2] [MANUAL]
**Current:** Stats render as a single bordered card with 3 items displayed inline in a flex row inside one container.
**Desired:** Replace with 3 separate white square tiles positioned side by side. Each tile shows a large bold number on top and a short muted label below. For example: "3" with "Members" below it, "1" with "Issues Sent" below it, "Feb 2026" with "Created" below it. Each tile should be its own distinct visual element, not items inside a shared container.
**Files:** `src/components/CircleSettings.tsx`

### G6 — Stat tile order should be Members, Issues Sent, Created [P2] [MANUAL]
**Current:** Stat tile order is Created first, Issues sent second, Members third.
**Desired:** Change order to: Members first, Issues Sent second, Created third. This puts the most actionable information (member count) first.
**Files:** `src/components/CircleSettings.tsx`

### G7 — Stats label capitalization [P2] [MANUAL]
**Current:** The label reads "Issues sent" with a lowercase "s".
**Desired:** Change to "Issues Sent" with a capital "S" for consistent title case.
**Files:** `src/components/CircleSettings.tsx`

### G8 — Created stat should show month and year only [P2] [MANUAL]
**Current:** The Created stat shows the full date including the day, e.g., "Feb 21, 2026".
**Desired:** Show only the month and year, e.g., "Feb 2026". Drop the day number.
**Files:** `src/components/CircleSettings.tsx`

### G9 — Create shared ProfileHeaderImageLayout component [P2] [MANUAL]
**Current:** Across the app, the circle icon and cover image are rendered as two separate stacked upload components — the icon above a large rectangle, both centered in a vertical column with a gap. This pattern appears in CircleSettings, CreateCircle, the invite page, and the newsletter view, but with no visual consistency.
**Desired:** Create a shared `ProfileHeaderImageLayout` component that renders the profile-header pattern used across the app: cover image as a full-width banner at the top, circle icon centered and overlapping the bottom edge of the cover by about half its height (like Facebook/LinkedIn profile headers). In edit mode, each has its own small pencil/edit icon overlaid on it (cover: top-right corner, icon: bottom-right corner). In display mode, the images render without edit icons. This component is used in: CircleSettings (edit mode), CreateCircle (edit mode), invite page (display mode), and newsletter view header (display mode). Merges former L4 ("Create circle image layout should use profile-header pattern") since it's the same visual component.
**Files:** New shared component at `src/components/ProfileHeaderImageLayout.tsx`, used by `src/components/CircleSettings.tsx`, `src/app/dashboard/create/page.tsx`, `src/app/invite/[inviteCode]/page.tsx`, `src/components/newsletter/NewsletterView.tsx`

### G10 — Leave button should be full-width destructive button [P2] [MANUAL]
**Current:** "Leave this circle" is a small text-only destructive link (`text-destructive text-sm hover:underline`) inside a "Danger Zone" section at the bottom of settings.
**Desired:** Replace with a full-width outlined or filled destructive button that reads "Leave this circle". The button should be clearly tappable and visually distinct as a destructive action.
**Files:** `src/components/CircleSettings.tsx`

### G11 — Remove "Danger Zone" heading [P2] [MANUAL]
**Current:** The "Danger Zone" section has a visible `<Label>` heading rendered above the leave button.
**Desired:** Remove the "Danger Zone" label entirely. Show only the Leave button in that section with no heading above it.
**Files:** `src/components/CircleSettings.tsx`

---

## H. Prompts

### H1 — Remove inline prompt library, add browse row [P1] [MANUAL]
**Current:** The Prompt Library renders inline on the same scrollable page as the prompt editor. Categories appear as small headings (e.g., "Deep", "Fun", "Gratitude", "Reflection") with available prompts shown as small pill-shaped buttons below each heading. All of this is visible on the same page as the prompt list, making the page long and cluttered.
**Desired:** Remove the inline library entirely. Replace it with a single tappable row at the bottom of the prompt list that reads "Browse Prompt Library" with a right chevron (›). Tapping this row navigates to a dedicated Prompt Library page (see H2).
**Note:** This change applies to both the circle settings Prompts tab and the circle creation setup flow, since the prompts editor will be extracted as a shared component (see Structural Decisions section). Former L8 ("Prompts step during setup should match settings design") is merged here — the same shared component covers both contexts.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

### H2 — Create dedicated Prompt Library page [P1] [MANUAL]
**Current:** No dedicated Prompt Library page exists. The library is rendered inline on the prompts editor page.
**Desired:** Create a new page at `/dashboard/circles/[circleId]/prompts/library` with: a back arrow header titled "Prompt Library"; a horizontal tab bar with 4 tabs (Fun, Gratitude, Reflection, Check-in); each tab shows a vertical list of prompt strings for that category; each row has a "+" button on the left side to add that prompt to the circle's active prompts. When a prompt is added, it should be reflected when the user navigates back to the prompts editor.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/library/page.tsx` (new)

### H3 — Prompt counter should be in section heading [P2] [MANUAL]
**Current:** The prompt counter is a small muted span showing "{n}/8" right-aligned inside the page header bar.
**Desired:** Move the counter out of the header. Add a "Current Prompts" section heading above the prompt list with the counter inline beside it, e.g., "Current Prompts  6/8". Style it as label-level text (muted, slightly smaller than a heading).
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

### H4 — Back arrow on prompts page navigates to wrong destination [P2] [MANUAL]
**Current:** The back arrow on the prompts page navigates to `/dashboard` (the main dashboard).
**Desired:** Change back navigation to go to the circle settings page (`/dashboard/circles/[circleId]/settings`) since prompts is conceptually a tab within settings. If the user came from the settings page, they should return there.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

---

## I. Members

### I1 — Replace inline Remove button with three-dot menu [P1] [MANUAL]
**Current:** An inline ghost "Remove" button (styled as `text-destructive`) is visible on every non-self member row at all times. It is always present in the UI, making the member list feel aggressive and action-heavy.
**Desired:** Replace the inline Remove button with a small MoreVertical (⋮) three-dot menu icon on the right side of each non-self member row. Tapping the icon opens an action sheet or popover containing the "Remove" option (and potentially "Remove & Block" as a second option). This keeps the member list clean and moves destructive actions behind a deliberate tap.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

### I2 — Show "You" for current user's member row [P2] [MANUAL]
**Current:** All member rows display the user's actual display name, including the currently logged-in user. The user sees their own name in the member list exactly as other members would see it.
**Desired:** For the currently logged-in user, replace their display name with "You" in the member row. This makes it instantly clear which row is the current user without having to match names.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

### I3 — Unified role labels for all members [P2] [MANUAL]
**Current:** The admin member gets a secondary Badge component with a Shield icon and the text "Admin" rendered below their name, on a separate line. It uses the shadcn Badge component with a distinct visual style. Non-admin members have no role label shown at all, creating an asymmetry where the admin has extra visual information but regular members appear plain.
**Desired:** Replace the admin Badge with a plain text inline label "Admin" positioned next to the name on the same line — no Badge component, no Shield icon, no separate line. Add a matching plain text inline "Member" label next to the name for all non-admin members in the same muted/secondary color. Every member row should show a role: either "Admin" or "Member". (Merges former I4 which described the same change for non-admins.)
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

### I5 — Remove joined date from member rows [P2] [MANUAL]
**Current:** Each member row shows a "Joined [date]" subtitle line rendered below the member's name, showing when they joined the circle.
**Desired:** Remove the joined date line entirely. Each member row should show only the member's name and their role label ("Admin" or "Member"), nothing else.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

### I6 — Header should show inline member count [P2] [MANUAL]
**Current:** The page header renders "Members" as the title text, with a separate Users icon and a numeric count displayed on the right side of the header as distinct elements.
**Desired:** Change the section heading to "Members (3)" with the count inline in parentheses as part of the heading text. Remove the separate Users icon and count from the right side.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

---

## J. Submission Input

### J1 — Media upload requires text input first [P1] [MANUAL]
**Current:** In `src/components/submissions/PromptResponseCard.tsx`, the media upload buttons (Take Photo, Choose Photo, Choose Video) only appear AFTER the user types text into the prompt's text area and the response auto-saves to the database. Before the auto-save completes and assigns a real `responseId` (replacing the temporary ID), a placeholder message "Start typing to enable photo & video uploads" is shown instead of the upload buttons. This means users cannot upload media without first typing text.
**Problem:** This is confusing because a user might want to respond to a prompt with only a photo or video and no text. The text-first prerequisite is an unnecessary gate.
**Desired:** Remove this prerequisite entirely. Media upload buttons should be available immediately on every prompt card, regardless of whether the user has typed any text. If no submission/response record exists yet, create one on-demand when the user initiates a media upload (similar to how auto-save creates the record on first text input).
**Files:** `src/components/submissions/PromptResponseCard.tsx`

### J2 — "Make Submission" nav card in CircleHome needs removal [P1] [MANUAL]
**Current:** The "Make Submission" navigation card currently lives inside `CircleHome.tsx` (the circle detail page) as a prominent nav card. It is the primary way to start a submission for a specific circle.
**Desired:** Remove or significantly de-emphasize this entry point since submissions are now accessed from the FAB at the top-level `/dashboard/submit` route. The circle detail page should no longer be the primary way to reach submissions. If kept, it should be a subtle link rather than a prominent nav card.
**Files:** `src/components/CircleHome.tsx`

### J3 — Collapse media upload buttons into single "+" button [P2] [MANUAL]
**Current:** Each prompt card shows three full-width buttons stacked vertically below the text input: "Take Photo", "Choose Photo", and "Choose Video". These three buttons take up significant vertical space and make the form feel long and cluttered, especially when there are multiple prompts.
**Desired:** Replace the three separate buttons with a single "+" icon button positioned below or beside the text input. Tapping the "+" opens an action sheet or popover menu with the three options (Take Photo, Choose Photo, Choose Video). This keeps the interface clean and compact while preserving all functionality.
**Files:** `src/components/submissions/MediaUploader.tsx`

### J4 — Prompt response input should be styled as dark card/bubble [P2] [MANUAL]
**Current:** The text input for each prompt is a standard Textarea component with a "Share your thoughts..." placeholder, rendered with the default light form field styling.
**Desired:** Restyle it as a dark card or bubble (dark background, lighter text, rounded corners) with the text input inside. The "+" media button (see J3) should be positioned at the bottom-left of the card. The overall feel should be like a chat compose bubble rather than a traditional form field, giving the submission experience a more personal, conversational tone.
**Files:** `src/components/submissions/PromptResponseCard.tsx`

---

## K. Newsletter View

### ~~K1~~ — MERGED into F6
*This issue was identical to F6 ("Clicking a circle should land on latest newsletter"). See F6 for the full description.*

### K2 — Newsletter header redesign [P1] [MANUAL]
**Current:** The newsletter header shows a small circle icon (approximately 32px) displayed inline with the circle name in regular sans-serif text, plus "Issue #1 · February 8, 2026" as a subtitle. All of this appears below a plain top navigation bar that reads "← Circle Name - Month Year".
**Desired:** Redesign the header: show the circle's cover image as a full-width banner at the top of the newsletter view. Center the circle's icon avatar so it overlaps the bottom edge of the cover banner by about half its height (the same profile-header pattern used on Circle Settings and Create Circle). Below the icon, display the circle name in a large serif font, centered on the page. Below the name, display the circle's slug or tagline in smaller muted text (e.g., "fake-frems").
**Files:** `src/components/newsletter/NewsletterView.tsx`

### K3 — Add month picker and settings access to newsletter [P1] [MANUAL]
**Current:** The newsletter view has no month picker or settings access. The user cannot switch between issues or reach circle settings from the newsletter view without navigating back to the dashboard.
**Desired:** Add a centered row below the circle name and slug containing: (1) a month picker dropdown button showing the current issue's month (e.g., "Sep 13 ∨") — tapping opens a selector to browse past issues; (2) a settings gear icon — tapping navigates to Circle Settings. This row gives the user quick access to both historical issues and circle management without leaving the newsletter context.
**Files:** `src/components/newsletter/NewsletterView.tsx`

### K4 — Simplify newsletter page header bar [P2] [MANUAL]
**Current:** The page header bar at the top of the newsletter view shows "← Circle Name - Month Year" in plain sans-serif text, repeating information that is now displayed in the integrated cover image header below.
**Desired:** Since the newsletter view now has its own cover image header with the circle name and month picker (see K2, K3), the top navigation bar should simplify to just a back arrow (←) without repeating the circle name and date. Alternatively, the bar could be removed entirely in favor of the integrated header, with the back arrow overlaid on the cover image.
**Files:** Newsletter page wrapper

### K5 — Response cards need grouping, avatars, and dividers [P2] [MANUAL]
**Current:** Each member response is rendered as a bold member name followed by plain text on the next line, with no visual container, no avatar, and no visual separation between different members' responses. All responses for a prompt run together in a flat vertical list separated only by whitespace, making it hard to distinguish where one person's response ends and another begins.
**Desired:** Redesign so all responses for a single prompt are grouped inside a single rounded card (with a subtle background like `bg-card` or `bg-muted/30`, `rounded-xl`, with padding). Within the card, each member's response shows their circular avatar image on the left beside their bold display name, with the response text below the name. Between responses within the same card, render a thin horizontal divider line. This gives each prompt section a clean, contained look where you can see all friends' answers grouped together.
**Files:** `src/components/newsletter/NewsletterView.tsx` or new `PromptSection.tsx`, `MemberResponse.tsx`

### ~~K6~~ — MERGED into K5
*Avatars are part of the K5 response card redesign (card grouping + avatars + dividers). See K5.*

### K7 — Prompt section headings should use serif font [P2] [MANUAL]
**Current:** Prompt section headings (e.g., "What did you do this month?", "One Good Thing", "On Your Mind") render in the default sans-serif body font as bold text, matching the rest of the UI.
**Desired:** Restyle section headings to use a serif font (matching the circle name's serif heading style from K2), with slightly larger size and appropriate spacing above and below. This creates visual hierarchy and gives the newsletter a warm, editorial feel rather than a utilitarian list.
**Files:** `src/components/newsletter/NewsletterView.tsx` or `PromptSection.tsx`

---

## L. Circle Creation Flow

### L1 — Add intro splash screen before circle creation [P1] [MANUAL]
**Current:** When a user taps "Create a circle" (from the dashboard three-dot menu or the empty-state CTA), they land directly on a form asking for a name and images with no context about what they are creating or what happens next.
**Desired:** Add an intro splash screen that appears first, showing: a large serif heading "Create Your Group"; a subtitle "Every second Saturday, connect meaningfully"; a smaller descriptive line "Set prompts, invite friends, and receive monthly newsletters"; and a centered "Get Started" button that advances to Step 1. The back arrow in the top-left header bar should navigate back to the dashboard, following the same header pattern used across the app (ArrowLeft icon in a sticky top bar).
**Files:** `src/app/dashboard/create/page.tsx` or new sub-route

### L2 — Add step progress indicator [P2] [MANUAL]
**Current:** There is no visual progress indicator across the 3-step circle creation wizard. The user has no idea how many steps remain or where they are in the flow.
**Desired:** Add a horizontal numbered step indicator that appears below the header and above the content on every step of creation. It shows 3 numbered circles connected by a horizontal line, labeled "1 Basic Info", "2 Prompts", "3 Members". The current step's circle is filled with the primary accent color and its label is highlighted. Completed steps show a checkmark or filled state. Future steps are muted gray.
**Files:** New shared component, used across `src/app/dashboard/create/page.tsx`, prompts page, setup-complete page

### L3 — Create circle form needs max-width container [P2] [MANUAL]
**Current:** Form content on the Create Circle page stretches edge-to-edge across the full viewport width with only 24px horizontal padding (`px-6`) and no `max-width`. On wide screens or tablets, the name input and description textarea span the entire width, making the form look stretched and unpolished.
**Desired:** Wrap the form content in a centered max-width container (e.g., `max-w-lg`, matching the width used on the Circle Settings page) so fields stay compact and readable at all screen sizes.
**Files:** `src/app/dashboard/create/page.tsx`

### ~~L4~~ — MERGED into G9
*This issue was identical to G9 ("Create shared ProfileHeaderImageLayout component"). The same shared component handles both CircleSettings and CreateCircle image layouts. See G9 for the full description.*

### L5 — Create Circle CTA should be in fixed bottom bar [P2] [MANUAL]
**Current:** The "Create Circle" CTA button uses `mt-auto` to push itself to the bottom of the scrollable form area, which makes it sit flush against the very bottom edge of the viewport with only safe-area padding.
**Desired:** Move the CTA out of the scroll area and into a fixed bottom bar separated by a visible top border (`border-t border-border`) with inner padding (`px-4 py-4`), so the button floats above the content and never touches the screen edge. This matches the fixed bottom bar pattern already used on the Prompts page.
**Files:** `src/app/dashboard/create/page.tsx`

### L6 — Prompts step needs max-width container [P2] [MANUAL]
**Current:** The prompts editor page during circle setup stretches its content (drag-drop prompt list, add button, prompt library section) edge-to-edge with only 16px horizontal padding (`px-4`) and no `max-width`. On wide screens the prompt rows and library pills span the full viewport width.
**Desired:** Wrap the content in a centered max-width container matching the Circle Settings width.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

### L7 — Prompts step CTA needs more bottom padding [P2] [MANUAL]
**Current:** The "Continue" CTA button in the fixed bottom bar on the prompts page sits with minimal spacing from the bottom edge of the viewport.
**Desired:** Add enough bottom padding or safe-area inset so the button has visual breathing room and does not feel like it is touching the device edge.
**Files:** `src/app/dashboard/circles/[circleId]/prompts/page.tsx`

### ~~L8~~ — MERGED into H1
*This issue was identical to H1 ("Remove inline prompt library, add browse row"). The prompts editor will be a shared component used in both settings and setup flows. See H1 for the full description.*

### L9 — Setup complete CTA needs more bottom padding [P2] [MANUAL]
**Current:** The "Go to Dashboard" CTA at the bottom of the setup-complete page (the final step after creating a circle and setting prompts) sits inside a bottom bar with safe-area padding but feels visually crowded against the screen edge.
**Desired:** Increase the bottom padding (e.g., `pb-6` or `pb-8`) so the CTA has more breathing room beneath it.
**Files:** `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx`

### L10 — Setup complete copy should feel warmer [P3] [MANUAL]
**Current:** The setup-complete page heading reads "{circleName} is ready!" with the subtitle "Now invite your friends to join." The copy is functional but reads like a system message rather than a celebration.
**Desired:** Rewrite to feel warmer and more personal, e.g., "You're all set! {circleName} is ready for your crew." or "{circleName} is good to go!" — exact wording TBD, but it should feel like a moment worth celebrating.
**Files:** `src/app/dashboard/circles/[circleId]/setup-complete/page.tsx`

---

## M. Invite / Join Page

### M1 — Invite page should use cover image banner layout [P2] [MANUAL]
**Current:** The invite preview page (what a user sees when they open a shared invite link) shows only the circle's icon avatar (a circular Avatar component with initials fallback) centered in a white card on a plain background. There is no cover image shown.
**Desired:** Redesign the card so the circle's cover image appears as a wide banner across the top of the card, with the circle's icon avatar centered and overlapping the bottom edge of that banner (the same profile-header layout used on Circle Settings, Create Circle, and Newsletter view). If no cover image exists, show a muted colored placeholder banner instead.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

### M2 — Invite page copy should feel warm and personal [P2] [MANUAL]
**Current:** The invite page copy shows the circle name as a heading, then "{memberCount} members" with a Users icon, then "Created by {adminName}". The tone is dry and transactional, reading like a database record rather than a personal invitation.
**Desired:** Rewrite to feel warm and inviting. For example: the heading becomes "You've been invited to join {circleName}"; the member line becomes "A group of {memberCount} friends sharing monthly updates"; and the creator line becomes "{adminName} started this circle". Exact copy TBD but it should feel like a friend inviting you, not a system notification.
**Files:** `src/app/invite/[inviteCode]/page.tsx`

---

## N. Profile Setup / Onboarding

### N1 — Logo should only show on mobile [P1] [MANUAL]
**Current:** The profile setup page (`src/app/complete-profile/page.tsx`) shows the Second Saturday logo icon at the top of the form on all screen sizes, including desktop.
**Problem:** On desktop, the right panel already shows the full branding artwork and "Every month, a little closer." tagline. Showing the logo again on the left panel is redundant.
**Desired:** The logo should only appear on mobile (where the right branding panel is hidden). On desktop, hide the logo from the form panel since the branding is already visible in the right panel.
**Files:** `src/app/complete-profile/page.tsx`

### N2 — Avatar should be pre-populated from SSO provider [P1] [MANUAL]
**Current:** The profile avatar upload starts as a blank dashed circle with a camera icon and "Add photo" label. The user must manually select and upload a photo, even if they signed up via Google or Apple which already have profile images.
**Desired:** Pre-populate the avatar with the user's profile image from their SSO provider (Google or Apple) via Clerk. Clerk already stores the user's OAuth profile image in the user object (`user.imageUrl`). This image should be loaded as the default avatar. The manual upload should remain as an option to override it, but the default should not be blank.
**Files:** `src/app/complete-profile/page.tsx`

### N3 — Display name should be pre-populated from SSO [P1] [MANUAL]
**Current:** The display name input field starts empty (`useState('')`) and the user must type their name from scratch, even if they signed up via Google or Apple which already provide name information.
**Desired:** Pre-populate the name from the user's SSO provider via Clerk. Clerk's user object has `firstName` and `lastName` fields that should be used as defaults. The user can still edit the pre-filled values.
**Files:** `src/app/complete-profile/page.tsx`

### N4 — Split into First Name and Last Name fields [P2] [MANUAL]
**Current:** The profile setup uses a single "Display Name" input field that accepts any freeform text.
**Desired:** Replace with two separate fields: "First Name" and "Last Name", both pre-populated from Clerk's SSO data when available. The user profile should store and display the full name composed from these two fields.
**Files:** `src/app/complete-profile/page.tsx`, potentially `convex/users.ts` schema

### N5 — Use floating label input pattern [P2] [MANUAL]
**Current:** The name input uses a traditional form pattern with a static "Display Name" label rendered above the input and a "Your name" placeholder displayed inside the input field.
**Desired:** Change to a floating label pattern (Material Design style): when the input is empty and unfocused, the label text appears inside the input field as a placeholder; when the user focuses the field or it has a value, the label text animates upward to become a small label positioned above the input border. There should be no separate static label rendered above the field.
**Files:** `src/app/complete-profile/page.tsx`

---

## O. Clerk Component Replacement

### O1 — Replace custom password/email management with Clerk UserProfile component [P1] [AUTO]
**Current:** The settings page at `src/app/dashboard/settings/page.tsx` contains approximately 170 lines of custom code with 15+ `useState` hooks manually implementing password change (lines 84-396) and email change with verification (lines 113-320) using low-level Clerk SDK methods (`updatePassword`, `createEmailAddress`, `prepareVerification`, `attemptVerification`). This custom code has the silent error handling bugs documented in B4, uses an `any` type for the pending email resource (line 57: `useState<any>(null)`), and forces a sign-out after password change (line 105) instead of letting Clerk manage sessions properly.
**Problem:** The custom implementation duplicates what Clerk's `<UserProfile />` component does out of the box with better UX, built-in error handling, proper session management, and accessibility. The custom code also introduces bugs (B4 silent failures) and maintenance burden.
**Desired:** Replace the "Change Password" card and the "Change Email" flow with Clerk's `<UserProfile />` component rendered inline in the settings page. Clerk's `<UserProfile />` handles: password change (with current password verification, strength requirements, session management), email management (add/remove/verify/set primary), and connected accounts (Google, Apple — shows linked status, allows connect/disconnect). Theme it with the existing `clerkAppearance` config in `providers.tsx` to match the app's visual style. Keep custom: profile name/avatar (stored in Convex, not Clerk), notification preferences, sign out button, and account deletion (requires Convex data cleanup). This removes ~170 lines of custom code.
**Files:** `src/app/dashboard/settings/page.tsx`, `src/app/providers.tsx`

---

## P. Security — Unprotected Convex Functions

### P1 — createVideo mutation has no auth check and accepts spoofable userId [P1] [AUTO]
**Current:** The `createVideo` mutation in `convex/videos.ts:5-24` accepts a raw `userId` string parameter with no authentication or authorization check. There is no call to `ctx.auth.getUserIdentity()`. Any user (or unauthenticated caller) can create video records in the database claiming that any other user uploaded them.
**Desired:** Remove the `userId` parameter from the mutation args. Instead, extract the authenticated user's ID from `ctx.auth.getUserIdentity()` (using the same `getAuthUser` helper pattern used in `submissions.ts` and `memberships.ts`). Reject unauthenticated calls.
**Files:** `convex/videos.ts`

### P2 — getVideo query has no auth check [P1] [AUTO]
**Current:** The `getVideo` query in `convex/videos.ts:113-118` accepts a video ID and returns the full video record (including `userId`, `circleId`, `status`, `playbackId`) with no authentication check. Anyone with a video ID can fetch metadata about any video in the system.
**Desired:** Add authentication check. Verify the caller is either the video owner or a member of the circle the video belongs to before returning data.
**Files:** `convex/videos.ts`

### P3 — getVideosByUser query has no auth check [P1] [AUTO]
**Current:** The `getVideosByUser` query in `convex/videos.ts:121-130` accepts any `userId` string parameter with no authentication. Anyone can enumerate all videos uploaded by any user in the system by passing different user IDs.
**Desired:** Add authentication. Either restrict to only returning the caller's own videos, or verify the caller has a relationship with the target user (e.g., shared circle membership).
**Files:** `convex/videos.ts`

### P4 — deleteVideo mutation has no auth check [P1] [AUTO]
**Current:** The `deleteVideo` mutation in `convex/videos.ts:145-151` accepts a video ID and deletes it from the database with zero authentication or authorization checks. The handler is just `await ctx.db.delete(args.id)`. Any authenticated user (or unauthenticated caller) can delete any video by ID.
**Desired:** Add authentication check. Verify the caller is the video owner OR is an admin of the circle the video belongs to before allowing deletion.
**Files:** `convex/videos.ts`

### P5 — getUserByClerkId query has no auth check [P1] [AUTO]
**Current:** The `getUserByClerkId` query in `convex/users.ts:55-63` accepts any `clerkId` string and returns the full user record (including email, name, imageUrl) with no authentication check. Anyone can query by Clerk ID to enumerate user profiles and email addresses.
**Desired:** Add authentication check via `ctx.auth.getUserIdentity()`. Either restrict to only returning the caller's own record, or make this an internal query not exposed to the client.
**Files:** `convex/users.ts`

### P6 — getMembershipCount query has no auth check [P1] [AUTO]
**Current:** The `getMembershipCount` query in `convex/memberships.ts:81-91` accepts a `circleId` and returns the active member count with no authentication check. Anyone can request the member count of any circle, leaking group size information. Note: the adjacent `getCircleMembers` query (line 44) correctly has authentication — only `getMembershipCount` is missing it.
**Desired:** Add authentication check. Either require the caller to be a member of the circle, or make this query internal-only if it's only used by other server-side functions.
**Files:** `convex/memberships.ts`

---

## Q. Accessibility & Loading States

### Q1 — Icon-only buttons lack aria-labels [P2] [AUTO]
**Current:** The icon-only buttons in `src/components/dashboard/DashboardHeader.tsx:45-50` (bell icon and MoreVertical menu icon) render with no `aria-label` attributes. Screen reader users hear "button" with no indication of what the button does.
**Desired:** Add `aria-label="Notifications"` to the bell button (or remove it entirely per F3) and `aria-label="Menu"` to the three-dot menu button. Apply the same pattern to all icon-only buttons across the app.
**Files:** `src/components/dashboard/DashboardHeader.tsx`, and audit all other icon-only buttons

### Q2 — No loading skeleton for members list [P2] [AUTO]
**Current:** The members list page at `src/app/dashboard/circles/[circleId]/members/page.tsx` shows a basic spinner while `useQuery(api.memberships.getCircleMembers)` is loading. There is no skeleton UI showing the expected layout shape.
**Desired:** Add a loading skeleton that matches the member list layout (rows with avatar circles, name placeholders, and role label placeholders) so the page feels faster and doesn't shift layout when data arrives.
**Files:** `src/app/dashboard/circles/[circleId]/members/page.tsx`

### Q3 — No loading skeleton for newsletter view [P2] [AUTO]
**Current:** The newsletter view shows a basic spinner while newsletter content is loading. There is no skeleton UI showing the expected newsletter structure.
**Desired:** Add a loading skeleton that matches the newsletter layout (cover image placeholder, prompt section placeholders, response card placeholders) for a smoother loading experience.
**Files:** `src/components/newsletter/NewsletterView.tsx`

---

## R. Data Integrity

### R1 — CircleSettings save button allows concurrent mutations [P2] [AUTO]
**Current:** In `src/components/CircleSettings.tsx:96-121`, the `handleSave` function sets `setSaving(true)` but the save button is not disabled while the mutation is in flight. If the user clicks "Save" multiple times rapidly, multiple `updateCircle` mutations fire concurrently with no idempotency guard.
**Desired:** Disable the save button immediately when `saving === true` to prevent concurrent mutations. The button should show a loading state ("Saving...") and be non-interactive until the mutation completes or fails.
**Files:** `src/components/CircleSettings.tsx`

### R2 — Missing database index for newsletter sort queries [P2] [AUTO]
**Current:** The `getNewslettersByCircle` query in `convex/newsletters.ts` filters by `circleId` and sorts by `publishedAt`, but `convex/schema.ts` only has a compound index on `['circleId', 'cycleId']` for the newsletters table. There is no `['circleId', 'publishedAt']` index, which means the sort requires a full table scan within the circle's newsletters.
**Desired:** Add a compound index `['circleId', 'publishedAt']` to the newsletters table in `convex/schema.ts` to support efficient sorting by publish date within a circle.
**Files:** `convex/schema.ts`

---

## S. Structural Decisions

### S1 — Extract shared prompts editor component [DECISION]
**Context:** The prompts editor currently exists as a standalone page at `/dashboard/circles/[circleId]/prompts/page.tsx`. It is used both during circle creation setup and for editing prompts in circle settings. With the move to a tabbed Circle Settings layout (G1), prompts management needs to be embedded in the Prompts tab.
**Decision:** Extract the prompts editor logic into a shared component (e.g., `PromptsEditor.tsx`) that accepts props for context (setup mode vs settings mode) and handles navigation accordingly. The shared component is used by both the Settings Prompts tab and the circle creation setup flow. The standalone `/prompts` route is deleted after extraction; the `/prompts/library` route (H2) remains as a sub-route.

### S2 — ProfileHeaderImageLayout shared component [DECISION]
**Context:** The profile-header image pattern (cover banner + overlapping circular icon) is needed in 4 places: CircleSettings (edit mode), CreateCircle (edit mode), invite page (display mode), and newsletter view (display mode).
**Decision:** Create a shared `ProfileHeaderImageLayout` component with edit/display modes, used across all 4 locations. See G9 for full details.

---

## V0.1 Backlog

The following items are deferred from V0 and will be addressed in V0.1:

- **In-app notification center** — Create a `notifications` table in Convex to store sent notifications. Build a `NotificationPanel` component accessible from a bell icon in the dashboard header. Show notification history with read/unread indicators (small primary-colored dot), "Mark all as read", and "Clear all" actions. Clicking a notification marks it as read and deep-links to the relevant screen.
- **Bell icon with badge** — Re-add the bell icon to the dashboard header with an unread count badge. Connect to the notification center.
- **Notification history persistence** — Currently notifications are push-and-forget via OneSignal. Every place that calls `sendPushNotification` also needs to insert a record into the notifications table so users can review past notifications.
- **Web push notification support** — Currently push notifications only work on native iOS/Android via Capacitor. Add web push support for browser users.
- **Rate limiting** — Add rate limiting to API routes (`verify-password`, `delete-account`) and high-risk Convex mutations to prevent brute force attacks.

---

## Summary

**Active issues** (excluding merged/removed):

| Severity | Count |
|----------|-------|
| P0       | 7     |
| P1       | 34    |
| P2       | 38    |
| P3       | 3     |
| **Total** | **82** |

Plus 2 structural decisions (S1, S2) and 5 V0.1 backlog items.

**Changes from original list:**
- Removed: C4 (invalid — code already has error handling)
- Merged: K1→F6, L4→G9, L8→H1, K6→K5, I4→I3 (5 items consolidated)
- Revised: A4 (added cron fix detail), F3 (remove bell instead of implement), G1 (4 tabs including admin Status)
- Added: O1 (Clerk components), P1-P6 (security), Q1-Q3 (accessibility), R1-R2 (data integrity)

---

## Not Yet Audited

The following areas have not been walked through yet and may produce additional issues:

- Edge cases (slow network, offline behavior, concurrent edits from multiple devices, session expiry)
- Mobile-specific issues (Capacitor camera integration, gesture navigation, safe area handling, keyboard avoidance)
- Email rendering across clients (Gmail, Outlook, Apple Mail newsletter template)
- Accessibility deep dive (contrast ratios, touch target sizes, keyboard navigation beyond icon buttons)
