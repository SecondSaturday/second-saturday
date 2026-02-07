---
issue: 9
title: Configure Deployment and CI/CD
analyzed: 2026-02-07T07:20:03Z
estimated_hours: 5
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #9

## Overview
Set up Vercel for web deployment and GitHub Actions for continuous integration. This involves configuring automatic deployments, preview environments, and PR checks with branch protection.

## Parallel Streams

### Stream A: GitHub Actions CI Pipeline
**Scope**: Create CI workflow with lint, type-check, and test jobs
**Files**:
- `.github/workflows/ci.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 1.5
**Dependencies**: none

### Stream B: Vercel Deployment Setup
**Scope**: Configure Vercel project, environment variables, and deployment settings
**Files**:
- `vercel.json` (if customization needed)
- Vercel dashboard configuration (manual)
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none
**Note**: Mostly dashboard configuration, minimal file changes

### Stream C: Branch Protection & Validation
**Scope**: Configure branch protection rules and validate end-to-end
**Files**:
- GitHub repository settings (manual)
**Agent Type**: devops-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 1.5
**Dependencies**: Stream A (CI must exist for required checks), Stream B (deployment must work)

## Coordination Points

### Shared Files
Minimal file overlap:
- `.github/` directory - Stream A only
- `vercel.json` - Stream B only (if needed)

### Sequential Requirements
1. CI workflow must exist before configuring required status checks
2. Vercel deployment must work before validating preview deploys
3. Both A & B must complete before enabling branch protection

## Conflict Risk Assessment
- **Low Risk**: Streams work on completely separate files/systems
- GitHub Actions vs Vercel are independent platforms

## Parallelization Strategy

**Recommended Approach**: hybrid

Launch Streams A & B simultaneously since they're independent:
- Stream A: Create GitHub Actions workflow files
- Stream B: Configure Vercel project and env vars (dashboard + optional vercel.json)

Start Stream C when both A & B complete:
- Configure branch protection with required status checks
- Test end-to-end: PR → CI runs → preview deploy → merge → production deploy

## Expected Timeline

With parallel execution:
- Wall time: 3.5 hours (A/B parallel: 2h, then C: 1.5h)
- Total work: 5 hours
- Efficiency gain: 30%

Without parallel execution:
- Wall time: 5 hours

## Special Considerations

### Environment Variables for Vercel
Based on previous tasks, these env vars need configuration:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `RESEND_API_KEY`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

### CI Workflow Jobs
Should include:
1. `lint` - Run ESLint
2. `type-check` - Run TypeScript compiler
3. `test` - Run Vitest (once testing infra is set up in #10)
4. `build` - Verify production build succeeds

### Vercel Settings
- Framework preset: Next.js
- Build command: `pnpm build`
- Output directory: `.next`
- Node.js version: 20.x

## Notes
- Vercel setup is mostly UI-based configuration
- Consider creating vercel.json only if custom settings needed
- Test task (#10) not yet complete, so CI can stub the test job initially
- Branch protection should require at least: lint, type-check, build
