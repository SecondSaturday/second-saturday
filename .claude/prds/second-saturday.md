---
name: second-saturday
description: Monthly newsletter ritual for dispersed friend groups with async updates and compiled delivery
status: backlog
created: 2026-02-04T03:08:42Z
timeline: 6 weeks (realistic with design/testing phases per epic)
team: 2 developers (frontend + backend), 70-80 hours/week combined recommended
---

# PRD: Second Saturday MVP

**Version:** 1.5 (Validated)
**Date:** February 4, 2026
**Author:** Kalyan Chandana
**Status:** Ready for Implementation

---

## Problem Statement

Adult friendships are dying a slow death of logistics. After college, careers, moves, and life changes scatter friend groups across cities and time zones. The tools we have make it worse: group chats demand constant attention or go silent for months; social media shows curated highlights that feel hollow; scheduling calls across time zones becomes another chore.

The result? Friends who genuinely care about each other drift into strangers who occasionally like each other's posts.

**Who is affected:** Adults (25-40) with dispersed friend groups from college, previous jobs, or earlier life chapters who want to maintain meaningful relationships but lack a sustainable way to do so.

**Impact of not solving:** Friendships that could last a lifetime fade into acquaintanceships. People lose their support networks precisely when adult life gets hardest.

---

## Goals

1. **Create a sustainable monthly ritual** - 50%+ of circle members submit their updates each month
2. **Deliver genuine value** - 70%+ open rate on newsletters (proving people actually want to read them)
3. **Enable network effects** - Average user joins or creates more than 1 circle within 6 months
4. **Build sticky circles** - 6+ members per circle (enough for variety, not so many it feels impersonal)
5. **Prove long-term retention** - Circles stay active for 3+ months (the real test of ritual formation)

---

## Non-Goals (MVP)

1. **Collaborative prompt selection** - Admin sets prompts; no voting or suggestion system
2. **AI-generated summaries or highlights** - The newsletter is a compilation, not a digest
3. **In-app commenting or reactions** - Discussions happen in existing group chats
4. **Custom newsletter templates/themes** - One clean, readable template
5. **Paid tiers or monetization** - MVP is free
6. **Calendar integrations or smart scheduling** - Fixed "second Saturday" delivery
7. **Member list preview before joining** - Deferred to V0.1
8. **Onboarding tutorials** - Product should be self-explanatory for V0
9. **Deep linking from email** - Simple "View in App" button for V0
10. **SMS reminders** - Push notifications only; SMS deferred to future release (requires phone collection)
11. **Phone number authentication** - V0 uses email + OAuth only; phone verification deferred to future release
11. **Advanced admin tools** - Circle archive, admin transfer, read receipts deferred

---

## User Personas

### Jordan (The Connector)
The natural organizer who'll champion adoption. Creates circles, invites friends, sets prompts. Comfortable with vulnerability, energized by bringing people together.

**Primary goal:** Reduce the burden of being the only one maintaining the group
**Risk:** If the tool feels like more work than a group chat, they won't use it

### Maya (The Yearner)
Wants authentic connection but feels awkward initiating after long silences. Values meaningful updates over constant pings.

**Primary goal:** Feel connected to friends' real lives without the pressure of constant contact
**Risk:** If prompts feel forced or newsletter feels too "polished," she'll disengage

### Alex (The Reluctant)
Protective of personal information, fears judgment, reads more than they share. Will lurk before participating.

**Primary goal:** Find a safer way to gradually open up
**Risk:** If there's social pressure to share or content feels exposed, they'll never submit

---

## Jobs to Be Done (by Epic)

### Epic 0: Project Setup & Infrastructure

This epic covers the foundational setup required before any feature development can begin. This includes project initialization, development environment configuration, third-party service integration, deployment pipeline, and establishing the codebase structure.

**Context:** This is the prerequisite for all other epics. Without completing Epic 0, no feature work can proceed. This epic should be completed in Week 1.

---

#### JTBD 0.1: Initialize Next.js Project

**When** starting the Second Saturday project,
**I want to** set up a modern Next.js application with TypeScript and essential tooling,
**So I can** have a solid foundation for building features.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.1.1 | Verify Node.js 20+ LTS installed (required) | P0 |
| 0.1.2 | Install pnpm globally as package manager (faster than npm, better for monorepo-style) | P0 |
| 0.1.3 | Initialize Next.js 14+ project with App Router using `pnpm create next-app` | P0 |
| 0.1.4 | Configure TypeScript with strict mode (tsconfig.json) | P0 |
| 0.1.5 | Set up ESLint with Next.js, TypeScript, and React rules | P0 |
| 0.1.6 | Set up Prettier with specific formatting rules (semi, singleQuote, etc.) | P0 |
| 0.1.7 | Install Husky for Git hooks | P0 |
| 0.1.8 | Install lint-staged for pre-commit linting | P0 |
| 0.1.9 | Configure environment variable handling (.env.local, .env.example) | P0 |
| 0.1.10 | Set up basic project directory structure (app/, components/, lib/, e2e/, etc.) | P0 |
| 0.1.11 | Configure Next.js for both web and Capacitor compatibility | P0 |
| 0.1.12 | Add .gitignore with appropriate exclusions | P0 |
| 0.1.13 | Set up package.json scripts (dev, build, lint, format, prepare for Husky) | P0 |
| 0.1.14 | Create .vscode/extensions.json with recommended extensions | P0 |
| 0.1.15 | Create .vscode/settings.json for consistent formatting | P0 |
| 0.1.16 | Install commitlint for conventional commits | P0 |

**Acceptance Criteria:**
- Node.js 20+ verified (`node --version`)
- Project runs on localhost with `pnpm run dev`
- TypeScript compilation succeeds with no errors
- ESLint and Prettier rules enforced on save (VSCode) and pre-commit (Husky)
- Environment variables load correctly from .env.local
- Project structure follows Next.js App Router best practices
- Pre-commit hooks run linting and formatting automatically
- Commits must follow Conventional Commits format (feat:, fix:, etc.)
- Recommended VSCode extensions: ESLint, Prettier, Tailwind CSS IntelliSense

---

#### JTBD 0.2: Install and Configure UI Framework

**When** building the frontend,
**I want to** set up shadcn/ui with tweakcn theme,
**So I can** rapidly build consistent, accessible UI components.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.2.1 | Install and configure shadcn/ui | P0 |
| 0.2.2 | Apply tweakcn theme customization | P0 |
| 0.2.3 | Set up Tailwind CSS configuration | P0 |
| 0.2.4 | Install essential shadcn components (Button, Input, Dialog, etc.) | P0 |
| 0.2.5 | Configure global styles and CSS variables | P0 |
| 0.2.6 | Set up dark mode support (if applicable) | P1 |
| 0.2.7 | Create component organization structure (components/ui/) | P0 |

**Acceptance Criteria:**
- shadcn/ui components render correctly
- Theme colors and typography match design system
- Tailwind CSS purges unused styles in production build
- Components are accessible (keyboard navigation, ARIA attributes)

---

#### JTBD 0.3: Set Up Convex Backend

**When** initializing the backend,
**I want to** configure Convex for database and serverless functions,
**So I can** build real-time features and store data.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.3.1 | Create Convex account and project | P0 |
| 0.3.2 | Install Convex npm packages (@convex-dev/client, convex) | P0 |
| 0.3.3 | Initialize Convex project structure (convex/ directory) | P0 |
| 0.3.4 | Configure Convex deployment URL in environment variables | P0 |
| 0.3.5 | Set up ConvexProvider in Next.js app layout | P0 |
| 0.3.6 | Create initial schema.ts with placeholder types | P0 |
| 0.3.7 | Set up Convex dev server for local development | P0 |
| 0.3.8 | Upgrade to Convex $25/mo paid plan | P0 |
| 0.3.9 | Configure file storage for photos/videos | P0 |
| 0.3.10 | Set up Convex HTTP actions for webhooks | P0 |

**Acceptance Criteria:**
- Convex client connects successfully to deployment
- Schema compiles without errors
- Can query and mutate data from Next.js components
- File uploads work to Convex storage
- Webhooks can be triggered via HTTP actions

---

#### JTBD 0.4: Integrate Clerk Authentication

**When** setting up authentication,
**I want to** configure Clerk with OAuth providers and email verification,
**So I can** enable secure user signup and login.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.4.1 | Create Clerk account and application | P0 |
| 0.4.2 | Install @clerk/nextjs package | P0 |
| 0.4.3 | Configure Clerk environment variables (publishable key, secret key) | P0 |
| 0.4.4 | Wrap Next.js app with ClerkProvider | P0 |
| 0.4.5 | Enable Google OAuth in Clerk dashboard (obtain client ID/secret) | P0 |
| 0.4.6 | Enable Apple Sign-In in Clerk dashboard (requires Apple Developer account) | P0 |
| 0.4.7 | Set up Clerk webhooks for user.created and user.updated | P0 |
| 0.4.9 | Configure Clerk → Convex user sync via webhooks | P0 |
| 0.4.9 | Set up Clerk middleware for route protection | P0 |
| 0.4.10 | Budget for Clerk Pro plan if MAU limit hit | P1 |

**Acceptance Criteria:**
- Users can sign up with email/password, Google, and Apple
- Email verification works for email/password signups
- User data syncs to Convex on creation/update
- Protected routes redirect to login when unauthenticated
- OAuth credentials are secure (not committed to git)

---

#### JTBD 0.5: Configure External Services

**When** integrating third-party services,
**I want to** set up Resend, Mux, and OneSignal accounts,
**So I can** send emails, handle videos, and send push notifications.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.5.1 | Create Resend account and obtain API key | P0 |
| 0.5.2 | Set up custom domain in Resend with DNS verification (SPF, DKIM, DMARC) | P0 |
| 0.5.3 | Install resend and @react-email packages | P0 |
| 0.5.4 | Create Mux account and obtain API access token | P0 |
| 0.5.5 | Configure Mux webhooks to point to Convex HTTP actions | P0 |
| 0.5.6 | Create OneSignal account and app | P0 |
| 0.5.7 | Install @onesignal/onesignal-capacitor plugin | P0 |
| 0.5.8 | Configure OneSignal app ID in environment variables | P0 |
| 0.5.9 | Set up FCM credentials for Android push notifications | P0 |
| 0.5.10 | Set up APNs credentials for iOS push notifications (requires Apple Developer) | P0 |
| 0.5.11 | Install browser-image-compression for client-side image compression | P0 |

**Acceptance Criteria:**
- Resend can send transactional emails from verified domain
- Mux can receive video uploads and generate thumbnails
- OneSignal can send push notifications to test devices
- All API keys stored securely in environment variables
- DNS records verified (can take 24-48 hours)

---

#### JTBD 0.6: Set Up Apple Developer Account

**When** preparing for iOS app deployment,
**I want to** enroll in Apple Developer Program and configure credentials,
**So I can** build and distribute the iOS app.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.6.1 | Enroll in Apple Developer Program ($99/year) | P0 |
| 0.6.2 | Wait for approval (can take 24-48 hours) | P0 |
| 0.6.3 | Create App ID in Apple Developer portal | P0 |
| 0.6.4 | Generate development and distribution certificates | P0 |
| 0.6.5 | Create provisioning profiles for development and App Store | P0 |
| 0.6.6 | Configure Apple Sign-In capability | P0 |
| 0.6.7 | Configure Push Notifications capability | P0 |
| 0.6.8 | Set up App Store Connect account | P0 |
| 0.6.9 | Create app listing in App Store Connect | P0 |
| 0.6.10 | Prepare signing credentials for Xcode | P0 |

**Acceptance Criteria:**
- Apple Developer account is active and verified
- App ID configured with necessary capabilities
- Certificates and provisioning profiles downloaded
- Can build signed iOS app locally
- App Store Connect ready for TestFlight uploads

---

#### JTBD 0.7: Initialize Capacitor for Mobile

**When** preparing mobile app builds,
**I want to** configure Capacitor to wrap the Next.js app for iOS and Android,
**So I can** deploy native mobile applications.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.7.1 | Install @capacitor/core and @capacitor/cli | P0 |
| 0.7.2 | Initialize Capacitor project (capacitor.config.ts) | P0 |
| 0.7.3 | Configure Next.js build output for Capacitor | P0 |
| 0.7.4 | Add iOS platform (npx cap add ios) | P0 |
| 0.7.5 | Add Android platform (npx cap add android) | P0 |
| 0.7.6 | Install essential Capacitor plugins (Camera, Filesystem, PushNotifications) | P0 |
| 0.7.7 | Configure app name, bundle ID, and version in capacitor.config.ts | P0 |
| 0.7.8 | Set up Xcode project for iOS (requires macOS) | P0 |
| 0.7.9 | Set up Android Studio project for Android | P0 |
| 0.7.10 | Test builds on iOS simulator and Android emulator | P0 |

**Acceptance Criteria:**
- Capacitor successfully wraps Next.js app
- iOS app builds and runs on simulator
- Android app builds and runs on emulator
- Camera and file access work on both platforms
- Push notifications register successfully

---

#### JTBD 0.8: Deploy to Vercel

**When** deploying the web application,
**I want to** connect the GitHub repository to Vercel,
**So I can** have automatic deployments on every push.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.8.1 | Create Vercel account (free tier) | P0 |
| 0.8.2 | Connect GitHub repository to Vercel | P0 |
| 0.8.3 | Configure environment variables in Vercel dashboard | P0 |
| 0.8.4 | Set up production and preview deployments | P0 |
| 0.8.5 | Configure custom domain (if applicable) | P1 |
| 0.8.6 | Enable automatic deployments on main branch | P0 |
| 0.8.7 | Configure build settings (Next.js framework preset) | P0 |
| 0.8.8 | Test production build succeeds | P0 |

**Acceptance Criteria:**
- Push to main branch triggers automatic deployment
- Production URL is accessible and loads correctly
- Environment variables load in production
- Build completes in under 5 minutes
- Preview deployments work for pull requests

---

#### JTBD 0.9: Establish Development Workflow

