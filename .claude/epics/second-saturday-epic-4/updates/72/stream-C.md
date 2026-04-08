---
issue: 72
stream: Test Run, Bug Hunt and Fixes
agent: fullstack-specialist
started: 2026-02-18T15:06:06Z
updated: 2026-02-18T18:25:00Z
status: completed
---

# Stream C: Test Run, Bug Hunt & Fixes

## Scope
Run the full test suite, analyze failures, fix bugs, retest until all pass.

## Final Result
**41 test files, 590 tests — all passing**

## Bugs Found and Fixed

### Pre-existing failures fixed (5 total)

1. **accessibility.test.tsx** — "date picker button is keyboard accessible"
   - Root cause: `tab()` landed on avatar link before date picker; pressing Enter triggered navigation
   - Fix: `tab()` twice to skip the link and reach the date picker button

2. **LeaveCircleModal.test.tsx** — "navigates to dashboard after successful leave"
   - Root cause: test checked `mockPush` but component calls `router.replace('/dashboard')`
   - Fix: mock and assert `mockReplace` instead

3. **SettingsPage.test.tsx** — "password section visible when passwordEnabled is true"
   - Root cause: both a CardTitle and a Button have text "Change Password"; `getByText` throws on multiple matches
   - Fix: use `getAllByText('Change Password').length > 0`

4. **SettingsPage.test.tsx** — "delete account flow shows confirmation dialog"
   - Root cause: Radix UI Dialog needs `userEvent` (realistic events) to open via trigger; `getByText` can't match text split across `<span>` elements
   - Fix: use `userEvent.click`, `waitFor`, and `getByPlaceholderText('DELETE')` instead

5. **MediaUploader.test.tsx** — "calls onUploadComplete callback on success"
   - Root cause: `onUploadComplete` signature is `(id, type)` but test only expected `(id)`
   - Fix: assert `toHaveBeenCalledWith('test-media-id', 'image')`

## Commits
- `fix(#72): fix 3 pre-existing test failures`
- `fix(#72): fix 2 additional pre-existing test failures`
