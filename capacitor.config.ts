import type { CapacitorConfig } from '@capacitor/cli'

// Server URL configuration
// - Development iOS: http://localhost:3000
// - Development Android: http://10.0.2.2:3000 (special IP for Android emulator)
// - Production: Set CAPACITOR_SERVER_URL to your Vercel deployment URL
// For device testing, use Cloudflare Tunnel (no interstitial, Clerk-compatible)
// Run: cloudflared tunnel --url http://localhost:3000
// Then update this URL with your cloudflared domain
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000'

const config: CapacitorConfig = {
  appId: 'com.secondsaturday.app',
  appName: 'Second Saturday',
  webDir: 'public', // Fallback directory (server mode loads from URL)
  server: {
    // Load app from live server (required for Clerk auth)
    // Note: For Android emulator, use 10.0.2.2 instead of localhost
    url: serverUrl,
    cleartext: true, // Required for local dev; production builds should use HTTPS via CAPACITOR_SERVER_URL
    // Keep authentication flows within the WebView (don't open Safari)
    allowNavigation: [
      '*.trycloudflare.com',
      '*.clerk.dev',
      '*.clerk.com',
      'clerk.secondsaturday.com',
      // Clerk development instance domains (from publishable key)
      '*.clerk.accounts.dev',
      'accounts.dev',
      '*.accounts.dev',
      // OAuth providers
      'accounts.google.com',
      'appleid.apple.com',
      'localhost',
      'localhost:*',
    ],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Camera plugin configuration
      // Permissions are configured in platform-specific files:
      // - iOS: ios/App/App/Info.plist
      // - Android: android/app/src/main/AndroidManifest.xml
    },
  },
  ios: {
    contentInset: 'never', // Let CSS env(safe-area-inset-*) handle safe areas
    scheme: 'Second Saturday',
    // No custom User-Agent - let Clerk see standard browser UA
    preferredContentMode: 'mobile',
    scrollEnabled: false, // Prevent WebView-level scroll/zoom
  },
  android: {
    allowMixedContent: true, // Required for local dev; production builds should use HTTPS
  },
}

export default config
