# Manual QA Checklist — Submission Feature

**Version:** 1.0
**Issue:** #72
**Feature:** Multi-circle submission screen with media upload, auto-save, and deadline locking

---

## 1. Setup & Prerequisites

Before starting any device testing, confirm the following are in place.

### Environment
- [ ] Convex dev environment is running (`npx convex dev`)
- [ ] Mux test environment credentials are configured in `.env.local`
- [ ] The app is built and installed on the test device (or running via Capacitor live reload)
- [ ] Test user account exists and is signed in via Clerk

### Test Data
- [ ] At least one circle exists for the test user with 2+ prompts configured
- [ ] At least one additional circle exists to test multi-circle tab switching
- [ ] The current cycle is active (submission deadline has not passed)
- [ ] A second test scenario with a past deadline is staged for deadline-locking tests (or deadline can be manipulated via Convex dashboard)

### Device Readiness
- [ ] Camera permission has NOT been pre-granted (to test the permission prompt flow)
- [ ] Photo library access has NOT been pre-granted (to test the permission prompt flow)
- [ ] Device has at least 1 GB of free storage
- [ ] Device is connected to a stable Wi-Fi network
- [ ] Device battery is above 20%

### iOS-Specific Setup
- [ ] iOS 15+ device available (iPhone or iPad)
- [ ] Xcode build installed or TestFlight build available
- [ ] iCloud Photo Library disabled to avoid confusion with permissions

### Android-Specific Setup
- [ ] Android 10+ device available
- [ ] APK installed via ADB or direct install
- [ ] No camera app permission granted yet in device Settings → Apps

---

## 2. iOS Device Tests

Perform each section below on an iOS device. Mark each item when verified. Note any failures in the Bug Report section at the end.

### 2.1 Text-Only Submission

- [ ] Open the app and navigate to the submission screen
- [ ] Verify the submission screen loads without a crash or blank screen
- [ ] Verify prompt cards are displayed for the active circle
- [ ] Tap into the first text input field
  - Expected: keyboard appears, cursor is visible
- [ ] Type a response (at least 20 characters)
  - Expected: text appears in real time as typed
- [ ] Wait 2 seconds without typing
  - Expected: "Saving..." indicator appears in the header within 2–3 seconds
- [ ] Wait for save to complete
  - Expected: indicator changes to "Saved just now" (green checkmark icon)
- [ ] After 3 seconds of inactivity, verify the save indicator disappears (returns to idle/hidden)
- [ ] Background the app for 10 seconds, then return
  - Expected: typed text is still present; no data loss
- [ ] Kill the app completely and relaunch
  - Expected: previously saved text is restored from server data when screen loads

### 2.2 Editing a Saved Response

- [ ] With a saved response on screen, modify the text (add or delete characters)
  - Expected: "Saving..." indicator appears after ~2 seconds of inactivity
- [ ] Immediately start typing again to interrupt the debounce timer
  - Expected: indicator does NOT flicker or show "Saved" prematurely
- [ ] Stop typing, wait for the 2-second debounce, and verify save triggers once
  - Expected: single "Saving..." → "Saved" transition, not multiple rapid saves

### 2.3 Photo Upload — Camera

- [ ] Tap the "Take Photo" button
  - Expected: iOS camera permission prompt appears (if first time)
- [ ] Grant camera permission
  - Expected: native camera opens
- [ ] Take a photo
  - Expected: photo is accepted; compression progress bar appears briefly
- [ ] Observe the upload progress bar
  - Expected: stages progress visibly: "Selecting photo..." → "Compressing image..." → "Uploading..." → completion
- [ ] After upload completes, verify a thumbnail appears in the MediaGrid below the upload buttons
  - Expected: image thumbnail rendered in a square aspect ratio
- [ ] Verify the "Saving..." → "Saved" indicator sequence appears in the header after photo upload
- [ ] Verify upload buttons are still visible (media count is now 1 out of 3)

