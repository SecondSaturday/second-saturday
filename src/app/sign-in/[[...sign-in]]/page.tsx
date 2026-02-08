'use client'

import { SignIn } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

export default function SignInPage() {
  useAuthAnalytics()

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold text-foreground">Second Saturday</h1>
        <SignIn />
      </div>
    </AuthLayout>
  )
}
