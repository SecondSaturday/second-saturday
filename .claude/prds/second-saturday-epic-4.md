---
name: second-saturday-epic-4
description: Content Submission - creating multimodal responses with text, photos, and videos for circle prompts
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 4 (70-90 hours)
---

# Epic 4: Content Submission

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 4 (70-90 hours)
**Prerequisites:** Epic 0 (Project Setup), Epic 1 (Authentication), Epic 2 (Circle Creation), Epic 3 (Circle Membership) must be complete

---

## Overview

This epic covers how users respond to prompts and share photos/videos. The submission experience must feel low-pressure (for Alex) while enabling meaningful sharing (for Maya).

**Key Insight:** Each prompt response is a mini "post" - users can add text, photos, and/or videos together. This mirrors how people naturally share on Instagram, Facebook, or X, reducing the learning curve and enabling richer storytelling. Media appears inline with text in the newsletter, not in a separate section.

---

## Goals

1. **Enable multimodal responses** - Text + photos + videos in any combination (max 3 media per prompt)
2. **Auto-save drafts** - 2-second debounce after typing stops
3. **Support multi-circle workflow** - Instagram Stories-style tabs for users in multiple circles
4. **Handle media efficiently** - Client-side image compression, Mux video processing
5. **Enforce deadline** - Lock submissions at 10:59 AM UTC second Saturday
6. **Enable editing** - Users can edit until deadline

---

## Implementation Plan

### Phase 1: Design (Days 1-2, ~18-22 hours)

**Goal:** Define submission screens and user flows before writing code.

**Activities:**

1. **Identify screens and components needed**
   - Multi-circle submission screen (Instagram Stories-style tabs at top)
   - Single circle submission view (list of prompts)
   - Prompt response card (text input + media upload area)
   - Character counter component (500 char limit)
   - Photo upload interface (gallery selector, camera capture, preview grid)
   - Video upload interface (blocking UI with progress indicator)
   - Media preview grid (max 3 items per response, with remove button)
   - Deadline countdown component (prominent, shows local time)
   - Submission status indicators (not started, in progress, submitted, locked)
   - Empty state (no circles, no prompts)
   - Auto-save indicator ("Saving...", "Saved")

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint) - this is a mobile-heavy feature
   - Design desktop (1024px+ breakpoint) layout
   - Design circle tabs with status indicators (empty circle, half-filled, checkmark)
   - Design media grid layout (1 photo, 2 photos, 3 photos, 1 video, mixed)
   - Design video upload blocking UI with progress bar
   - Apply tweakcn theme tokens

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code (SubmissionForm, PromptCard, MediaUploader, etc.)
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for all 11 submission screens/components
- Component code generated from Figma MCP
- Design review notes and approval

---

### Phase 2: Implementation (Days 3-5, ~35-45 hours)

**Goal:** Build content submission features following approved designs.

**Activities:**

1. **Set up Convex schema**
   - Create submissions table in schema.ts (one per user per circle per cycle)
     - Fields: circleId, userId, cycleId (format: "2026-02"), submittedAt, lockedAt
   - Create responses table in schema.ts (one per prompt per submission)
     - Fields: submissionId, promptId, text, updatedAt
   - Create media table in schema.ts (photos/videos linked to responses)
     - Fields: responseId, storageId (for photos), muxAssetId (for videos), type, thumbnailUrl, order, uploadedAt
   - Create indexes for efficient queries

