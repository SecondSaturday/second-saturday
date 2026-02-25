---
issue: 174
completed: 2026-02-25T03:25:00Z
status: completed
---

# Issue #174: Newsletter header redesign with serif font

## Completed Changes

### Font Infrastructure (Already Present)
**Files**: `src/app/layout.tsx`, `src/app/globals.css`
- `Instrument_Serif` font imported via next/font/google
- CSS variable `--font-instrument-serif` configured
- `font-serif` Tailwind class available via `@theme` block

### PL4 Fix - Actual Image URLs
**Files**: `src/app/dashboard/page.tsx`, `src/app/dashboard/circles/[circleId]/page.tsx`
- Both pages pass `circle.iconUrl ?? null` and `circle.coverUrl ?? null`
- No longer hardcoded to null

### Newsletter Header Redesign
**File**: `src/components/newsletter/NewsletterView.tsx`
- Uses `ProfileHeaderImageLayout` with `editable={false}` for cover banner
- Circle name rendered with `font-serif text-2xl`
- Issue number and date shown in muted text below
- Simplified header structure

### PromptSection Headings
**File**: `src/components/newsletter/PromptSection.tsx`
- Prompt titles use `font-serif text-lg`

## Files Modified
- `src/app/layout.tsx` (pre-existing font config)
- `src/app/globals.css` (pre-existing font-serif class)
- `src/app/dashboard/page.tsx` (PL4 fix)
- `src/app/dashboard/circles/[circleId]/page.tsx` (PL4 fix)
- `src/components/newsletter/NewsletterView.tsx` (header redesign)
- `src/components/newsletter/PromptSection.tsx` (serif headings)

## Notes
- All 918 tests pass
- Serif font (Instrument Serif) provides elegant typography for newsletter
