'use client'

import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSaved?: Date
  className?: string
}

export function AutoSaveIndicator({ status, lastSaved, className }: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          color: 'text-muted-foreground',
          animate: true,
        }
      case 'saved':
        return {
          icon: Check,
          text: lastSaved ? `Saved ${formatTimeAgo(lastSaved)}` : 'Saved',
          color: 'text-emerald-600 dark:text-emerald-500',
          animate: false,
        }
      case 'error':
        return {
          icon: Cloud,
          text: 'Failed to save',
          color: 'text-destructive',
          animate: false,
        }
      case 'offline':
        return {
          icon: CloudOff,
          text: 'Offline',
          color: 'text-amber-600 dark:text-amber-500',
          animate: false,
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()

  if (!config || status === 'idle') {
    return null
  }

  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', config.color, className)}>
      <Icon className={cn('size-3.5', config.animate && 'animate-spin')} />
      <span className="font-medium">{config.text}</span>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}
