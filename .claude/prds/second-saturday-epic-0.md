---
name: second-saturday-epic-0
description: Project Setup & Infrastructure - foundational setup for Next.js, Convex, Clerk, services, and tooling
status: backlog
created: 2026-02-04T12:00:00Z
parent_prd: second-saturday
timeline: Week 1 (80-110 hours - more hours due to setup overhead)
---

# Epic 0: Project Setup & Infrastructure

**Parent PRD:** [second-saturday](./second-saturday.md)
**Status:** Backlog
**Timeline:** Week 1 (80-110 hours)

---

## Overview

This epic covers the foundational setup required before any feature development can begin. This includes project initialization, development environment configuration, third-party service integration, deployment pipeline, and establishing the codebase structure.

**Context:** This is the prerequisite for all other epics. Without completing Epic 0, no feature work can proceed. This epic should be completed in Week 1.

---

## Goals

1. **Establish development environment** - Next.js 14+ with TypeScript, ESLint, Prettier, Git hooks
2. **Configure UI framework** - shadcn/ui with tweakcn theme for rapid, consistent component development
3. **Set up backend infrastructure** - Convex database and serverless functions
4. **Integrate authentication** - Clerk with OAuth (Google, Apple) and email verification
5. **Configure external services** - Resend (email), Mux (video), OneSignal (push notifications)
6. **Prepare mobile deployment** - Apple Developer account, Capacitor configuration
7. **Establish testing infrastructure** - Vitest, Playwright, CI/CD
8. **Set up monitoring** - Sentry error tracking, PostHog analytics
9. **Configure design workflow** - Figma MCP integration for design-to-code
10. **Deploy to production** - Vercel hosting with automatic deployments

---

## Implementation Plan

### Phase 1: Design (20-25% of epic time)

**Note:** Epic 0 is primarily technical setup, so "design" here means architectural planning rather than visual design.

**Activities:**
1. **Plan project structure**
   - Define directory structure (app/, components/, lib/, convex/, e2e/)
   - Map out configuration files needed
   - Identify all third-party services and their setup order

2. **Document setup workflow**
   - Create checklist for DAY 1 critical items (Apple Developer, Resend DNS)
   - Identify dependencies between setup tasks
   - Plan for 24-48 hour approval/propagation waits

3. **Review with backend developer**
   - Agree on Convex schema structure
   - Define API boundaries between frontend and backend
   - Establish Git workflow and branching strategy

**Deliverables:**
- Project structure plan
- Setup task checklist with priorities
- Development workflow documentation

---

### Phase 2: Implementation (50-60% of epic time)

**Activities:**

1. **Development Environment Setup**
   - Verify Node.js 20+ LTS installed
   - Install pnpm globally
   - Initialize Next.js 14+ project with TypeScript
   - Configure TypeScript strict mode
   - Set up ESLint with Next.js + TypeScript + React rules
   - Set up Prettier with formatting rules
   - Install Husky for Git hooks
   - Install lint-staged for pre-commit linting
   - Install commitlint for conventional commits
   - Create .vscode/extensions.json and settings.json
   - Configure environment variable handling (.env.local, .env.example)
   - Set up basic project directory structure

2. **UI Framework**
   - Install and configure shadcn/ui
   - Apply tweakcn theme customization
   - Set up Tailwind CSS configuration
   - Install essential shadcn components (Button, Input, Dialog, Form, etc.)
   - Configure global styles and CSS variables
   - Set up dark mode support (if applicable)

3. **Backend & Services (DAY 1 critical items)**
   - Apple Developer Program signup (24-48 hour wait) ⚠️ DO IMMEDIATELY
   - Resend domain verification + DNS setup (24-48 hour wait) ⚠️ DO IMMEDIATELY
   - Create Convex account ($25/mo), initialize convex/ directory
   - Install Convex packages, configure ConvexProvider
   - Create initial schema.ts with placeholder types
   - Configure Convex file storage and HTTP actions
   - Create Clerk account, install @clerk/nextjs
   - Configure Clerk environment variables
   - Enable Google OAuth and Apple Sign-In in Clerk
   - Set up Clerk webhooks and middleware
   - Create Resend account, obtain API key
   - Install resend and @react-email packages
   - Create Mux account, configure webhooks
   - Create OneSignal account, install Capacitor plugin
   - Configure FCM (Android) and APNs (iOS) credentials

