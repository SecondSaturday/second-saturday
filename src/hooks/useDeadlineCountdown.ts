'use client'

import { useState, useEffect } from 'react'

export interface DeadlineCountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
  isUrgent: boolean
}

export function useDeadlineCountdown(deadlineTimestamp: number): DeadlineCountdownResult {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (Date.now() >= deadlineTimestamp) return

    const interval = setInterval(() => {
      if (Date.now() >= deadlineTimestamp) {
        clearInterval(interval)
      }
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [deadlineTimestamp])

  return compute(deadlineTimestamp)
}

function compute(deadlineTimestamp: number): DeadlineCountdownResult {
  const diff = deadlineTimestamp - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isUrgent: false }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const isUrgent = diff < 1000 * 60 * 60 // less than 1 hour

  return { days, hours, minutes, seconds, isPast: false, isUrgent }
}
