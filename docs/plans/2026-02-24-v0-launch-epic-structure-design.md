# V0 Launch Epic Structure Design

**Date:** 2026-02-24
**Source:** `.claude/v0-launch-issues.md` (82 active issues + 2 structural decisions)
**Goal:** Ship V0 by dividing issues into 4 parallelizable epics across 2 work streams

---

## Work Streams

| Stream | Mode | Worker | Design Input |
|--------|------|--------|--------------|
| **A** (autonomous) | Agent runs in worktree, PR reviewed at end | Agent only | None |
| **B** (hands-on) | Issue-by-issue live, iterative with designs | You + Agent | Figma for major redesigns, verbal/screenshots for polish |

---

## Epic 1: Plumbing

**Stream:** A (autonomous)
**Parallel with:** Epic 2
**Issues:** 22
**PRD name:** `v0-plumbing`

### Contents

| # | ID | Severity | Description |
|---|-----|----------|-------------|
| 1 | A1 | P0 | Newsletter idempotency guard |
| 2 | A2 | P0 | cycleId local time to UTC |
| 3 | A3 | P0 | Auto-save race condition after Submit |
| 4 | A4 | P1 | Locked status derivation + cron fix |
| 5 | P1 | P1 | createVideo auth + remove spoofable userId |
| 6 | P2 | P1 | getVideo auth check |
| 7 | P3 | P1 | getVideosByUser auth check |
| 8 | P4 | P1 | deleteVideo auth check |
| 9 | P5 | P1 | getUserByClerkId auth check |
| 10 | P6 | P1 | getMembershipCount auth check |
| 11 | B3 | P1 | Submit button catch block |
| 12 | B4 | P1 | Profile save toast error |
| 13 | B5 | P1 | Account deletion toast error |
| 14 | B6 | P1 | CircleSettings image upload error handling |
| 15 | B7 | P1 | Clipboard copy try/catch + fallback |
| 16 | C1 | P1 | Display name empty string validation |
| 17 | C2 | P1 | Circle name edit min length validation |
| 18 | D1 | P2 | OneSignal console.log leaks |
| 19 | D2 | P2 | Debug console.log removal |
| 20 | D3 | P2 | Demo submissions page guard |
| 21 | D4 | P2 | ObjectURL memory leak |
| 22 | A5 | P2 | Orphan media record cleanup |

**Key files:** `convex/submissions.ts`, `convex/newsletters.ts`, `convex/videos.ts`, `convex/users.ts`, `convex/memberships.ts`, `convex/crons.ts`, `src/app/dashboard/settings/page.tsx`, `src/components/CircleSettings.tsx`, `src/screens/submissions/MultiCircleSubmissionScreen.tsx`, `src/lib/onesignal.ts`, `src/components/circles/ImageUpload.tsx`

**No dependencies between issues.** Can be done in any order.

---

## Epic 2: Navigation & Structure

**Stream:** B (hands-on)
**Parallel with:** Epic 1
**Issues:** 14
**PRD name:** `v0-navigation`

### Contents (in dependency order)

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 1 | F4 | P1 | Three-dot menu with "Create a circle" | Verbal |
| 2 | F2 | P0 | Top-level /dashboard/submit page | Reference screenshot |
| 3 | F1 | P0 | FAB repurpose to /dashboard/submit | None (route change) |
| 4 | F3 | P1 | Remove dead bell icon | None |
| 5 | S1 | — | Extract shared PromptsEditor component | None (refactor) |
| 6 | F6 | P1 | Circle click lands on newsletter | Live review |
| 7 | J2 | P1 | Remove Make Submission nav card | Verbal |
| 8 | G1 | P1 | 4-tab settings layout (shell) | Figma or reference screenshot |
| 9 | G2 | P1 | Remove Configure Prompts row | None (follows G1) |
| 10 | G3 | P1 | Members into Members tab | None (follows G1) |
| 11 | S2 | — | ProfileHeaderImageLayout component | Figma recommended |
| 12 | B1 | P0 | error.tsx files | None |
| 13 | B2 | P0 | global-error.tsx | None |
| 14 | B8 | P2 | not-found.tsx | None |

### Dependency chain
```
F4 → F2 → F1 (menu before submit page before FAB)
S1 → G1 (shared prompts before tab shell)
F6 → J2 (newsletter landing before removing CircleHome nav)
G1 → G2, G3 (tab shell before tab contents)
S2 has no deps (can be built anytime)
B1, B2, B8 have no deps (slot in anywhere)
```

---

## Epic 3: Screen Redesigns

**Stream:** B (hands-on)
**Starts after:** Epic 2 complete
**Issues:** 25
**PRD name:** `v0-redesigns`

### Contents (grouped by screen)

**Newsletter View (5):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 1 | K2 | P1 | Newsletter header redesign | Figma |
| 2 | K3 | P1 | Month picker + settings gear | Figma |
| 3 | K4 | P2 | Simplify page header bar | Verbal |
| 4 | K5 | P2 | Response cards with avatars + dividers | Figma |
| 5 | K7 | P2 | Serif font for section headings | Verbal |

**Circle Settings Details Tab (7):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 6 | G9 | P2 | Apply ProfileHeaderImageLayout (edit mode) | Component exists from S2 |
| 7 | G4 | P1 | Fix cover crop aspect ratio (3:1) | None (bug fix) |
| 8 | G5 | P2 | Stats as 3 separate tiles | Reference screenshot |
| 9 | G6 | P2 | Stat tile order | None |
| 10 | G7 | P2 | "Issues Sent" capitalization | None |
| 11 | G8 | P2 | Created stat month+year only | None |
| 12 | G10+G11 | P2 | Full-width leave button, remove heading | Verbal |

