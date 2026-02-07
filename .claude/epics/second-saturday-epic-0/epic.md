---
name: second-saturday-epic-0
status: in-progress
created: 2026-02-07T04:16:07Z
progress: 40%
prd: .claude/prds/second-saturday-epic-0.md
github: https://github.com/SecondSaturday/second-saturday/issues/1
---

# Epic: Project Setup & Infrastructure

## Overview

Set up the foundational Next.js application with all required third-party integrations (Convex, Clerk, Mux, Resend, OneSignal), mobile deployment via Capacitor, and development infrastructure (testing, CI/CD, monitoring). This epic establishes the complete development environment before feature work begins.

## Architecture Decisions

- **Framework:** Next.js 14+ with App Router and TypeScript strict mode
- **UI:** shadcn/ui with tweakcn theme + Tailwind CSS
- **Backend:** Convex for database, serverless functions, and file storage
- **Auth:** Clerk with OAuth (Google, Apple) and email verification
- **Email:** Resend with custom domain
- **Video:** Mux for upload and processing
- **Push:** OneSignal with Capacitor plugin
- **Mobile:** Capacitor wrapping Next.js for iOS/Android
- **Hosting:** Vercel with automatic deployments
- **Testing:** Vitest + React Testing Library + Playwright
- **Monitoring:** Sentry (errors) + PostHog (analytics) + Vercel Analytics

## Technical Approach

### Frontend Components
- Next.js App Router structure with conventional directories (app/, components/, lib/)
- shadcn/ui component library with tweakcn theme customization
- CSS variables for theming, Tailwind for utility classes
- ConvexProvider and ClerkProvider wrapping the app

### Backend Services
- Convex schema with placeholder types (users, etc.)
- Convex file storage configuration for photos/videos
- Convex HTTP actions for webhooks (Clerk, Mux)
- Clerk → Convex user sync via webhooks

### Infrastructure
- Vercel deployment with environment variables
- GitHub Actions CI (lint, type-check, test)
- Capacitor for iOS (Xcode) and Android (Android Studio) builds
- Pre-commit hooks (Husky + lint-staged + commitlint)

## Implementation Strategy

**Day 1 Critical Items (start immediately due to 24-48hr waits):**
1. Apple Developer Program enrollment ($99/yr)
2. Resend domain verification + DNS setup

**Phased Approach:**
1. Core project setup (Next.js, TypeScript, linting, UI framework)
2. Backend integration (Convex, Clerk auth)
3. External services (Resend, Mux, OneSignal)
4. Mobile setup (Capacitor, Xcode, Android Studio)
5. Deployment & DevOps (Vercel, GitHub Actions)
6. Testing & Monitoring infrastructure
7. Documentation & validation

## Task Breakdown Preview

- [ ] Task 1: Initialize Next.js project with TypeScript, ESLint, Prettier, Husky, and project structure
- [ ] Task 2: Set up shadcn/ui with tweakcn theme and essential components
- [ ] Task 3: Configure Convex backend (schema, providers, file storage, HTTP actions)
- [ ] Task 4: Integrate Clerk authentication with OAuth (Google, Apple) and webhook sync
- [ ] Task 5: Configure external services (Resend email, Mux video, OneSignal push)
- [ ] Task 6: Set up Capacitor for iOS and Android mobile builds
- [ ] Task 7: Configure Vercel deployment and GitHub Actions CI/CD
- [ ] Task 8: Install testing infrastructure (Vitest, Playwright) with example tests
- [ ] Task 9: Set up monitoring (Sentry, PostHog) and create privacy policy page
- [ ] Task 10: Validate all integrations and document setup in README

## Dependencies

### External Dependencies
- Apple Developer Program approval (24-48 hours)
- Resend DNS propagation (24-48 hours)
- Third-party accounts: Convex ($25/mo), Clerk (free/pro), Mux, OneSignal, Sentry, PostHog, Vercel

### Internal Dependencies
- macOS required for iOS builds (Xcode)
- Node.js 20+ LTS
- pnpm package manager

### Enables
- Epic 1 (Authentication & Identity) - requires Clerk and Convex
- Epic 2 (Circle Creation) - requires UI framework and Convex
- All subsequent epics depend on Epic 0

## Success Criteria (Technical)

### Performance Benchmarks
- Development server starts in <5 seconds
- Production build completes in <5 minutes on Vercel
- New developer can run locally in <10 minutes from clone

### Quality Gates
- TypeScript strict mode with no errors
- ESLint passes with zero warnings
- All example tests pass
- Pre-commit hooks enforced

### Acceptance Criteria
- [ ] `pnpm run dev` starts local development server
- [ ] Convex client connects and can read/write data
- [ ] Clerk auth works (email, Google, Apple sign-in)
- [ ] File uploads work to Convex storage
- [ ] Email sends successfully via Resend
- [ ] Video uploads process in Mux
- [ ] Push notifications register on test devices
- [ ] iOS app builds on simulator
- [ ] Android app builds on emulator
- [ ] Push to main auto-deploys to Vercel
- [ ] GitHub Actions run on PRs
- [ ] Sentry captures test errors
- [ ] PostHog tracks test events
- [ ] Privacy policy page accessible at /privacy
- [ ] README documents complete setup process

## Estimated Effort

- **Overall:** 80-110 hours (Week 1)
- **Critical path:** Apple Developer approval and DNS propagation (24-48 hours each)
- **Resource requirements:**
  - macOS machine for iOS development
  - Apple Developer account ($99/year)
  - Convex paid plan ($25/month)
  - Optional: Clerk Pro for higher limits

## Simplification Notes

The task breakdown consolidates the 13 JTBDs from the PRD into 10 focused tasks by:
1. Combining related setup activities (e.g., all linting/formatting tools in Task 1)
2. Grouping external services that can be configured together (Task 5)
3. Merging testing and CI setup into logical units
4. Combining monitoring and privacy policy (both are pre-deployment requirements)
5. Final validation task ensures everything works together

## Tasks Created

- [ ] #2 - Initialize Next.js Project (parallel: true)
- [ ] #3 - Set Up UI Framework (parallel: false, depends: #2)
- [ ] #4 - Configure Convex Backend (parallel: true, depends: #2)
- [ ] #5 - Integrate Clerk Authentication (parallel: false, depends: #2, #4)
- [ ] #6 - Configure External Services (parallel: true, depends: #4)
- [ ] #7 - Set Up Capacitor Mobile (parallel: true, depends: #2, #3)
- [ ] #9 - Configure Deployment and CI/CD (parallel: true, depends: #2)
- [ ] #10 - Install Testing Infrastructure (parallel: true, depends: #2, #3)
- [ ] #11 - Set Up Monitoring and Privacy Policy (parallel: true, depends: #2, #3)
- [ ] #12 - Validate Integrations and Document Setup (parallel: false, depends: all)

**Summary:**
- Total tasks: 10
- Parallel tasks: 7
- Sequential tasks: 3
- Estimated total effort: 48-65 hours
