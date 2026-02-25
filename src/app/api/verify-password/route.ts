import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
