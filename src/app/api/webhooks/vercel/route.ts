import { NextRequest, NextResponse } from 'next/server'

const MATTERMOST_WEBHOOK_URL = process.env.MATTERMOST_DEPLOYS_WEBHOOK_URL

export async function POST(request: NextRequest) {
  if (!MATTERMOST_WEBHOOK_URL) {
    return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 })
  }

  const payload = await request.json()

  const text = formatVercelAlert(payload)
  if (!text) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await fetch(MATTERMOST_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  return NextResponse.json({ ok: true })
}

function formatVercelAlert(payload: Record<string, unknown>): string | null {
  const type = (payload.type as string) ?? ''
  const deployment = (payload.payload as Record<string, unknown>) ?? {}
  const name = (deployment.name as string) ?? 'second-saturday'
  const url = (deployment.url as string) ?? ''
  const meta = (deployment.meta as Record<string, unknown>) ?? {}
  const commit = (meta.githubCommitMessage as string) ?? ''

  switch (type) {
    case 'deployment.created':
      return [
        '**:rocket: Deployment started**',
        `Project: ${name}`,
        commit ? `Commit: ${commit}` : '',
        url ? `URL: https://${url}` : '',
      ]
        .filter(Boolean)
        .join('\n')

    case 'deployment.succeeded':
      return [
        '**:white_check_mark: Deployment succeeded**',
        `Project: ${name}`,
        commit ? `Commit: ${commit}` : '',
        url ? `URL: https://${url}` : '',
      ]
        .filter(Boolean)
        .join('\n')

    case 'deployment.error':
      return [
        '**:red_circle: Deployment failed**',
        `Project: ${name}`,
        commit ? `Commit: ${commit}` : '',
      ]
        .filter(Boolean)
        .join('\n')

    default:
      return null
  }
}