4. **Apple Developer Account**
   - Enroll in Apple Developer Program ($99/year)
   - Wait for approval (24-48 hours)
   - Create App ID in Apple Developer portal
   - Generate certificates and provisioning profiles
   - Configure Apple Sign-In and Push Notifications capabilities
   - Set up App Store Connect account
   - Create app listing in App Store Connect

5. **Capacitor Mobile Setup**
   - Install @capacitor/core and @capacitor/cli
   - Initialize Capacitor project (capacitor.config.ts)
   - Configure Next.js build output for Capacitor
   - Add iOS and Android platforms
   - Install Capacitor plugins (Camera, Filesystem, PushNotifications)
   - Configure app name, bundle ID, and version
   - Set up Xcode project (requires macOS)
   - Set up Android Studio project
   - Test builds on simulators/emulators

6. **Deployment**
   - Create Vercel account
   - Connect GitHub repository to Vercel
   - Configure environment variables in Vercel
   - Set up production and preview deployments
   - Enable automatic deployments on main branch
   - Test production build

7. **Development Workflow**
   - Set up GitHub repository (CalyanV/second-saturday)
   - Create PR template
   - Set up GitHub Actions for CI (linting, type checking, testing)
   - Document local development setup in README
   - Create .env.example with required variables

8. **Privacy Policy**
   - Write privacy policy covering email and OAuth data collection
   - Document data storage (Convex, Clerk, Mux, OneSignal)
   - Document user data deletion process (GDPR compliance)
   - Create /privacy route in Next.js app
   - Link to privacy policy from signup flow

9. **Figma MCP Integration**
   - Install Figma MCP server for Claude Code
   - Configure Figma API access token
   - Create Second Saturday project workspace in Figma
   - Set up Figma component library matching shadcn/ui + tweakcn
   - Configure design tokens (colors, typography, spacing)
   - Share Figma workspace with backend developer
   - Test Figma MCP: design sample component → generate code → verify output

10. **Testing Infrastructure**
    - Install Vitest for unit and integration testing
    - Install @testing-library/react and @testing-library/user-event
    - Install Playwright for E2E testing
    - Configure test coverage reporting
    - Install @vitest/ui for interactive debugging
    - Configure Playwright for mobile viewports
    - Create test utilities directory
    - Write example unit test
    - Write example E2E test
    - Add test scripts to package.json
    - Update GitHub Actions CI to run tests on PR

11. **Monitoring & Analytics**
    - Create Sentry account, install @sentry/nextjs
    - Configure Sentry for Next.js (client and server configs)
    - Configure Sentry source maps
    - Enable Vercel Analytics
    - Create PostHog account, install posthog-js
    - Configure PostHog provider in app layout
    - Set up Sentry alerting
    - Create lib/analytics.ts wrapper for event tracking

**Deliverables:**
- Working Next.js project running locally
- All third-party services configured and accessible
- Mobile builds running on simulators
- Vercel deployment pipeline active
- Testing infrastructure ready
- Monitoring tools installed

---

### Phase 3: Testing (20-25% of epic time)

**Activities:**

1. **Verify all integrations**
   - Test Convex client connection
   - Test Clerk authentication flows
   - Test file uploads to Convex storage
   - Test Resend email sending
   - Test Mux video upload
   - Test OneSignal push notifications
   - Test Figma MCP code generation

2. **Test development workflow**
   - Verify pre-commit hooks run (lint, format)
   - Test commit message validation (commitlint)
   - Verify GitHub Actions CI runs on PR
   - Test PR template appears correctly
   - Verify failed CI blocks merge

3. **Test deployment pipeline**
   - Verify push to main triggers deployment
   - Test environment variables load in production
   - Verify preview deployments work for PRs
   - Test production URL is accessible

4. **Test mobile builds**
   - Build iOS app on simulator
   - Build Android app on emulator
   - Test camera and file access
   - Test push notification registration

5. **Test monitoring**
   - Trigger test error to verify Sentry capture
   - Verify source maps work in Sentry
   - Test PostHog event tracking
   - Verify Vercel Analytics enabled

6. **Documentation review**
   - Verify README has clear setup instructions
   - Test new developer setup (clone → run in <10 minutes)
   - Verify .env.example lists all required variables
   - Check privacy policy is accessible without login

**Deliverables:**
- All integration tests passing
- CI/CD pipeline validated
- Mobile builds successful
- Monitoring confirmed working
- Setup documentation verified

