---
issue: 185
title: Onboarding — SSO pre-population, first/last name fields, floating labels, mobile-only logo
analyzed: 2026-02-25T04:07:42Z
estimated_hours: 3.0
parallelization_factor: 1.3
---

# Parallel Work Analysis: Issue #185

## Overview

Polish the complete-profile onboarding page with 4 changes:
1. SSO pre-population of avatar + name from Clerk `useUser()`
2. Split single "Display Name" field into separate "First Name" + "Last Name" fields
3. Floating label animation on both name inputs
4. Mobile-only logo (`md:hidden`)

**Schema decision (pre-decided)**: The users table has a single `name` field. No `firstName`/`lastName` fields exist. Adding them requires a schema migration and changes to all queries that return `name`. The safer path (confirmed by PRD) is to **compose on save**: store `${firstName} ${lastName}` into `name`, keep the schema unchanged. No `convex/schema.ts` or `convex/users.ts` changes needed.

**Files touched**:
- `src/components/ui/FloatingLabelInput.tsx` — new component (no existing deps, pure UI)
- `src/app/complete-profile/page.tsx` — page changes (uses FloatingLabelInput)

These two are separate files and could be parallelized. However, the page agent would need FloatingLabelInput to already exist when it runs (to avoid import errors at commit time). Since FloatingLabelInput is ~30-40 lines and very fast to build, **the practical approach is a single agent** that builds FloatingLabelInput first, then updates the page. No real wall-time gain from splitting, and avoids coordination overhead.

## Parallel Streams

### Stream A: Onboarding Page Overhaul (Single Stream)
**Scope**: FloatingLabelInput component + complete-profile page changes (SSO pre-pop, split name fields, mobile logo)
**Files**:
- `src/components/ui/FloatingLabelInput.tsx` — create new
- `src/app/complete-profile/page.tsx` — update existing
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 3.0
**Dependencies**: none

**Implementation detail**:

**Step 1 — FloatingLabelInput component** (`src/components/ui/FloatingLabelInput.tsx`):
```tsx
'use client'
import { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, id, className, value, defaultValue, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const hasValue = Boolean(value || defaultValue)
    const floated = focused || hasValue

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'peer w-full rounded-md border border-input bg-background px-3 pb-2 pt-5 text-sm ring-offset-background',
            'placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className,
          )}
          placeholder={label}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'absolute left-3 cursor-text text-muted-foreground transition-all duration-200',
            floated ? 'top-1.5 text-xs' : 'top-3 text-sm',
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingLabelInput.displayName = 'FloatingLabelInput'
```

**Step 2 — complete-profile/page.tsx changes**:

State: replace `const [name, setName] = useState('')` with:
```tsx
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
```

SSO pre-population: add `useUser` import from `@clerk/nextjs`, then add a useEffect:
```tsx
const { user } = useUser()
useEffect(() => {
  if (user) {
    if (user.firstName && !firstName) setFirstName(user.firstName)
    if (user.lastName && !lastName) setLastName(user.lastName)
  }
}, [user])
```
For avatar pre-pop: the ImageUpload component takes `onUpload` for storage upload. Pre-populating it from `user.imageUrl` is trickier since it shows a storage-based image, not a URL. **Skip avatar pre-pop** — the Convex `upsertUser` webhook already syncs `imageUrl` from Clerk on sign-in, so the avatar is already set for SSO users when they reach this page.

Submit handler: compose name on save:
```tsx
const trimmedFirst = firstName.trim()
const trimmedLast = lastName.trim()
if (!trimmedFirst) return
const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ')
await updateProfile({ name: fullName, ... })
```

Disable condition: `!firstName.trim() || saving`

Mobile-only logo: add `className="md:hidden"` to the `<Image src="/icon.svg" ...>` element.

Replace the single name input block with two FloatingLabelInput fields:
```tsx
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput'
// ...
<FloatingLabelInput id="first-name" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
<FloatingLabelInput id="last-name" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
```

Remove the `<label>` + `<Input>` block and the `import { Input }` (if no longer used).

## Coordination Points

### Shared Files
None — the two files are independent of all other epic tasks.

### Sequential Requirements
1. FloatingLabelInput must exist before page imports it — handled by single-agent sequential approach.

## Conflict Risk Assessment

- **No Risk**: Both files are isolated from other issue streams. `complete-profile/page.tsx` and `src/components/ui/FloatingLabelInput.tsx` are not touched by any other epic task (#182-#184 done, #186 not started).

## Parallelization Strategy

**Recommended Approach**: sequential (single stream)

The FloatingLabelInput dependency on the page makes true parallelization awkward without coordination overhead. A single agent builds FloatingLabelInput first (~10 min), then updates the page (~20 min). No wall-time benefit from splitting.

## Expected Timeline

With single agent:
- Wall time: 3.0 hours
- Total work: 3.0 hours

## Notes

- **Avatar pre-pop**: Skip the ImageUpload pre-population — the Convex webhook (`upsertUser`) already syncs Clerk's `imageUrl` on every sign-in, so SSO users already have their avatar stored. The ImageUpload is for overriding/changing it.
- **Schema unchanged**: `name` field stores the composed full name. No schema migration needed.
- **`useUser` null safety**: `user` from `useUser()` is null before Clerk loads — the `useEffect` guard `if (user)` handles this.
- **Last name optional**: Last name should NOT be `required` — not all users have a last name.
- **`useUser` dep array**: The `useEffect` for SSO pre-pop should run once when `user` first becomes non-null. Using `[user]` as dep is correct; the `if (user && !firstName)` guard prevents overwriting user edits.
