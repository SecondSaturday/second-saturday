---
issue: 100
stream: E2E Tests — User-Facing Flows
agent: frontend-specialist
started: 2026-02-22T05:14:57Z
updated: 2026-02-22T05:18:11Z
status: completed
---

# Stream C: E2E Tests — User-Facing Flows

## Scope
Test Playwright flows: newsletter web view, archive display, auth requirements, navigation, unsubscribe.

## Files
- `e2e/newsletter-view.spec.ts` (new)
- `e2e/newsletter-archive.spec.ts` (new)

## Tests Written

### `e2e/newsletter-view.spec.ts` (9 tests)

**Newsletter View Page**
- newsletter page requires authentication (protected route)
- newsletter page loads without server errors
- newsletter page shows loading state while data loads
- newsletter page shows "not found" for invalid newsletter ID
- newsletter page shows back button that links to circle dashboard
- newsletter page displays circle name and issue number when newsletter exists
- newsletter page displays publication date
- newsletter page displays prompt sections with member responses

**Newsletter View - Navigation**
- back button navigates to circle dashboard

### `e2e/newsletter-archive.spec.ts` (9 tests)

**Newsletter Archive - Circle Home**
- circle home page shows "Newsletters" section heading
- newsletter archive section is visible on circle home
- newsletter archive shows newsletter list when newsletters exist
- newsletter items show issue number and date
- newsletter items are clickable and navigate to newsletter view page
- newsletter archive shows read/unread indicators
- newsletter archive shows latest newsletter with highlighted styling
- empty archive state is handled gracefully

**Newsletter Archive - Authentication**
- newsletter archive requires being a circle member (part of circle home)

## Completed
- Created `e2e/newsletter-view.spec.ts` with 9 tests
- Created `e2e/newsletter-archive.spec.ts` with 9 tests
- All tests use `setupClerkTestingToken` for auth
- All tests use `test.skip()` pattern for missing data
- TypeScript compilation passes with no errors