---

### Phase 4: Review & Deploy (Continuous)

**Activities:**
1. Create pull request with Epic 0 setup
2. Code review with backend developer
3. CI validation (lint, type check, tests)
4. Deploy to Vercel preview
5. Merge to main
6. Smoke test production
7. Monitor Sentry for errors
8. Verify PostHog events

**Deliverables:**
- Merged PR
- Production deployment
- Smoke test verification
- Epic 0 complete, ready for Epic 1

---

## Jobs To Be Done (JTBDs)

### JTBD 0.1: Initialize Next.js Project

**When** starting the Second Saturday project,
**I want to** set up a modern Next.js application with TypeScript and essential tooling,
**So I can** have a solid foundation for building features.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.1.1 | Verify Node.js 20+ LTS installed (required) | P0 |
| 0.1.2 | Install pnpm globally as package manager | P0 |
| 0.1.3 | Initialize Next.js 14+ project with App Router | P0 |
| 0.1.4 | Configure TypeScript with strict mode | P0 |
| 0.1.5 | Set up ESLint with Next.js, TypeScript, and React rules | P0 |
| 0.1.6 | Set up Prettier with formatting rules | P0 |
| 0.1.7 | Install Husky for Git hooks | P0 |
| 0.1.8 | Install lint-staged for pre-commit linting | P0 |
| 0.1.9 | Configure environment variable handling | P0 |
| 0.1.10 | Set up project directory structure | P0 |
| 0.1.11 | Configure Next.js for Capacitor compatibility | P0 |
| 0.1.12 | Add .gitignore with appropriate exclusions | P0 |
| 0.1.13 | Set up package.json scripts | P0 |
| 0.1.14 | Create .vscode/extensions.json | P0 |
| 0.1.15 | Create .vscode/settings.json | P0 |
| 0.1.16 | Install commitlint for conventional commits | P0 |

**Acceptance Criteria:**
- Node.js 20+ verified
- Project runs on localhost with `pnpm run dev`
- TypeScript compilation succeeds with no errors
- ESLint and Prettier enforced on save and pre-commit
- Environment variables load correctly from .env.local
- Project structure follows Next.js App Router best practices
- Pre-commit hooks run automatically
- Commits follow Conventional Commits format
- VSCode extensions recommended: ESLint, Prettier, Tailwind CSS IntelliSense

---

### JTBD 0.2: Install and Configure UI Framework

**When** building the frontend,
**I want to** set up shadcn/ui with tweakcn theme,
**So I can** rapidly build consistent, accessible UI components.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.2.1 | Install and configure shadcn/ui | P0 |
| 0.2.2 | Apply tweakcn theme customization | P0 |
| 0.2.3 | Set up Tailwind CSS configuration | P0 |
| 0.2.4 | Install essential shadcn components | P0 |
| 0.2.5 | Configure global styles and CSS variables | P0 |
| 0.2.6 | Set up dark mode support (if applicable) | P1 |
| 0.2.7 | Create component organization structure | P0 |

**Acceptance Criteria:**
- shadcn/ui components render correctly
- Theme colors and typography match design system
- Tailwind CSS purges unused styles in production
- Components are accessible (keyboard navigation, ARIA attributes)

---

### JTBD 0.3: Set Up Convex Backend

**When** initializing the backend,
**I want to** configure Convex for database and serverless functions,
**So I can** build real-time features and store data.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.3.1 | Create Convex account and project | P0 |
| 0.3.2 | Install Convex npm packages | P0 |
| 0.3.3 | Initialize Convex project structure | P0 |
| 0.3.4 | Configure Convex deployment URL in env variables | P0 |
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

### JTBD 0.4: Integrate Clerk Authentication

**When** setting up authentication,
**I want to** configure Clerk with OAuth providers and email verification,
**So I can** enable secure user signup and login.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.4.1 | Create Clerk account and application | P0 |
| 0.4.2 | Install @clerk/nextjs package | P0 |
| 0.4.3 | Configure Clerk environment variables | P0 |
| 0.4.4 | Wrap Next.js app with ClerkProvider | P0 |
| 0.4.5 | Enable Google OAuth in Clerk dashboard | P0 |
| 0.4.6 | Enable Apple Sign-In in Clerk dashboard | P0 |
| 0.4.7 | Set up Clerk webhooks for user events | P0 |
| 0.4.9 | Configure Clerk → Convex user sync via webhooks | P0 |
| 0.4.10 | Set up Clerk middleware for route protection | P0 |
| 0.4.11 | Budget for Clerk Pro plan (~$20-60/mo) | P0 |

