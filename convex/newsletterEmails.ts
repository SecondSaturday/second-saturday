'use node'

import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import NewsletterEmail, { type NewsletterEmailProps } from '../src/emails/NewsletterEmail'
import MissedMonthEmail from '../src/emails/MissedMonthEmail'
import { MONTH_NAMES } from './lib/constants'
import { getSecondSaturdayDay } from './lib/dates'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')
  return new Resend(apiKey)
}

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@secondsaturday.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://secondsaturday.app'

// Resend allows up to 100 emails per batch call. Each call counts as one
// request against the account rate limit (5 req/s on our plan), so batching
// is what keeps us under the limit — a tight per-recipient loop would 429.
const RESEND_BATCH_SIZE = 100
// Spacing between batch calls: 4 req/s, leaving headroom under the 5/s limit.
const RESEND_BATCH_DELAY_MS = 250

type BatchEmail = {
  from: string
  to: [string]
  subject: string
  html: string
}

async function sendInBatches(
  resend: Resend,
  emails: BatchEmail[],
  label: string
): Promise<{ sentCount: number; failedEmails: string[] }> {
  let sentCount = 0
  const failedEmails: string[] = []

  for (let i = 0; i < emails.length; i += RESEND_BATCH_SIZE) {
    const chunk = emails.slice(i, i + RESEND_BATCH_SIZE)
    try {
      const result = await resend.batch.send(chunk, { batchValidation: 'permissive' })
      if (result.error) {
        console.error(`${label}: batch send failed for ${chunk.length} recipients:`, result.error)
        for (const c of chunk) failedEmails.push(c.to[0])
      } else {
        const errors = result.data?.errors ?? []
        const failedIdx = new Set(errors.map((e) => e.index))
        sentCount += chunk.length - failedIdx.size
        for (const e of errors) {
          const addr = chunk[e.index]?.to[0]
          if (addr) failedEmails.push(addr)
          console.error(`${label}: failed to send to ${addr}: ${e.message}`)
        }
      }
    } catch (error) {
      console.error(`${label}: batch send threw for ${chunk.length} recipients:`, error)
      for (const c of chunk) failedEmails.push(c.to[0])
    }
    if (i + RESEND_BATCH_SIZE < emails.length) {
      await new Promise((r) => setTimeout(r, RESEND_BATCH_DELAY_MS))
    }
  }

  if (failedEmails.length > 0) {
    console.error(`${label}: ${failedEmails.length} recipients failed:`, failedEmails)
  }

  return { sentCount, failedEmails }
}

/**
 * Send a compiled newsletter to all active, subscribed circle members.
 */
export const sendNewsletter = internalAction({
  args: { newsletterId: v.id('newsletters') },
  handler: async (ctx, args) => {
    // Atomically claim the send slot; bail if a prior invocation already sent.
    const claimed = await ctx.runMutation(internal.newsletterHelpers.claimNewsletterSendSlot, {
      newsletterId: args.newsletterId,
    })
    if (!claimed) {
      console.log(`Newsletter ${args.newsletterId} already sent; skipping retry`)
      return
    }

    const data = await ctx.runQuery(internal.newsletterHelpers.getNewsletterSendData, {
      newsletterId: args.newsletterId,
    })

    const { newsletter, circleName, iconUrl, recipients } = data

    // Parse sections from htmlContent JSON
    const parsed = JSON.parse(newsletter.htmlContent || '{"sections":[]}')
    const sections = parsed.sections as NewsletterEmailProps['sections']

    // Format date from cycleId (YYYY-MM)
    const [year, month] = newsletter.cycleId.split('-')
    const date = `${MONTH_NAMES[parseInt(month!, 10) - 1]} ${year}`

    const viewInAppUrl = `${APP_URL}/dashboard/circles/${newsletter.circleId}/newsletter/${newsletter._id}?utm_source=email&utm_medium=newsletter`
    const unsubscribeUrl = `${APP_URL}/dashboard/circles/${newsletter.circleId}/settings`

    // Render React Email template to HTML
    const html = await render(
      NewsletterEmail({
        circleIcon: iconUrl,
        circleName,
        issueNumber: newsletter.issueNumber,
        date,
        sections,
        viewInAppUrl,
        unsubscribeUrl,
      })
    )

    const resend = getResend()
    const subject = `${circleName} - Issue #${newsletter.issueNumber}`
    const emails: BatchEmail[] = recipients.map((r) => ({
      from: FROM,
      to: [r.email],
      subject,
      html,
    }))

    const { sentCount } = await sendInBatches(resend, emails, `Newsletter ${args.newsletterId}`)

    // Update recipient count
    await ctx.runMutation(internal.newsletterHelpers.updateRecipientCount, {
      newsletterId: args.newsletterId,
      recipientCount: sentCount,
    })

    console.log('[analytics] newsletter_sent', {
      circle_id: newsletter.circleId,
      recipient_count: sentCount,
      issue_number: newsletter.issueNumber,
    })
    console.log(`Newsletter ${newsletter._id} sent to ${sentCount}/${recipients.length} recipients`)
  },
})

