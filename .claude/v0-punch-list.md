# V0 Punch List

Issues discovered during epic execution that need a final cleanup pass after all 4 epics complete.
Do NOT fix these inline — they go here so the flow stays organized.

**When to fix:** After Epics 1-4 are merged. One focused cleanup session.

---

## Found During Epic 1 (v0-plumbing) Validation

### PL1 — `getVideosByCircle` query has no auth check [P1] [AUTO]
**Current:** `convex/videos.ts:184-193` — the `getVideosByCircle` query is a public `query` with no `getAuthUser()` or `requireMembership()` call. Any caller can fetch all videos for any circle by ID. The other 4 video functions in the same file were secured in Epic 1, but this one was missed because it wasn't in the original issue list.
**Desired:** Add `getAuthUser(ctx)` and `requireMembership(ctx, user._id, args.circleId)` at the top of the handler, matching the pattern used on `getVideo`, `getVideosByUser`, and `deleteVideo` in the same file.
**Files:** `convex/videos.ts`

---

## Found During Epic 2 (v0-navigation) Validation

### PL2 — ProfileHeaderImageLayout not integrated into any page [P2]
**Current:** `src/components/ProfileHeaderImageLayout.tsx` exists with edit/display modes but is not imported or used anywhere in the app. CircleSettings still uses two separate `ImageUpload` components (lines 226-237). The invite page and newsletter view also don't use it.
**Desired:** Integrate into CircleSettings Details tab (edit mode), CreateCircle page (edit mode), invite page (display mode), and newsletter view header (display mode). This is expected to happen in Epic 3 (G9) and Epic 4 (M1).
**Files:** `src/components/ProfileHeaderImageLayout.tsx`, `src/components/CircleSettings.tsx`, `src/app/dashboard/create/page.tsx`, `src/app/invite/[inviteCode]/page.tsx`, `src/components/newsletter/NewsletterView.tsx`

### PL3 — ProfileHeaderImageLayout interface mismatch with ImageUpload [P1]
**Current:** `ProfileHeaderImageLayout` accepts `onCoverUpload?: (file: File) => void` and `onIconUpload?: (file: File) => void` — passing raw `File` objects. But the existing `ImageUpload` component's `onUpload` callback passes a Convex `Id<'_storage'>` (storage ID after upload). These are different interfaces.
**Desired:** When integrating the component into CircleSettings, either: (a) adapt `ProfileHeaderImageLayout` to handle the full upload-to-storage flow internally (accept storage IDs), or (b) wrap the raw File in upload logic at the call site. Must resolve before G9 integration.
**Files:** `src/components/ProfileHeaderImageLayout.tsx`

### PL4 — Newsletter view passes null for circle icon and cover URLs [P1]
**Current:** In `src/app/dashboard/page.tsx` (line 120) and `src/app/dashboard/circles/[circleId]/page.tsx` (line 94), the `NewsletterView` is rendered with `iconUrl: null` and `coverUrl: null` hardcoded, even though the circle data from the query includes `circle.iconUrl` and `circle.coverUrl`. Newsletter headers will never show the circle's actual icon or cover image.
**Desired:** Pass the actual circle image URLs through to `NewsletterView` so the header can display them. This is prerequisite for the K2 newsletter header redesign in Epic 3.
**Files:** `src/app/dashboard/page.tsx`, `src/app/dashboard/circles/[circleId]/page.tsx`

### PL5 — FAB component naming is misleading after repurpose [P2]
**Current:** The FAB component is still named `CreateCircleFAB` (`src/components/dashboard/CreateCircleFAB.tsx`) and its `data-testid` is still `"create-circle-button"` (line 18), even though it now navigates to `/dashboard/submit` for submissions, not circle creation.
**Desired:** Rename component to `SubmitFAB` (or similar), update the file name, update the test ID to `"submit-button"`, and update all imports.
**Files:** `src/components/dashboard/CreateCircleFAB.tsx`, `src/app/dashboard/page.tsx`, any test files referencing the old name

---

## Found During Epic 3 (v0-redesigns) Validation

*(empty — epic not yet executed)*

---

## Found During Epic 4 (v0-polish) Validation

*(empty — epic not yet executed)*

---

## Found During Final QA

*(empty — not yet started)*