**Circle Settings Prompts Tab (3):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 13 | H1 | P1 | Browse Prompt Library row | Verbal |
| 14 | H2 | P1 | Dedicated Prompt Library page | Reference screenshot |
| 15 | H3 | P2 | Prompt counter as section heading | Verbal |

**Circle Settings Members Tab (5):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 16 | I1 | P1 | Three-dot menu per member row | Verbal |
| 17 | I2 | P2 | "You" for current user | None |
| 18 | I3 | P2 | Unified role labels | Verbal |
| 19 | I5 | P2 | Remove joined date | None |
| 20 | I6 | P2 | Inline member count header | None |

**Submission Input (3):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 21 | J1 | P1 | Media upload without text prerequisite | None (logic fix) |
| 22 | J3 | P2 | Single "+" button action sheet | Reference screenshot |
| 23 | J4 | P2 | Dark card/bubble input styling | Reference screenshot |

**Clerk + Date Picker (2):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 24 | O1 | P1 | Clerk UserProfile inline replacement | None (drop-in) |
| 25 | F5 | P1 | Month picker UI + wire to data | Reference screenshot |

---

## Epic 4: Polish & Onboarding

**Stream:** B (hands-on)
**Starts after:** Epic 3 substantially complete
**Issues:** 21
**PRD name:** `v0-polish`

### Contents (grouped by area)

**Circle Creation Flow (8):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 1 | L1 | P1 | Intro splash screen | Figma |
| 2 | L2 | P2 | Step progress indicator | Reference screenshot |
| 3 | L3 | P2 | Form max-width container | Verbal |
| 4 | L5 | P2 | Fixed bottom CTA bar | Verbal |
| 5 | L6 | P2 | Prompts step max-width | Verbal |
| 6 | L7 | P2 | Prompts CTA bottom padding | Verbal |
| 7 | L9 | P2 | Setup complete CTA padding | Verbal |
| 8 | L10 | P3 | Warmer setup complete copy | Verbal (copywriting) |

**Profile Setup / Onboarding (5):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 9 | N1 | P1 | Logo only on mobile | Verbal |
| 10 | N2 | P1 | Pre-populate avatar from SSO | None (logic) |
| 11 | N3 | P1 | Pre-populate name from SSO | None (logic) |
| 12 | N4 | P2 | First/Last name fields | Verbal |
| 13 | N5 | P2 | Floating label input pattern | Reference screenshot |

**Invite Page (3):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 14 | M1 | P2 | ProfileHeaderImageLayout on invite | Component exists from S2 |
| 15 | M2 | P2 | Warmer invite copy | Verbal (copywriting) |
| 16 | C3 | P2 | "1 member" pluralization | None |

**Dashboard + Prompts (2):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 17 | F7 | P2 | Center date picker in header | Verbal |
| 18 | H4 | P2 | Prompts back arrow to settings | None |

**Accessibility + Loading (3):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 19 | Q1 | P2 | Aria-labels on icon buttons | None |
| 20 | Q2 | P2 | Members list loading skeleton | None |
| 21 | Q3 | P2 | Newsletter loading skeleton | None |

**Dead Code + Data Integrity (6):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 22 | E1 | P2 | dropdown-menu.tsx cleanup | None |
| 23 | E2 | P2 | VideoThumbnail cleanup | None |
| 24 | E3 | P2 | Push notification wrappers cleanup | None |
| 25 | E4 | P2 | Email template wrappers cleanup | None |
| 26 | R1 | P2 | Save button concurrent mutation guard | None |
| 27 | R2 | P2 | Newsletter publishedAt index | None |

**Backlog (1):**

| # | ID | Severity | Description | Design Input |
|---|-----|----------|-------------|-------------|
| 28 | F8 | P3 | Resizable sidebar | Skip if time-constrained |

---

## Execution Flow

```
Week 1:
  Stream A: Epic 1 (Plumbing) ──────────────────► PR Review ► Merge
  Stream B: Epic 2 (Navigation) ─────────────────────────────────────►

Week 2-3:
  Stream A: (idle or assist Stream B)
  Stream B: Epic 3 (Screen Redesigns) ──────────────────────────────►

Week 3-4:
  Stream B: Epic 4 (Polish & Onboarding) ──────► Final QA ► V0 Ship
```

## Design Gates

Before each group in Epics 2-4, you provide designs:

| Gate | Items | Format |
|------|-------|--------|
| Submit page layout | F2 | Reference screenshot |
| Settings tab structure | G1 | Figma or reference |
| ProfileHeaderImageLayout | S2 | Figma |
| Newsletter header + cards | K2, K3, K5 | Figma |
| Stat tiles | G5 | Reference screenshot |
| Submission input bubble | J4 | Reference screenshot |
| Month picker | F5, K3 | Reference screenshot |
| Creation splash + steps | L1, L2 | Figma |
| Floating labels | N5 | Reference screenshot |

## CCPM Mapping

Each epic becomes a separate PRD → epic → set of tasks:

| Epic | PRD Name | CCPM Command |
|------|----------|-------------|
| Epic 1 | `v0-plumbing` | `/pm:prd-new v0-plumbing` |
| Epic 2 | `v0-navigation` | `/pm:prd-new v0-navigation` |
| Epic 3 | `v0-redesigns` | `/pm:prd-new v0-redesigns` |
| Epic 4 | `v0-polish` | `/pm:prd-new v0-polish` |