### 2.4 Photo Upload — Gallery

- [ ] Tap the "Choose Photo" button
  - Expected: iOS photo library permission prompt appears (if first time)
- [ ] Grant photo library access
  - Expected: native photo picker opens
- [ ] Select a photo from the library
  - Expected: compression stage appears; upload proceeds as in 2.3
- [ ] Verify the selected photo thumbnail appears in the MediaGrid
- [ ] Verify the save indicator shows "Saved" after upload completes

### 2.5 Photo Upload — Media Limit

- [ ] Upload photos until the count reaches 3 (the maximum per response)
  - Expected: all three thumbnails appear in the MediaGrid (1-wide + 2-column layout for 3 items)
- [ ] Verify the "Take Photo", "Choose Photo", "Record Video", and "Choose Video" buttons become disabled (visually grayed out)
- [ ] Verify the message "Maximum 3 media items reached" appears below the buttons
- [ ] Attempt to tap a disabled upload button
  - Expected: no action; no crash

### 2.6 Photo Removal

- [ ] Long-press or hover over a media thumbnail in the MediaGrid (if interaction is required)
  - Expected: a red remove button (X) appears in the top-right corner of the thumbnail
- [ ] Tap the remove button on a photo
  - Expected: photo is removed from the grid; upload buttons re-enable; "Saved" indicator flashes
- [ ] Verify the MediaGrid reflows correctly for the remaining items (2-column for 2 items, full-width for 1 item)

### 2.7 Video Upload — Record New

- [ ] Tap the "Record Video" button
  - Expected: iOS camera permission prompt (if not already granted) and microphone permission prompt appear
- [ ] Grant both permissions
  - Expected: native camera opens in video mode
- [ ] Record a short video (5–15 seconds)
  - Expected: blocking modal dialog appears: "Uploading Video — Please wait while your video is being uploaded and processed. Do not close this window."
- [ ] Observe the progress bar inside the blocking modal
  - Expected: progress advances through stages:
    - "Selecting video..." (0–20%)
    - "Uploading to server..." (30–80%)
    - Reaches 100% and modal closes
- [ ] Verify a video thumbnail appears in the MediaGrid after the modal closes
  - Expected: thumbnail image with a centered play button overlay
- [ ] Verify the "Saved" indicator appears in the header

### 2.8 Video Upload — Pick from Library

- [ ] Tap the "Choose Video" button
  - Expected: photo/video library picker opens
- [ ] Select a video from the library (MP4 or MOV, under 500 MB)
  - Expected: blocking modal appears and upload proceeds as in 2.7
- [ ] Verify video thumbnail with play icon appears in MediaGrid on completion

### 2.9 Video Upload — Cancel

- [ ] Begin a video upload (record or pick from library)
- [ ] While the blocking modal is visible, tap the "Cancel" button
  - Expected: upload is aborted; modal closes; no thumbnail is added; upload buttons re-enable
- [ ] Verify no partial media record appears in the MediaGrid

### 2.10 Video Upload — Large File Warning

- [ ] Attempt to upload a video larger than 500 MB (simulate by using a large file if available)
  - Expected: error message: "Video file is too large. Please choose a video under 500MB." with a "Try Again" button
- [ ] Tap "Try Again"
  - Expected: upload buttons re-appear; no crash

### 2.11 Camera/Gallery Permission Denial

- [ ] Deny camera permission when prompted
  - Expected: error message: "Camera permission denied. Please enable camera access in your device settings."
- [ ] Tap "Try Again"
  - Expected: upload buttons re-appear (no crash)
- [ ] Go to iOS Settings → Privacy → Camera → [App Name], grant permission
- [ ] Return to the app and retry photo capture
  - Expected: camera opens normally

### 2.12 Network Error During Upload

- [ ] Begin a photo upload, then disable Wi-Fi mid-upload
  - Expected: error message: "Network error. Please check your connection and try again."
- [ ] Re-enable Wi-Fi and tap "Try Again"
  - Expected: upload restarts from the beginning (no data corruption)

