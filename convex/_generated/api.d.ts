/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as circles from '../circles.js'
import type * as crons from '../crons.js'
import type * as e2eCleanup from '../e2eCleanup.js'
import type * as emails from '../emails.js'
import type * as files from '../files.js'
import type * as http from '../http.js'
import type * as memberships from '../memberships.js'
import type * as newsletterReads from '../newsletterReads.js'
import type * as prompts from '../prompts.js'
import type * as submissions from '../submissions.js'
import type * as users from '../users.js'
import type * as videoActions from '../videoActions.js'
import type * as videos from '../videos.js'

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server'

declare const fullApi: ApiFromModules<{
  circles: typeof circles
  crons: typeof crons
  e2eCleanup: typeof e2eCleanup
  emails: typeof emails
  files: typeof files
  http: typeof http
  memberships: typeof memberships
  newsletterReads: typeof newsletterReads
  prompts: typeof prompts
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
