'use client'

import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

export default function SignInPage() {
  useAuthAnalytics()

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignIn />
      </div>
    </AuthLayout>
  )
}
