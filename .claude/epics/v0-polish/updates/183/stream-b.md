---
issue: 183
stream: Newsletter View Skeleton
agent: general-purpose
started: 2026-02-25T03:56:41Z
status: completed
completed: 2026-02-25T04:02:15Z
---

# Stream B: Newsletter View Skeleton

## Scope
Replace spinner in NewsletterView with skeleton layout

## Files
- `src/components/newsletter/NewsletterView.tsx`

## Results

### Loading Condition Found
The NewsletterView component did not have its own loading state previously. It was a pure presentational component that received data as props. The loading spinners were handled in the parent pages (`src/app/dashboard/circles/[circleId]/page.tsx` and `src/app/dashboard/circles/[circleId]/newsletter/[newsletterId]/page.tsx`) which showed a centered spinner when `newsletter === undefined`.

### Skeleton Markup Added
Added an optional `isLoading` prop to the NewsletterView component with the following skeleton layout:

```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      {/* Cover block skeleton */}
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />

      {/* Heading bars skeleton */}
      <div className="mt-4 flex flex-col items-center gap-2 px-4">
        <div className="h-7 w-[70%] animate-pulse rounded bg-muted" />
        <div className="h-5 w-[40%] animate-pulse rounded bg-muted" />
      </div>

      {/* Article card placeholders */}
      <div className="space-y-4 px-4">
        <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}
```

The skeleton includes:
- Full-width cover block (200px tall) with `rounded-lg bg-muted animate-pulse`
- Two centered heading bars (70% and 40% width, 28px and 20px tall respectively)
- Three article card placeholders (160px tall each) with spacing
- Proper padding/spacing matching the real newsletter layout

### Commit SHA
`620c07c`
