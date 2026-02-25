'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SafeArea } from 'capacitor-plugin-safe-area'
import { CapacitorSwipeBackPlugin } from '@notnotsamuel/capacitor-swipe-back'

/**
 * Capacitor provider that handles native platform behaviors:
 * - Platform detection for CSS safe area handling
 * - Safe area inset injection via native bridge (iOS/Android)
 * - iOS swipe-back navigation gestures
 * - Android back button/gesture navigation
 * - iOS/Android status bar configuration for edge-to-edge display
 */
export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) return

    // Add platform-specific class to body for CSS safe area handling
    const platform = Capacitor.getPlatform()
    if (platform === 'ios') {
      document.body.classList.add('native-ios')
    } else if (platform === 'android') {
      document.body.classList.add('native-android')
    }

    // Configure status bar for edge-to-edge display
    const configureStatusBar = async () => {
      try {
        // Set status bar to overlay WebView (edge-to-edge)
        await StatusBar.setOverlaysWebView({ overlay: true })
        // Use dark content (dark icons on light background)
        await StatusBar.setStyle({ style: Style.Light })
      } catch (e) {
        // Status bar plugin may not be available on all platforms
      }
    }
    configureStatusBar()

    // Enable iOS swipe-back navigation gestures
    const enableSwipeBack = async () => {
      try {
        await CapacitorSwipeBackPlugin.enable()
      } catch (e) {
        // SwipeBack plugin may not be available
      }
    }
    if (platform === 'ios') {
      enableSwipeBack()
    }

    // Inject safe area insets as CSS variables via native bridge
    // This bypasses the broken env() approach on iOS where WKWebView
    // is constrained within safe areas and env(safe-area-inset-top) returns 0
    const injectSafeAreaInsets = async () => {
      try {
        const { insets } = await SafeArea.getSafeAreaInsets()
        for (const [key, value] of Object.entries(insets)) {
          document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`)
        }
      } catch (e) {
        // SafeArea plugin may not be available
      }
    }
    injectSafeAreaInsets()

    // Listen for safe area changes (orientation changes, etc.)
    const safeAreaListener = SafeArea.addListener('safeAreaChanged', ({ insets }) => {
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`)
      }
    })

    // Handle Android back button/gesture
    const backHandler = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        // Navigate back in browser history
        window.history.back()
      } else {
        // At root - minimize app (don't exit)
        App.minimizeApp()
      }
    })

    return () => {
      backHandler.then((handle) => handle.remove())
      safeAreaListener.then((handle) => handle.remove())
      // Clean up body classes
      document.body.classList.remove('native-ios', 'native-android')
    }
  }, [])

  return <>{children}</>
}
