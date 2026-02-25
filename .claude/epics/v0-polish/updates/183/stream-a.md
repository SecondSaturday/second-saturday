---
issue: 183
stream: Members List Skeleton
agent: general-purpose
started: 2026-02-25T03:56:41Z
status: completed
completed: 2026-02-25T04:12:00Z
---

# Stream A: Members List Skeleton

## Scope
Replace spinner in Members tab of CircleSettings with skeleton rows

## Files
- `src/components/CircleSettings.tsx`

## Results

### Loading Condition Found
The original implementation had a global loading guard at lines 67-73 that showed a spinner when `members === undefined`. However, the Members tab content (lines 359-407) did not have its own tab-specific loading state and directly rendered the member list.

### Skeleton Implementation
Added a conditional check within the Members `TabsContent` to display skeleton rows when `members === undefined`:
- 4 skeleton rows that match the real member row layout
- Each row contains:
  - Avatar skeleton: `size-10 rounded-full bg-muted animate-pulse` (40px circle)
  - Name bar: `h-4 w-32 rounded bg-muted animate-pulse` (128px wide, 16px tall)
  - Role bar: `h-3 w-16 rounded bg-muted animate-pulse` (64px wide, 12px tall)
- Wrapped in the same card styling as real member rows: `flex items-center gap-3 rounded-lg border border-border bg-card p-3`
- Uses only Tailwind utility classes (no skeleton component imports)

### Commit
SHA: `d4fade1`
Message: `feat(#183): add members list skeleton to CircleSettings`