/**
 * Send a missed-month notification to all active, subscribed circle members.
 */
export const sendMissedMonthEmail = internalAction({
  args: {
    newsletterId: v.id('newsletters'),
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    // Atomically claim the send slot; bail if a prior invocation already sent.
    const claimed = await ctx.runMutation(internal.newsletterHelpers.claimNewsletterSendSlot, {
      newsletterId: args.newsletterId,
    })
    if (!claimed) {
      console.log(`Missed-month email for ${args.newsletterId} already sent; skipping retry`)
      return
    }

    const data = await ctx.runQuery(internal.newsletterHelpers.getCircleSendData, {
      circleId: args.circleId,
    })

    const { circleName, iconUrl, recipients } = data

    // Calculate next deadline (next month's second Saturday at 10:59 AM UTC)
    const [yearStr, monthStr] = args.cycleId.split('-')
    const year = parseInt(yearStr!, 10)
    const month = parseInt(monthStr!, 10) // 1-indexed

    // Next month (1-indexed)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    const secondSaturdayDay = getSecondSaturdayDay(nextYear, nextMonth)
    const nextDeadline = `${MONTH_NAMES[nextMonth - 1]} ${secondSaturdayDay}, ${nextYear}`

    const viewCircleUrl = `${APP_URL}/dashboard/circles/${args.circleId}`

    // Render React Email template to HTML
    const html = await render(
      MissedMonthEmail({
        circleName,
        circleIcon: iconUrl,
        nextDeadline,
        viewCircleUrl,
      })
    )

    const resend = getResend()
    const subject = `No submissions this month for ${circleName}`
    const emails: BatchEmail[] = recipients.map((r) => ({
      from: FROM,
      to: [r.email],
      subject,
      html,
    }))

    const { sentCount } = await sendInBatches(resend, emails, `Missed-month ${args.newsletterId}`)

    console.log(
      `Missed-month email for ${circleName} sent to ${sentCount}/${recipients.length} recipients`
    )
  },
})

/**
 * Check if a given date is the second Saturday of its month.
 */
function isSecondSaturday(date: Date): boolean {
  if (date.getUTCDay() !== 6) return false // Not a Saturday
  const day = date.getUTCDate()
  // Second Saturday falls between day 8 and day 14
  return day >= 8 && day <= 14
}

/**
 * Cron handler: compile and send newsletters for all circles.
 * Runs every Saturday at 11:00 AM UTC but only proceeds on the second Saturday.
 */
export const processNewsletters = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date()

    // Guard: only proceed on the second Saturday of the month
    if (!isSecondSaturday(now)) {
      console.log('Not the second Saturday — skipping newsletter processing')
      return
    }

    // Calculate current cycleId (YYYY-MM)
    const cycleId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

    // Get all active (non-archived) circles
    const circles = await ctx.runQuery(internal.newsletterHelpers.getAllActiveCircles, {})

    console.log(`Processing newsletters for ${circles.length} circles, cycle ${cycleId}`)

    for (const circle of circles) {
      try {
        // Compile the newsletter
        const result = await ctx.runMutation(internal.newsletters.compileNewsletter, {
          circleId: circle._id,
          cycleId,
        })

        if (result.missedMonth) {
          // No submissions — send missed-month email
          await ctx.scheduler.runAfter(0, internal.newsletterEmails.sendMissedMonthEmail, {
            newsletterId: result.newsletterId,
            circleId: circle._id,
            cycleId,
          })
          console.log(`Circle ${circle.name}: missed month, scheduling missed-month email`)
        } else {
          // Has submissions — send the newsletter
          await ctx.scheduler.runAfter(0, internal.newsletterEmails.sendNewsletter, {
            newsletterId: result.newsletterId,
          })
          console.log(
            `Circle ${circle.name}: compiled ${result.submissionCount} submissions, scheduling send`
          )
        }
      } catch (error) {
        console.error(`Failed to process newsletter for circle ${circle.name}:`, error)
        // Continue with other circles
      }
    }

    console.log('Newsletter processing complete')
  },
})
