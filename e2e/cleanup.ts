/**
 * Test Data Cleanup Script
 *
 * Removes circles and all related data created by E2E tests or QA dogfooding from Convex.
 * Only deletes circles matching known test name patterns (E2E *, QA *).
 *
 * Usage:
 *   pnpm e2e:cleanup              # Delete E2E + QA test data
 *   pnpm e2e:cleanup --dry-run    # Preview what would be deleted
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL not set in .env.local')
  process.exit(1)
}

const dryRun = process.argv.includes('--dry-run')

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL!)

  console.log(
    dryRun ? '🔍 Dry run — previewing E2E data to clean up...' : '🧹 Cleaning up E2E test data...'
  )

  try {
    const result = await client.mutation(api.e2eCleanup.cleanupE2EData, { dryRun })

    if (result.matchedCircles.length === 0) {
      console.log('✅ No E2E test data found — nothing to clean up.')
      return
    }

    console.log(`\n${dryRun ? 'Would delete' : 'Deleted'}:`)
    console.log(`  Circles:          ${result.deleted.circles}`)
    console.log(`  Prompts:          ${result.deleted.prompts}`)
    console.log(`  Memberships:      ${result.deleted.memberships}`)
    console.log(`  Submissions:      ${result.deleted.submissions}`)
    console.log(`  Responses:        ${result.deleted.responses}`)
    console.log(`  Media:            ${result.deleted.media}`)
    console.log(`  Videos:           ${result.deleted.videos}`)
    console.log(`  Newsletter Reads: ${result.deleted.newsletterReads}`)
    console.log(`  Newsletters:      ${result.deleted.newsletters}`)
    console.log(`  Admin Reminders:  ${result.deleted.adminReminders}`)
    console.log(`  Notif. Prefs:     ${result.deleted.notificationPreferences}`)

    console.log(`\nCircles matched:`)
    for (const name of result.matchedCircles) {
      console.log(`  - ${name}`)
    }

    if (dryRun) {
      console.log('\nRun without --dry-run to actually delete.')
    } else {
      console.log('\n✅ Cleanup complete.')
    }
  } catch (err) {
    console.error('❌ Cleanup failed:', err)
    process.exit(1)
  }
}

main()