**Acceptance Criteria:**
- Users can sign up with email/password, Google, and Apple
- Email verification works for email/password signups
- User data syncs to Convex on creation/update
- Protected routes redirect to login when unauthenticated
- OAuth credentials are secure (not committed to git)

---

### JTBD 0.5: Configure External Services

**When** integrating third-party services,
**I want to** set up Resend, Mux, and OneSignal accounts,
**So I can** send emails, handle videos, and send push notifications.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.5.1 | Create Resend account and obtain API key | P0 |
| 0.5.2 | Set up custom domain in Resend with DNS verification | P0 |
| 0.5.3 | Install resend and @react-email packages | P0 |
| 0.5.4 | Create Mux account and obtain API access token | P0 |
| 0.5.5 | Configure Mux webhooks to point to Convex | P0 |
| 0.5.6 | Create OneSignal account and app | P0 |
| 0.5.7 | Install @onesignal/onesignal-capacitor plugin | P0 |
| 0.5.8 | Configure OneSignal app ID in env variables | P0 |
| 0.5.9 | Set up FCM credentials for Android push | P0 |
| 0.5.10 | Set up APNs credentials for iOS push | P0 |
| 0.5.11 | Install browser-image-compression | P0 |

**Acceptance Criteria:**
- Resend can send emails from verified domain
- Mux can receive video uploads and generate thumbnails
- OneSignal can send push notifications to test devices
- All API keys stored securely in environment variables
- DNS records verified (can take 24-48 hours)

---

### JTBD 0.6: Set Up Apple Developer Account

**When** preparing for iOS app deployment,
**I want to** enroll in Apple Developer Program and configure credentials,
**So I can** build and distribute the iOS app.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.6.1 | Enroll in Apple Developer Program ($99/year) | P0 |
| 0.6.2 | Wait for approval (24-48 hours) | P0 |
| 0.6.3 | Create App ID in Apple Developer portal | P0 |
| 0.6.4 | Generate development and distribution certificates | P0 |
| 0.6.5 | Create provisioning profiles | P0 |
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

### JTBD 0.7: Initialize Capacitor for Mobile

**When** preparing mobile app builds,
**I want to** configure Capacitor to wrap the Next.js app for iOS and Android,
**So I can** deploy native mobile applications.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.7.1 | Install @capacitor/core and @capacitor/cli | P0 |
| 0.7.2 | Initialize Capacitor project | P0 |
| 0.7.3 | Configure Next.js build output for Capacitor | P0 |
| 0.7.4 | Add iOS platform | P0 |
| 0.7.5 | Add Android platform | P0 |
| 0.7.6 | Install essential Capacitor plugins | P0 |
| 0.7.7 | Configure app name, bundle ID, and version | P0 |
| 0.7.8 | Set up Xcode project for iOS | P0 |
| 0.7.9 | Set up Android Studio project for Android | P0 |
| 0.7.10 | Test builds on simulators/emulators | P0 |

**Acceptance Criteria:**
- Capacitor successfully wraps Next.js app
- iOS app builds and runs on simulator
- Android app builds and runs on emulator
- Camera and file access work on both platforms
- Push notifications register successfully

---

### JTBD 0.8: Deploy to Vercel

**When** deploying the web application,
**I want to** connect the GitHub repository to Vercel,
**So I can** have automatic deployments on every push.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.8.1 | Create Vercel account (free tier) | P0 |
| 0.8.2 | Connect GitHub repository to Vercel | P0 |
| 0.8.3 | Configure environment variables in Vercel | P0 |
| 0.8.4 | Set up production and preview deployments | P0 |
| 0.8.5 | Configure custom domain (if applicable) | P1 |
| 0.8.6 | Enable automatic deployments on main branch | P0 |
| 0.8.7 | Configure build settings | P0 |
| 0.8.8 | Test production build succeeds | P0 |

**Acceptance Criteria:**
- Push to main triggers automatic deployment
- Production URL is accessible and loads correctly
- Environment variables load in production
- Build completes in under 5 minutes
- Preview deployments work for pull requests

---

### JTBD 0.9: Establish Development Workflow

