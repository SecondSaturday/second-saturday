'use client'

import { useParams } from 'next/navigation'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import { MemberProfileView } from '@/components/profile/MemberProfileView'

export default function MemberProfilePage() {
  const params = useParams()
  const circleId = params.circleId as Id<'circles'>
  const userId = params.userId as Id<'users'>

  return <MemberProfileView circleId={circleId} userId={userId} />
}