2. **Implement Convex queries and mutations**
   - Create createSubmission mutation
   - Create updateResponse mutation (for auto-save)
   - Create uploadMedia action (handles file upload to Convex storage for photos)
   - Create uploadVideoToMux action (uploads video to Mux, stores asset ID)
   - Create Mux webhook endpoint (handles video.asset.ready for thumbnails)
   - Create lockSubmission mutation (triggered at deadline)
   - Create getSubmissionForCircle query (gets user's draft or locked submission)

3. **Build UI components**
   - Build MultiCircleSubmissionScreen with horizontal tabs
   - Build circle tab component (icon, name, status indicator)
   - Build PromptResponseCard component (text input + media area)
   - Implement auto-save with 2-second debounce (useDebounce hook)
   - Build MediaUploader component (gallery/camera selector)
   - Integrate @capacitor/camera for photo capture
   - Implement client-side image compression with browser-image-compression
   - Build VideoUploader component with blocking UI and progress
   - Integrate Mux upload (get upload URL, upload file, display progress)
   - Build MediaPreviewGrid (shows uploaded photos/videos, max 3)
   - Implement media removal
   - Build DeadlineCountdown component (shows local time)
   - Implement deadline logic (lock at 10:59 AM UTC second Saturday)
   - Display locked state (read-only view after deadline)
   - Build submission status switching between circles (preserve drafts)

4. **Add analytics events** (PostHog)
   - Track `submission_started` (circle_id, prompt_count)
   - Track `submission_photo_added`
   - Track `submission_video_added`
   - Track `submission_saved_draft`
   - Track `submission_completed`

5. **Manual testing in dev**
   - Test submission on web and mobile
   - Test photo upload from gallery and camera
   - Test video upload with progress indicator
   - Test auto-save functionality
   - Test multi-circle switching
   - Test deadline countdown and locking
   - Fix obvious bugs

**Deliverables:**
- Convex schema updates (submissions, responses, media tables)
- Convex functions (createSubmission, updateResponse, uploadMedia, etc.)
- UI components with Convex integration
- Analytics events tracking
- Working submission flows in dev environment

---

### Phase 3: Testing (Days 6-7, ~17-23 hours)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**

1. **Write unit tests** (Vitest)
   - Test character counter (500 char limit)
   - Test auto-save debounce logic (waits 2 seconds)
   - Test deadline detection (10:59 AM UTC conversion to local time)
   - Test media count validation (max 3 per response)
   - Test video file size validation (25MB limit)
   - Target: 80% coverage for validation logic

2. **Write integration tests** (Vitest + Testing Library)
   - Test createSubmission mutation
   - Test updateResponse mutation (auto-save)
   - Test uploadMedia to Convex storage (photos)
   - Test uploadVideoToMux (mock Mux API)
   - Test Mux webhook (mock video.asset.ready payload)
   - Test lockSubmission mutation at deadline
   - Test getSubmissionForCircle query (returns draft or locked)

3. **Write E2E tests** (Playwright)
   - Test full submission flow (write text, upload photo, save draft)
   - Test multi-circle switching (drafts persist per circle)
   - Test photo upload from gallery (mock Capacitor Camera API)
   - Test video upload with progress indicator
   - Test media removal
   - Test auto-save (type, wait 2 sec, verify saved)
   - Test deadline countdown displays correctly in local timezone
   - Test submission locks at deadline (cannot edit after)
   - Test character limit enforcement (cannot type beyond 500)

4. **Manual QA testing**
   - Test photo upload on real iOS device (camera + gallery)
   - Test photo upload on real Android device
   - Test video upload on real iOS device (blocking UI, progress)
   - Test video upload on real Android device
   - Test browser-image-compression on mobile (verify file size reduction)
   - Test Mux video workflow end-to-end (upload → process → thumbnail ready)
   - Test auto-save works (stores locally if offline, syncs when online)
   - Test multi-circle tab switching on mobile
   - Test deadline countdown accuracy (check multiple timezones)
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage for validation logic)
- Integration tests for all Convex functions
- E2E tests for critical submission paths
- Bug fixes
- Test passing verification

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. Create PR with Figma links, demo video of submission flow
2. Code review
3. Address review comments
4. CI validation
5. Fix any CI failures
6. Deploy to Vercel preview and test
7. Merge to main after approval
8. Auto-deploy to production
9. Smoke test submission flow in production
10. Monitor Sentry for Mux upload errors
11. Monitor PostHog for submission events
12. Check Mux dashboard for video processing stats

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 4 complete

---

## Jobs To Be Done (JTBDs)

### JTBD 4.1: Creating Multimodal Responses

