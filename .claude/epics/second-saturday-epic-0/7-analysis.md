---
issue: 7
title: Set Up Capacitor Mobile
analyzed: 2026-02-07T06:09:41Z
estimated_hours: 8-10
parallelization_factor: 1.5
---

# Parallel Work Analysis: Issue #7

## Overview
Initialize Capacitor to wrap the Next.js app for iOS and Android deployment. This involves configuring Next.js for static export, initializing Capacitor, adding native platforms, installing plugins, and verifying builds on simulators/emulators.

## Parallel Streams

### Stream A: Capacitor Core Setup
**Scope**: Initialize Capacitor, configure Next.js static export, install core plugins
**Files**:
- `capacitor.config.ts` (new)
- `next.config.ts` (modify for static export)
- `package.json` (add dependencies)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 2-3
**Dependencies**: none

### Stream B: iOS Platform Setup
**Scope**: Add iOS platform, configure Xcode project, test simulator build
**Files**:
- `ios/` (new directory - native project)
- Xcode project configuration
**Agent Type**: mobile-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 3-4
**Dependencies**: Stream A (Capacitor must be initialized first)
**Notes**: Requires macOS with Xcode, Apple Developer account for signing

### Stream C: Android Platform Setup
**Scope**: Add Android platform, configure Android Studio project, test emulator build
**Files**:
- `android/` (new directory - native project)
- Android Studio project configuration
**Agent Type**: mobile-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 2-3
**Dependencies**: Stream A (Capacitor must be initialized first)

### Stream D: OneSignal Capacitor Plugin
**Scope**: Install and configure OneSignal Capacitor plugin (deferred from issue #6)
**Files**:
- `capacitor.config.ts` (add OneSignal config)
- `src/lib/push.ts` (update for Capacitor)
**Agent Type**: mobile-specialist
**Can Start**: after Streams B & C complete
**Estimated Hours**: 1-2
**Dependencies**: Streams B, C (native platforms must exist)

## Coordination Points

### Shared Files
- `capacitor.config.ts` - Streams A & D (A creates, D adds OneSignal config)
- `package.json` - Stream A only (all dependencies added together)

### Sequential Requirements
1. Capacitor initialization before adding platforms
2. Native platforms exist before testing plugins
3. Static export configured before `cap sync`

## Conflict Risk Assessment
- **Low Risk**: Each stream works on separate directories (ios/, android/)
- **Sequential Nature**: This task is inherently sequential due to Capacitor's workflow:
  1. Initialize Capacitor
  2. Add platforms (can be parallel)
  3. Configure and test

## Parallelization Strategy

**Recommended Approach**: hybrid

1. **Phase 1**: Stream A - Core Capacitor setup (sequential, required first)
2. **Phase 2**: Streams B & C in parallel - iOS and Android setup simultaneously
3. **Phase 3**: Stream D - OneSignal plugin after platforms ready

Note: Streams B & C can run in parallel since iOS and Android are independent, but both require Stream A to complete first.

## Expected Timeline

With parallel execution (Streams B & C together):
- Wall time: 6-8 hours
- Total work: 8-10 hours
- Efficiency gain: ~20%

Without parallel execution:
- Wall time: 8-10 hours

## Notes

1. **Interactive Steps Required**: Several steps require manual interaction:
   - Xcode: Opening project, configuring signing, running simulator
   - Android Studio: Opening project, configuring SDK, running emulator
   - These cannot be fully automated

2. **Apple Developer Account**: Must be approved for iOS signing. If not approved yet, iOS build can proceed unsigned for simulator testing.

3. **Static Export Consideration**: Next.js `output: 'export'` may affect dynamic routes. Need to verify app structure supports static generation.

4. **OneSignal Plugin**: This completes the push notification setup from issue #6. APNs (iOS) and FCM (Android) configuration happens in the native projects.

5. **Build Order**:
   ```
   pnpm build → npx cap sync → npx cap open ios/android
   ```