**When** starting feature development,
**I want to** define Git workflow, branching strategy, and collaboration practices,
**So I can** work efficiently with the backend developer.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.9.1 | Define Git branching strategy | P0 |
| 0.9.2 | Set up GitHub repository | P0 |
| 0.9.3 | Create PR template for code reviews | P0 |
| 0.9.4 | Commit message conventions | P0 |
| 0.9.5 | Set up GitHub Actions for CI | P0 |
| 0.9.6 | Document local development setup in README | P0 |
| 0.9.7 | Create .env.example with required variables | P0 |
| 0.9.8 | Define code review process | P0 |

**Acceptance Criteria:**
- README includes clear setup instructions
- New developer can clone and run locally in <10 minutes
- .env.example lists all required environment variables
- Git workflow documented and agreed upon
- GitHub Actions run on every PR
- PR template guides reviewers
- Failed CI blocks merge to main

---

### JTBD 0.10: Create Privacy Policy

**When** preparing for App Store submission,
**I want to** create a privacy policy page,
**So I can** meet Apple's requirements and be transparent about data usage.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.10.1 | Write privacy policy covering email and OAuth data collection | P0 |
| 0.10.2 | Document data storage providers | P0 |
| 0.10.3 | Document user data deletion process | P0 |
| 0.10.5 | Create /privacy route in Next.js app | P0 |
| 0.10.6 | Link to privacy policy from signup flow | P0 |
| 0.10.7 | Ensure privacy policy accessible without login | P0 |

**Acceptance Criteria:**
- Privacy policy covers all data collection and usage
- GDPR and CCPA compliance addressed
- Privacy policy URL can be submitted to App Store
- Policy is clear and user-friendly

---

### JTBD 0.11: Set Up Figma MCP Integration

**When** preparing for design-to-code workflow,
**I want to** configure Figma MCP integration and establish the design workspace,
**So I can** convert Figma designs directly to code for each epic.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.11.1 | Install Figma MCP server for Claude Code | P0 |
| 0.11.2 | Configure Figma API access token in MCP settings | P0 |
| 0.11.3 | Create Second Saturday project workspace in Figma | P0 |
| 0.11.4 | Set up Figma component library matching shadcn/ui | P0 |
| 0.11.5 | Configure design tokens in Figma | P0 |
| 0.11.6 | Share Figma workspace with backend developer | P0 |
| 0.11.7 | Test Figma MCP code generation | P0 |
| 0.11.8 | Document Figma-to-code workflow for team | P0 |

**Acceptance Criteria:**
- Figma MCP can read designs from workspace
- Design tokens match Tailwind config
- Sample component generates valid shadcn/ui compatible code
- Both developers understand Figma MCP workflow
- Component library uses Auto Layout for responsive behavior

**Design-to-Code Workflow:**
1. Design screens/components in Figma (per epic Phase 1)
2. Use Figma MCP to generate React/Tailwind code
3. Review generated code, refine design if needed
4. Integrate generated code into codebase

---

### JTBD 0.12: Install Testing Infrastructure

**When** preparing for test-driven development across all epics,
**I want to** install and configure testing tools,
**So I can** write tests for each epic without setup friction.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.12.1 | Install Vitest for unit and integration testing | P0 |
| 0.12.2 | Install @testing-library/react and user-event | P0 |
| 0.12.3 | Install Playwright for E2E testing | P0 |
| 0.12.4 | Configure test coverage reporting | P0 |
| 0.12.5 | Install @vitest/ui for interactive debugging | P0 |
| 0.12.6 | Configure Playwright for mobile viewports | P0 |
| 0.12.7 | Create test utilities directory | P0 |
| 0.12.8 | Write example unit test | P0 |
| 0.12.9 | Write example E2E test | P0 |
| 0.12.10 | Add test scripts to package.json | P0 |
| 0.12.11 | Update GitHub Actions CI to run tests on PR | P0 |

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

### JTBD 0.13: Install Monitoring & Analytics

**When** preparing for production deployment,
**I want to** install error tracking, performance monitoring, and analytics,
**So I can** observe system health and user behavior from day one.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| 0.13.1 | Create Sentry account (free tier: 5k errors/month) | P0 |
| 0.13.2 | Install @sentry/nextjs package | P0 |
| 0.13.3 | Configure Sentry for Next.js | P0 |
| 0.13.4 | Configure Sentry source maps | P0 |
| 0.13.5 | Enable Vercel Analytics | P0 |
| 0.13.6 | Create PostHog account (free tier: 1M events/month) | P0 |
| 0.13.7 | Install posthog-js package | P0 |
| 0.13.8 | Configure PostHog provider in app layout | P0 |
| 0.13.9 | Set up Sentry alerting | P0 |
| 0.13.10 | Create lib/analytics.ts wrapper | P0 |

