'use client'

import Link from 'next/link'

export default function CircleError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
