import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock NotificationPreferences
vi.mock('@/components/NotificationPreferences', () => ({
  NotificationPreferences: () => <div data-testid="notification-preferences" />,
}))

import NotificationsPage from '@/app/dashboard/notifications/page'

describe('NotificationsPage', () => {
  it('renders NotificationPreferences component', () => {
    render(<NotificationsPage />)
    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument()
  })

  it('shows back arrow linking to dashboard', () => {
    render(<NotificationsPage />)
    const backLink = screen.getByRole('link')
    expect(backLink).toHaveAttribute('href', '/dashboard')
  })

  it('displays Notifications header', () => {
    render(<NotificationsPage />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })
})
