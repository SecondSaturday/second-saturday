import { PromptSection } from './PromptSection'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface Response {
  memberName: string
  text: string
  media?: MediaItem[]
}

interface Section {
  promptTitle: string
  responses: Response[]
}

interface CircleInfo {
  name: string
  iconUrl: string | null
  coverUrl: string | null
  timezone: string
}

interface NewsletterViewProps {
  circle: CircleInfo
  issueNumber: number
  publishedAt?: number
  sections: Section[]
}

export function NewsletterView({
  circle,
  issueNumber,
  publishedAt,
  sections,
}: NewsletterViewProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Newsletter Header */}
      <div className="flex items-center gap-3">
        {circle.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={circle.iconUrl}
            alt={circle.name}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {circle.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">{circle.name}</h2>
          <p className="text-sm text-muted-foreground">
            Issue #{issueNumber}
            {formattedDate && <span> &middot; {formattedDate}</span>}
          </p>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <div key={index}>
          {index > 0 && <hr className="mb-6 border-border" />}
          <PromptSection promptTitle={section.promptTitle} responses={section.responses} />
        </div>
      ))}

      {sections.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          This newsletter has no content yet.
        </p>
      )}
    </div>
  )
}
