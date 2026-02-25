---
issue: 174
title: Newsletter header redesign with serif font
analyzed: 2026-02-25T01:48:50Z
estimated_hours: 3.5
parallelization_factor: 2.0
---

# Parallel Work Analysis: Issue #174

## Overview
Redesign the newsletter header with a cover image banner, serif font for circle name, and fix PL4 (null image URLs). This involves font configuration, component redesign, and data flow fixes across multiple files.

## Parallel Streams

### Stream A: Font Infrastructure
**Scope**: Add serif font to the project and configure Tailwind
**Files**:
- `src/app/layout.tsx`
- `tailwind.config.ts`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 0.5
**Dependencies**: none

### Stream B: PL4 Fix (Image URL Passthrough)
**Scope**: Fix null image URLs by passing actual circle.iconUrl/coverUrl from queries
**Files**:
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/circles/[circleId]/page.tsx`
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 1.0
**Dependencies**: none

### Stream C: Newsletter Header Redesign
**Scope**: Redesign NewsletterView header with ProfileHeaderImageLayout, serif styling, and PromptSection updates
**Files**:
- `src/components/newsletter/NewsletterView.tsx`
- `src/components/newsletter/PromptSection.tsx`
**Agent Type**: frontend-specialist
**Can Start**: after Stream A completes (needs font-serif class)
**Estimated Hours**: 2.0
**Dependencies**: Stream A (font classes must exist)

## Coordination Points

### Shared Files
None - each stream works on distinct files.

### Sequential Requirements
1. Font infrastructure (Stream A) must complete before header redesign (Stream C) can use `font-serif` class
2. Stream B (PL4 fix) is independent and can run in parallel with A

## Conflict Risk Assessment
- **Low Risk**: All streams work on completely different files
- No shared type files or configuration conflicts expected

## Parallelization Strategy

**Recommended Approach**: hybrid

Launch Streams A & B simultaneously. Start Stream C when A completes.

```
Timeline:
├── Stream A: Font Infrastructure (0.5h) ──────┐
├── Stream B: PL4 Fix (1.0h) ──────────────────┤
└── Stream C: Header Redesign (2.0h) ──────────┘ (starts after A)
```

## Expected Timeline

With parallel execution:
- Wall time: 2.5 hours (A: 0.5h → C: 2.0h, while B runs in parallel)
- Total work: 3.5 hours
- Efficiency gain: 29%

Without parallel execution:
- Wall time: 3.5 hours

## Notes
- Issue 174 conflicts with issue 175 (per local task file) — coordinate if both are in progress
- Design input from Figma is recommended for header layout decisions
- ProfileHeaderImageLayout component must support `editable={false}` display mode
- Test that serif font loads correctly on both mobile and desktop
