'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function NotificationPreferences() {
  const preferences = useQuery(api.notifications.getNotificationPreferences)
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences)

  if (preferences === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how Second Saturday communicates with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-60 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleToggle = async (field: 'submissionReminders' | 'newsletterReady', value: boolean) => {
    try {
      await updatePreferences({
        submissionReminders:
          field === 'submissionReminders' ? value : preferences.submissionReminders,
        newsletterReady: field === 'newsletterReady' ? value : preferences.newsletterReady,
      })
      trackEvent('notification_settings_updated', {
        [field]: value,
        submissionReminders:
          field === 'submissionReminders' ? value : preferences.submissionReminders,
        newsletterReady: field === 'newsletterReady' ? value : preferences.newsletterReady,
      })
      toast.success('Preferences updated')
    } catch {
      toast.error('Failed to update preferences')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Control how Second Saturday communicates with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="submission-reminders">Submission Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get reminded before the submission deadline
            </p>
          </div>
          <Switch
            id="submission-reminders"
            checked={preferences.submissionReminders}
            onCheckedChange={(checked) => handleToggle('submissionReminders', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newsletter-ready">Newsletter Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when a new newsletter is ready
            </p>
          </div>
          <Switch
            id="newsletter-ready"
            checked={preferences.newsletterReady}
            onCheckedChange={(checked) => handleToggle('newsletterReady', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
