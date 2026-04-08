import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60_000

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = attempts.get(userId)
  if (!entry || now > entry.resetAt) {
    attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { password } = await request.json()
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  try {
    const client = await clerkClient()
    const result = await client.users.verifyPassword({ userId, password })
    return NextResponse.json({ verified: result.verified })
  } catch {
    return NextResponse.json({ verified: false, error: 'Invalid password' }, { status: 400 })
  }
}