**When** starting feature development,
**I want to** define Git workflow, branching strategy, and collaboration practices,
**So I can** work efficiently with the backend developer.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.9.1 | Define Git branching strategy (main, feature branches) | P0 |
| 0.9.2 | Set up GitHub repository (already done: CalyanV/second-saturday) | P0 |
| 0.9.3 | Create PR template for code reviews | P0 |
| 0.9.4 | Commit message conventions (handled by commitlint in JTBD 0.1.16) | P0 |
| 0.9.5 | Set up GitHub Actions for CI (linting, type checking, testing) | P0 |
| 0.9.6 | Document local development setup in README | P0 |
| 0.9.7 | Create .env.example with required variables | P0 |
| 0.9.8 | Define code review process between frontend and backend devs | P0 |

**Acceptance Criteria:**
- README includes clear setup instructions
- New developer can clone repo and run locally in under 10 minutes
- .env.example lists all required environment variables
- Git workflow is documented and agreed upon by both devs
- GitHub Actions run on every PR (lint, type check, test)
- PR template guides reviewers through code review checklist
- Failed CI blocks merge to main

---

#### JTBD 0.10: Create Privacy Policy

**When** preparing for App Store submission,
**I want to** create a privacy policy page,
**So I can** meet Apple's requirements and be transparent about data usage.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.10.1 | Write privacy policy covering email and OAuth data collection | P0 |
| 0.10.2 | Document data storage (Convex, Clerk, Mux, OneSignal) | P0 |
| 0.10.3 | Document user data deletion process (GDPR compliance) | P0 |
| 0.10.5 | Create /privacy route in Next.js app | P0 |
| 0.10.6 | Link to privacy policy from signup flow | P0 |
| 0.10.7 | Ensure privacy policy is accessible without login | P0 |

**Acceptance Criteria:**
- Privacy policy covers all data collection and usage
- GDPR and CCPA compliance addressed
- Privacy policy URL can be submitted to App Store
- Policy is clear and user-friendly (not just legal jargon)

---

#### JTBD 0.11: Set Up Figma MCP Integration

**When** preparing for design-to-code workflow,
**I want to** configure Figma MCP integration and establish the design workspace,
**So I can** convert Figma designs directly to code for each epic without manual translation.

**Context:** User has paid Figma account. Design work happens incrementally per epic using Figma MCP to generate code. This JTBD sets up the integration; actual design work is part of each epic's implementation plan.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.11.1 | Install Figma MCP server for Claude Code | P0 |
| 0.11.2 | Configure Figma API access token in MCP settings | P0 |
| 0.11.3 | Create Second Saturday project workspace in Figma | P0 |
| 0.11.4 | Set up Figma component library matching shadcn/ui + tweakcn theme | P0 |
| 0.11.5 | Configure design tokens in Figma (colors, typography, spacing from tweakcn) | P0 |
| 0.11.6 | Share Figma workspace with backend developer for review access | P0 |
| 0.11.7 | Test Figma MCP: design sample component → generate code → verify output quality | P0 |
| 0.11.8 | Document Figma-to-code workflow for team | P0 |

**Acceptance Criteria:**
- Figma MCP can read designs from workspace
- Design tokens match Tailwind config (colors, spacing, typography)
- Sample component generates valid shadcn/ui compatible code
- Both developers understand Figma MCP workflow
- Component library uses Auto Layout for proper responsive behavior

**Design-to-Code Workflow:**
1. Design screens/components in Figma (per epic Phase 1)
2. Use Figma MCP to generate React/Tailwind code
3. Review generated code, refine design if needed
4. Integrate generated code into codebase

---

#### JTBD 0.12: Install Testing Infrastructure

**When** preparing for test-driven development across all epics,
**I want to** install and configure testing tools,
**So I can** write tests for each epic as features are built without setup friction.

**Context:** Testing happens per epic (not upfront). This JTBD only installs the tools and creates example tests; actual test writing is part of each epic's implementation plan.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.12.1 | Install Vitest for unit and integration testing | P0 |
| 0.12.2 | Install @testing-library/react and @testing-library/user-event | P0 |
| 0.12.3 | Install Playwright for E2E testing | P0 |
| 0.12.4 | Configure test coverage reporting (vitest.config.ts) | P0 |
| 0.12.5 | Install @vitest/ui for interactive test debugging | P0 |
| 0.12.6 | Configure Playwright for mobile viewports (iOS/Android) | P0 |
| 0.12.7 | Create test utilities directory (lib/test-utils/) | P0 |
| 0.12.8 | Write example unit test (components/__tests__/example.test.tsx) | P0 |
| 0.12.9 | Write example E2E test (e2e/example.spec.ts) | P0 |
| 0.12.10 | Add test scripts to package.json (test, test:watch, test:e2e, test:coverage) | P0 |
| 0.12.11 | Update GitHub Actions CI to run tests on PR (upgrade JTBD 0.9.5 to P0) | P0 |

**Acceptance Criteria:**
- `npm run test` runs unit/integration tests successfully
- `npm run test:e2e` runs Playwright E2E tests successfully
- `npm run test:coverage` shows coverage report
- Example tests pass and serve as templates
- CI runs tests on every pull request

**Testing Strategy Per Epic:**
- Each epic includes test writing in Phase 3
- Target: 80% code coverage overall
- Critical paths require E2E tests
- All Convex queries/mutations require integration tests

---

#### JTBD 0.13: Install Monitoring & Analytics

**When** preparing for production deployment,
**I want to** install error tracking, performance monitoring, and analytics,
**So I can** observe system health and user behavior from day one.

**Context:** Monitoring tools installed early but event tracking happens per epic. This JTBD sets up the infrastructure; actual event definitions are part of each epic's implementation plan.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.13.1 | Create Sentry account (free tier: 5k errors/month) | P0 |
| 0.13.2 | Install @sentry/nextjs package | P0 |
| 0.13.3 | Configure Sentry for Next.js (sentry.client.config.ts, sentry.server.config.ts) | P0 |
| 0.13.4 | Configure Sentry source maps for debugging | P0 |
| 0.13.5 | Enable Vercel Analytics (built-in, toggle in Vercel dashboard) | P0 |
| 0.13.6 | Create PostHog account (free tier: 1M events/month) | P0 |
| 0.13.7 | Install posthog-js package | P0 |
| 0.13.8 | Configure PostHog provider in app layout | P0 |
| 0.13.9 | Set up Sentry alerting (email for critical errors) | P0 |
| 0.13.10 | Create lib/analytics.ts wrapper for consistent event tracking | P0 |

**Acceptance Criteria:**
- Sentry captures errors in dev and production
- Source maps work (can see original TypeScript in stack traces)
- Vercel Analytics enabled
- PostHog initialized and ready for event tracking
- Analytics wrapper provides simple API (trackEvent, trackPageView)

**Event Tracking Per Epic:**
- Each epic defines events to track in implementation plan
- Events added incrementally as features are built
- See "Key Events to Track" in implementation plan template

---

### Epic 1: Authentication & Identity

This epic covers how users establish and manage their identity in the system. Authentication must feel lightweight (this is a personal app, not enterprise software) while providing enough security for personal content.

---

#### JTBD 1.1: First-Time Signup

**When** I click an invite link from a friend and don't have an account yet,
**I want to** create an account with minimal friction,
**So I can** join my friend's circle without losing momentum or abandoning the flow.

**Context:** Most new users will arrive via invite link, not organic discovery. The signup flow is the first impression and the highest-friction moment. Every additional step loses users.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.1.1 | Support email/password signup with email verification | P0 |
| 1.1.2 | Support Google OAuth as alternative signup method | P0 |
| 1.1.3 | Support Apple Sign-In (required for iOS App Store) | P0 |
| 1.1.4 | OAuth users skip email verification (verified by provider) | P0 |
| 1.1.5 | Email/password users must verify email before accessing circles | P0 |
| 1.1.6 | Preserve invite link context through signup flow (user lands in correct circle after account creation) | P0 |
| 1.1.7 | Collect display name during signup (required) | P0 |
| 1.1.8 | Collect profile photo during signup (optional, can skip) | P0 |
| 1.1.9 | Auto-join circle upon successful account creation when arriving via invite | P0 |
| 1.1.10 | Auto-detect user timezone from browser during signup | P0 |

**Acceptance Criteria:**
- OAuth users can complete signup in under 60 seconds (no email verification wait)
- Email/password users can complete signup in under 90 seconds (including email verification)
- Email verification sent within 30 seconds (for email/password signups only)
- User is automatically redirected to circle after signup if they arrived via invite link
- If email already exists, prompt to login instead with clear messaging

**Edge Cases:**
- User clicks invite link, starts signup, abandons, returns later: invite link should remain valid
- User already has account but clicks invite link while logged out: after login, should auto-join the circle
- User enters email that's already registered: show "This email is already associated with an account. Please log in instead."

---

#### JTBD 1.2: Returning User Login

**When** I return to the app after being away (days or weeks),
**I want to** get back into my circles quickly,
**So I can** check if the newsletter is out or submit my update without re-authenticating every time.

**Context:** Users interact monthly, not daily. Session persistence is critical. Re-authentication friction could cause users to skip a month.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.2.1 | Support login via email/password | P0 |
| 1.2.2 | Support login via Google OAuth | P0 |
| 1.2.3 | Support login via Apple Sign-In | P0 |
| 1.2.4 | Maintain persistent sessions (30+ days on mobile, 7 days on web) | P0 |
| 1.2.5 | Support "Remember me" option on web | P0 |
| 1.2.6 | Implement secure token refresh without requiring re-login | P0 |
| 1.2.7 | Deep link support: if user clicks email link while logged out, redirect to intended destination after login | P0 |

**Acceptance Criteria:**
- Returning user on mobile app should not need to re-authenticate for at least 30 days
- Login via social provider completes in 2 taps
- Failed login shows specific error (wrong password vs. no account found)
- After 3 failed login attempts, show password reset option prominently

---

#### JTBD 1.3: Password Recovery

**When** I forget my password and can't log in,
**I want to** reset it via email,
**So I can** regain access to my circles and content without losing my account.

**Context:** With monthly usage, password forgets are common. This flow must be bulletproof.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.3.1 | "Forgot password" link on login screen | P0 |
| 1.3.2 | Send password reset email within 30 seconds | P0 |
| 1.3.3 | Reset link expires after 1 hour | P0 |
| 1.3.4 | Reset link is single-use | P0 |
| 1.3.5 | After reset, user is logged in automatically | P0 |
| 1.3.6 | If email not found, show generic "if account exists, we've sent instructions" message (security) | P0 |

**Acceptance Criteria:**
- Password reset completes in under 2 minutes end-to-end
- Reset email includes clear CTA button, not just a link
- New password must meet minimum security requirements (8+ chars)
- Old sessions are invalidated after password change
- Rate limit: max 3 reset attempts per email per hour

---

#### JTBD 1.4: Profile Management

**When** I want to update how I appear to my circles,
**I want to** change my display name or photo,
**So I can** present myself authentically.

**Context:** Users may want different names in different contexts (full name for family circle, nickname for college friends). MVP uses single identity; per-circle customization is P2.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.4.1 | Edit display name from settings | P0 |
| 1.4.2 | Upload/change profile photo from settings | P0 |
| 1.4.3 | Profile photo cropping (square aspect ratio) | P0 |
| 1.4.4 | View current email address (read-only in MVP) | P0 |
| 1.4.5 | Change password (if using email auth) | P0 |
| 1.4.6 | Change email address | P1 |
| 1.4.7 | Per-circle display name override | P2 |

**Acceptance Criteria:**
- Profile changes reflect immediately across all circles
- Photo upload supports JPG, PNG, HEIC; max 10MB; auto-compressed client-side to <200KB
- Name changes show in next newsletter (not retroactively in past issues)

---

#### JTBD 1.5: Account Deletion

**When** I decide I no longer want to use Second Saturday,
**I want to** delete my account and data,
**So I can** remove my personal information from the platform.

**Context:** GDPR and CCPA compliance. Also builds trust that users control their data.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 1.5.1 | "Delete account" option in settings | P0 |
| 1.5.2 | Confirmation step with clear warning about data loss | P0 |
| 1.5.3 | Require password or re-authentication before deletion | P0 |
| 1.5.4 | Remove user from all circles upon deletion | P0 |
| 1.5.5 | Delete all user-generated content (responses, photos, videos) immediately | P0 |
| 1.5.6 | Past newsletters show "[Deleted User]" placeholder where user's content was (GDPR compliant) | P0 |
| 1.5.7 | Export data before deletion option | P2 |

**Acceptance Criteria:**
- Deletion executed immediately per GDPR "without undue delay"
- User receives email confirmation of deletion
- Past newsletters retain structure but show "[Deleted User]" with no content for removed member
- **Key distinction:** Account deletion removes all content; leaving a circle (while staying on platform) keeps contributions visible to remaining members
- User can re-register with same email after deletion is complete
- No grace period; deletion is immediate and irreversible

---

### Epic 2: Circle Creation & Setup

This epic covers how users create and configure circles. The circle creator becomes the admin and is responsible for setting the tone through prompts and inviting members.

---

#### JTBD 2.1: Creating a New Circle

**When** I want to start a newsletter with a group of friends,
**I want to** create a circle with a name that represents our group,
**So I can** establish a shared space and start inviting people.

**Context:** Jordan initiates this. The circle name and cover image set the emotional tone. This should feel like naming a group chat, not creating a corporate workspace.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.1.1 | Create circle with custom name (required, 3-50 chars) | P0 |
| 2.1.2 | Upload optional circle icon/image (square, displayed in headers and tabs) | P0 |
| 2.1.3 | Upload optional cover image (banner style, 3:1 aspect ratio recommended) | P0 |
| 2.1.4 | Images compressed client-side before upload (max 10MB upload, compress to <200KB) | P0 |
| 2.1.5 | Creator automatically becomes circle admin | P0 |
| 2.1.6 | Circle created with 4 default prompts pre-selected (user can modify) | P0 |
| 2.1.7 | Generate unique invite link immediately upon creation | P0 |
| 2.1.8 | Store admin's timezone for displaying local times in UI | P0 |
| 2.1.9 | Optional circle description/tagline (displayed in newsletter header) | P1 |

