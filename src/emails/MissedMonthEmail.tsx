import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Button,
  Preview,
} from '@react-email/components'
import * as React from 'react'

export interface MissedMonthEmailProps {
  circleName: string
  circleIcon?: string | null
  nextDeadline: string
  viewCircleUrl: string
}

export default function MissedMonthEmail({
  circleName,
  circleIcon,
  nextDeadline,
  viewCircleUrl,
}: MissedMonthEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>No submissions this month for {circleName} - we miss you!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            {circleIcon && (
              <Img src={circleIcon} width="48" height="48" alt={circleName} style={iconStyle} />
            )}
            <Text style={title}>{circleName}</Text>
          </Section>

          <Section style={content}>
            <Img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHB4Ynl3a2Fmc3R3NXBybm1kN2U0dGRyOHBpOGJ4czJ2a3FkNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ICOgUNjkzRahS/giphy.gif"
              alt="Sad puppy"
              width="300"
              style={puppyGif}
            />
            <Text style={heading}>No one submitted this month</Text>
            <Text style={message}>
              Your circle didn&apos;t have any submissions this time around. That&apos;s okay
              &mdash; life gets busy! But your friends would love to hear from you next month.
            </Text>
            <Text style={deadline}>
              Next deadline: <strong>{nextDeadline}</strong>
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={viewCircleUrl} style={ctaButton}>
              Visit Your Circle
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you&apos;re a member of {circleName} on{' '}
              <Link href="https://secondsaturday.app" style={footerLink}>
                Second Saturday
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '24px',
}

const header: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '24px 0 0',
}

const iconStyle: React.CSSProperties = {
  borderRadius: '50%',
  margin: '0 auto 12px',
  display: 'block',
}

const title: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
}

const content: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const puppyGif: React.CSSProperties = {
  borderRadius: '12px',
  margin: '0 auto 20px',
  display: 'block',
  maxWidth: '300px',
  height: 'auto',
}

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 12px',
}

const message: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 16px',
}

const deadline: React.CSSProperties = {
  fontSize: '16px',
  color: '#7c3aed',
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '8px 0 24px',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const footer: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '16px 0 0',
  borderTop: '1px solid #e5e5e5',
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  margin: '0',
}

const footerLink: React.CSSProperties = {
  color: '#7c3aed',
  textDecoration: 'underline',
}
