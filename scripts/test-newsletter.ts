/**
 * Newsletter Pipeline Integration Test
 *
 * Tests the full newsletter lifecycle via Convex CLI:
 *   1. Create test submission with responses
 *   2. Compile the newsletter
 *   3. Send the newsletter email
 *   4. Verify results
 *
 * Usage:
 *   pnpm test:newsletter                    # run against first circle found
 *   pnpm test:newsletter -- --circle <id>   # run against specific circle
 *   pnpm test:newsletter -- --cleanup       # delete test data after run
 *   pnpm test:newsletter -- --dry-run       # compile only, skip email send
 *
 * Requires: CONVEX_URL set (reads from .env.local)
 */

import { execSync } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function convexRun(fnPath: string, args: Record<string, unknown> = {}): string {
  const argsJson = JSON.stringify(args).replace(/"/g, '\\"')
  try {
    return execSync(`npx convex run ${fnPath} "${argsJson}"`, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string }
    const stderr = error.stderr ?? error.message ?? 'Unknown error'
    // Extract the actual Convex error from stderr
    const match = stderr.match(/Error: (.+)/m)
    throw new Error(match?.[1] ?? stderr.substring(0, 200))
  }
}

function parseResult(output: string): Record<string, unknown> {
  // convex run may output multi-line JSON with log lines before it
  // Try parsing the entire output first, then look for JSON blocks
  try {
    return JSON.parse(output)
  } catch {
    /* not single JSON, try extracting */
  }

  // Find the last JSON object in the output
  const match = output.match(/\{[\s\S]*\}/g)
  if (match) {
    for (let i = match.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(match[i]!)
      } catch {
        /* try previous match */
      }
    }
  }

  throw new Error(`Could not parse Convex output: ${output}`)
}

