---
issue: 3
title: Set Up UI Framework
analyzed: 2026-02-07T04:52:24Z
estimated_hours: 2.5
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #3

## Overview
Install and configure shadcn/ui with tweakcn theme customization, set up Tailwind CSS design tokens, and install essential UI components. This is a frontend-focused setup task with limited parallelization potential due to sequential dependencies in the shadcn init process.

## Theme Configuration (tweakcn: 2s6y)
Theme URL: https://tweakcn.com/themes/cml1xy3s2000104jx5fum5gre

### Light Mode Colors
| Token | Value |
|-------|-------|
| Background | #efe6e6 |
| Foreground | #291334 |
| Card | #f8f1f1 |
| Primary | #953FE3 |
| Primary Foreground | #f8f3ff |
| Secondary | #ffc2b3 |
| Secondary Foreground | #4d1300 |
| Accent | #e9d1ff |
| Accent Foreground | #42027e |
| Muted | #e6dbdb |
| Border | #dad2cd |
| Input | #f8f1f1 |
| Ring | #42027e |

### Dark Mode Colors
| Token | Value |
|-------|-------|
| Background | #1f1e1e |
| Foreground | #efe6e6 |
| Card | #322f2f |
| Primary | #953FE3 |
| Primary Foreground | #f8f3ff |
| Secondary | #4d3028 |
| Accent | #42027e |
| Border | #2e2e2e |
| Input | #322f2f |
| Ring | #bb9bd9 |

### Typography
- Font Sans: Instrument Sans, ui-sans-serif, sans-serif, system-ui
- Font Serif: Instrument Serif, ui-serif, serif
- Font Mono: Courier Prime, ui-monospace, monospace

### Design Tokens
- Border Radius: 0.625rem
- Spacing: 0.25rem
- Letter Spacing: 0em
- Shadow Color: oklch(0 0 0)
- Shadow Opacity: 0.1

## Parallel Streams

### Stream A: Core Setup & Theme Configuration
**Scope**: Initialize shadcn/ui, configure Tailwind CSS, apply tweakcn theme, set up CSS variables and dark mode
**Files**:
- `components.json` (shadcn config)
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/lib/utils.ts`
**Agent Type**: frontend-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

### Stream B: Component Installation
**Scope**: Install essential shadcn components after core setup is complete
**Files**:
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`
**Agent Type**: frontend-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 1.0
**Dependencies**: Stream A (shadcn must be initialized first)

## Coordination Points

### Shared Files
- `package.json` - Stream A adds core deps, Stream B adds component deps (both via npx shadcn commands)
- `src/lib/utils.ts` - Created by Stream A, used by Stream B components

### Sequential Requirements
1. shadcn/ui must be initialized before components can be installed
2. Tailwind config must exist before theme customization
3. CSS variables must be set up before dark mode works

## Conflict Risk Assessment
- **Low Risk**: Streams are naturally sequential due to shadcn's architecture
- The `npx shadcn` CLI handles file creation/modification atomically
- No manual file editing conflicts expected

## Parallelization Strategy

**Recommended Approach**: sequential

This task has limited parallelization potential because:
1. `npx shadcn@latest init` must complete before any components can be added
2. Components are installed one at a time via CLI
3. All work is in the same domain (frontend/UI setup)

However, Stream A can be optimized by running theme configuration in parallel with component installation planning.

## Expected Timeline

With parallel execution:
- Wall time: 2.0 hours (minor optimization)
- Total work: 2.5 hours
- Efficiency gain: 20%

Without parallel execution:
- Wall time: 2.5 hours

## Notes
- This is a small task (Size: S) where parallelization overhead may exceed benefits
- Recommend running as a single focused stream with the frontend-specialist agent
- The sequential nature of shadcn CLI commands limits true parallelization
- Consider combining into a single stream for efficiency
