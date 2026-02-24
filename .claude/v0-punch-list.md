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

*(empty — epic not yet executed)*

---

## Found During Epic 3 (v0-redesigns) Validation

*(empty — epic not yet executed)*

---

## Found During Epic 4 (v0-polish) Validation

*(empty — epic not yet executed)*

---

## Found During Final QA

*(empty — not yet started)*
