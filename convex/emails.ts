'use node'

import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import { Resend } from 'resend'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')
  return new Resend(apiKey)
}

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@secondsaturday.app'

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (_ctx, { email, name }) => {
    const resend = getResend()
    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Welcome to Second Saturday!',
      html: `
        <h1>Welcome${name ? `, ${name}` : ''}!</h1>
        <p>Thanks for joining Second Saturday. We're excited to have you!</p>
        <p>Get started by creating or joining a circle with your friends and family.</p>
      `,
    })
  },
})

export const sendAccountDeletionEmail = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (_ctx, { email, name }) => {
    const resend = getResend()
    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Your Second Saturday account has been deleted',
      html: `
        <h1>Account Deleted</h1>
        <p>Hi${name ? ` ${name}` : ''},</p>
        <p>Your Second Saturday account has been successfully deleted. All your data has been removed.</p>
        <p>If you didn't request this, please contact us immediately.</p>
      `,
    })
  },
})