**When** I open my circle and want to share my update,
**I want to** create responses that combine text, photos, and videos like a social media post,
**So I can** share my month in a rich, expressive way without friction.

**Context:** Each prompt response is a mini "post" - users can add text, photos, and/or videos together. This mirrors how people naturally share on Instagram, Facebook, or X, reducing the learning curve and enabling richer storytelling. Media appears inline with text in the newsletter, not in a separate section.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.1.1 | Display all active prompts for the circle | P0 |
| 4.1.2 | Text input field per prompt (500 character limit) | P0 |
| 4.1.3 | Character count displayed as user types | P0 |
| 4.1.4 | Auto-save drafts (2-second debounce after typing stops) | P0 |
| 4.1.5 | Show which prompts have responses vs. are empty | P0 |
| 4.1.6 | Allow skipping prompts entirely | P0 |
| 4.1.7 | Show deadline countdown prominently | P0 |
| 4.1.8 | Emoji picker integration | P1 |
| 4.1.9 | Rich text support (bold, italic) | P2 |

**Acceptance Criteria:**
- Text responses save within 2 seconds of typing pause
- User can close app and return to find their draft intact
- Skipped prompts don't show placeholder text in newsletter
- If user is offline, show clear error message (no offline support in V0)
- Each response can contain text only, media only, or both together

---

### JTBD 4.2: Adding Media (Photos & Videos)

**When** I want to share visual moments from my month,
**I want to** attach photos and videos directly to my prompt responses,
**So I can** show my friends what I've been up to in a rich, engaging way.

**Context:** Media is embedded inline with each prompt response (like a social post), not separated into a "Photo Wall." This reduces friction and allows users to pair specific media with specific prompts. Videos add life to updates but require special handling for email delivery.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.1 | Upload photos from device gallery | P0 |
| 4.2.2 | Upload videos from device gallery | P0 |
| 4.2.3 | Capture photo directly from camera | P0 |
| 4.2.4 | Capture video directly from camera | P0 |
| 4.2.5 | Max 3 media items per prompt response | P0 |
| 4.2.6 | Video file size limit: 25MB before compression | P0 |
| 4.2.7 | Remove uploaded media before submission | P0 |
| 4.2.8 | Media preview/thumbnail in submission form | P0 |
| 4.2.9 | Reorder media via drag-and-drop | P1 |
| 4.2.10 | Progress indicator during upload (blocking UI) | P0 |

**Media Format & Optimization:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.11 | Support photo formats: JPG, PNG, HEIC | P0 |
| 4.2.12 | Support video formats: MP4, MOV, WebM | P0 |
| 4.2.13 | Auto-compress photos client-side (max 1200px, <200KB) | P0 |
| 4.2.14 | Upload videos to Mux for compression and hosting | P0 |
| 4.2.15 | HEIC/MOV (iPhone defaults) handled automatically | P0 |
| 4.2.16 | User must wait during video upload (blocking UI) | P0 |

**Email Handling (Videos):**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.17 | Videos in email display as thumbnail with play button | P0 |
| 4.2.18 | Clicking video thumbnail opens newsletter in web app | P0 |
| 4.2.19 | Fallback text for email clients that don't render images | P0 |

**In-App Video Playback:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.20 | Videos play on tap (no autoplay) | P0 |
| 4.2.21 | Video player shows play/pause, progress bar, mute toggle | P0 |
| 4.2.22 | Videos loop by default (can be toggled off) | P1 |

**Acceptance Criteria:**
- Photo upload completes within 5 seconds on typical mobile connection
- Video upload shows clear progress indicator; user cannot navigate away during upload
- Media appears inline with prompt response in newsletter
- User can mix photos and videos in any combination (up to 3 total per response)
- Compression happens automatically
- Email newsletter size stays under 5MB (videos are thumbnails only)

---

### JTBD 4.3: Editing Before Deadline

