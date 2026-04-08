import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // 100% trace sampling — appropriate for <1K users.
  // Reduce to 0.2 when scaling past 1K MAU.
  tracesSampleRate: 1,

  debug: false,
})
