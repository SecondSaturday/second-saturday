---
issue: 7
started: 2026-02-07T06:09:41Z
last_sync: 2026-02-07T06:21:18Z
completion: 100%
---

# Issue #7: Set Up Capacitor Mobile

## Summary
Capacitor mobile setup completed. iOS and Android platforms configured with essential plugins.

## Work Completed

### Capacitor Core
- Installed @capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/android
- Initialized Capacitor with app ID `com.secondsaturday.app`
- Configured server mode (loads from live URL instead of static export)

### Native Platforms
- Added iOS platform (`ios/` directory)
- Added Android platform (`android/` directory)
- Both platforms sync with Capacitor plugins

### Plugins Installed
- @capacitor/camera - Photo/video capture
- @capacitor/filesystem - File system access
- @capacitor/push-notifications - Native push notifications
- onesignal-cordova-plugin - OneSignal integration

### Configuration
- Updated `capacitor.config.ts` with server URL mode
- Updated `eslint.config.mjs` to ignore native platform directories
- Added npm scripts: `cap:sync`, `cap:ios`, `cap:android`

## Files Changed
- `capacitor.config.ts` - Capacitor configuration (new)
- `next.config.ts` - Removed static export (not compatible with Clerk)
- `package.json` - Added dependencies and scripts
- `eslint.config.mjs` - Added ios/android to ignores
- `ios/` - Native iOS project (new directory)
- `android/` - Native Android project (new directory)

## Usage

### Development Workflow
1. Start Next.js dev server: `pnpm dev`
2. Open iOS simulator: `pnpm cap:ios`
3. Open Android emulator: `pnpm cap:android`

### Production
Set `CAPACITOR_SERVER_URL` to your Vercel deployment URL

## Notes
- Server mode used instead of static export (Clerk auth requires server-side rendering)
- Android emulator requires `10.0.2.2` instead of `localhost` to access host machine
- Java not detected on system - Android Studio will handle Gradle sync

## Deferred Items
- **iOS Signing**: Apple Developer subscription pending activation (24-48hr wait)
- **OneSignal Push Testing**: Requires real device; emulator has limited push support
- **APNs Configuration**: Blocked by Apple Developer subscription

## Status
- ✅ Capacitor core setup complete
- ✅ iOS platform added (signing deferred)
- ✅ Android platform added and tested
- ⏸️ Push notification testing deferred to real device

<!-- SYNCED: 2026-02-07T06:21:18Z -->