**When** I've submitted but want to make changes,
**I want to** edit my responses up until the deadline,
**So I can** refine what I've shared without being locked out.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.3.1 | All responses editable until deadline | P0 |
| 4.3.2 | Clear indication of deadline in user's local timezone | P0 |
| 4.3.3 | Warning when editing within 24 hours of deadline | P0 |
| 4.3.4 | Responses locked automatically at deadline | P0 |
| 4.3.5 | After deadline, show "Submitted" state with read-only view | P0 |
| 4.3.6 | Late edit requests handled manually (contact admin) | P2 |

**Acceptance Criteria:**
- Deadline is second Saturday 10:59 AM UTC (1 minute before newsletter generation starts)
- All deadline displays shown in user's local timezone
- Edits save immediately (same auto-save as initial entry)
- User cannot edit after deadline passes, even by 1 minute
- Clear visual distinction between "editable" and "locked" states
- Countdown timer shows time remaining in hours/minutes when <24 hours left

---

### JTBD 4.4: Submitting for Multiple Circles

**When** I'm in multiple circles with overlapping deadlines,
**I want to** manage all my submissions from a single page,
**So I can** easily switch between circles and see my progress at a glance.

**Context:** Users in multiple circles need a unified submission experience. The UI uses an Instagram Stories-style tab pattern: circle icons displayed horizontally at the top, user taps to switch between circles. This keeps all submissions in one place while maintaining clear separation between circles.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.4.1 | Single submission page for all circles | P0 |
| 4.4.2 | Horizontal tab bar at top showing circle icons | P0 |
| 4.4.3 | Circle name displayed below each icon | P0 |
| 4.4.4 | Visual indicator on tab showing submission status | P0 |
| 4.4.5 | Tap circle icon/tab to switch to that circle's prompts | P0 |
| 4.4.6 | Each circle has independent submission content | P0 |
| 4.4.7 | Deadline countdown shown for currently selected circle | P0 |
| 4.4.8 | Notifications specify which circle needs attention | P0 |
| 4.4.9 | Copy response from one circle to another | P2 |

**Acceptance Criteria:**
- Tab bar scrolls horizontally if user is in many circles
- Currently selected circle is visually highlighted (border, scale, or glow)
- Status indicators: empty circle = not started, half-filled = in progress, checkmark = submitted
- Switching circles preserves draft state of previous circle
- Responses and media are completely separate between circles
- Same media file can be uploaded to multiple circles separately

---

## Analytics Events

Track user actions throughout submission:

**Epic 4 (Submission):**
- `submission_started` (circle_id, prompt_count)
- `submission_photo_added`
- `submission_video_added`
- `submission_saved_draft`
- `submission_completed`

**Implementation:** Track events at key moments:
- When user starts responding to first prompt
- When photo or video is uploaded
- When draft is auto-saved
- When user completes all prompts (or submits)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test character counter (500 char limit)
- Test auto-save debounce logic (waits 2 seconds)
- Test deadline detection (10:59 AM UTC conversion to local time)
- Test media count validation (max 3 per response)
- Test video file size validation (25MB limit)
- Target: 80% coverage for validation functions

### Integration Tests (Vitest + Testing Library)
- Test createSubmission mutation
- Test updateResponse mutation (auto-save)
- Test uploadMedia to Convex storage (photos)
- Test uploadVideoToMux (mock Mux API)
- Test Mux webhook (mock video.asset.ready payload)
- Test lockSubmission mutation at deadline
- Test getSubmissionForCircle query

### E2E Tests (Playwright)
- Test full submission flow (write text, upload photo, save draft)
- Test multi-circle switching (drafts persist per circle)
- Test photo upload from gallery
- Test video upload with progress indicator
- Test media removal
- Test auto-save functionality
- Test deadline countdown and locking
- Test character limit enforcement

### Manual QA Testing
- Test photo upload on real iOS/Android devices (camera + gallery)
- Test video upload on real iOS/Android devices (blocking UI, progress)
- Test browser-image-compression on mobile
- Test Mux video workflow end-to-end
- Test auto-save reliability
- Test multi-circle tab switching on mobile
- Test deadline countdown accuracy across timezones

