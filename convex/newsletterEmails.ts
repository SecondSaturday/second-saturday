'use node'

import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import NewsletterEmail, { type NewsletterEmailProps } from '../src/emails/NewsletterEmail'
import MissedMonthEmail from '../src/emails/MissedMonthEmail'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')
  return new Resend(apiKey)
}

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@secondsaturday.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://secondsaturday.app'

/**
 * Send a compiled newsletter to all active, subscribed circle members.
 */
export const sendNewsletter = internalAction({
  args: { newsletterId: v.id('newsletters') },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.newsletterHelpers.getNewsletterSendData, {
      newsletterId: args.newsletterId,
    })

    const { newsletter, circleName, iconUrl, recipients } = data

    // Parse sections from htmlContent JSON
    const parsed = JSON.parse(newsletter.htmlContent || '{"sections":[]}')
    const sections = parsed.sections as NewsletterEmailProps['sections']

    // Format date from cycleId (YYYY-MM)
    const [year, month] = newsletter.cycleId.split('-')
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const date = `${monthNames[parseInt(month!, 10) - 1]} ${year}`

    const viewInAppUrl = `${APP_URL}/circles/${newsletter.circleId}/newsletters/${newsletter._id}`
    const unsubscribeUrl = `${APP_URL}/circles/${newsletter.circleId}/unsubscribe`

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
    let sentCount = 0

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: FROM,
          to: [recipient.email],
          subject: `${circleName} - Issue #${newsletter.issueNumber}`,
          html,
        })
        sentCount++
      } catch (error) {
        console.error(`Failed to send newsletter to ${recipient.email}:`, error)
      }
    }

    // Update recipient count
    await ctx.runMutation(internal.newsletterHelpers.updateRecipientCount, {
      newsletterId: args.newsletterId,
      recipientCount: sentCount,
    })

    console.log(`Newsletter ${newsletter._id} sent to ${sentCount}/${recipients.length} recipients`)
  },
})

/**
 * Send a missed-month notification to all active, subscribed circle members.
 */
export const sendMissedMonthEmail = internalAction({
  args: {
    circleId: v.id('circles'),
    cycleId: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.newsletterHelpers.getCircleSendData, {
      circleId: args.circleId,
    })

    const { circleName, iconUrl, recipients } = data

    // Calculate next deadline (next month's second Saturday at 10:59 AM UTC)
    const [yearStr, monthStr] = args.cycleId.split('-')
    const year = parseInt(yearStr!, 10)
    const month = parseInt(monthStr!, 10) - 1 // 0-indexed

    // Next month
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year

    const firstDay = new Date(Date.UTC(nextYear, nextMonth, 1))
    const dayOfWeek = firstDay.getUTCDay()
    const daysToFirstSaturday = (6 - dayOfWeek + 7) % 7
    const secondSaturdayDay = 1 + daysToFirstSaturday + 7

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const nextDeadline = `${monthNames[nextMonth]} ${secondSaturdayDay}, ${nextYear}`

    const viewCircleUrl = `${APP_URL}/circles/${args.circleId}`

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

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: FROM,
          to: [recipient.email],
          subject: `No submissions this month for ${circleName}`,
          html,
        })
      } catch (error) {
        console.error(`Failed to send missed-month email to ${recipient.email}:`, error)
      }
    }

    console.log(`Missed-month email for ${circleName} sent to ${recipients.length} recipients`)
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