### 2.13 Multi-Circle Tab Switching

- [ ] Verify the tab bar at the top shows circle avatars for all circles the user belongs to
- [ ] Verify the active circle tab has a slightly larger avatar (scale-110 animation)
- [ ] Tap a second circle tab
  - Expected: content area updates to show the second circle's prompts; a loading spinner may appear briefly
- [ ] Type a response in the second circle's first prompt
- [ ] Switch back to the first circle
  - Expected: the first circle's text is exactly as left (draft state is preserved in memory)
- [ ] Switch to the second circle again
  - Expected: the typed-but-unsaved text is still visible (draft state persisted in memory between tab switches)
- [ ] Verify the progress ring on each circle tab updates as prompts are answered:
  - No answers → thin empty ring
  - Some answers → partial arc ring
  - All answers → full solid ring with checkmark

### 2.14 Deadline Countdown Display

- [ ] Locate the deadline countdown widget in the header (top-right area, next to the save indicator)
- [ ] Verify it displays the correct deadline date and time (should be the second Saturday of the current or next month at 10:59 AM UTC)
- [ ] Verify the countdown format matches:
  - More than 1 day remaining → `Xd Xh Xm Xs`
  - Less than 1 day remaining → `Xh Xm Xs`
  - Less than 1 hour remaining → `Xm Xs` (amber/orange styling)
- [ ] Wait at least 5 seconds and verify the seconds counter is ticking live
- [ ] Verify the "urgent" amber styling appears when fewer than 60 minutes remain (simulate by setting deadline in the near future if available)

### 2.15 Deadline Locking — Post-Deadline State

- [ ] Configure a past deadline (via Convex dashboard or test fixture) so that the current submission is locked
- [ ] Reload the app
- [ ] Verify the deadline countdown widget displays "Submissions Locked" with red styling
- [ ] Verify a red banner below the header reads: "Submissions are locked for this cycle."
- [ ] Verify all text input fields are disabled (tapping does not open the keyboard)
- [ ] Verify the "Take Photo", "Choose Photo", "Record Video", "Choose Video" buttons do not appear (or are disabled)
- [ ] Verify no remove buttons appear on existing media thumbnails
- [ ] Verify a semi-transparent overlay appears over existing media thumbnails (locked state)
- [ ] Attempt to trigger a save by any means
  - Expected: no save is attempted; no "Saving..." indicator appears

### 2.16 Auto-Save Indicator States

- [ ] Verify the indicator is not visible (idle) when no edits have been made
- [ ] Edit a text field; observe within 2 seconds: "Saving..." with a spinning loader icon appears
- [ ] Verify "Saving..." text is in a muted/gray color
- [ ] After save completes: indicator shows green checkmark + "Saved just now"
- [ ] Wait 3 seconds: indicator disappears (returns to idle/hidden)
- [ ] Upload a photo: indicator should also show "Saved just now" immediately after upload

---

## 3. Android Device Tests

Perform the identical checklist items from Section 2 on an Android device. Differences are noted below.

### Android-Specific Differences

- Permission prompts use the Android system dialog style (different visual from iOS but functionally equivalent)
- Android may show a "Don't ask again" checkbox on permission denial; verify the error message still shows if permission was permanently denied
- Camera app behavior may vary by device manufacturer; verify the native camera or gallery picker opens (not a web fallback)
- Video format: Android devices may produce `.mp4` (most common) or `.webm` files; verify the format validation accepts `mp4` and rejects unsupported formats gracefully
- MediaGrid thumbnails should render identically on Android; verify no layout shift or aspect-ratio issues specific to Android screen densities (mdpi, xhdpi, xxhdpi)
- Blocking modal during video upload: verify the Android back button does NOT dismiss the modal (hardware back gesture)

### 3.1 Text-Only Submission
- [ ] (Same steps as 2.1 — execute on Android)

