import { MemberResponse } from './MemberResponse'
import type { ServerReaction } from './ReactionStrip'

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string | null
}

interface Response {
  responseId?: string
  memberName: string
  memberAvatarUrl?: string | null
  text: string
  media?: MediaItem[]
}

interface PromptSectionProps {
  promptTitle: string
  responses: Response[]
  reactionsByResponseId?: Record<string, ServerReaction[]>
}

export function PromptSection({
  promptTitle,
  responses,
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
