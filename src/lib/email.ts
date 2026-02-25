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