### 3.2 Editing a Saved Response
- [ ] (Same steps as 2.2 — execute on Android)

### 3.3 Photo Upload — Camera
- [ ] (Same steps as 2.3 — execute on Android)
- [ ] Additionally verify: tapping "Take Photo" triggers the Android camera app (not a browser file picker)

### 3.4 Photo Upload — Gallery
- [ ] (Same steps as 2.4 — execute on Android)
- [ ] Additionally verify: Android photo picker opens (system media picker on Android 13+, or gallery app on older versions)

### 3.5 Photo Upload — Media Limit
- [ ] (Same steps as 2.5 — execute on Android)

### 3.6 Photo Removal
- [ ] (Same steps as 2.6 — execute on Android)
- [ ] Verify remove button is accessible via tap (not relying on hover, which does not exist on touch devices)

### 3.7 Video Upload — Record New
- [ ] (Same steps as 2.7 — execute on Android)
- [ ] Additionally: press the Android hardware back button while blocking modal is open
  - Expected: back button is ignored; modal stays open; upload continues

### 3.8 Video Upload — Pick from Library
- [ ] (Same steps as 2.8 — execute on Android)

### 3.9 Video Upload — Cancel
- [ ] (Same steps as 2.9 — execute on Android)

### 3.10 Video Upload — Large File Warning
- [ ] (Same steps as 2.10 — execute on Android)

### 3.11 Camera/Gallery Permission Denial
- [ ] Deny camera permission and verify error message appears
- [ ] Tap "Allow" on a "Don't ask again" denial scenario
  - Expected: app gracefully shows error message directing user to Settings; does not crash
- [ ] Go to Android Settings → Apps → [App Name] → Permissions → Camera, grant permission
- [ ] Return and retry
  - Expected: camera opens normally

### 3.12 Network Error During Upload
- [ ] (Same steps as 2.12 — execute on Android)

### 3.13 Multi-Circle Tab Switching
- [ ] (Same steps as 2.13 — execute on Android)
- [ ] Verify horizontal scroll on the tab bar works smoothly when more than 3 circles are present

### 3.14 Deadline Countdown Display
- [ ] (Same steps as 2.14 — execute on Android)

### 3.15 Deadline Locking — Post-Deadline State
- [ ] (Same steps as 2.15 — execute on Android)

### 3.16 Auto-Save Indicator States
- [ ] (Same steps as 2.16 — execute on Android)

---

## 4. Cross-Platform Verification

After completing both iOS and Android tests, verify these cross-platform behaviors.

### Data Consistency
- [ ] Create a submission on iOS, then view it on Android (or vice versa)
  - Expected: text content, media thumbnails, and save status are identical on both platforms
- [ ] Upload a photo on iOS; verify it appears in the MediaGrid when the same account is accessed on Android
- [ ] Upload a video on iOS; verify the video thumbnail (generated by Mux) appears on Android after Mux processing completes

### Mux Video Processing End-to-End
- [ ] Upload a video on either platform
- [ ] After the upload modal closes, the thumbnail may be a placeholder initially
- [ ] Wait 30–120 seconds for Mux to process the video
- [ ] Reload the submission screen
  - Expected: the video thumbnail updates to the Mux-generated thumbnail image
- [ ] Verify no error state appears during the processing wait period

### Image Compression Verification
- [ ] Take a high-resolution photo (12 MP or above) using the device camera
- [ ] After upload, verify in the Convex dashboard or network inspector that the stored image is under 200 KB
- [ ] Verify the displayed thumbnail does not appear noticeably degraded at normal viewing size

---

## 5. Bug Report Template

Use this template for each bug discovered during testing. File bugs in the GitHub issue tracker.

