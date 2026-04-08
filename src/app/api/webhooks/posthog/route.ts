import { NextRequest, NextResponse } from 'next/server'

const MATTERMOST_WEBHOOK_URL = process.env.MATTERMOST_ANALYTICS_WEBHOOK_URL

export async function POST(request: NextRequest) {
  if (!MATTERMOST_WEBHOOK_URL) {
    return NextResponse.json({ ok: true, skipped: 'Webhook URL not configured' })
  }

  const payload = await request.json()

  const text = formatPostHogAlert(payload)

  await fetch(MATTERMOST_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  return NextResponse.json({ ok: true })
}

function formatPostHogAlert(payload: Record<string, unknown>): string {
  const event = (payload.event as string) ?? (payload.name as string) ?? 'unknown'
  const person = (payload.person as Record<string, unknown>) ?? {}
  const properties =
    (person.properties as Record<string, unknown>) ??
    (payload.properties as Record<string, unknown>) ??
    {}

  const email = (properties.email as string) ?? ''
  const name = (properties.name as string) ?? ''

  if (event === 'user_signed_up' || event === '$identify') {
    const who = name || email || 'Unknown user'
    return `**:tada: New user signed up**\n${who}${email && name ? ` (${email})` : ''}`
  }

  // Generic event
  return `**PostHog event:** \`${event}\`${email ? `\nUser: ${email}` : ''}`
}
