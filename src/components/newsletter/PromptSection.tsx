import { MemberResponse } from './MemberResponse'

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

interface PromptSectionProps {
  promptTitle: string
  responses: Response[]
}

export function PromptSection({ promptTitle, responses }: PromptSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{promptTitle}</h3>
      <div className="space-y-6">
        {responses.map((response, index) => (
          <MemberResponse
            key={index}
            memberName={response.memberName}
            text={response.text}
            media={response.media}
          />
        ))}
      </div>
    </div>
  )
}
