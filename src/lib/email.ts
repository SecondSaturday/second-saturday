import { Resend } from 'resend'

// Resend client - only available server-side
const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender configuration
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'noreply@secondsaturday.app'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, react, replyTo }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      react,
      replyTo,
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw new Error(error.message)
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Email send error:', err)
    throw err
  }
}

// Email templates for common use cases
export async function sendWelcomeEmail(to: string, name?: string) {
  return sendEmail({
    to,
    subject: 'Welcome to Second Saturday!',
    html: `
      <h1>Welcome${name ? `, ${name}` : ''}!</h1>
      <p>Thanks for joining Second Saturday. We're excited to have you!</p>
      <p>Get started by creating or joining a circle with your friends and family.</p>
    `,
  })
}

export async function sendCircleInviteEmail(
  to: string,
  inviterName: string,
  circleName: string,
  inviteLink: string
) {
  return sendEmail({
    to,
    subject: `${inviterName} invited you to join ${circleName}`,
    html: `
      <h1>You're invited!</h1>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${circleName}</strong> on Second Saturday.</p>
      <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #953FE3; color: white; text-decoration: none; border-radius: 8px;">Join Circle</a></p>
      <p>This invite link will expire in 7 days.</p>
    `,
  })
}

export async function sendEventReminderEmail(
  to: string,
  eventTitle: string,
  eventDate: string,
  circleName: string
) {
  return sendEmail({
    to,
    subject: `Reminder: ${eventTitle} is coming up`,
    html: `
      <h1>Event Reminder</h1>
      <p>Don't forget about <strong>${eventTitle}</strong> in your circle <strong>${circleName}</strong>.</p>
      <p>Date: ${eventDate}</p>
      <p>We hope to see you there!</p>
    `,
  })
}
