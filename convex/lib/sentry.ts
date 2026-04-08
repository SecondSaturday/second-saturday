function parseDsn(dsn: string) {
  const url = new URL(dsn)
  return {
    key: url.username,
    host: `${url.protocol}//${url.host}`,
    projectId: url.pathname.replace('/', ''),
  }
}

export async function reportErrorToSentry(
  error: unknown,
  context: { handler: string; event?: string }
): Promise<void> {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  const { key, host, projectId } = parseDsn(dsn)
  const storeUrl = `${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorType = error instanceof Error ? error.constructor.name : 'Error'
  const stackTrace = error instanceof Error ? error.stack : undefined

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    logger: 'convex',
    tags: {
      handler: context.handler,
      ...(context.event && { event: context.event }),
      runtime: 'convex',
    },
    exception: {
      values: [
        {
          type: errorType,
          value: errorMessage,
          ...(stackTrace && {
            stacktrace: {
              frames: [
                {
                  filename: context.handler,
                  function: 'handler',
                  raw: stackTrace,
                },
              ],
            },
          }),
        },
      ],
    },
  }

  try {
    await fetch(storeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Best-effort — don't let reporting failures break the webhook handler
    console.error('Failed to report error to Sentry')
  }
}