```
**Bug Title:** [Short descriptive title]

**Platform:** iOS / Android / Both
**Device:** [e.g., iPhone 15 Pro, Samsung Galaxy S23]
**OS Version:** [e.g., iOS 17.4, Android 14]
**App Version/Build:** [build number or commit SHA]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should have happened]

**Actual Result:**
[What actually happened]

**Severity:** Critical / High / Medium / Low
- Critical: app crash, data loss, feature completely non-functional
- High: feature broken but workaround exists
- Medium: visual glitch, minor UX issue
- Low: cosmetic issue, nice-to-have improvement

**Screenshots/Recording:**
[Attach if available]

**Additional Context:**
[Any relevant logs, network traces, or notes]
```

---

## 6. Sign-Off

Complete this section after all tests have been executed and all Critical/High bugs are resolved.

### iOS Sign-Off

| Check | Status | Notes |
|-------|--------|-------|
| Text-only submission (create + auto-save + restore) | [ ] Pass / [ ] Fail | |
| Photo upload — camera | [ ] Pass / [ ] Fail | |
| Photo upload — gallery | [ ] Pass / [ ] Fail | |
| Photo compression verified (< 200 KB) | [ ] Pass / [ ] Fail | |
| Video upload — record | [ ] Pass / [ ] Fail | |
| Video upload — library | [ ] Pass / [ ] Fail | |
| Video upload — cancel flow | [ ] Pass / [ ] Fail | |
| Mux end-to-end (thumbnail appears after processing) | [ ] Pass / [ ] Fail | |
| Media removal | [ ] Pass / [ ] Fail | |
| Media limit (max 3 enforced) | [ ] Pass / [ ] Fail | |
| Multi-circle tab switching (state preserved) | [ ] Pass / [ ] Fail | |
| Deadline countdown (live ticking, correct date) | [ ] Pass / [ ] Fail | |
| Deadline locking (UI locked, no edits possible) | [ ] Pass / [ ] Fail | |
| Auto-save indicator (saving/saved/idle states) | [ ] Pass / [ ] Fail | |
| Permission denial handling (camera + gallery) | [ ] Pass / [ ] Fail | |
| Network error handling | [ ] Pass / [ ] Fail | |

**iOS Tester:**
**Date:**
**Build Tested:**
**Signature:** ___________________________

---

### Android Sign-Off

| Check | Status | Notes |
|-------|--------|-------|
| Text-only submission (create + auto-save + restore) | [ ] Pass / [ ] Fail | |
| Photo upload — camera | [ ] Pass / [ ] Fail | |
| Photo upload — gallery | [ ] Pass / [ ] Fail | |
| Photo compression verified (< 200 KB) | [ ] Pass / [ ] Fail | |
| Video upload — record | [ ] Pass / [ ] Fail | |
| Video upload — library | [ ] Pass / [ ] Fail | |
| Video upload — cancel flow | [ ] Pass / [ ] Fail | |
| Mux end-to-end (thumbnail appears after processing) | [ ] Pass / [ ] Fail | |
| Media removal | [ ] Pass / [ ] Fail | |
| Media limit (max 3 enforced) | [ ] Pass / [ ] Fail | |
| Multi-circle tab switching (state preserved) | [ ] Pass / [ ] Fail | |
| Deadline countdown (live ticking, correct date) | [ ] Pass / [ ] Fail | |
| Deadline locking (UI locked, no edits possible) | [ ] Pass / [ ] Fail | |
| Auto-save indicator (saving/saved/idle states) | [ ] Pass / [ ] Fail | |
| Permission denial handling (camera + gallery) | [ ] Pass / [ ] Fail | |
| Network error handling | [ ] Pass / [ ] Fail | |
| Hardware back button blocked during video upload modal | [ ] Pass / [ ] Fail | |

**Android Tester:**
**Date:**
**Build Tested:**
**Signature:** ___________________________

---

### Final Sign-Off

- [ ] All Critical bugs resolved
- [ ] All High bugs resolved (or accepted with documented workarounds)
- [ ] iOS and Android sign-off tables above are complete
- [ ] Cross-platform data consistency verified
- [ ] Mux video end-to-end verified on at least one platform

**QA Lead:**
**Date:**