**Acceptance Criteria:**
- Circle creation completes in under 30 seconds
- Cover image auto-cropped/resized; supports JPG, PNG, HEIC; compressed client-side
- Circle name must be unique per user (same user can't have two circles with identical names)
- Invite link generated is URL-safe and not guessable (UUID or similar)
- Invite links are public (anyone with link can join) for V0; security improvements in V0.1+
- **Minimum 3 members required** before first newsletter is sent (admin counts as 1)
- Circles with fewer than 3 members show "Invite more friends to start your newsletter" prompt
- **Grandfathering:** If circle drops below 3 members after newsletters have started, newsletters continue (no pause)

---

#### JTBD 2.2: Configuring Circle Prompts

**When** I've created a circle and want to customize what we share,
**I want to** select or write prompts that fit our group's vibe,
**So I can** guide conversations toward meaningful topics without being too prescriptive.

**Context:** Prompts are the heart of the product. Good prompts lower the barrier to sharing (Alex) while enabling depth (Maya). Admin can set once and forget, or refresh monthly.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.2.1 | Select from library of suggested prompts | P0 |
| 2.2.2 | Write custom prompts (max 200 chars each) | P0 |
| 2.2.3 | Set 1-8 active prompts per circle | P0 |
| 2.2.4 | Reorder prompts (drag-and-drop) to control newsletter flow | P0 |
| 2.2.5 | Prompts persist month-to-month unless admin changes them | P0 |
| 2.2.6 | Preview how prompts will appear in newsletter | P1 |
| 2.2.7 | Prompt categories in library (reflection, fun, gratitude, deep) | P1 |
| 2.2.8 | "Seasonal" or "special occasion" prompts (holidays, year-end) | P2 |

**Acceptance Criteria:**
- Default prompts pre-filled for new circles: "What did you do this month?", "One Good Thing", "On Your Mind", "What are you listening to?"
- Changes to prompts take effect for the current cycle (if before deadline) or next cycle
- Removing a prompt mid-cycle does not delete already-submitted responses for that prompt
- Empty prompts (no one answered) are omitted from newsletter

---

#### JTBD 2.3: Managing Circle Settings

**When** I want to adjust how my circle operates,
**I want to** access settings for the circle I admin,
**So I can** update the name, image, or other configuration as our group evolves.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 2.3.1 | Edit circle name | P0 |
| 2.3.2 | Edit/replace circle cover image | P0 |
| 2.3.3 | Edit/replace circle icon image | P0 |
| 2.3.4 | View circle creation date and issue count | P0 |
| 2.3.5 | Regenerate invite link (invalidates old link) | P0 |
| 2.3.6 | Archive circle (stops newsletters, preserves history) | P1 |
| 2.3.7 | Delete circle permanently (requires confirmation) | P1 |
| 2.3.8 | Transfer admin role to another member | P1 |

**Acceptance Criteria:**
- Settings changes reflect immediately
- Regenerating invite link shows warning that old links will stop working
- Archived circles remain visible in member's circle list but marked as inactive
- Circle deletion requires typing circle name to confirm

---

### Epic 3: Circle Membership

This epic covers how users join circles, view fellow members, and manage their participation. This includes admin functions for managing the group.

---

#### JTBD 3.1: Joining a Circle via Invite Link

**When** a friend sends me an invite link to their circle,
**I want to** click it and join seamlessly,
**So I can** start participating in their newsletter without complicated setup.

**Context:** This is the primary growth mechanism. The invite link flow must handle both existing users and new signups gracefully.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.1.1 | Invite link opens circle preview page (name, cover, member count, admin name) | P0 |
| 3.1.2 | Invite link includes context when copied (e.g., "Jordan invited you to College Friends - [link]") | P0 |
| 3.1.3 | "Join Circle" button for logged-in users | P0 |
| 3.1.4 | "Sign up to Join" button for new users (preserves invite context through signup) | P0 |
| 3.1.5 | "Log in to Join" option for existing users who are logged out | P0 |
| 3.1.6 | After joining, redirect to circle home showing prompts and submission status | P0 |
| 3.1.7 | Prevent duplicate joins (if already a member, show "You're already in this circle") | P0 |
| 3.1.8 | Invite links do not expire by default | P0 |
| 3.1.9 | Member list preview on invite page (before joining) | P1 |
| 3.1.10 | Admin can set invite link to expire after X uses or X days | P2 |

**Acceptance Criteria:**
- Entire join flow (for existing logged-in user) completes in 2 taps
- New user signup + join completes in under 90 seconds (OAuth) or 2 minutes (email/password with verification)
- User cannot join a circle they're already in
- **Joining mid-month:** user can (and should) submit for the current cycle; same deadline applies to all members
- New member sees prompts immediately after joining with deadline countdown

---

#### JTBD 3.2: Viewing Circle Members

**When** I'm in a circle and want to see who else is part of it,
**I want to** view a list of all members,
**So I can** know who I'm sharing with and who to expect in the newsletter.

**Context:** Transparency about membership builds trust, especially for Alex who needs to know exactly who sees their content.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.2.1 | View list of all active circle members with name and photo | P0 |
| 3.2.2 | Indicate which member is the admin | P0 |
| 3.2.3 | Show member join date | P1 |
| 3.2.4 | Submission status NOT visible to regular members in V0 (admin-only feature) | P0 |
| 3.2.5 | Tap member to view their profile (name, photo, bio if available) | P1 |

**Acceptance Criteria:**
- Member list accessible from circle home screen
- Admin indicated with badge or label, not just position
- Member count shows only active members (excludes those who have left)
- Submission status dashboard is admin-only; regular members cannot see others' progress
- Member list sorted by: admin first, then alphabetical or by join date

---

#### JTBD 3.3: Leaving a Circle

**When** I no longer want to be part of a circle,
**I want to** leave it voluntarily,
**So I can** stop receiving newsletters and remove my obligation to participate.

**Context:** Life changes. People should be able to leave gracefully without drama or asking permission.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.3.1 | "Leave Circle" option in circle settings | P0 |
| 3.3.2 | Confirmation dialog explaining consequences (temporary loss of access) | P0 |
| 3.3.3 | Upon leaving, user removed from future newsletters immediately | P0 |
| 3.3.4 | User's past contributions remain visible to remaining circle members | P0 |
| 3.3.5 | User who left loses access to circle content while not a member | P0 |
| 3.3.6 | User can rejoin via invite link and regains full access seamlessly (including past contributions and newsletters) | P0 |
| 3.3.7 | If admin leaves and is the only admin, prompt to transfer or delete circle | P0 |
| 3.3.8 | No notification sent to other members when someone leaves | P0 |

**Acceptance Criteria:**
- Leaving is instant; no waiting period
- Left circles removed from user's circle list immediately
- Past newsletters remain intact for remaining members with the departed user's contributions
- Departed user cannot access circle content while not a member
- **Rejoining restores full access** to all past newsletters and their own previous contributions
- Rejoining mid-cycle allows user to submit for current cycle (seamless data persistence)
- Admin cannot leave without transferring admin role or deleting circle
- User's home screen shows only current month's newsletters (not past), so rejoining doesn't create UX complexity

---

#### JTBD 3.4: Admin Removing a Member

**When** someone in my circle is no longer part of our friend group or is causing issues,
**I want to** remove them from the circle,
**So I can** maintain a safe and relevant group for everyone else.

**Context:** Rare but necessary. Friendships end, people become inactive, or someone was added by mistake. Admin has control over whether to preserve or erase the removed member's history.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.4.1 | Admin can remove any member except themselves | P0 |
| 3.4.2 | Confirmation dialog with removal options | P0 |
| 3.4.3 | Removed member no longer receives newsletters | P0 |
| 3.4.4 | Admin chooses: keep removed member's past contributions OR delete them | P0 |
| 3.4.5 | If admin keeps contributions: removed member can rejoin via invite link | P0 |
| 3.4.6 | If admin deletes contributions (block): member cannot rejoin, past content shows "[Removed]" | P0 |
| 3.4.7 | Deletion of contributions is immediate and irreversible | P0 |
| 3.4.8 | No notification sent to removed member in V0 (deferred to V0.1) | P0 |
| 3.4.9 | Admin can restore blocked member's ability to rejoin (but cannot restore deleted content) | P2 |

**Acceptance Criteria:**
- Removal is instant
- Removal dialog presents two options: "Remove" (keeps contributions) or "Remove & Block" (deletes contributions)
- Removed user sees circle disappear from their list
- Other members not notified of removal
- Removed user's current-cycle draft is discarded (not included in newsletter)
- If blocked: past newsletters show "[Removed]" where their content was; member cannot rejoin even with new invite link

---

#### JTBD 3.5: Admin Viewing Submission Status

**When** the deadline is approaching and I want to know who hasn't submitted yet,
**I want to** see a dashboard of submission status,
**So I can** send friendly reminders to specific people via our group chat.

**Context:** Jordan uses this to nudge stragglers. Should show who, not what (no peeking at content before newsletter).

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 3.5.1 | Admin dashboard shows each member's submission status | P0 |
| 3.5.2 | Status options: "Submitted", "In Progress" (has draft), "Not Started" | P0 |
| 3.5.3 | Show submission timestamp for those who've submitted | P1 |
| 3.5.4 | Do NOT show content preview (preserve surprise for newsletter) | P0 |
| 3.5.5 | Show days/hours remaining until deadline | P0 |
| 3.5.6 | One-tap "Send reminder" to individual member (via push notification) | P1 |
| 3.5.7 | Option to send reminder to all non-submitters at once | P1 |
| 3.5.8 | Limit admin to max 3 manual reminder notifications per cycle (does not include automatic preset reminders) | P0 |

**Acceptance Criteria:**
- Dashboard accessible from circle home for admin only
- Regular members cannot see submission status of others
- Status updates in real-time (or near real-time via Convex subscriptions)
- Admin sees remaining manual reminder count (e.g., "2 of 3 reminders remaining this cycle")
- Manual reminder limit resets after newsletter sends (not just after deadline)

---

### Epic 4: Content Submission

This epic covers how users respond to prompts and share photos/videos. The submission experience must feel low-pressure (for Alex) while enabling meaningful sharing (for Maya).

---

#### JTBD 4.1: Creating Multimodal Responses

**When** I open my circle and want to share my update,
**I want to** create responses that combine text, photos, and videos like a social media post,
**So I can** share my month in a rich, expressive way without friction.

**Context:** Each prompt response is a mini "post" - users can add text, photos, and/or videos together. This mirrors how people naturally share on Instagram, Facebook, or X, reducing the learning curve and enabling richer storytelling. Media appears inline with text in the newsletter, not in a separate section.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.1.1 | Display all active prompts for the circle | P0 |
| 4.1.2 | Text input field per prompt (500 character limit) | P0 |
| 4.1.3 | Character count displayed as user types | P0 |
| 4.1.4 | Auto-save drafts as user types (2-second debounce after typing stops) | P0 |
| 4.1.5 | Show which prompts have responses vs. are empty | P0 |
| 4.1.6 | Allow skipping prompts entirely (empty = not shown in newsletter) | P0 |
| 4.1.7 | Show deadline countdown prominently | P0 |
| 4.1.8 | Emoji picker integration | P1 |
| 4.1.9 | Rich text support (bold, italic) | P2 |

**Acceptance Criteria:**
- Text responses save within 2 seconds of typing pause
- User can close app and return to find their draft intact
- Skipped prompts don't show placeholder text like "No response" in newsletter
- If user is offline, show clear error message (no offline support in V0)
- Each response can contain text only, media only, or both together

---

#### JTBD 4.2: Adding Media (Photos & Videos)

**When** I want to share visual moments from my month,
**I want to** attach photos and videos directly to my prompt responses,
**So I can** show my friends what I've been up to in a rich, engaging way.

**Context:** Media is embedded inline with each prompt response (like a social post), not separated into a "Photo Wall." This reduces friction and allows users to pair specific media with specific prompts. Videos add life to updates but require special handling for email delivery.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.1 | Upload photos from device gallery | P0 |
| 4.2.2 | Upload videos from device gallery | P0 |
| 4.2.3 | Capture photo directly from camera | P0 |
| 4.2.4 | Capture video directly from camera | P0 |
| 4.2.5 | **Max 3 media items per prompt response** (any combination of photos/videos) | P0 |
| 4.2.6 | Video file size limit: 25MB before compression | P0 |
| 4.2.7 | Remove uploaded media before submission | P0 |
| 4.2.8 | Media preview/thumbnail in submission form | P0 |
| 4.2.9 | Reorder media via drag-and-drop | P1 |
| 4.2.10 | Progress indicator during upload (blocking UI with greyed screen) | P0 |

**Media Format & Optimization:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.11 | Support photo formats: JPG, PNG, HEIC | P0 |
| 4.2.12 | Support video formats: MP4, MOV, WebM | P0 |
| 4.2.13 | Auto-compress photos client-side using browser-image-compression (max 1200px wide, <200KB) | P0 |
| 4.2.14 | Upload videos to Mux for compression and hosting | P0 |
| 4.2.15 | HEIC/MOV (iPhone defaults) handled automatically | P0 |
| 4.2.16 | User must wait during video upload (blocking UI with progress) - no background upload in V0 | P0 |

**Email Handling (Videos):**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.17 | Videos in email display as thumbnail with play button overlay (Mux thumbnail endpoint) | P0 |
| 4.2.18 | Clicking video thumbnail in email opens newsletter in web app (requires login) | P0 |
| 4.2.19 | Fallback text for email clients that don't render images: "[Video - tap to view in app]" | P0 |

**In-App Video Playback:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.2.20 | Videos play on tap (no autoplay) | P0 |
| 4.2.21 | Video player shows play/pause, progress bar, mute toggle | P0 |
| 4.2.22 | Videos loop by default (can be toggled off) | P1 |

**Acceptance Criteria:**
- Photo upload completes within 5 seconds on typical mobile connection (client-side compression helps)
- Video upload shows clear progress indicator; user cannot navigate away during upload
- Media appears inline with the prompt response in newsletter (not separate Photo Wall)
- User can mix photos and videos in any combination (up to 3 total per response)
- Compression happens automatically; user doesn't need to pre-compress
- Email newsletter size stays under 5MB (videos are thumbnails only, not embedded)

---

#### JTBD 4.3: Editing Before Deadline

**When** I've submitted but want to make changes,
**I want to** edit my responses up until the deadline,
**So I can** refine what I've shared without being locked out.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.3.1 | All responses editable until deadline | P0 |
| 4.3.2 | Clear indication of deadline in user's local timezone | P0 |
| 4.3.3 | Warning when editing within 24 hours of deadline | P0 |
| 4.3.4 | Responses locked automatically at deadline | P0 |
| 4.3.5 | After deadline, show "Submitted" state with read-only view | P0 |
| 4.3.6 | Late edit requests handled manually (contact admin) | P2 |

**Acceptance Criteria:**
- Deadline is second Saturday 10:59 AM UTC (1 minute before newsletter generation starts)
- All deadline displays shown in user's local timezone for clarity
- Edits save immediately (same auto-save as initial entry)
- User cannot edit after deadline passes, even by 1 minute
- Clear visual distinction between "editable" and "locked" states
- Countdown timer shows time remaining in hours/minutes when <24 hours left

---

#### JTBD 4.4: Submitting for Multiple Circles

**When** I'm in multiple circles with overlapping deadlines,
**I want to** manage all my submissions from a single page,
**So I can** easily switch between circles and see my progress at a glance.

**Context:** Users in multiple circles need a unified submission experience. The UI uses an Instagram Stories-style tab pattern: circle icons displayed horizontally at the top, user taps to switch between circles. This keeps all submissions in one place while maintaining clear separation between circles.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 4.4.1 | Single submission page for all circles | P0 |
| 4.4.2 | Horizontal tab bar at top showing circle icons (like Instagram Stories) | P0 |
| 4.4.3 | Circle name displayed below each icon | P0 |
| 4.4.4 | Visual indicator on tab showing submission status (not started, in progress, submitted) | P0 |
| 4.4.5 | Tap circle icon/tab to switch to that circle's prompts | P0 |
| 4.4.6 | Each circle has independent submission content | P0 |
| 4.4.7 | Deadline countdown shown for currently selected circle | P0 |
| 4.4.8 | Notifications specify which circle needs attention | P0 |
| 4.4.9 | Copy response from one circle to another | P2 |

**Acceptance Criteria:**
- Tab bar scrolls horizontally if user is in many circles
- Currently selected circle is visually highlighted (border, scale, or glow)
- Status indicators: empty circle = not started, half-filled = in progress, checkmark = submitted
- Switching circles preserves draft state of previous circle
- Responses and media are completely separate between circles
- Same media file can be uploaded to multiple circles separately

---

### Epic 5: Newsletter Experience

This epic covers how users receive and read the compiled newsletter. The newsletter is the "payoff" that makes the monthly effort worthwhile.

---

#### JTBD 5.1: Receiving the Newsletter

**When** it's the second Saturday and the newsletter is ready,
**I want to** receive it via email and/or notification,
**So I can** read what everyone shared without having to remember to check the app.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.1.1 | Newsletter compilation starts after deadline (second Saturday 10:59 AM UTC) | P0 |
| 5.1.2 | Newsletter sends when ready (async processing, exact time varies) | P0 |
| 5.1.3 | Push notification when newsletter is ready (if app installed) | P0 |
| 5.1.4 | Email includes full newsletter content (text + photos; videos as thumbnails with Mux) | P0 |
| 5.1.5 | Email works without images (graceful fallback) | P0 |
| 5.1.6 | "View in App" button in email footer (opens web app, requires login) | P0 |
| 5.1.7 | Email sent to all members, including those who didn't submit | P0 |
| 5.1.8 | Unsubscribe link in email stops email delivery only (does NOT leave circle) | P0 |
| 5.1.9 | To leave circle, user must use the app (not email unsubscribe) | P0 |
| 5.1.10 | If circle has 0 submissions, send "missed month" email with sad puppy gif and heartfelt message encouraging participation next month | P0 |

**Acceptance Criteria:**
- Email deliverability >95% (not spam-foldered)
- Email renders correctly in Gmail, Apple Mail, Outlook (web and desktop)
- Total email size <5MB (photos compressed; videos are thumbnails only)
- Newsletter sent even if only 1 person submitted
- 10:59 AM UTC deadline chosen so newsletter can compile and send on same day worldwide
- All user-facing dates/times displayed in user's local timezone
- Unsubscribe stops email but user remains in circle (can still view in app, still counted as member)
- Unsubscribed users still receive push notifications if app installed

---

#### JTBD 5.2: Reading the Newsletter

**When** I open the newsletter (email or app),
**I want to** easily read everyone's updates and see their photos/videos,
**So I can** feel connected to my friends and know what's happening in their lives.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.2.1 | Newsletter organized by prompt (all answers to prompt 1, then prompt 2, etc.) | P0 |
| 5.2.2 | Member names as clear headers/labels for each response | P0 |
| 5.2.3 | Media (photos/videos) displayed inline with each response (not separate Photo Wall) | P0 |
| 5.2.4 | Photos can be tapped to view full-size (in-app) | P0 |
| 5.2.5 | Videos play on tap with player controls (in-app via Mux) | P0 |
| 5.2.6 | Newsletter header shows circle name, icon, issue number, date | P0 |
| 5.2.7 | Mobile-responsive layout (readable on phone without zooming) | P0 |
| 5.2.8 | Estimated read time displayed | P2 |
| 5.2.9 | "Share to group chat" button (copies text summary or link) | P2 |

**Acceptance Criteria:**
- Newsletter loads in under 3 seconds on mobile
- Text is readable without zooming (16px minimum font)
- Photos/videos lazy-load to improve performance
- Empty prompts (no one answered) are omitted entirely
- Each response shows text followed by media grid (if media attached)
- Video thumbnails show play button overlay (Mux handles this)

---

#### JTBD 5.3: Viewing Past Issues

**When** I want to reminisce or catch up on issues I missed,
**I want to** browse an archive of past newsletters,
**So I can** revisit shared memories and see how our group has evolved.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 5.3.1 | Archive of all past issues accessible from circle home | P0 |
| 5.3.2 | Issues listed by date, newest first | P0 |
| 5.3.3 | Past issues display identically to current issue | P0 |
| 5.3.4 | Past issues reflect membership at time of issue (show former members' contributions) | P0 |
| 5.3.5 | Search within past issues | P2 |
| 5.3.6 | Filter by member (show all of Maya's submissions across issues) | P2 |

**Acceptance Criteria:**
- Archive loads quickly even with 12+ issues (year's worth)
- Past issues show "[Deleted User]" for contributions from deleted accounts
- Past issues available in app (offline support deferred to V0.1)

---

### Epic 6: Notifications & Reminders

This epic covers how the app communicates with users between newsletters. Notifications must be helpful, not annoying.

---

#### JTBD 6.1: Submission Reminders

**When** I haven't submitted yet and the deadline is approaching,
**I want to** receive a friendly reminder,
**So I can** remember to contribute before it's too late.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.1.1 | Automatic reminder notification sent before deadline (push notification via OneSignal) | P0 |
| 6.1.2 | Default reminder: 3 days before deadline | P0 |
| 6.1.3 | Reminder only sent to members who haven't submitted | P0 |
| 6.1.4 | User can configure reminder timing (1 day, 3 days, 1 week before) | P1 |
| 6.1.5 | User can disable reminders entirely per circle | P0 |
| 6.1.6 | Reminder includes circle name and direct link to submission | P0 |
| 6.1.7 | Second reminder 24 hours before deadline (optional, off by default) | P1 |
| 6.1.8 | SMS reminder option (user can opt-in; requires phone collection in future release) | P1 |

**Acceptance Criteria:**
- Reminders arrive at reasonable times (not 3am local time)
- Reminder clearly states deadline date/time in user's local timezone
- One tap from reminder goes directly to submission screen
- No reminder sent if user has already submitted
- SMS reminders deferred to P1 (requires phone collection in future release); push is default for V0

---

#### JTBD 6.2: Newsletter Ready Notification

**When** the newsletter is compiled and sent,
**I want to** receive a notification,
**So I can** read it right away if I want to.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.2.1 | Push notification when newsletter is ready (via OneSignal) | P0 |
| 6.2.2 | Notification includes circle name | P0 |
| 6.2.3 | Tap notification opens newsletter in app | P0 |
| 6.2.4 | User can disable newsletter notifications per circle | P1 |

**Acceptance Criteria:**
- Notification sent simultaneously with email
- Notification groups if user is in multiple circles (or sends separately per circle)

---

#### JTBD 6.3: Managing Notification Preferences

**When** I'm getting too many or too few notifications,
**I want to** adjust my notification settings,
**So I can** control how the app communicates with me.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 6.3.1 | Global notification settings in account settings | P0 |
| 6.3.2 | Per-circle notification overrides | P1 |
| 6.3.3 | Toggle for submission reminders (on/off) | P0 |
| 6.3.4 | Toggle for newsletter ready notifications (on/off) | P0 |
| 6.3.5 | Email notification preferences (can opt out of email, keep push) | P1 |
| 6.3.6 | SMS notification preferences (opt-in for reminders) | P1 |
| 6.3.7 | Quiet hours setting (no notifications during certain times) | P2 |

**Acceptance Criteria:**
- Settings sync across devices (via Convex)
- Changes take effect immediately
- Unsubscribing from email via link updates app preferences
- SMS is P1 (deferred, requires phone collection in future release); push notifications are P0

---

## Implementation Plan Template

**This template applies to each Epic 1-6.** When this master PRD is split into individual epic PRDs, each epic should follow this three-phase implementation process:

### Phase 1: Design (20-25% of epic time)

**Goal:** Define screens, components, and user flows before writing code.

**Activities:**
1. **Identify screens and components needed**
   - List all screens for this epic
   - List all components (forms, modals, cards, etc.)
   - Identify which shadcn/ui components to use

2. **Create wireframes in Figma**
   - Design mobile-first (375px breakpoint)
   - Design desktop (1024px+ breakpoint)
   - Use Figma component library (shadcn/ui reference)
   - Apply tweakcn theme tokens

3. **Design review**
   - Share with backend developer for feedback
   - Validate user flows make sense
   - Check for accessibility (contrast, touch targets 44px+)
   - Get approval before moving to implementation

4. **Use Figma MCP to generate component code**
   - Select designed components in Figma
   - Use Figma MCP to generate React + Tailwind code
   - Review generated code for quality
   - Refine design if generated code is problematic

**Deliverables:**
- Figma designs for all screens
- Component code generated from Figma MCP
- Design review notes and approval

**Example (Epic 1: Auth):**
- Screens: signup, login, password reset, profile settings
- Components: SignupForm, LoginForm, PasswordResetForm, ProfilePhotoUpload
- Figma MCP generates base components → customize with Convex/Clerk integration

---

### Phase 2: Implementation (50-60% of epic time)

**Goal:** Build features following the approved designs.

**Activities:**
1. **Set up Convex schema** (if needed for this epic)
   - Define tables, indexes, relationships
   - Create sample data for development

2. **Implement Convex queries and mutations**
   - Write business logic
   - Add input validation
   - Handle error cases

3. **Build UI components**
   - Start with Figma MCP-generated code
   - Integrate with Convex (useQuery, useMutation)
   - Add client-side validation
   - Handle loading and error states

4. **Add analytics events** (PostHog)
   - Define events to track for this epic
   - Implement trackEvent calls at key moments

5. **Manual testing in dev**
   - Test on web (Chrome, Safari)
   - Test on mobile (iOS simulator, Android emulator)
   - Fix obvious bugs

**Deliverables:**
- Convex schema (schema.ts updates)
- Convex functions (queries, mutations, actions)
- UI components with Convex integration
- Analytics events tracking

**Example (Epic 1: Auth):**
- Convex: users table, user sync from Clerk webhook
- UI: SignupForm with Clerk integration, profile upload to Convex storage
- Analytics: track "user_signed_up" (with method: email/Google/Apple)

---

### Phase 3: Testing (20-25% of epic time)

**Goal:** Ensure quality through automated tests and manual QA.

**Activities:**
1. **Write unit tests** (Vitest)
   - Test utility functions
   - Test component logic (not UI rendering)
   - Target: 80% coverage for this epic's code

2. **Write integration tests** (Vitest + Testing Library)
   - Test Convex query/mutation integration
   - Test form submissions
   - Test error handling

3. **Write E2E tests** (Playwright)
   - Test critical user flows end-to-end
   - Test on mobile viewports (375px, 768px)
   - Test happy paths and error paths

4. **Manual QA testing**
   - Test on real iOS device (if available)
   - Test on real Android device (if available)
   - Test edge cases (slow network, offline, etc.)
   - Create bug tickets for issues found

5. **Fix bugs and retest**
   - Address all critical bugs
   - Rerun automated tests
   - Verify fixes manually

**Deliverables:**
- Unit tests (80%+ coverage)
- Integration tests for all Convex functions
- E2E tests for critical paths
- Bug fixes

**Example (Epic 1: Auth):**
- Unit: test email validation logic, password strength validation
- Integration: test Clerk webhook → Convex user sync
- E2E: test signup flow (email, Google, Apple), test login flow

---

### Phase 4: Review & Deploy (Continuous)

**Goal:** Code review, merge, and deploy to production.

**Activities:**
1. **Create pull request**
   - Fill out PR template
   - Link to Figma designs
   - Add screenshots/videos

2. **Code review**
   - Backend dev reviews frontend code
   - Frontend dev reviews backend code
   - Address review comments

3. **CI validation**
   - GitHub Actions runs lint, type check, tests
   - Fix any CI failures

4. **Deploy to Vercel preview**
   - Preview URL automatically generated
   - Test on preview environment

5. **Merge to main**
   - Squash and merge after approval
   - Auto-deploys to production (Vercel)

6. **Smoke test production**
   - Verify core flow works in production
   - Check Sentry for errors
   - Monitor PostHog for events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification

---

### Key Events to Track (PostHog)

Each epic should define analytics events. Track user actions, not just page views.

**Epic 1 (Auth):**
- `user_signed_up` (method: email/Google/Apple)
- `user_logged_in` (method: email/Google/Apple)
- `user_reset_password` (method: email)
- `profile_updated` (field: name/photo)
- `account_deleted`

**Epic 2 (Circles):**
- `circle_created`
- `circle_updated` (field: name/cover/prompts)
- `invite_link_generated`
- `invite_link_copied`

**Epic 3 (Membership):**
- `invite_link_viewed`
- `circle_joined` (source: link/direct)
- `circle_left`
- `member_removed` (keep_contributions: true/false)

**Epic 4 (Submission):**
- `submission_started` (circle_id, prompt_count)
- `submission_photo_added`
- `submission_video_added`
- `submission_saved_draft`
- `submission_completed`

**Epic 5 (Newsletter):**
- `newsletter_compiled` (circle_id, member_count, submission_count)
- `newsletter_sent` (circle_id, recipient_count)
- `newsletter_opened` (email tracking pixel)
- `newsletter_clicked` (CTA: view_in_app)

**Epic 6 (Notifications):**
- `push_notification_sent` (type: reminder/newsletter_ready)
- `push_notification_clicked` (type: reminder/newsletter_ready)
- `notification_settings_updated`

---

### Testing Coverage Targets

**Overall target: 80% code coverage**

**Per epic coverage breakdown:**
- **Unit tests:** 80%+ of utility functions, business logic
- **Integration tests:** 100% of Convex queries/mutations
- **E2E tests:** 100% of critical user paths (signup, circle create, submission, etc.)

**What NOT to test:**
- Third-party libraries (Clerk, Convex, shadcn/ui components)
- Generated code from Figma MCP (visual testing only)
- Simple pass-through components with no logic

**What to test:**
- All Convex functions (queries, mutations, actions)
- Form validation logic
- Data transformation functions
- Error handling
- User flows (E2E)

---

## Requirements Summary

### P0 - Must Have (MVP Launch Blockers)

| Category | Requirements |
|----------|-------------|
| **Project Setup** | Node.js 20+ LTS, pnpm package manager, Next.js 14+ with TypeScript, ESLint + Prettier + Husky + lint-staged + commitlint, shadcn/ui with tweakcn theme, Figma MCP integration for design-to-code, Convex backend ($25/mo), Clerk auth with OAuth (Google, Apple) and SMS, Resend email with domain verification, Mux video hosting, OneSignal push notifications, Capacitor mobile wrapper, Vercel deployment, Apple Developer account ($99/year), Vitest + Playwright testing infrastructure, Sentry error tracking, PostHog analytics, GitHub Actions CI/CD, privacy policy, development workflow documentation |
| **Authentication** | Email/password signup with verification (OAuth skips email verification), Google OAuth, Apple Sign-In, persistent sessions, password reset (email), profile management (name/photo), account deletion, timezone auto-detection |
| **Circle Creation** | Create with name/icon/cover, client-side image compression, admin assignment, 4 default prompts, invite link generation (public in V0), timezone storage, 3-member minimum |
| **Circle Membership** | Join via link with context, view members (active only), leave circle with seamless rejoin, admin remove member (keep or delete contributions), submission status dashboard (admin-only) |
| **Prompts** | Set 1-8 prompts, custom prompts (200 char limit), reorder, prompt library selection, 4 defaults pre-filled |
| **Submission** | Multimodal responses (text + photos + videos), 500 char text limit, 3 media items max per response, 25MB video limit, auto-save drafts (2-second debounce), edit until deadline (10:59 AM UTC second Saturday), Instagram-style multi-circle tabs, browser-image-compression for photos, Mux for video hosting, blocking UI during video upload |
| **Newsletter** | Async compilation after deadline, email delivery via Resend (React Email templates), in-app view with login required, archive of past issues, "missed month" email if 0 submissions, videos as thumbnails (Mux) |
| **Notifications** | Push via OneSignal, submission reminders (3 days before), newsletter ready notifications, configurable preferences, admin manual reminders (max 3 per cycle) |

### P1 - Nice to Have (Post-V0)

| Requirement | Notes |
|------------|-------|
| Prompt library with categories | Easier prompt discovery |
| Admin transfer | Allow admin to hand off role |
| Circle archive | Soft-stop without deletion |
| Member list preview before joining | Trust-building for privacy-concerned users |
| One-tap nudges | Admin can remind specific people |
| Onboarding tutorial | Reduce confusion |
| SMS reminders | Opt-in, requires phone collection (future release) |
| Email address change | Security consideration |
| Per-circle notification overrides | Granular control |

### P2 - Future Considerations

| Requirement | Notes |
|------------|-------|
| Per-circle display names | Different identity per circle |
| Block/ban members with restore capability | Prevent bad actors |
| Export data | GDPR full compliance |
| Search within archives | Find specific memories |
| Copy responses between circles | Reduce duplicate effort |
| Rich text in responses | Bold, italic, links |
| Read receipts | Admin sees who opened newsletter |
| Estimated read time | Newsletter engagement metric |

---

## Success Metrics

### Leading Indicators (Change Quickly)

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Invite acceptance rate** | >60% | Measures initial appeal and Jordan's ability to recruit |
| **Submission rate per cycle** | >50% | Core engagement metric; ritual is working |
| **Submission timing** | <30% submit in last 24 hours | Healthy ritual vs. last-minute scramble |
| **Reminder click-through** | >40% | Notifications are effective, not annoying |

### Lagging Indicators (Change Over Time)

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Newsletter open rate** | >70% | People actually value the content |
| **Circle retention at 3 months** | >60% | Ritual has formed |
| **Multi-circle users** | >30% of users in 2+ circles | Network effects emerging |
| **Members per circle** | 6-12 average | Sweet spot for intimacy + variety |
| **NPS** | >50 | Users would recommend to friends |

### Engagement Quality Metric

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Off-platform engagement lift** | 3x increase | Users report more group chat activity, calls, or meetups because of newsletter content |

*Measurement: In-app survey at 3-month mark asking "Has Second Saturday led to more conversations with this friend group outside the app?"*

---

## Technical Architecture

### Stack (Validated)

| Component | Technology | Notes |
|-----------|------------|-------|
| **Frontend** | Next.js + shadcn/ui (tweakcn theme) | React-based, server components where beneficial |
| **Backend** | Convex ($25/mo plan) | Real-time database, serverless functions, file storage |
| **Authentication** | Clerk (free tier for V0) | Email/password, Google, Apple; handles verification, sessions, OAuth merge |
| **Email** | Resend | React Email templates for newsletters and transactional emails |
| **Push Notifications** | OneSignal (free tier) | Handles FCM/APNs complexity, 10k subscribers free |
| **Video** | Mux (free tier 1000 mins/mo) | Compression, hosting, thumbnail generation |
| **Image Compression** | browser-image-compression (npm) | Client-side compression before upload |
| **Mobile** | Capacitor | Wraps Next.js app for iOS/Android |
| **Hosting** | Vercel | Frontend hosting, edge functions |

### Realistic Costs (MVP Scale <100 active users)

| Service | Free Tier | Estimated Monthly | Notes |
|---------|-----------|-------------------|-------|
| **Convex** | — | $25 | Paid plan: 5M function calls, 10GB storage |
| **Clerk** | 10k MAU | $0 | Free tier sufficient for MVP without SMS; Pro plan if MAU exceeded |
| **Resend** | 3,000 emails/month | $0 | Plenty for MVP (300 users × 10 circles × 1 newsletter = 3k) |
| **Mux** | 1000 mins encoding/month | $0 | 2000 videos × 30 sec avg = 1000 mins; should be sufficient |
| **OneSignal** | 10k subscribers | $0 | Push notifications fully covered |
| **Vercel** | 100GB bandwidth | $0 | Free tier sufficient |
| **Apple Developer** | — | $8/mo | $99/year required for iOS |
| **Google Play** | — | ~$0 | $25 one-time |
| **Total** | | **$53-103/month** | Budget ~$100/mo for safety |

### Week 1 Critical Setup Tasks

1. **Apple Developer Program** - $99/year, can take 24-48 hours for approval
2. **Resend domain verification** - DNS setup (SPF, DKIM, DMARC), 24-48 hours propagation
3. **Clerk account** - Configure OAuth (Google, Apple credentials), email verification
4. **Convex account** - $25/mo plan, schema design
5. **Mux account** - Set up webhooks for thumbnail generation
6. **OneSignal account** - Free tier, set up Capacitor plugin

### Key Technical Decisions (Validated)

1. **Convex for real-time** - Subscription-based data means submission status dashboard updates live without polling
2. **Clerk for auth complexity** - Handles OAuth, email verification, password reset, session management, account merging out of the box
3. **Resend + React Email** - Good deliverability, component-based templates simplify maintenance vs. raw HTML
4. **Capacitor over React Native** - Single Next.js codebase for web and mobile; less native capability but simpler for small team learning stack
5. **Mux for video** - Automatic compression, thumbnail generation, CDN hosting; eliminates complex video processing logic
6. **OneSignal for push** - Abstracts FCM/APNs complexity; faster setup than Firebase Cloud Messaging
7. **browser-image-compression** - Client-side compression improves perceived upload speed; works across web/iOS/Android

### Convex Schema (Simplified, For Reference Only)

```typescript
// users - managed by Clerk, synced to Convex via webhooks
users: {
  clerkId: string
  email: string
  name: string
  avatarUrl?: string
  timezone: string // Auto-detected from browser
  oneSignalPlayerId?: string // For push notifications
  createdAt: number
}

// circles
circles: {
  name: string
  iconImageId?: string // Square icon (replaces emoji)
  coverImageId?: string // Banner image (3:1 aspect ratio)
  description?: string
  adminId: Id
  inviteCode: string
  timezone: string
  createdAt: number
  archivedAt?: number
}

// memberships
memberships: {
  circleId: Id
  userId: Id
  role: "admin" | "member"
  joinedAt: number
  leftAt?: number // For tracking who left (excludes from active count)
}

// prompts
prompts: {
  circleId: Id
  text: string
  order: number
  active: boolean
  createdAt: number
}

// submissions (one per user per cycle)
submissions: {
  circleId: Id
  userId: Id
  cycleId: string // "2026-02" format
  submittedAt?: number
  lockedAt?: number
}

// responses (one per prompt per submission)
responses: {
  submissionId: Id
  promptId: Id
  text: string
  updatedAt: number
}

// media (photos and videos per response, max 3 per response)
media: {
  responseId: Id // Links to specific prompt response
  storageId?: Id // For photos stored in Convex
  muxAssetId?: string // For videos hosted on Mux
  type: "photo" | "video"
  thumbnailUrl?: string // Mux thumbnail URL for videos
  order: number
  uploadedAt: number
}

// newsletters (compiled output)
newsletters: {
  circleId: Id
  cycleId: string
  htmlContent: string
  sentAt: number
  issueNumber: number
}
```

---

## Newsletter Specification

### Structure

```
[Circle Cover Image - full width banner]

[Circle Icon] [Circle Name] - [Tagline]
Issue No. [X] - [Month Day, Year]

---

[Prompt 1 Title]

[Member Name 1]:
[Their text response]
[Media grid: photos/video thumbnails inline, max 3 items]

[Member Name 2]:
[Their text response]
[Media grid if attached]

...

---

[Prompt 2 Title]

[Member Name 1]:
[Their response with inline media]

...

---

See you next month!
[View in App button - requires login]
```

**Note:** Media (photos and videos) appears inline with each prompt response, not in a separate section. This allows members to pair specific media with specific prompts for richer storytelling.

### Design Principles

1. **Scannable** - Names as colored headers; clear section breaks; no walls of text
2. **Personal** - Member names prominent; their words unedited; photos are real (no filters)
3. **Lightweight** - Loads fast on mobile; works in email clients; no JavaScript required
4. **Consistent** - Same structure every month; predictability builds ritual

### Technical Requirements

- **Email:** HTML with inline CSS via React Email; max 600px width; UTF-8 encoding
- **Encoding:** UTF-8 throughout (supports emoji, non-Latin scripts, RTL languages)
- **In-app:** Native rendering via Capacitor webview; requires login
- **Photos:** Max 1200px wide; client-side compressed to <200KB (browser-image-compression); lazy loading
- **Videos:** Uploaded to Mux for compression/hosting; displayed as thumbnail with play button in email (Mux thumbnail endpoint)
- **Video playback (in-app):** Tap to play via Mux player, no autoplay; shows play/pause, progress bar, mute toggle
- **Email video handling:** Thumbnail with play button overlay; clicking opens web app (requires login)
- **Total email size:** <5MB target (photos compressed, videos are thumbnails only)
- **Missed month asset:** Sad puppy gif (asset TBD or use giphy.com/oqV7cTAWIQfmg)

---

## Timeline & Phasing (6 Weeks Flexible)

**Note:** Each epic follows the implementation plan template: Design (20-25%) → Implementation (50-60%) → Testing (20-25%) → Review & Deploy.

### Week 1: Epic 0 - Project Setup & Infrastructure (80-110 hours)

**CRITICAL: Complete Epic 0 before starting any feature work. This week has more hours due to setup overhead.**

**Development Environment Setup:**
- [ ] Verify Node.js 20+ LTS installed (`node --version`)
- [ ] Install pnpm globally (`npm install -g pnpm`)
- [ ] Initialize Next.js 14+ project with TypeScript (`pnpm create next-app`)
- [ ] Configure TypeScript strict mode (tsconfig.json)
- [ ] Set up ESLint with Next.js + TypeScript + React rules
- [ ] Set up Prettier with formatting rules
- [ ] Install Husky for Git hooks (`pnpm add -D husky`)
- [ ] Install lint-staged for pre-commit linting
- [ ] Install commitlint for conventional commits
- [ ] Create .vscode/extensions.json (ESLint, Prettier, Tailwind CSS IntelliSense)
- [ ] Create .vscode/settings.json for consistent formatting
- [ ] Set up pre-commit hooks (lint + format)

**UI Framework:**
- [ ] Install and configure shadcn/ui
- [ ] Apply tweakcn theme customization
- [ ] Set up Tailwind CSS configuration
- [ ] Install essential shadcn components (Button, Input, Dialog, Form, etc.)
- [ ] Configure global styles and CSS variables

**Backend & Services (DAY 1 critical items):**
- [ ] Apple Developer Program signup (24-48 hour approval wait) ⚠️ DO IMMEDIATELY
- [ ] Resend domain verification + DNS setup (24-48 hour propagation) ⚠️ DO IMMEDIATELY
- [ ] Create Convex account ($25/mo), initialize convex/ directory
- [ ] Install Convex packages (@convex-dev/client, convex)
- [ ] Configure ConvexProvider in app layout
- [ ] Create Clerk account, install @clerk/nextjs
- [ ] Configure OAuth in Clerk dashboard (Google client ID/secret, Apple credentials - requires Apple Developer approval)
- [ ] Set up Clerk webhooks → Convex HTTP actions for user sync
- [ ] Create Resend account, obtain API key (domain verification takes 24-48 hours)
- [ ] Install resend and @react-email/components packages
- [ ] Create Mux account, obtain API token, configure webhooks
- [ ] Create OneSignal account, install @onesignal/onesignal-capacitor plugin
- [ ] Install browser-image-compression

**Mobile Setup:**
- [ ] Initialize Capacitor (capacitor.config.ts, add iOS/Android platforms)
- [ ] Install Capacitor plugins (Camera, Filesystem, PushNotifications)
- [ ] Configure Next.js build for Capacitor compatibility

**Deployment & CI/CD:**
- [ ] Create Vercel account, connect GitHub repo
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up production and preview deployments
- [ ] Create PR template for code reviews
- [ ] Set up GitHub Actions CI (lint, type check, test on every PR)
- [ ] Test production build succeeds

**Design Tools (Figma MCP):**
- [ ] Install Figma MCP server for Claude Code
- [ ] Configure Figma API access token in MCP settings
- [ ] Create Second Saturday project workspace in Figma
- [ ] Set up Figma component library (shadcn/ui + tweakcn theme)
- [ ] Configure design tokens in Figma (match Tailwind config)
- [ ] Test Figma MCP: design sample component → generate code → verify quality
- [ ] Document Figma-to-code workflow

**Testing Infrastructure:**
- [ ] Install Vitest for unit/integration testing
- [ ] Install @testing-library/react and @testing-library/user-event
- [ ] Install Playwright for E2E testing
- [ ] Configure test coverage reporting (vitest.config.ts)
- [ ] Install @vitest/ui for interactive debugging
- [ ] Configure Playwright for mobile viewports
- [ ] Create test utilities directory (lib/test-utils/)
- [ ] Write example unit test (template)
- [ ] Write example E2E test (template)
- [ ] Add test scripts to package.json (test, test:watch, test:e2e, test:coverage)

**Monitoring & Analytics:**
- [ ] Create Sentry account, install @sentry/nextjs
- [ ] Configure Sentry for Next.js (client + server configs)
- [ ] Configure Sentry source maps
- [ ] Enable Vercel Analytics
- [ ] Create PostHog account, install posthog-js
- [ ] Configure PostHog provider in app layout
- [ ] Set up Sentry alerting (email for critical errors)
- [ ] Create lib/analytics.ts wrapper for event tracking

**Documentation:**
- [ ] Write privacy policy page (/privacy route) for App Store compliance
- [ ] Document setup instructions in README.md
- [ ] Create .env.example with all required variables
- [ ] Document testing guidelines
- [ ] Document Git workflow and branching strategy

**Validation:**
- [ ] Test entire stack is connected (can auth, query Convex, send email)
- [ ] Run all tests (`pnpm test`)
- [ ] Run E2E tests (`pnpm test:e2e`)
- [ ] Verify CI passes on a test PR
- [ ] Verify Sentry captures test error
- [ ] Verify PostHog tracks test event

**Key risks:**
- Apple Developer approval delay (24-48 hours, blocks iOS OAuth setup)
- DNS propagation for Resend (24-48 hours, blocks email testing)
- Learning curve with new stack (Convex, Clerk, Capacitor, Figma MCP)
- OAuth credential configuration (easy to misconfigure)
- Increased hour estimate (80-110 vs original 60-80) - plan accordingly

### Week 2: Epic 1 (Authentication & Identity) - Design → Implement → Test (60-80 hours)

**Phase 1: Design (Days 1-2, ~15-20 hours)**

Screens to design in Figma:
- [ ] Signup screen (email/password variant)
- [ ] Signup screen (OAuth variant - Google/Apple buttons)
- [ ] Email verification pending screen
- [ ] Login screen (email/password + OAuth options)
- [ ] Password reset screen (email-based)
- [ ] Profile settings screen (name, photo, password sections)
- [ ] Account deletion confirmation modal

Design checklist:
- [ ] Create wireframes for all 9 screens in Figma
- [ ] Apply tweakcn theme tokens (colors, typography, spacing)
- [ ] Design for mobile (375px) and desktop (1024px+)
- [ ] Design review with backend developer
- [ ] Use Figma MCP to generate component code (SignupForm, LoginForm, ProfileForm, etc.)
- [ ] Review generated code quality, refine designs if needed

**Phase 2: Implementation (Days 3-5, ~30-40 hours)**

Convex setup:
- [ ] Create users table in schema.ts (synced from Clerk via webhook)
- [ ] Create Clerk webhook endpoint (HTTP action for user.created, user.updated)
- [ ] Test webhook: signup in Clerk → verify user appears in Convex

UI implementation:
- [ ] Build SignupForm component (email/password + OAuth buttons)
- [ ] Integrate Clerk useSignUp hook
- [ ] Build email verification pending screen
- [ ] Build LoginForm component with Clerk useSignIn hook
- [ ] Build PasswordResetForm (email-based)
- [ ] Build ProfileSettings component
- [ ] Implement profile photo upload to Convex storage
- [ ] Build AccountDeletionModal with confirmation
- [ ] Implement account deletion (call Clerk API + delete from Convex)

Analytics events (PostHog):
- [ ] Track `user_signed_up` (with method: email/Google/Apple)
- [ ] Track `user_logged_in` (with method)
- [ ] Track `user_reset_password` (method: email)
- [ ] Track `profile_updated` (with field: name/photo)
- [ ] Track `account_deleted`

**Phase 3: Testing (Days 6-7, ~15-20 hours)**

Unit tests (Vitest):
- [ ] Test email validation logic
- [ ] Test profile photo file size/type validation

Integration tests (Vitest + Testing Library):
- [ ] Test Clerk webhook → Convex user sync (mock webhook payload)
- [ ] Test signup flow (email/password)
- [ ] Test signup flow (OAuth - mock Clerk hooks)
- [ ] Test login flow
- [ ] Test password reset flow
- [ ] Test profile update (name, photo)
- [ ] Test account deletion

E2E tests (Playwright):
- [ ] Test full signup flow (email/password + email verification)
- [ ] Test Google OAuth signup flow
- [ ] Test Apple Sign-In flow
- [ ] Test login flow (email/password)
- [ ] Test password reset via email
- [ ] Test profile photo upload
- [ ] Test account deletion

Manual QA:
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test OAuth on real devices (Clerk dev mode)
- [ ] Test Clerk → Convex sync in real-time
- [ ] Fix bugs found

**Phase 4: Review & Deploy (Continuous)**
- [ ] Create PR with Figma links and screenshots
- [ ] Code review (backend dev reviews frontend code)
- [ ] CI passes (lint, type check, tests)
- [ ] Deploy to Vercel preview
- [ ] Merge to main → auto-deploy to production
- [ ] Smoke test production auth flows
- [ ] Monitor Sentry for errors
- [ ] Monitor PostHog for signup events

**Key risks:**
- OAuth configuration complexity (Google/Apple credentials)
- Clerk → Convex webhook sync reliability
- Account deletion must handle all user data (GDPR)

### Week 3: Epic 2 (Circle Creation) + Epic 3 (Circle Membership) - Design → Implement → Test (70-90 hours)

**Phase 1: Design (Days 1-2, ~18-22 hours)**

**Epic 2 screens to design:**
- [ ] Circle creation form (name, icon upload, cover upload, description)
- [ ] Prompt selection screen (library + custom prompts)
- [ ] Prompt reorder screen (drag-and-drop interface)
- [ ] Circle settings screen (edit name, images, regenerate invite link)
- [ ] Invite link share modal (copy button with context)
- [ ] Empty state (no circles yet, CTA to create first circle)

**Epic 3 screens to design:**
- [ ] Invite link preview page (before signup/login - shows circle details)
- [ ] Circle home screen (shows prompts, member list, deadline countdown)
- [ ] Member list view (avatars, names, admin badge, submission status for admin)
- [ ] Leave circle confirmation modal
- [ ] Admin member removal modal (with keep/delete options)
- [ ] Admin submission status dashboard

Design checklist:
- [ ] Create wireframes for all 12 screens in Figma
- [ ] Design Instagram Stories-style circle tabs UI (for multi-circle users)
- [ ] Apply tweakcn theme tokens
- [ ] Design for mobile (375px) and desktop (1024px+)
- [ ] Design review with backend developer
- [ ] Use Figma MCP to generate components (CircleForm, PromptSelector, MemberList, etc.)
- [ ] Review generated code quality

**Phase 2: Implementation (Days 3-5, ~35-45 hours)**

**Epic 2 (Circle Creation) - Convex setup:**
- [ ] Create circles table in schema.ts
- [ ] Create prompts table in schema.ts
- [ ] Create createCircle mutation
- [ ] Create updateCircle mutation
- [ ] Create generateInviteLink mutation (UUID-based)
- [ ] Create getCirclesByUser query
- [ ] Create getCirclePrompts query

**Epic 2 - UI implementation:**
- [ ] Build CircleCreationForm component
- [ ] Implement circle icon/cover image upload with browser-image-compression
- [ ] Build PromptSelector component (4 defaults pre-selected, can add custom)
- [ ] Build PromptReorder component (drag-and-drop with dnd-kit)
- [ ] Build CircleSettings screen
- [ ] Implement invite link generation and copy-to-clipboard with context
- [ ] Implement 3-member minimum logic (show warning if < 3 members)

**Epic 3 (Circle Membership) - Convex setup:**
- [ ] Create memberships table in schema.ts
- [ ] Create joinCircle mutation
- [ ] Create leaveCircle mutation
- [ ] Create removeMember mutation (with keep/delete contributions option)
- [ ] Create getCircleMembers query
- [ ] Create getSubmissionStatus query (admin-only)

**Epic 3 - UI implementation:**
- [ ] Build InviteLinkPreview page (public, shows circle name, cover, member count)
- [ ] Build circle home screen (shows prompts, deadline, member list link)
- [ ] Build MemberList component (shows active members, admin badge)
- [ ] Build LeaveCircleModal with confirmation
- [ ] Build RemoveMemberModal (admin-only, with keep/delete options)
- [ ] Build AdminSubmissionDashboard (shows who submitted, who hasn't)

**Analytics events (PostHog):**
- [ ] Track `circle_created`
- [ ] Track `circle_updated` (field: name/cover/prompts)
- [ ] Track `invite_link_generated`
- [ ] Track `invite_link_copied`
- [ ] Track `invite_link_viewed`
- [ ] Track `circle_joined` (source: link/direct)
- [ ] Track `circle_left`
- [ ] Track `member_removed` (keep_contributions: true/false)

**Phase 3: Testing (Days 6-7, ~17-23 hours)**

**Epic 2 unit tests:**
- [ ] Test invite link generation (UUID format)
- [ ] Test circle name validation (3-50 chars)
- [ ] Test image file size/type validation

**Epic 2 integration tests:**
- [ ] Test createCircle mutation (with defaults)
- [ ] Test updateCircle mutation
- [ ] Test prompt CRUD operations
- [ ] Test invite link regeneration

**Epic 3 integration tests:**
- [ ] Test joinCircle mutation (via invite link)
- [ ] Test leaveCircle mutation (preserves contributions)
- [ ] Test removeMember mutation (keep contributions)
- [ ] Test removeMember mutation (delete contributions)
- [ ] Test getCircleMembers query (active members only)
- [ ] Test getSubmissionStatus query (admin-only)

**E2E tests:**
- [ ] Test full circle creation flow (name, upload icon, add custom prompt)
- [ ] Test invite link copy includes context
- [ ] Test join circle via invite link (new user signup flow)
- [ ] Test join circle via invite link (existing user login flow)
- [ ] Test leave circle (confirm contributions stay)
- [ ] Test admin remove member (keep contributions)
- [ ] Test admin remove member (delete contributions, shows [Removed])
- [ ] Test admin submission dashboard shows correct statuses

**Manual QA:**
- [ ] Test image upload on iOS/Android
- [ ] Test invite link sharing via WhatsApp, iMessage
- [ ] Test prompt drag-and-drop reorder on mobile
- [ ] Test 3-member minimum warning
- [ ] Test admin dashboard real-time updates (Convex subscription)
- [ ] Fix bugs found

**Phase 4: Review & Deploy (Continuous)**
- [ ] Create PR with Figma links
- [ ] Code review
- [ ] CI passes
- [ ] Deploy to preview
- [ ] Merge to main
- [ ] Smoke test circle creation and invite flow in production
- [ ] Monitor Sentry for errors
- [ ] Monitor PostHog for circle_created events

**Key risks:**
- Image upload/compression on mobile devices
- Invite link security (public in V0, no auth check before preview)
- Real-time submission status updates (Convex subscription performance)
- Member removal with delete contributions (must clean up all data)

### Week 4: Epic 4 (Content Submission) - Design → Implement → Test (70-90 hours)

**Phase 1: Design (Days 1-2, ~18-22 hours)**

Screens to design in Figma:
- [ ] Multi-circle submission screen (Instagram Stories-style tabs at top)
- [ ] Single circle submission view (list of prompts)
- [ ] Prompt response card (text input + media upload area)
- [ ] Character counter component (500 char limit)
- [ ] Photo upload interface (gallery selector, camera capture, preview grid)
- [ ] Video upload interface (blocking UI with progress indicator)
- [ ] Media preview grid (max 3 items per response, with remove button)
- [ ] Deadline countdown component (prominent, shows local time)
- [ ] Submission status indicators (not started, in progress, submitted, locked)
- [ ] Empty state (no circles, no prompts)
- [ ] Auto-save indicator ("Saving...", "Saved")

Design checklist:
- [ ] Create wireframes for all 11 screens/components in Figma
- [ ] Design circle tabs with status indicators (empty circle, half-filled, checkmark)
- [ ] Design for mobile-first (375px) - this is a mobile-heavy feature
- [ ] Design desktop (1024px+) layout
- [ ] Design media grid layout (1 photo, 2 photos, 3 photos, 1 video, mixed)
- [ ] Design video upload blocking UI with progress bar
- [ ] Apply tweakcn theme tokens
- [ ] Design review with backend developer
- [ ] Use Figma MCP to generate components (SubmissionForm, PromptCard, MediaUploader, etc.)
- [ ] Review generated code quality

**Phase 2: Implementation (Days 3-5, ~35-45 hours)**

Convex setup:
- [ ] Create submissions table in schema.ts (one per user per circle per cycle)
- [ ] Create responses table in schema.ts (one per prompt per submission)
- [ ] Create media table in schema.ts (photos/videos linked to responses)
- [ ] Create createSubmission mutation
- [ ] Create updateResponse mutation (for auto-save)
- [ ] Create uploadMedia action (handles file upload to Convex storage for photos)
- [ ] Create uploadVideoToMux action (uploads video to Mux, stores asset ID)
- [ ] Create Mux webhook endpoint (handles video.asset.ready for thumbnails)
- [ ] Create lockSubmission mutation (triggered at deadline)
- [ ] Create getSubmissionForCircle query (gets user's draft or locked submission)

UI implementation:
- [ ] Build MultiCircleSubmissionScreen with horizontal tabs
- [ ] Build circle tab component (icon, name, status indicator)
- [ ] Build PromptResponseCard component (text input + media area)
- [ ] Implement auto-save with 2-second debounce (useDebounce hook)
- [ ] Build MediaUploader component (gallery/camera selector)
- [ ] Integrate @capacitor/camera for photo capture
- [ ] Implement client-side image compression with browser-image-compression
- [ ] Build VideoUploader component with blocking UI and progress
- [ ] Integrate Mux upload (get upload URL, upload file, display progress)
- [ ] Build MediaPreviewGrid (shows uploaded photos/videos, max 3)
- [ ] Implement media removal
- [ ] Build DeadlineCountdown component (shows local time)
- [ ] Implement deadline logic (lock at 10:59 AM UTC second Saturday)
- [ ] Display locked state (read-only view after deadline)
- [ ] Build submission status switching between circles (preserve drafts)

Analytics events (PostHog):
- [ ] Track `submission_started` (circle_id, prompt_count)
- [ ] Track `submission_photo_added`
- [ ] Track `submission_video_added`
- [ ] Track `submission_saved_draft`
- [ ] Track `submission_completed`

**Phase 3: Testing (Days 6-7, ~17-23 hours)**

Unit tests:
- [ ] Test character counter (500 char limit)
- [ ] Test auto-save debounce logic (waits 2 seconds)
- [ ] Test deadline detection (10:59 AM UTC conversion to local time)
- [ ] Test media count validation (max 3 per response)
- [ ] Test video file size validation (25MB limit)

Integration tests:
- [ ] Test createSubmission mutation
- [ ] Test updateResponse mutation (auto-save)
- [ ] Test uploadMedia to Convex storage (photos)
- [ ] Test uploadVideoToMux (mock Mux API)
- [ ] Test Mux webhook (mock video.asset.ready payload)
- [ ] Test lockSubmission mutation at deadline
- [ ] Test getSubmissionForCircle query (returns draft or locked)

E2E tests:
- [ ] Test full submission flow (write text, upload photo, save draft)
- [ ] Test multi-circle switching (drafts persist per circle)
- [ ] Test photo upload from gallery (mock Capacitor Camera API)
- [ ] Test video upload with progress indicator
- [ ] Test media removal
- [ ] Test auto-save (type, wait 2 sec, verify saved)
- [ ] Test deadline countdown displays correctly in local timezone
- [ ] Test submission locks at deadline (cannot edit after)
- [ ] Test character limit enforcement (cannot type beyond 500)

Manual QA:
- [ ] Test photo upload on real iOS device (camera + gallery)
- [ ] Test photo upload on real Android device
- [ ] Test video upload on real iOS device (blocking UI, progress)
- [ ] Test video upload on real Android device
- [ ] Test browser-image-compression on mobile (verify file size reduction)
- [ ] Test Mux video workflow end-to-end (upload → process → thumbnail ready)
- [ ] Test auto-save works offline (stores locally, syncs when online)
- [ ] Test multi-circle tab switching on mobile
- [ ] Test deadline countdown accuracy (check multiple timezones)
- [ ] Fix bugs found

**Phase 4: Review & Deploy (Continuous)**
- [ ] Create PR with Figma links, demo video of submission flow
- [ ] Code review
- [ ] CI passes
- [ ] Deploy to preview
- [ ] Merge to main
- [ ] Smoke test submission flow in production
- [ ] Monitor Sentry for Mux upload errors
- [ ] Monitor PostHog for submission events
- [ ] Check Mux dashboard for video processing stats

**Key risks:**
- Mux video upload workflow complexity (upload URL generation, webhook handling)
- Video upload UX on slow connections (blocking UI must show accurate progress)
- Auto-save reliability (must not lose data)
- Deadline logic accuracy across timezones (10:59 AM UTC must lock correctly)
- Mobile camera/gallery permissions (Capacitor Camera plugin)

### Week 5: Epic 5 (Newsletter) + Epic 6 (Notifications) - Design → Implement → Test (70-90 hours)

**Phase 1: Design (Days 1-2, ~18-22 hours)**

**Epic 5 screens to design:**
- [ ] Newsletter web view (responsive, mobile-first)
- [ ] Newsletter header (circle icon, name, issue number, date)
- [ ] Newsletter section per prompt (prompt title, member responses)
- [ ] Member response card (name, text, inline media grid)
- [ ] Newsletter archive list view (shows past issues by date)
- [ ] Empty state (no newsletters yet)
- [ ] "Missed month" email template (sad puppy gif, encouraging message)

**Epic 6 screens to design:**
- [ ] Notification preferences screen (global toggles)
- [ ] Push notification UI (system notifications - document appearance only)
- [ ] In-app notification banner (if needed)

**Email template design:**
- [ ] Design React Email template for newsletter (responsive, 600px max width)
- [ ] Design for Gmail rendering (limited CSS support)
- [ ] Design for Outlook rendering (even more limited CSS)
- [ ] Design for Apple Mail rendering (best support)
- [ ] Design video thumbnail with play button overlay
- [ ] Design "View in App" CTA button
- [ ] Design footer with unsubscribe link

Design checklist:
- [ ] Create wireframes for all screens in Figma
- [ ] Design email template in Figma (export to React Email)
- [ ] Test email template in email client preview tools
- [ ] Apply tweakcn theme tokens
- [ ] Design review with backend developer
- [ ] Use Figma MCP to generate newsletter web view components
- [ ] Review generated code quality

**Phase 2: Implementation (Days 3-5, ~35-45 hours)**

**Epic 5 (Newsletter) - Convex setup:**
- [ ] Create newsletters table in schema.ts
- [ ] Create compileNewsletter action (runs after deadline, organizes by prompt)
- [ ] Create sendNewsletter action (sends via Resend to all members)
- [ ] Create getNewsletterById query
- [ ] Create getNewslettersByCircle query (for archive)
- [ ] Set up Convex cron job (runs at 11:00 AM UTC second Saturday)

**Epic 5 - UI implementation:**
- [ ] Build NewsletterView component (renders compiled newsletter)
- [ ] Build PromptSection component (shows all responses for one prompt)
- [ ] Build MemberResponse component (name, text, inline media grid)
- [ ] Build NewsletterArchive component (lists past issues)
- [ ] Build NewsletterWebView page (/circle/[id]/newsletter/[cycleId])
- [ ] Implement auth check (requires login)

**Epic 5 - Email implementation:**
- [ ] Create React Email template (NewsletterEmail.tsx)
- [ ] Implement responsive layout (works in Gmail/Outlook/Apple Mail)
- [ ] Implement video thumbnail with play button (links to web view)
- [ ] Implement "View in App" CTA button
- [ ] Implement footer with unsubscribe link
- [ ] Test inline CSS (no external stylesheets for email)
- [ ] Create MissedMonthEmail.tsx template (sad puppy gif)
- [ ] Implement newsletter compilation logic (organize by prompt, filter empty prompts)
- [ ] Implement async newsletter sending (via Resend)
- [ ] Handle Mux thumbnail URLs in email (video thumbnails)

**Epic 6 (Notifications) - Convex setup:**
- [ ] Create notificationPreferences table in schema.ts
- [ ] Create updateNotificationPreferences mutation
- [ ] Create sendPushNotification action (calls OneSignal API)
- [ ] Set up Convex cron job for submission reminders (3 days before deadline)
- [ ] Implement reminder logic (only send to non-submitters)

**Epic 6 - UI implementation:**
- [ ] Build NotificationPreferences screen (toggles for reminders, newsletter)
- [ ] Integrate OneSignal SDK (initialize on app load)
- [ ] Register OneSignal player ID in Convex (store in users table)
- [ ] Implement push notification handlers (on notification received, clicked)
- [ ] Implement deep linking from push notifications

**Epic 6 - Notification implementation:**
- [ ] Implement submission reminder notification (3 days before deadline)
- [ ] Implement newsletter ready notification
- [ ] Implement admin manual reminder (max 3 per cycle)
- [ ] Implement reminder count tracking (resets after newsletter sends)

**Analytics events (PostHog):**
- [ ] Track `newsletter_compiled` (circle_id, member_count, submission_count)
- [ ] Track `newsletter_sent` (circle_id, recipient_count)
- [ ] Track `newsletter_opened` (email tracking pixel)
- [ ] Track `newsletter_clicked` (CTA: view_in_app)
- [ ] Track `push_notification_sent` (type: reminder/newsletter_ready)
- [ ] Track `push_notification_clicked` (type)
- [ ] Track `notification_settings_updated`

**Phase 3: Testing (Days 6-7, ~17-23 hours)**

**Epic 5 unit tests:**
- [ ] Test newsletter compilation logic (organizes by prompt)
- [ ] Test filter empty prompts (no responses = omit from newsletter)
- [ ] Test member name formatting
- [ ] Test date formatting (local timezone)

**Epic 5 integration tests:**
- [ ] Test compileNewsletter action (mock submissions data)
- [ ] Test sendNewsletter action (mock Resend API)
- [ ] Test Convex cron job (manual trigger)
- [ ] Test getNewsletterById query
- [ ] Test newsletter with 0 submissions (sends MissedMonthEmail)

**Epic 5 E2E tests:**
- [ ] Test full newsletter flow (compile → send → receive email)
- [ ] Test newsletter archive view (shows past issues)
- [ ] Test newsletter web view (requires login)
- [ ] Test video thumbnail in email (links to web view)
- [ ] Test "View in App" button
- [ ] Test unsubscribe link (stops emails, keeps membership)

**Epic 5 email testing:**
- [ ] Send test newsletter to Gmail (check rendering)
- [ ] Send test newsletter to Outlook (check rendering)
- [ ] Send test newsletter to Apple Mail (check rendering)
- [ ] Test total email size <5MB (photos compressed, videos as thumbnails)
- [ ] Test email with 0 images (fallback text works)
- [ ] Test missed month email (sad puppy gif renders)

**Epic 6 integration tests:**
- [ ] Test updateNotificationPreferences mutation
- [ ] Test sendPushNotification action (mock OneSignal API)
- [ ] Test submission reminder logic (only non-submitters)
- [ ] Test admin manual reminder count tracking

**Epic 6 E2E tests:**
- [ ] Test submission reminder received (3 days before deadline)
- [ ] Test newsletter ready notification received
- [ ] Test notification deep linking (opens correct screen)
- [ ] Test notification preferences (toggle off, verify no notifications)
- [ ] Test admin manual reminder (max 3 limit)

**Manual QA:**
- [ ] Test push notifications on real iOS device (OneSignal)
- [ ] Test push notifications on real Android device
- [ ] Test email deliverability (check spam score)
- [ ] Test newsletter rendering across email clients
- [ ] Test video thumbnails in email (click opens web view)
- [ ] Test Convex cron jobs trigger at correct times
- [ ] Fix bugs found

**Phase 4: Review & Deploy (Continuous)**
- [ ] Create PR with Figma links, email template preview
- [ ] Code review
- [ ] CI passes
- [ ] Deploy to preview
- [ ] Merge to main
- [ ] Smoke test newsletter compilation and sending in production
- [ ] Monitor Resend dashboard for email delivery stats
- [ ] Monitor OneSignal dashboard for push delivery stats
- [ ] Monitor Sentry for newsletter compilation errors
- [ ] Monitor PostHog for newsletter events
- [ ] Check email deliverability (not in spam)

**Key risks:**
- Email deliverability (newsletters may land in spam)
- Email rendering inconsistencies (Gmail/Outlook have limited CSS support)
- React Email template complexity (must work without external CSS)
- Video thumbnails in email (some clients block images)
- OneSignal push notification reliability (FCM/APNs integration)
- Convex cron job timing accuracy (must run exactly at 11:00 AM UTC)

### Week 6: Mobile Build, App Store Prep & Launch (70-90 hours)

**Days 1-3: Mobile Build & Testing (40-50 hours)**

Mobile builds (Capacitor already set up in Week 1):
- [ ] Run `pnpm build` to create Next.js production build
- [ ] Run `npx cap sync` to copy web assets to native projects
- [ ] Open iOS project in Xcode (`npx cap open ios`)
- [ ] Configure signing certificates and provisioning profiles in Xcode
- [ ] Build iOS app on simulator, test all features
- [ ] Build iOS app on real device, test all features
- [ ] Open Android project in Android Studio (`npx cap open android`)
- [ ] Configure app signing for Android
- [ ] Build Android app on emulator, test all features
- [ ] Build Android app on real device, test all features

Mobile-specific testing:
- [ ] Test camera access (iOS and Android)
- [ ] Test gallery access (iOS and Android)
- [ ] Test photo upload with browser-image-compression on mobile
- [ ] Test video upload to Mux on mobile (blocking UI, progress)
- [ ] Test push notifications (OneSignal on iOS and Android)
- [ ] Test deep linking from push notifications
- [ ] Test app performance (smooth scrolling, no lag)
- [ ] Test offline behavior (show error, don't crash)
- [ ] Test keyboard behavior (doesn't cover input fields)
- [ ] Test safe area handling (notch, home indicator on iOS)
- [ ] Test landscape orientation (if supported)
- [ ] Test text input with emoji keyboard
- [ ] Test accessibility (VoiceOver on iOS, TalkBack on Android)

Bug fixes:
- [ ] Fix any iOS-specific bugs found
- [ ] Fix any Android-specific bugs found
- [ ] Optimize mobile performance (lazy loading, code splitting)
- [ ] Test fixed bugs on both platforms

**Days 4-5: App Store Preparation (20-30 hours)**

App Store Connect (iOS):
- [ ] Log into App Store Connect (requires Apple Developer account)
- [ ] Create app listing (Second Saturday)
- [ ] Fill in app description (use PRD problem statement)
- [ ] Fill in keywords (friendship, newsletter, circles, groups)
- [ ] Upload app screenshots (iPhone 6.7", 6.5", 5.5")
- [ ] Upload app preview video (optional, recommended)
- [ ] Set app category (Social Networking)
- [ ] Set age rating (4+, no mature content)
- [ ] Add privacy policy URL (https://yourdomain.com/privacy)
- [ ] Fill in App Privacy questionnaire (data collection, email, etc.)
- [ ] Set pricing (Free)
- [ ] Set availability (All countries or select markets)

Google Play Console (Android):
- [ ] Log into Google Play Console
- [ ] Create app listing (Second Saturday)
- [ ] Fill in app description
- [ ] Upload screenshots (phone, 7", 10" tablet)
- [ ] Upload feature graphic (1024x500)
- [ ] Upload app icon (512x512)
- [ ] Set app category (Social)
- [ ] Set content rating (fill questionnaire)
- [ ] Add privacy policy URL
- [ ] Fill in Data safety section (data collection, encryption)
- [ ] Set pricing (Free)
- [ ] Set availability (All countries or select markets)

Build for TestFlight/Beta:
- [ ] Archive iOS app in Xcode (Product → Archive)
- [ ] Upload to App Store Connect via Xcode Organizer
- [ ] Wait for processing (5-30 minutes)
- [ ] Add beta testers in TestFlight (internal or external)
- [ ] Send TestFlight invite to 5-10 beta testers
- [ ] Build Android app bundle (Build → Generate Signed Bundle)
- [ ] Upload to Google Play Console (Internal testing track)
- [ ] Add beta testers to internal testing track
- [ ] Send Google Play beta invite to testers

Beta testing:
- [ ] Beta testers install and test for 2-3 days
- [ ] Collect feedback (bugs, UX issues, crashes)
- [ ] Fix critical bugs found in beta
- [ ] Upload new builds if needed (TestFlight/Google Play)

**Days 6-7: Production Submission & Launch (10-15 hours)**

Final checks:
- [ ] Run full test suite one more time (`pnpm test`, `pnpm test:e2e`)
- [ ] Verify all environment variables set in Vercel production
- [ ] Verify Sentry is capturing errors in production
- [ ] Verify PostHog is tracking events in production
- [ ] Verify Resend domain is verified and emails send successfully
- [ ] Verify Mux videos upload and generate thumbnails
- [ ] Verify OneSignal push notifications send successfully
- [ ] Verify Clerk auth flows work in production
- [ ] Verify Convex cron jobs are scheduled correctly

App Store submission (iOS):
- [ ] Submit final build for App Review
- [ ] Wait for review (typically 1-3 days, up to 5 days)
- [ ] Respond to any App Review questions/rejections
- [ ] If rejected: fix issues, resubmit (adds 1-3 days)
- [ ] Once approved: release manually or set to auto-release

Google Play submission (Android):
- [ ] Promote internal testing build to production
- [ ] Submit for review
- [ ] Wait for review (typically 1-3 days)
- [ ] Once approved: roll out to 100% of users or staged rollout

Web launch:
- [ ] Already live on Vercel (auto-deployed from main branch)
- [ ] Verify web app works in production
- [ ] Test on multiple browsers (Chrome, Safari, Firefox, Edge)

Soft launch:
- [ ] Create your own first circle with 5-10 real friends
- [ ] Send invite links
- [ ] Monitor first newsletter cycle (invite → submissions → newsletter send)
- [ ] Collect feedback from first users
- [ ] Monitor Sentry for errors
- [ ] Monitor PostHog for user behavior
- [ ] Monitor Resend for email deliverability

Post-launch monitoring (ongoing):
- [ ] Set up daily Sentry error digest email
- [ ] Set up weekly PostHog report (signups, circles created, newsletters sent)
- [ ] Monitor Resend sender reputation
- [ ] Monitor Mux video processing queue
- [ ] Monitor OneSignal delivery rates
- [ ] Track success metrics (submission rate >50%, open rate >70%, retention at 3 months >60%)

**Key risks:**
- **App Store rejection (MEDIUM RISK)** - Privacy policy, data collection disclosure. Mitigation: clear privacy policy, respond quickly to reviewer questions, have fallback release date.
- **App review delays** - iOS review can take 1-5 days, sometimes longer during holidays. Mitigation: submit by end of Week 5 if possible.
- **Mobile bugs found late** - Camera, gallery, or push notifications may behave differently on real devices. Mitigation: test on real devices early (Day 1-2 of Week 6).
- **Email deliverability issues** - First newsletters may land in spam. Mitigation: warm up sender reputation, monitor bounce rates, use Resend best practices.

---

### Post-Launch: Ongoing Operations

After successful launch, maintain and improve the product:

**Daily:**
- [ ] Check Sentry for new errors (respond within 24 hours)
- [ ] Check Resend for email bounces/complaints
- [ ] Monitor user signups and circle creations (PostHog)

**Weekly:**
- [ ] Review PostHog analytics (signups, circles, submissions, newsletters)
- [ ] Review user feedback (app store reviews, support emails)
- [ ] Plan bug fixes and small improvements
- [ ] Deploy fixes to production (via PR → main → auto-deploy)

**Monthly:**
- [ ] Review success metrics against targets
- [ ] Analyze newsletter open rates and submission rates
- [ ] Interview power users (what's working, what's not)
- [ ] Plan V0.1 features based on feedback
- [ ] Review costs (Convex, Clerk, Resend, Mux, etc.)

**Success metric targets (from PRD):**
- Submission rate per cycle: >50%
- Newsletter open rate: >70%
- Circle retention at 3 months: >60%
- Members per circle: 6-12 average
- Multi-circle users: >30% in 2+ circles
- NPS: >50

---

## Total Timeline: 6 Weeks (380-550 hours)

- **Week 1:** Epic 0 (Project Setup) - 80-110 hours
- **Week 2:** Epic 1 (Auth) - 60-80 hours
- **Week 3:** Epic 2 + 3 (Circles & Membership) - 70-90 hours
- **Week 4:** Epic 4 (Submission) - 70-90 hours
- **Week 5:** Epic 5 + 6 (Newsletter & Notifications) - 70-90 hours
- **Week 6:** Mobile Build & Launch - 70-90 hours

**Total:** 420-550 hours (average 485 hours)

**Team capacity:** 2 developers, 60-80 hours/week combined = 360-480 hours over 6 weeks

**Buffer:** With aggressive pace (80 hours/week), you have 480 hours capacity vs 550 max estimated = 70 hours shortfall at maximum. With realistic pace (70 hours/week), you have 420 hours capacity vs 420 min estimated = perfectly matched at minimum.

**Recommendation:** Aim for 70-75 hours/week combined (35-38 hours each) to stay on track without burnout. Week 1 is heaviest (setup overhead), weeks 2-5 are steady, Week 6 has external dependencies (app review wait times).

---
- Gather user feedback for V0.1 features
- Plan P1 features: onboarding, member list preview, SMS reminders, etc.

---

## Open Questions

All major product questions have been resolved during validation. Remaining questions are implementation details to be addressed during development.

### Resolved Questions

| Question | Decision |
|----------|----------|
| What happens if a circle has 0 submissions? | Send "missed month" email with sad puppy gif encouraging participation |
| Minimum circle size? | 3 members minimum before first newsletter sends |
| Circle drops below 3 members after starting? | Grandfather existing circles; newsletters continue regardless of member count |
| Someone joining mid-month? | Same deadline as others; can submit for current cycle |
| Exact deadline cutoff? | Second Saturday 10:59 AM UTC; newsletter compiles asynchronously and sends when ready |
| Content when someone leaves? | Stays for remaining members; departed member loses access while away but regains on rejoin |
| Rejoining a circle? | Seamless; restores full access to all past newsletters and their own previous contributions |
| Data retention for deleted accounts? | Delete immediately per GDPR "without undue delay" |
| Character encoding? | UTF-8 for all text (supports emoji, non-Latin scripts, RTL languages) |
| Image moderation? | Trust-based for MVP. No reporting or screening. |
| Multi-admin support? | Single admin only for MVP. |
| Email verification for OAuth? | Skip email verification if signing up via Google/Apple (Clerk handles this) |
| Video compression approach? | Use Mux for hosting, compression, and thumbnail generation; user waits during upload (blocking UI) |
| Image compression approach? | Client-side using browser-image-compression before upload |
| Push notification provider? | OneSignal (free tier, abstracts FCM/APNs complexity) |
| Offline support? | Not in V0; show error if offline. Defer to V0.1. |
| Deep linking from email? | Not in V0; simple "View in App" button that requires login. Defer to V0.1. |
| Submission status visibility? | Admin-only in V0; regular members cannot see others' progress. Defer member visibility to V0.1. |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Cold start problem** - Circles need critical mass to be valuable | High | High | Launch with curated friend groups (yours); 4 starter prompts that work with 2-3 people; 3-member minimum prevents empty newsletters |
| **Reminder fatigue** - People ignore notifications | Medium | High | Smart reminder timing (3 days before); OneSignal allows A/B testing notification copy; let users customize or disable |
| **Email deliverability** - Newsletters go to spam | Medium | High | Use Resend with proper DNS setup; warm up sender reputation by starting small; include unsubscribe; monitor bounce rates |
| **Clerk MAU limits** - Free tier limit at 10k MAU | Low | Medium | Free tier sufficient for MVP; upgrade to Pro if needed |
| **Mux video costs** - Free tier 1000 mins/month | Low | Medium | Monitor usage; 1000 mins = 2000 videos × 30 sec; sufficient for MVP; after validation can optimize or use alternative |
| **Apple App Store rejection** - Privacy policy, data collection | Medium | High | Submit TestFlight build by end of Week 3; clear privacy policy; respond quickly to rejections |
| **Learning curve with stack** - New to Convex, Clerk, Mux | High | Medium | Start with thorough documentation reading; use Claude Code heavily; build iteratively; Week 1 setup critical for de-risking |
| **Timeline overrun** - 5 weeks is aggressive | Medium | Low | 5-week timeline already has buffer vs. 3-4 week original; can deprioritize P1 features if needed; Claude Code accelerates development |
| **Circle abandonment** - Groups go silent | High | Medium | V0 won't solve this; requires V0.1+ features (nurturing, admin tools, engagement prompts) |

---

## Appendix A: Default Prompt Library

### Starter Set (Pre-filled for New Circles)

1. **What did you do this month?** - Open-ended life update
2. **One Good Thing** - Positive moment, big or small
3. **On Your Mind** - What you're thinking about lately
4. **What are you listening to?** - Music, podcasts, anything audio

### Extended Options (For Admin to Browse)

- **What are you reading/watching?**
- **A photo that tells a story**
- **Something you learned**
- **What's challenging you right now?**
- **A question for the group**
- **What are you looking forward to?**
- **Unpopular opinion**
- **Recommendation of the month**

---

## Appendix B: Competitive Landscape

| Product | Approach | Why Second Saturday is Different |
|---------|----------|--------------------------------|
| **Letterloop** | Similar concept | Second Saturday has fixed cadence (ritual), simpler UX, mobile-first with Capacitor |
| **Marco Polo** | Video messages | Async video is higher friction; Second Saturday is text-first with optional media |
| **WhatsApp/Group chats** | Real-time messaging | Second Saturday is structured, async, compiled; doesn't demand immediate attention |
| **Instagram Close Friends** | Stories to select group | Still performative; ephemeral; no compilation or ritual |
| **Substack** | Personal newsletters | 1-to-many; Second Saturday is many-to-many within a closed group |

**Core differentiator:** The constraint of monthly cadence + structured prompts + compiled newsletter creates a ritual that's sustainable where constant connection fails. Email is gateway to app, app is gateway to ritual.

---

## Appendix C: Validation Summary

This PRD has been validated for:
- **Completeness:** All 6 epics reviewed, gaps identified and resolved
- **Technical feasibility:** Stack choices validated against MVP requirements and timeline
- **UX flows:** Three persona journeys validated for friction points
- **Timeline realism:** 5-week flexible timeline accounts for learning curve and buffer
- **Cost accuracy:** Realistic budget of ~$100/month (vs. original $8-28 estimate)

**Key clarifications incorporated:**
- OAuth signup skips email verification; email/password requires verification
- Video handling via Mux with blocking UI during upload
- Image compression client-side with browser-image-compression
- Push notifications via OneSignal (not Firebase)
- Submission status admin-only (no member visibility in V0)
- Timeline extended to 5 weeks with flexibility to finish faster
- SMS reminders deferred to future release (requires phone collection)
- Phone authentication removed from V0 (email + OAuth only)
- Deep linking and onboarding deferred to V0.1+

---

*Document last updated: February 4, 2026*
*Version: 2.0 (Comprehensive Validation - Design/Testing/Monitoring Integrated)*
*Timeline: 6 weeks (420-550 hours total, realistic with all phases)*
*Team: 2 developers (frontend + backend), 70-80 hours/week combined recommended*
*Each Epic: Design (20-25%) → Implementation (50-60%) → Testing (20-25%) → Deploy*
