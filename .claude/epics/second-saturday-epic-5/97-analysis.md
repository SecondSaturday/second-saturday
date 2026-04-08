---
issue: 97
title: Build newsletter web view page and UI components
analyzed: 2026-02-21T10:31:38Z
estimated_hours: 5
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #97

## Overview
Create the in-app newsletter viewing page and components: NewsletterView, PromptSection, MemberResponse. Page at `dashboard/circles/[circleId]/newsletter/[newsletterId]`.

## Parallel Streams

### Stream A: Page + Components (Single Stream)
**Scope**: Newsletter page and all UI components
**Files**:
- `src/app/dashboard/circles/[circleId]/newsletter/[newsletterId]/page.tsx`
- `src/components/newsletter/NewsletterView.tsx`
- `src/components/newsletter/PromptSection.tsx`
- `src/components/newsletter/MemberResponse.tsx`
**Agent Type**: frontend-specialist
**Can Start**: immediately (depends on #93, already done)
**Estimated Hours**: 5
**Dependencies**: none remaining

## Coordination Points

### Shared Files
- None. All new files in new directories.

### Sequential Requirements
1. Uses `getNewsletterById` query from #93 (done)
2. Uses `markNewsletterRead` mutation from existing `convex/newsletterReads.ts`
3. Newsletter content is stored as `htmlContent` string - need to decide rendering approach

## Conflict Risk Assessment
- **Low Risk**: All new files, no shared modifications

## Parallelization Strategy
**Recommended Approach**: sequential (single cohesive UI feature)

## Notes
- Follow existing page pattern: `'use client'`, `useParams()`, `useQuery()`, handle undefined/null states
- `@mux/mux-player-react` NOT installed. Videos use Mux thumbnail URLs with play overlay (linking to web view)
- Reuse existing `MediaGrid` from `src/components/submissions/MediaGrid.tsx`
- Reuse `VideoThumbnail` from `src/components/submissions/VideoThumbnail.tsx`
- Standard layout: `min-h-dvh flex flex-col bg-background`
- Loading: spinner. Not found: message + back link.
- Call `markNewsletterRead` on mount via `useMutation`
- Newsletter `htmlContent` can be rendered via `dangerouslySetInnerHTML` or parsed into structured data
- Structured approach preferred: parse newsletter data into prompt sections for native rendering
