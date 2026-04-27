import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { PromptSection } from './PromptSection'
import { ProfileHeaderImageLayout } from '@/components/ProfileHeaderImageLayout'
import { Settings, ChevronDown, PencilLine } from 'lucide-react'
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
  responseId?: string
  memberUserId?: string
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
  onSettingsOpen?: () => void
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
  onSettingsOpen,
  isLoading = false,
}: NewsletterViewProps) {
  // Collect responseIds across sections and batch-fetch reactions.
  // Capped at 200 to match the server-side limit in `listReactionsForResponses`;
  // fingerprinted by joined string so identity-only `sections` changes don't refetch.
  const responseIdsKey = useMemo(
    () =>
      sections
        .flatMap((s) => s.responses.map((r) => r.responseId).filter((id): id is string => !!id))
        .slice(0, 200)
        .join('|'),
    [sections]
  )
  const allResponseIds = useMemo(
    () => (responseIdsKey ? responseIdsKey.split('|') : []),
    [responseIdsKey]
  )
  const reactionsByResponseId = useQuery(
    api.reactions.listReactionsForResponses,
    allResponseIds.length > 0 ? { responseIds: allResponseIds as Id<'responses'>[] } : 'skip'
  )
  const commentsByResponseId = useQuery(
    api.comments.listCommentsForResponses,
    allResponseIds.length > 0 ? { responseIds: allResponseIds as Id<'responses'>[] } : 'skip'
  )

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
    <div className="pb-12">
      {/* Newsletter Header */}
      <ProfileHeaderImageLayout
        coverImageUrl={circle.coverUrl}
        iconUrl={circle.iconUrl}
        editable={false}
      />

      <div className="mt-4 text-center">
        <h2 className="font-serif text-5xl font-normal text-foreground">{circle.name}</h2>
        {issueNumber > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Issue #{issueNumber}
            {formattedDate && <span> &middot; {formattedDate}</span>}
          </p>
        )}
      </div>

      {/* Month picker and settings */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {issueNumber === 0 ? null : availableNewsletters && availableNewsletters.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-foreground">
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
          <span className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-foreground">
            {currentMonthLabel}
          </span>
        )}

        <Link
          href={`/dashboard/circles/${circleId}/submit`}
          aria-label="Submit to this circle"
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PencilLine className="size-5" />
        </Link>

        {onSettingsOpen ? (
          <button
            onClick={onSettingsOpen}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" />
          </button>
        ) : (
          <Link
            href={`/dashboard/circles/${circleId}/settings`}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" />
          </Link>
        )}
      </div>

      {/* Sections — same horizontal margin as cover */}
      <div className="mt-8 space-y-8 px-4 md:px-8">
        {sections.map((section, index) => (
          <PromptSection
            key={index}
            promptTitle={section.promptTitle}
            responses={section.responses}
            circleId={circleId}
            reactionsByResponseId={reactionsByResponseId ?? undefined}
            commentsByResponseId={commentsByResponseId ?? undefined}
          />
        ))}

        {sections.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-lg font-medium text-foreground">No newsletters yet</p>
            <p className="text-sm text-muted-foreground">
              Editions will appear here once published.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
