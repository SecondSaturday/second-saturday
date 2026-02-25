---
issue: 175
completed: 2026-02-25T03:25:00Z
status: completed
---

# Issue #175: Newsletter month picker and response cards

## Completed Changes

### Month Picker
**File**: `src/components/newsletter/NewsletterView.tsx`
- Dropdown menu showing current month label
- `availableNewsletters` prop populates options
- `onNewsletterSelect` callback for browsing past issues
- Centered below circle name with settings gear

### Settings Gear
**File**: `src/components/newsletter/NewsletterView.tsx`
- Gear icon next to month picker
- Links to `/dashboard/circles/[circleId]/settings`
- Hover state with `hover:bg-muted`

### Response Cards
**File**: `src/components/newsletter/PromptSection.tsx`
- Responses grouped in `bg-card rounded-xl p-4` container
- Prompt title above card with serif font

### Member Response with Avatar
**File**: `src/components/newsletter/MemberResponse.tsx`
- Avatar component with `AvatarImage` and `AvatarFallback`
- Initials fallback using `getInitials()` function
- Bold name (`font-semibold`) + text layout
- `showDivider` prop for `border-t border-border` between responses
- Media grid for images/videos with lightbox

## Files Modified
- `src/components/newsletter/NewsletterView.tsx`
- `src/components/newsletter/PromptSection.tsx`
- `src/components/newsletter/MemberResponse.tsx`

## Notes
- All 918 tests pass
- Works on mobile and desktop
- Responsive avatar sizing with `size-10`
