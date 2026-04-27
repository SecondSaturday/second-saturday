'use client'

import { notFound, useParams } from 'next/navigation'
import { YourMonthView } from '@/components/yourMonth/YourMonthView'

const CYCLE_ID_PATTERN = /^\d{4}-\d{2}$/

export default function YourMonthCyclePage() {
  const params = useParams()
  const raw = params.cycleId
  const cycleId = Array.isArray(raw) ? raw[0] : raw
  if (!cycleId || !CYCLE_ID_PATTERN.test(cycleId)) {
    notFound()
  }
  return <YourMonthView cycleId={cycleId} />
}
