'use client'

import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { AuthLayout } from '@/components/auth'
import { useAuthAnalytics } from '@/hooks'

export default function SignUpPage() {
  useAuthAnalytics()

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-8">
        <Image src="/icon.svg" alt="Second Saturday" width={48} height={48} />
        <SignUp />
      </div>
    </AuthLayout>
  )
}
