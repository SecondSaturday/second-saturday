---
name: second-saturday-epic-4
status: complete
created: 2026-02-11T11:45:32Z
updated: 2026-02-23T00:00:00Z
progress: 100%
completed: 2026-02-23T00:00:00Z
prd: .claude/prds/second-saturday-epic-4.md
github: https://github.com/SecondSaturday/second-saturday/issues/125
---

# Epic: Content Submission

## Overview

Enable users to create multimodal responses (text + photos + videos) for circle prompts with auto-save, multi-circle support, and deadline management. The submission experience mirrors familiar social media patterns (Instagram/Facebook posts) to reduce friction.

## Architecture Decisions

**Data Model:**
- Use Convex for submissions, responses, and media storage
- One submission per user per circle per cycle (monthly)
- One response per prompt, supporting text + up to 3 media items
- Leverage existing Convex storage for photos, integrate Mux for video hosting

**Media Strategy:**
- Client-side image compression using browser-image-compression (target: <200KB, max 1200px)
- Video uploads to Mux with blocking UI and progress indicator
- Capacitor Camera plugin for mobile camera/gallery access
- Videos rendered as thumbnails in emails, playable in web app

**State Management:**
- Auto-save with 2-second debounce using useDebounce hook
- Multi-circle support via Instagram Stories-style horizontal tabs
- Deadline enforcement: lock submissions at 10:59 AM UTC on second Saturday

**UI Pattern:**
- Mobile-first design (375px breakpoint)
- Reuse existing tweakcn theme tokens and components where possible
- Instagram Stories-style tabs for multi-circle navigation

## Technical Approach

### Frontend Components

**Submission Flow:**
- MultiCircleSubmissionScreen - horizontal tabs with status indicators
- PromptResponseCard - text input (500 char limit) + media upload area
- MediaUploader - photo/video picker with Capacitor Camera integration
- MediaPreviewGrid - shows up to 3 media items with remove capability
- DeadlineCountdown - shows time remaining in user's local timezone
- Auto-save indicator ("Saving...", "Saved")

**Leverage Existing:**
- Reuse existing button, input, and card components from shadcn/ui
- Reuse character counter pattern from any existing form components
- Reuse loading/progress indicators from existing UI

### Backend Services

**Convex Schema:**
- submissions table (circleId, userId, cycleId, submittedAt, lockedAt)
- responses table (submissionId, promptId, text, updatedAt)
- media table (responseId, storageId, muxAssetId, type, thumbnailUrl, order, uploadedAt)

**Convex Functions:**
- createSubmission mutation
- updateResponse mutation (auto-save)
- uploadMedia action (photos to Convex storage)
- uploadVideoToMux action (videos to Mux, stores asset ID)
- Mux webhook handler (video.asset.ready for thumbnails)
- lockSubmission mutation (triggered at deadline)
- getSubmissionForCircle query

**Analytics (PostHog):**
- submission_started, submission_photo_added, submission_video_added, submission_saved_draft, submission_completed

### Infrastructure

**Dependencies:**
- @capacitor/camera for mobile photo/video capture
- browser-image-compression for client-side photo compression
- Mux SDK for video upload and hosting
- Existing Convex storage for photos

**Deployment:**
- Deploy via existing Vercel pipeline
- Monitor via existing Sentry integration
- Track submission events in PostHog

## Implementation Strategy

**Phase 1: Design & Component Generation (Days 1-2)**
- Create Figma wireframes for submission screens (mobile-first)
- Design circle tabs with status indicators
- Design media grid layouts
- Use Figma MCP to generate initial React component code
- Design review and approval

**Phase 2: Backend & Data Layer (Day 3)**
- Set up Convex schema (submissions, responses, media tables)
- Implement Convex mutations/queries
- Set up Mux integration (upload action + webhook)
- Test data flows in isolation

**Phase 3: Frontend Implementation (Days 4-5)**
- Build submission UI components using Figma-generated code as starting point
- Integrate Convex for data persistence
- Implement auto-save with debounce
- Integrate Capacitor Camera for mobile
- Implement client-side image compression
- Integrate Mux video upload with blocking UI
- Build multi-circle tab navigation
- Implement deadline countdown and locking

**Phase 4: Testing & QA (Days 6-7)**
- Write unit tests for validation logic (80%+ coverage)
- Write integration tests for Convex functions
- Write E2E tests for critical submission flows
- Manual QA on real iOS/Android devices
- Test video upload end-to-end with Mux
- Fix bugs and retest

**Phase 5: Deploy (Continuous)**
- Code review with demo video
- CI validation
- Deploy to Vercel preview
- Merge and auto-deploy to production
- Smoke test and monitor

## Tasks Created
- [x] #126 - Design Figma wireframes and generate component code (parallel: true) ✅
- [x] #127 - Set up Convex schema and core mutations/queries (parallel: true) ✅
- [x] #128 - Implement Mux video integration and webhook handler (parallel: true) ✅
- [x] #129 - Build photo upload with Capacitor Camera and compression (parallel: false) ✅
- [x] #130 - Build video upload UI with Mux and blocking progress (parallel: false) ✅
- [x] #131 - Build multi-circle submission UI with auto-save and tabs (parallel: false) ✅
- [x] #132 - Implement deadline countdown and submission locking (parallel: true) ✅
- [x] #133 - Write comprehensive tests and perform manual QA (parallel: false) ✅
- [x] #134 - Code review, deploy, and monitor production (parallel: false) ✅

Total tasks: 9
Parallel tasks: 4
Sequential tasks: 5
Estimated total effort: 99-135 hours (approximately 7-9 days with parallel execution)
## Dependencies

**Blockers (must complete before starting):**
- Epic 0 (Project Setup) - requires Convex, Mux, Capacitor setup
- Epic 1 (Authentication) - users must be authenticated
- Epic 2 (Circle Creation) - circles and prompts must exist
- Epic 3 (Circle Membership) - users must be members to submit

**Enables (what this epic unlocks):**
- Epic 5 (Newsletter Experience) - requires submissions to compile newsletter

## Success Criteria (Technical)

**Functional:**
- [x] Users can create text + photo + video responses (any combination, max 3 media per response)
- [x] Auto-save works with 2-second debounce
- [x] Photos compress to <200KB client-side
- [x] Videos upload to Mux with blocking UI and progress indicator
- [x] Multi-circle tabs work seamlessly with independent drafts per circle
- [x] Submissions lock automatically at 10:59 AM UTC second Saturday
- [x] Users can edit responses until deadline
- [x] Camera and gallery access work on iOS/Android

**Performance:**
- [x] Photo upload completes in <5 seconds on typical mobile connection
- [x] Video upload shows accurate progress and blocks navigation
- [x] Auto-save doesn't interfere with typing performance

**Quality:**
- [x] 80%+ test coverage for validation logic
- [x] All submission flows have E2E tests
- [x] No critical bugs in production
- [x] Analytics events tracking properly
- [x] Mux video processing working end-to-end

## Estimated Effort

- **Total Timeline:** 7 days (70-90 hours)
- **Design:** 2 days (18-22 hours)
- **Implementation:** 3 days (35-45 hours)
- **Testing:** 2 days (17-23 hours)
- **Deploy:** Continuous throughout

**Critical Path:**
1. Design approval before implementation
2. Backend/schema setup before frontend work
3. Mux integration before video upload UI
4. Testing before deployment

**Team:**
- Frontend developer (primary)
- Backend developer (schema + Mux integration)
- Designer (Figma wireframes)
- QA tester (manual device testing)
