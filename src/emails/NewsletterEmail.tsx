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
  Hr,
  Preview,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  /** For videos: Mux thumbnail URL */
  thumbnailUrl?: string
  /** For videos: link to web view */
  webViewUrl?: string
  alt?: string
}

interface MemberResponse {
  memberName: string
  text: string
  media?: MediaItem[]
}

interface PromptSection {
  promptTitle: string
  responses: MemberResponse[]
}

export interface NewsletterEmailProps {
  circleIcon?: string | null
  circleName: string
  issueNumber: number
  date: string
  sections: PromptSection[]
  viewInAppUrl: string
  unsubscribeUrl: string
}

export default function NewsletterEmail({
  circleIcon,
  circleName,
  issueNumber,
  date,
  sections,
  viewInAppUrl,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${circleName} - Issue #${issueNumber}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {circleIcon && (
              <Img
                src={circleIcon}
                width="48"
                height="48"
                alt={circleName}
                style={circleIconStyle}
              />
            )}
            <Text style={circleName_style}>{circleName}</Text>
            <Text style={issueInfo}>
              Issue No. {issueNumber} &mdash; {date}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Prompt Sections */}
          {sections.map((section, sIdx) => (
            <Section key={sIdx} style={promptSection}>
              <Text style={promptTitle}>{section.promptTitle}</Text>

              {section.responses.map((response, rIdx) => (
                <Section key={rIdx} style={responseBlock}>
                  <Text style={memberName}>{response.memberName}</Text>
                  <Text style={responseText}>{response.text}</Text>

                  {response.media && response.media.length > 0 && (
                    <Row style={mediaRow}>
                      {response.media.map((item, mIdx) => (
                        <Column key={mIdx} style={mediaColumn}>
                          {item.type === 'image' ? (
                            <Img
                              src={item.url}
                              alt={item.alt || `Photo by ${response.memberName}`}
                              width="200"
                              style={mediaImage}
                            />
                          ) : (
                            <Link href={item.webViewUrl || viewInAppUrl} style={videoLink}>
                              <div style={videoContainer}>
                                <Img
                                  src={item.thumbnailUrl || item.url}
                                  alt={item.alt || `Video by ${response.memberName}`}
                                  width="200"
                                  style={mediaImage}
                                />
                                <Img
                                  src="https://secondsaturday.app/play-button.png"
                                  alt="Play video"
                                  width="48"
                                  height="48"
                                  style={playButton}
                                />
                              </div>
                            </Link>
                          )}
                        </Column>
                      ))}
                    </Row>
                  )}
                </Section>
              ))}

              {sIdx < sections.length - 1 && <Hr style={divider} />}
            </Section>
          ))}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>See you next month!</Text>
            <Button href={viewInAppUrl} style={ctaButton}>
              View in App
            </Button>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe from email
              </Link>{' '}
              (you&apos;ll still be in the circle)
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Inline styles for email client compatibility
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
  padding: '24px 0',
}

const circleIconStyle: React.CSSProperties = {
  borderRadius: '50%',
  margin: '0 auto 12px',
  display: 'block',
}

const circleName_style: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 4px',
}

const issueInfo: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
}

const divider: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const promptSection: React.CSSProperties = {
  padding: '0',
}

const promptTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#7c3aed',
  margin: '0 0 16px',
}

const responseBlock: React.CSSProperties = {
  marginBottom: '20px',
}

const memberName: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 4px',
}

const responseText: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333333',
  margin: '0 0 8px',
}

const mediaRow: React.CSSProperties = {
  marginTop: '8px',
}

const mediaColumn: React.CSSProperties = {
  padding: '0 4px',
  verticalAlign: 'top',
}

const mediaImage: React.CSSProperties = {
  borderRadius: '8px',
  maxWidth: '200px',
  height: 'auto',
}

const videoLink: React.CSSProperties = {
  textDecoration: 'none',
  position: 'relative' as const,
  display: 'inline-block',
}

const videoContainer: React.CSSProperties = {
  position: 'relative' as const,
  display: 'inline-block',
}

const playButton: React.CSSProperties = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

const footer: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const footerText: React.CSSProperties = {
  fontSize: '16px',
  color: '#666666',
  margin: '0 0 16px',
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

const unsubscribeText: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  marginTop: '16px',
}

const unsubscribeLink: React.CSSProperties = {
  color: '#999999',
  textDecoration: 'underline',
}
