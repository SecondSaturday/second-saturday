import { MemberResponse } from './MemberResponse'

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

interface PromptSectionProps {
  promptTitle: string
  responses: Response[]
}

export function PromptSection({ promptTitle, responses }: PromptSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-normal text-foreground">{promptTitle}</h3>
      <div className="space-y-4 rounded-xl bg-card p-4">
        {responses.map((response, index) => (
          <MemberResponse
            key={index}
            memberName={response.memberName}
            memberAvatarUrl={response.memberAvatarUrl}
            text={response.text}
            media={response.media}
            showDivider={index > 0}
          />
        ))}
      </div>
    </div>
  )
}
