import type { CapacitorConfig } from '@capacitor/cli'

// Server URL configuration
// - Development iOS: http://localhost:3000
// - Development Android: http://10.0.2.2:3000 (special IP for Android emulator)
// - Production: Set CAPACITOR_SERVER_URL to your Vercel deployment URL
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000'

const config: CapacitorConfig = {
  appId: 'com.secondsaturday.app',
  appName: 'Second Saturday',
  webDir: 'public', // Fallback directory (server mode loads from URL)
  server: {
    // Load app from live server (required for Clerk auth)
    // Note: For Android emulator, use 10.0.2.2 instead of localhost
    url: serverUrl,
    cleartext: true, // Allow HTTP for local development
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Second Saturday',
  },
  android: {
    allowMixedContent: true, // Allow HTTP for local development
  },
}

export default config
