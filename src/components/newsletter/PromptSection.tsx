import { MemberResponse } from './MemberResponse'
import type { ServerReaction } from './ReactionStrip'
import type { Id } from '../../../convex/_generated/dataModel'

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

interface PromptSectionProps {
  promptTitle: string
  responses: Response[]
  circleId?: string
  reactionsByResponseId?: Record<string, ServerReaction[]>
}

export function PromptSection({
  promptTitle,
  responses,
  circleId,
  reactionsByResponseId,
}: PromptSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl font-normal text-foreground">{promptTitle}</h3>
      <div className="rounded-2xl bg-card">
        {responses.map((response, index) => (
          <MemberResponse
            key={response.responseId ?? `idx-${index}`}
            responseId={response.responseId}
            memberUserId={response.memberUserId as Id<'users'> | undefined}
            circleId={circleId as Id<'circles'> | undefined}
            memberName={response.memberName}
            memberAvatarUrl={response.memberAvatarUrl}
            text={response.text}
            media={response.media}
            showDivider={index > 0}
            reactions={
              response.responseId ? reactionsByResponseId?.[response.responseId] : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
