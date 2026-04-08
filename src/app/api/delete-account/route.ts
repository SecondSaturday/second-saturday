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

    // Verify password before allowing deletion
    const { verified } = await client.users.verifyPassword({ userId, password })
    if (!verified) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
    }

    await client.users.deleteUser(userId)
    return NextResponse.json({ deleted: true })
  } catch {
    // Generic error — don't leak Clerk internals
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
