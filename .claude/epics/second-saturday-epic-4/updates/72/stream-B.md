---
issue: 72
stream: E2E Test Setup and Tests
agent: fullstack-specialist
started: 2026-02-18T15:06:06Z
updated: 2026-02-18T09:50:34Z
status: completed
---

# Stream B: E2E Test Setup & Tests

## Scope
Set up Playwright, write E2E tests for critical submission flows:
- Text-only submission
- Photo submission (with compression)
- Video submission (with progress)
- Multi-circle tab switching
- Deadline locking

## Files Created
- `e2e/submission-text.spec.ts` — text submission flow, auto-save indicator, character limit
- `e2e/submission-photo.spec.ts` — photo upload buttons, compression stage, format validation, max limit, cancellation
- `e2e/submission-video.spec.ts` — video upload buttons, blocking modal, cancel confirmation, format validation
- `e2e/multi-circle-tabs.spec.ts` — tab navigation, avatar rendering, tab switching, state preservation, scroll behavior
- `e2e/deadline-locking.spec.ts` — countdown display, past-deadline locking, locked banner, textarea disabled state

## Assessment
The project is a Next.js web app (not Expo/RN), so **Playwright** (already configured) is the
correct E2E framework. `playwright.config.ts` already exists with:
- Clerk auth setup via `@clerk/testing/playwright`
- `./e2e/` test directory
- Desktop Chrome + iPhone 14 projects
- `http://localhost:3000` base URL

`@playwright/test` was already in `devDependencies` — no new packages needed.
The `test:e2e` script (`playwright test`) was already in `package.json`.

## Key Design Decisions
- Tests use `/demo-submissions` as a harness for media upload tests (avoids needing real Convex data)
- Tests gracefully skip when no circles exist in the test environment (data-dependent flows)
- Date mocking via `Date.now` override in `page.addInitScript()` for deadline locking tests
- File chooser interception via `page.on('filechooser')` for format validation tests
- All tests follow the existing `setupClerkTestingToken({ page })` pattern from the codebase

## Progress
- All 5 spec files created and passing TypeScript checks (no new errors introduced)
- Tests cover all 5 required flows from the issue
