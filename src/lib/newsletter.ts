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

export interface NewsletterSection {
  promptTitle: string
  responses: Response[]
}

interface ParsedContent {
  sections: NewsletterSection[]
}

export function parseNewsletterContent(htmlContent?: string | null): NewsletterSection[] {
  if (!htmlContent) return []
  try {
    const parsed: ParsedContent = JSON.parse(htmlContent)
    return parsed.sections ?? []
  } catch {
    return []
  }
}