**Coverage Target:** 80%+ for validation logic; 100% for Convex functions

---

## Dependencies

### Blockers (Must complete before this epic)
- **Epic 0 (Project Setup & Infrastructure)** - Requires Convex, Mux, Capacitor
- **Epic 1 (Authentication & Identity)** - Users must be authenticated
- **Epic 2 (Circle Creation & Setup)** - Circles and prompts must exist
- **Epic 3 (Circle Membership)** - Users must be members to submit

### Enables (What this epic unlocks)
- **Epic 5 (Newsletter Experience)** - Requires submissions to compile newsletter

---

## Week 4 Timeline Breakdown

### Days 1-2: Design (18-22 hours)
- Create wireframes for 11 submission screens/components in Figma
- Design circle tabs with status indicators
- Design for mobile-first (375px)
- Design desktop (1024px+) layout
- Design media grid layout variations
- Design video upload blocking UI with progress
- Apply tweakcn theme tokens
- Design review with backend developer
- Use Figma MCP to generate component code
- Review and refine generated code

### Days 3-5: Implementation (35-45 hours)
- Create submissions, responses, and media tables in Convex
- Create submission mutations and queries
- Implement Mux upload and webhook handling
- Build MultiCircleSubmissionScreen with tabs
- Build PromptResponseCard component
- Implement auto-save with debounce
- Build MediaUploader with camera/gallery integration
- Implement client-side image compression
- Build VideoUploader with blocking UI and progress
- Build MediaPreviewGrid
- Build DeadlineCountdown component
- Implement deadline locking logic
- Add analytics events (PostHog)
- Manual testing in dev environment

### Days 6-7: Testing (17-23 hours)
- Write unit tests for validation logic
- Write integration tests for Convex functions
- Write E2E tests for submission flows
- Manual QA on real iOS/Android devices
- Test photo and video upload end-to-end
- Test auto-save reliability
- Test deadline countdown accuracy
- Test Mux video workflow
- Fix bugs found during testing
- Retest to verify fixes

### Continuous: Review & Deploy
- Create PR with Figma links and demo video
- Code review
- CI validation
- Deploy to Vercel preview
- Merge to main
- Smoke test production
- Monitor Sentry and PostHog
- Check Mux dashboard

**Total: 70-90 hours**

---

## Key Risks

1. **Mux video upload workflow complexity** - Upload URL generation, webhook handling
   - Mitigation: Follow Mux documentation carefully; test webhook handling early

2. **Video upload UX on slow connections** - Blocking UI must show accurate progress
   - Mitigation: Test on throttled connections; provide clear progress indicator

3. **Auto-save reliability** - Must not lose data
   - Mitigation: Implement robust error handling; test offline scenarios

4. **Deadline logic accuracy across timezones** - 10:59 AM UTC must lock correctly
   - Mitigation: Write comprehensive timezone tests; verify with multiple timezone testers

5. **Mobile camera/gallery permissions** - Capacitor Camera plugin configuration
   - Mitigation: Test on real devices early; handle permission denial gracefully

---

## Success Criteria

- [ ] Users can create multimodal responses (text + photos + videos)
- [ ] Auto-save works reliably (2-second debounce)
- [ ] Photo upload completes in under 5 seconds on typical connection
- [ ] Photos auto-compress to <200KB client-side
- [ ] Video upload shows blocking UI with progress indicator
- [ ] Videos upload to Mux and generate thumbnails
- [ ] Max 3 media items per response enforced
- [ ] Character limit (500) enforced
- [ ] Multi-circle tabs work seamlessly (Instagram Stories-style)
- [ ] Submission status indicators show correct state
- [ ] Deadline countdown displays in user's local timezone
- [ ] Submissions lock automatically at 10:59 AM UTC
- [ ] Users can edit responses until deadline
- [ ] All submission flows have E2E tests
- [ ] 80%+ test coverage for validation logic
- [ ] Camera and gallery access work on iOS/Android
- [ ] No critical bugs in production
- [ ] Analytics events tracking properly
- [ ] Mux video processing working end-to-end
