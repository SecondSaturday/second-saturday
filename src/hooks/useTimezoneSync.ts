'use client'

import { useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useTimezoneSync() {
  const currentUser = useQuery(api.users.getCurrentUser)
  const setTimezone = useMutation(api.users.setTimezone)

  useEffect(() => {
    if (currentUser && !currentUser.timezone) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        setTimezone({ timezone: tz }).catch(console.error)
      }
    }
  }, [currentUser, setTimezone])
}