**Acceptance Criteria:**
- Sentry captures errors in dev and production
- Source maps work (can see original TypeScript in stack traces)
- Vercel Analytics enabled
- PostHog initialized and ready for event tracking
- Analytics wrapper provides simple API (trackEvent, trackPageView)

**Event Tracking Per Epic:**
- Each epic defines events to track in implementation plan
- Events added incrementally as features are built

---

## Analytics Events

Epic 0 has no user-facing features, so no analytics events to track. However, monitoring tools are set up for future epics.

---

## Testing Strategy

### Unit Tests
- Test utility functions for environment variable handling
- Test configuration validation

### Integration Tests
- Test Convex client connection
- Test Clerk webhook → Convex user sync
- Test file upload to Convex storage

### E2E Tests
- Test development server starts successfully
- Test production build succeeds
- Test mobile builds on simulators

### Manual Testing
- Verify all third-party services accessible
- Test GitHub Actions CI/CD pipeline
- Test deployment to Vercel
- Verify privacy policy page renders

**Coverage Target:** 80%+ for utility functions; 100% for critical integrations

---

## Dependencies

### Blockers (Must complete before this epic)
- None (Epic 0 is the foundation)

### Enables (What this epic unlocks)
- **Epic 1 (Authentication & Identity)** - Requires Clerk and Convex setup
- **Epic 2 (Circle Creation & Setup)** - Requires UI framework and Convex
- **Epic 3 (Circle Membership)** - Requires authentication and database
- **Epic 4 (Content Submission)** - Requires file storage (Convex, Mux)
- **Epic 5 (Newsletter Experience)** - Requires email service (Resend)
- **Epic 6 (Notifications & Reminders)** - Requires push notification service (OneSignal)

**All subsequent epics depend on Epic 0 being complete.**

---

## Week 1 Timeline Breakdown

### Days 1-2: Critical Setup & Approval Waits (20-30 hours)
- Apple Developer Program enrollment (START IMMEDIATELY - 24-48 hour wait)
- Resend domain verification + DNS setup (START IMMEDIATELY - 24-48 hour wait)
- Next.js project initialization
- Development environment setup (Node, pnpm, TypeScript, ESLint, Prettier, Husky)
- shadcn/ui + tweakcn theme installation

### Days 3-4: Backend & Services (30-40 hours)
- Convex setup and schema design
- Clerk authentication configuration
- OAuth provider setup (Google, Apple)
- Mux video service configuration
- OneSignal push notification setup
- browser-image-compression installation

### Days 5-6: Mobile, Deployment, Testing (30-40 hours)
- Capacitor initialization for iOS and Android
- Xcode and Android Studio project setup
- Vercel deployment pipeline
- GitHub Actions CI/CD setup
- Testing infrastructure (Vitest, Playwright)
- Monitoring tools (Sentry, PostHog)
- Figma MCP integration
- Privacy policy creation
- Development workflow documentation
- Smoke testing all integrations

**Total: 80-110 hours (higher due to setup overhead)**

---

## Success Criteria

- [ ] Next.js project runs locally with `pnpm run dev`
- [ ] All third-party services configured and accessible
- [ ] Clerk authentication works (email, Google, Apple)
- [ ] Email verification works for email/password signups
- [ ] Convex database and file storage functional
- [ ] Resend email sending works (domain verified)
- [ ] Mux video upload and thumbnail generation works
- [ ] OneSignal push notifications work on test devices
- [ ] iOS app builds on simulator
- [ ] Android app builds on emulator
- [ ] Vercel deployment pipeline active (auto-deploy on push to main)
- [ ] GitHub Actions CI runs on every PR
- [ ] Testing infrastructure functional (Vitest, Playwright)
- [ ] Monitoring tools installed (Sentry, PostHog)
- [ ] Figma MCP generates valid component code
- [ ] Privacy policy page accessible
- [ ] README documents setup process
- [ ] .env.example lists all required variables
- [ ] Pre-commit hooks enforce linting and formatting

**Epic 0 is complete when a new developer can clone the repo and run the full stack in under 10 minutes.**
