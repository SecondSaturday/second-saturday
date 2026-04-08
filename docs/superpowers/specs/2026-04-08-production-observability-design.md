# Production Observability Design Spec

## Overview

Close the observability gaps in Second Saturday before production launch. No new abstractions — wire up what's already installed, add the missing pieces, and funnel all alerts to Mattermost.

## Principles

- **Single source per concern:** Sentry for errors, PostHog for analytics, Convex Dashboard for backend logs, Vercel Analytics for performance
- **No redundant tracking:** Tools don't overlap in responsibility
- **Mattermost as unified alert hub:** Three dedicated channels for errors, analytics, and deployments
- **Keep it simple:** Minimal code changes, mostly wiring and configuration

## Current State

| Tool | Status | Gap |
|------|--------|-----|
| PostHog | Well integrated, 24 custom events, user identification, session replay | None — already production-ready |
| Sentry | Configured for client/server/edge with source maps | Error boundaries don't report; no user context; no release tracking |
| Vercel Analytics | Not installed | Missing entirely |
| Convex | Console logging in webhook handlers | Webhook errors fail silently |
| Alerting | None | No notifications to any channel |

## Design

### 1. Sentry Error Boundary Integration

**Files:** `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/dashboard/error.tsx`, `src/app/dashboard/circles/[circleId]/error.tsx`

**Change:** Add `useEffect` to each error boundary that calls `Sentry.captureException(error)` when the error prop arrives.

```tsx
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

**Impact:** React rendering crashes that currently show fallback UI but never reach Sentry will now be captured with full stack traces and session replay context.

### 2. Sentry User Context from Clerk

**Location:** `src/app/providers.tsx` or a new hook alongside existing auth analytics

**Change:** When Clerk session loads, call `Sentry.setUser({ id, email, username })`. On sign-out, call `Sentry.setUser(null)`.

```tsx
import * as Sentry from "@sentry/nextjs";
import { useUser } from "@clerk/nextjs";

// Inside provider or hook:
const { user, isSignedIn } = useUser();

useEffect(() => {
  if (isSignedIn && user) {
    Sentry.setUser({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      username: user.username ?? undefined,
    });
  } else {
    Sentry.setUser(null);
  }
}, [isSignedIn, user]);
```

**Impact:** Every Sentry error shows which user was affected. With a small user base, this enables direct follow-up.

### 3. Vercel Analytics + Speed Insights

**Packages:** `@vercel/analytics`, `@vercel/speed-insights`

**File:** `src/app/layout.tsx`

**Change:** Add two components to the root layout.

```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// In the layout JSX:
<Analytics />
<SpeedInsights />
```

**What this provides:**
- Page views, unique visitors, top pages, referrers
- Core Web Vitals (LCP, FID, CLS) per page with real user measurements
- Visible in Vercel project dashboard

### 4. Sentry Release Tracking

**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Change:** Add `release` property using Vercel's auto-populated git SHA environment variable.

```ts
Sentry.init({
  // ...existing config
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});
```

**Impact:** Errors are grouped by deployment. You can see whether a new deploy introduced or fixed issues, and track crash-free session percentage per release.

### 5. Sample Rate Documentation

**Current rates:** `tracesSampleRate: 1.0` (all configs), replay at 100% errors / 10% regular.

**Decision:** Keep all rates at current levels. With ~15 users, 100% sampling is well within free tier limits and provides full visibility.

**Change:** Add inline comments to each Sentry config noting the scaling plan:

```ts
// 100% trace sampling — appropriate for <1K users.
// Reduce to 0.2 when scaling past 1K MAU.
tracesSampleRate: 1.0,
```

### 6. Mattermost Webhook Integration

No code changes — purely dashboard configuration. Documented here as a setup checklist.

**Three Mattermost channels:**
- `#errors` — Sentry alerts (new errors, regressions, crash-free rate drops)
- `#analytics` — PostHog alerts (user signups, anomalies)
- `#deploys` — Vercel deployment status and failures

**Setup steps:**

#### Sentry → Mattermost
1. In Mattermost: create incoming webhook for `#errors`, copy URL
2. In Sentry: Settings → Integrations → Webhooks → add Mattermost URL
3. In Sentry: Alerts → Create Rule:
   - Trigger: "A new issue is created"
   - Action: Send webhook notification
4. Create additional rules for error regressions and crash-free rate drops

#### PostHog → Mattermost
1. In Mattermost: create incoming webhook for `#analytics`, copy URL
2. In PostHog: Data Pipelines → Destinations → Webhook
3. Configure alerts for key events (user signups, anomalies)

#### Vercel → Mattermost
1. In Mattermost: create incoming webhook for `#deploys`, copy URL
2. In Vercel: Project Settings → Webhooks → add Mattermost URL
3. Select events: deployment created, deployment succeeded, deployment failed, deployment error
4. Disable Vercel email notifications: Account Settings → Notifications → uncheck email for deployment events

### 7. Convex Webhook Error Forwarding to Sentry

**New file:** `convex/lib/sentry.ts` (small utility)

**Change:** Create a lightweight function that sends error details to Sentry's HTTP API via `fetch`. No Sentry SDK in Convex — just a plain HTTP POST to the Sentry envelope endpoint.

```ts
// convex/lib/sentry.ts
export async function reportErrorToSentry(
  error: unknown,
  context: { handler: string; event?: string }
): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  // Parse DSN and POST error envelope to Sentry HTTP API
  // Include handler name and event type as tags
}
```

**Updated files:** `convex/http.ts` — wrap existing catch blocks in webhook handlers (Clerk, Mux) to call `reportErrorToSentry` before re-throwing or returning error responses.

**Impact:** Webhook failures (missed user signups, failed video processing) surface in Sentry instead of dying silently in Convex logs.

## Out of Scope

- No unified logging abstraction — not needed at this scale
- No OpenTelemetry — overkill for current usage
- No additional PostHog events — 24 events already cover key user flows
- No Sentry SDK in Convex runtime — HTTP forwarding is sufficient
- No custom dashboards — use each tool's built-in dashboard

## Testing Plan

1. **Error boundaries:** Temporarily throw an error in a component, verify it appears in Sentry with user context
2. **Release tracking:** Deploy and verify the release tag appears in Sentry
3. **Vercel Analytics:** Deploy and verify page views appear in Vercel dashboard
4. **Webhook forwarding:** Trigger a webhook error (e.g., invalid Clerk payload), verify it appears in Sentry
5. **Mattermost:** Trigger each alert type, verify notifications arrive in the correct channel

## Rollout Order

1. Sentry error boundaries + user context (highest impact, catches silent failures)
2. Sentry release tracking (enables deployment correlation)
3. Vercel Analytics + Speed Insights (zero-risk addition)
4. Convex webhook error forwarding (catches backend silent failures)
5. Mattermost webhook setup (alerting layer on top of everything else)
6. Sample rate documentation (comment-only change)
