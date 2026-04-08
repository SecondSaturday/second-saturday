import { NextRequest, NextResponse } from 'next/server'

const MATTERMOST_WEBHOOK_URL = process.env.MATTERMOST_ERRORS_WEBHOOK_URL

export async function POST(request: NextRequest) {
  if (!MATTERMOST_WEBHOOK_URL) {
    return NextResponse.json({ ok: true, skipped: 'Webhook URL not configured' })
  }

  const payload = await request.json()

  const text = formatSentryAlert(payload)

  await fetch(MATTERMOST_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  return NextResponse.json({ ok: true })
}

function formatSentryAlert(payload: Record<string, unknown>): string {
  const action = (payload.action as string) ?? 'unknown'
  const data = (payload.data as Record<string, unknown>) ?? {}

  // Issue alerts
  if (action === 'triggered' || action === 'created') {
    const issue = (data.issue as Record<string, unknown>) ?? {}
    const title = (issue.title as string) ?? 'Unknown error'
    const culprit = (issue.culprit as string) ?? ''
    const url = (issue.permalink as string) ?? ''
    const level = (issue.level as string) ?? 'error'
    const count = (issue.count as string) ?? '1'

    const lines = [`**:red_circle: Sentry ${level.toUpperCase()}**`, `**${title}**`]
    if (culprit) lines.push(`in \`${culprit}\``)
    lines.push(`Events: ${count}`)
    if (url) lines.push(`[View in Sentry](${url})`)

    return lines.join('\n')
  }

  // Metric alerts
  if (action === 'critical' || action === 'warning' || action === 'resolved') {
    const metric = (data.metric_alert as Record<string, unknown>) ?? {}
    const title = (metric.title as string) ?? 'Metric alert'
    const status = action === 'resolved' ? ':white_check_mark: Resolved' : ':warning: ' + action
    return `**${status}: ${title}**`
  }

  // Fallback — show raw action
  return `**Sentry alert:** ${action}\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 500)}\n\`\`\``
}
