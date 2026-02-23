import type { CapacitorConfig } from '@capacitor/cli'

// Server URL configuration
// - Development iOS: http://localhost:3000
// - Development Android: http://10.0.2.2:3000 (special IP for Android emulator)
// - Production: Set CAPACITOR_SERVER_URL to your Vercel deployment URL
// For device testing, use Cloudflare Tunnel (no interstitial, Clerk-compatible)
// Run: cloudflared tunnel --url http://localhost:3000
// Then update this URL with your cloudflared domain
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || 'https://toolbar-easy-decades-handling.trycloudflare.com'

const config: CapacitorConfig = {
  appId: 'com.secondsaturday.app',
  appName: 'Second Saturday',
  webDir: 'public', // Fallback directory (server mode loads from URL)
  server: {
    // Load app from live server (required for Clerk auth)
    // Note: For Android emulator, use 10.0.2.2 instead of localhost
    url: serverUrl,
    cleartext: true, // Allow HTTP for local development
    // Keep authentication flows within the WebView (don't open Safari)
    allowNavigation: [
      'toolbar-easy-decades-handling.trycloudflare.com',
      '*.trycloudflare.com',
      '*.clerk.dev',
      '*.clerk.com',
      'clerk.secondsaturday.com',
      // Clerk development instance domains (from publishable key)
      '*.clerk.accounts.dev',
      'accounts.dev',
      '*.accounts.dev',
      'optimum-slug-14.clerk.accounts.dev',
      // OAuth providers
      'accounts.google.com',
      '*.google.com',
      'appleid.apple.com',
      '*.apple.com',
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
    contentInset: 'automatic',
    scheme: 'Second Saturday',
    // No custom User-Agent - let Clerk see standard browser UA
  },
  android: {
    allowMixedContent: true, // Allow HTTP for local development
  },
}

export default config
