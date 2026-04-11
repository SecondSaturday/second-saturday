/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authHelpers from '../authHelpers.js'
import type * as circles from '../circles.js'
import type * as cleanup from '../cleanup.js'
import type * as crons from '../crons.js'
import type * as e2eCleanup from '../e2eCleanup.js'
import type * as emails from '../emails.js'
import type * as files from '../files.js'
import type * as http from '../http.js'
import type * as lib_constants from '../lib/constants.js'
import type * as lib_dates from '../lib/dates.js'
import type * as lib_sentry from '../lib/sentry.js'
import type * as memberships from '../memberships.js'
import type * as newsletterEmails from '../newsletterEmails.js'
import type * as newsletterHelpers from '../newsletterHelpers.js'
import type * as newsletterReads from '../newsletterReads.js'
import type * as newsletters from '../newsletters.js'
import type * as notificationPush from '../notificationPush.js'
import type * as notifications from '../notifications.js'
import type * as prompts from '../prompts.js'
import type * as seed from '../seed.js'
import type * as submissions from '../submissions.js'
import type * as users from '../users.js'
import type * as videoActions from '../videoActions.js'
import type * as videos from '../videos.js'

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server'

declare const fullApi: ApiFromModules<{
  authHelpers: typeof authHelpers
  circles: typeof circles
  cleanup: typeof cleanup
  crons: typeof crons
  e2eCleanup: typeof e2eCleanup
  emails: typeof emails
  files: typeof files
  http: typeof http
  'lib/constants': typeof lib_constants
  'lib/dates': typeof lib_dates
  'lib/sentry': typeof lib_sentry
  memberships: typeof memberships
  newsletterEmails: typeof newsletterEmails
  newsletterHelpers: typeof newsletterHelpers
  newsletterReads: typeof newsletterReads
  newsletters: typeof newsletters
  notificationPush: typeof notificationPush
  notifications: typeof notifications
  prompts: typeof prompts
  seed: typeof seed
  submissions: typeof submissions
  users: typeof users
  videoActions: typeof videoActions
  videos: typeof videos
}>

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>

export declare const components: {}
