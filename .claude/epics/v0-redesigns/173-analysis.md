---
issue: 173
title: Replace custom auth code with Clerk UserProfile
analyzed: 2026-02-25T00:25:00Z
estimated_hours: 2
parallelization_factor: 1.0
---

# Parallel Work Analysis: Issue #173

## Overview

Single-file refactor of `settings/page.tsx` (540 lines). Delete ~200 lines of custom password change, email change, and associated state. Replace with Clerk `<UserProfile />` rendered inline. Keep: profile name/avatar, notifications, sign-out, account deletion.

## Parallel Streams

### Stream A: Settings page refactor (single stream)
**Scope**: Delete custom auth code, add UserProfile
**Files**: `src/app/dashboard/settings/page.tsx`
**Agent Type**: frontend
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Parallelization Strategy
**Recommended Approach**: sequential — single file refactor

### What to delete:
- Lines 44-58: 15 useState hooks for password/email (currentPassword, newPassword, confirmPassword, passwordSaving, passwordError, passwordSuccess, emailEditing, newEmail, emailSaving, emailError, emailSuccess, emailVerifying, emailCode, pendingEmailResource)
- Lines 92-96: `passwordValid` computation
- Lines 98-119: `handleChangePassword` function
- Lines 121-161: `handleChangeEmail` + `handleVerifyEmailCode` functions
- Lines 245-329: Email change UI (the entire email section in the Card)
- Lines 348-405: Password change Card

### What to add:
- `import { UserProfile } from '@clerk/nextjs'`
- `<UserProfile routing="hash" />` between the Profile card and Notifications card

### What to keep:
- Profile card (name, avatar, timezone, save button) — lines 222-343
- NotificationPreferences — line 346
- Account card (sign out) — lines 407-421
- Danger Zone card (delete account) — lines 423-534
- handleSave, handleReauthForDelete, handleDeleteAccount functions

## Notes
- `routing="hash"` prevents Clerk from navigating away from the page
- UserProfile automatically handles email change, password change, connected accounts
- The `any` type on line 58 (`pendingEmailResource`) gets deleted with the rest
- Existing `clerkAppearance` in providers.tsx will theme the component automatically
