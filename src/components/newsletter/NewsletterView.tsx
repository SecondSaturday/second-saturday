import { PromptSection } from './PromptSection'
import { ProfileHeaderImageLayout } from '@/components/ProfileHeaderImageLayout'
import { Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface Response {
  memberName: string
  memberAvatarUrl?: string | null
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

interface NewsletterOption {
  id: string
  issueNumber: number
  publishedAt: number
}

interface NewsletterViewProps {
  circle: CircleInfo
  circleId: string
  issueNumber: number
  publishedAt?: number
  sections: Section[]
  availableNewsletters?: NewsletterOption[]
  onNewsletterSelect?: (newsletterId: string) => void
  isLoading?: boolean
}

export function NewsletterView({
  circle,
  circleId,
  issueNumber,
  publishedAt,
  sections,
  availableNewsletters,
  onNewsletterSelect,
  isLoading = false,
}: NewsletterViewProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const currentMonthLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : 'Current Issue'

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Cover block skeleton */}
        <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />

        {/* Heading bars skeleton */}
        <div className="mt-4 flex flex-col items-center gap-2 px-4">
          <div className="h-7 w-[70%] animate-pulse rounded bg-muted" />
          <div className="h-5 w-[40%] animate-pulse rounded bg-muted" />
        </div>

        {/* Article card placeholders */}
        <div className="space-y-4 px-4">
          <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-[160px] w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Newsletter Header */}
      <div>
        <ProfileHeaderImageLayout
          coverImageUrl={circle.coverUrl}
          iconUrl={circle.iconUrl}
          editable={false}
        />
        <div className="mt-4 text-center">
          <h2 className="font-serif text-2xl font-normal text-foreground">{circle.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue #{issueNumber}
            {formattedDate && <span> &middot; {formattedDate}</span>}
          </p>
        </div>

        {/* Month picker and settings */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {availableNewsletters && availableNewsletters.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground">
                {currentMonthLabel}
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {availableNewsletters.map((nl) => {
                  const monthLabel = new Date(nl.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })
                  return (
                    <DropdownMenuItem
                      key={nl.id}
                      onClick={() => onNewsletterSelect?.(nl.id)}
                      className={nl.issueNumber === issueNumber ? 'bg-accent' : ''}
                    >
                      {monthLabel} (Issue #{nl.issueNumber})
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="rounded-lg bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground">
              {currentMonthLabel}
            </span>
          )}

          <Link
            href={`/dashboard/circles/${circleId}/settings`}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 px-4">
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
    </div>
  )
}