function getCycleId(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function log(step: string, msg: string) {
  console.log(`  [${step}] ${msg}`)
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const circleIdArg = args.includes('--circle') ? args[args.indexOf('--circle') + 1] : undefined
const cleanup = args.includes('--cleanup')
const dryRun = args.includes('--dry-run')

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n📰 Newsletter Pipeline Test\n')

  const cycleId = getCycleId()
  console.log(`  Cycle: ${cycleId}`)
  console.log(`  Dry run: ${dryRun}`)
  console.log(`  Cleanup: ${cleanup}\n`)

  // -----------------------------------------------------------------------
  // Step 0: Resolve circle
  // -----------------------------------------------------------------------
  let circleId = circleIdArg

  if (!circleId) {
    log('setup', 'No --circle provided, finding circle with real email recipients...')
    const output = convexRun('newsletterHelpers:getAllActiveCircles')
    const circles = JSON.parse(output) as Array<{ _id: string; name: string }>

    if (!circles.length) {
      console.error('❌ No active circles found. Create a circle first or pass --circle <id>')
      process.exit(1)
    }

    // Find a circle that has both the test user AND at least one real email recipient
    const TEST_EMAIL = 'jane+clerk_test@example.com'
    let chosen: { _id: string; name: string } | null = null
    for (const circle of circles) {
      try {
        const sendData = convexRun('newsletterHelpers:getCircleSendData', { circleId: circle._id })
        const parsed = parseResult(sendData)
        const recipients = parsed.recipients as Array<{ email: string }>
        const hasTestUser = recipients.some((r) => r.email === TEST_EMAIL)
        const hasRealEmail = recipients.some((r) => !r.email.endsWith('@example.com'))
        if (hasTestUser && hasRealEmail) {
          chosen = circle
          const realCount = recipients.filter((r) => !r.email.endsWith('@example.com')).length
          log('setup', `Found circle with test user + ${realCount} real email recipient(s)`)
          break
        }
      } catch {
        /* skip circles we can't inspect */
      }
    }

    if (!chosen) {
      console.error(`❌ No circle found with both ${TEST_EMAIL} and a real email recipient`)
      console.error('   Pass --circle <id> to target a specific circle')
      process.exit(1)
    }

    circleId = chosen._id
    log('setup', `Using circle: ${chosen.name} (${circleId})`)
  } else {
    log('setup', `Using circle: ${circleId}`)
  }

  // -----------------------------------------------------------------------
  // Cleanup-only mode: skip seeding/compiling/sending, just delete
  // -----------------------------------------------------------------------
  if (cleanup && dryRun) {
    log('cleanup', 'Cleaning up test data...')
    try {
      const output = convexRun('seed:cleanupTestData', { circleId, cycleId })
      const result = parseResult(output)
      log(
        'cleanup',
        `✅ Deleted: ${result.submissions} submissions, ${result.responses} responses, ${result.media} media, ${result.newsletters} newsletters, ${result.reads} reads`
      )
    } catch (err) {
      log('cleanup', `⚠️  Cleanup failed: ${(err as Error).message}`)
    }
    console.log()
    return
  }

  // -----------------------------------------------------------------------
  // Step 1: Seed test submissions
  // -----------------------------------------------------------------------
  log('step 1', 'Seeding test submissions...')

  let submissionCount = 0
  try {
    const seedOutput = convexRun('seed:createTestSubmissions', { circleId, cycleId })
    const seedResult = parseResult(seedOutput)
    const created = seedResult.created as number
    const totalMembers = seedResult.totalMembers as number
    const promptCount = seedResult.promptCount as number

    if (created > 0) {
      log(
        'step 1',
        `✅ Created ${created} submission(s) for ${totalMembers} member(s) with ${promptCount} prompt(s)`
      )
    } else {
      log('step 1', `All ${totalMembers} member(s) already have submissions — using existing`)
    }
    submissionCount = totalMembers
  } catch (err) {
    log('step 1', `⚠️  Seed failed: ${(err as Error).message}`)
  }

  // -----------------------------------------------------------------------
  // Step 2: Delete stale newsletter if exists, then compile fresh
  // -----------------------------------------------------------------------
  log('step 2', 'Compiling newsletter...')

  let newsletterId: string | null = null
  let missedMonth = false

  // Delete any existing newsletter for this cycle so we get a fresh compile
  try {
    convexRun('seed:deleteNewsletter', { circleId, cycleId })
    log('step 2', 'Deleted existing newsletter for fresh compile')
  } catch {
    // No existing newsletter — that's fine
  }

  try {
    const output = convexRun('newsletters:compileNewsletter', { circleId, cycleId })
    const result = parseResult(output)

    newsletterId = result.newsletterId as string
    submissionCount = result.submissionCount as number
    missedMonth = result.missedMonth as boolean

    log('step 2', `✅ Compiled: newsletterId=${newsletterId}`)
    log(
      'step 2',
      `   submissions=${submissionCount}, members=${result.memberCount}, missed=${missedMonth}`
    )
  } catch (err) {
    const msg = (err as Error).message
    console.error(`❌ Compilation failed: ${msg}`)
    process.exit(1)
  }

  // -----------------------------------------------------------------------
  // Step 3: Send email
  // -----------------------------------------------------------------------
  if (dryRun) {
    log('step 3', '⏭️  Skipping email send (--dry-run)')
  } else if (missedMonth) {
    log('step 3', 'Sending missed-month email...')
    try {
      convexRun('newsletterEmails:sendMissedMonthEmail', { circleId, cycleId })
      log('step 3', '✅ Missed-month email sent')
    } catch (err) {
      log('step 3', `❌ Failed: ${(err as Error).message}`)
    }
  } else if (newsletterId) {
    log('step 3', 'Sending newsletter email...')
    try {
      convexRun('newsletterEmails:sendNewsletter', { newsletterId })
      log('step 3', '✅ Newsletter email sent')
    } catch (err) {
      log('step 3', `❌ Failed: ${(err as Error).message}`)
    }
  } else {
    log('step 3', '⚠️  No newsletter to send')
  }

  // -----------------------------------------------------------------------
  // Step 4: Verify
  // -----------------------------------------------------------------------
  log('step 4', 'Verifying compilation result...')

  if (newsletterId && submissionCount > 0 && !missedMonth) {
    log('step 4', '✅ Newsletter compiled with submissions and email triggered')
  } else if (missedMonth) {
    log('step 4', '✅ Missed month detected — missed-month email triggered')
  } else {
    log('step 4', '⚠️  No submissions found — newsletter skipped or empty')
  }

  // -----------------------------------------------------------------------
  // Cleanup (optional)
  // -----------------------------------------------------------------------
  if (cleanup) {
    log('cleanup', 'Cleaning up test data...')
    try {
      const output = convexRun('seed:cleanupTestData', { circleId, cycleId })
      const result = parseResult(output)
      log(
        'cleanup',
        `✅ Deleted: ${result.submissions} submissions, ${result.responses} responses, ${result.media} media, ${result.newsletters} newsletters, ${result.reads} reads`
      )
    } catch (err) {
      log('cleanup', `⚠️  Cleanup failed: ${(err as Error).message}`)
    }
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n📋 Summary')
  console.log(`  Circle:       ${circleId}`)
  console.log(`  Cycle:        ${cycleId}`)
  console.log(`  Submissions:  ${submissionCount}`)
  console.log(`  Newsletter:   ${newsletterId ?? 'none'}`)
  console.log(`  Missed month: ${missedMonth}`)
  console.log(`  Email sent:   ${!dryRun && (newsletterId || missedMonth) ? 'yes' : 'no'}`)
  console.log()
}

main().catch((err) => {
  console.error('\n❌ Test failed:', err.message)
  process.exit(1)
})
