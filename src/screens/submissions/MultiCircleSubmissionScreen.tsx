'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Lock, Loader2, Check } from 'lucide-react'
import {
  CircleSubmissionTabs,
  AutoSaveIndicator,
  PromptResponseCard,
  DeadlineCountdown,
} from '@/components/submissions'
import type { Circle, SaveStatus } from '@/components/submissions'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeadlineCountdown } from '@/hooks/useDeadlineCountdown'
import { getNextSecondSaturday } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'

interface MultiCircleSubmissionScreenProps {
  circles: Circle[]
  cycleId: string
}

function getDeadlineTimestamp(): number {
  const d = getNextSecondSaturday(new Date())
  d.setUTCHours(10, 59, 0, 0)
  return d.getTime()
}

export function MultiCircleSubmissionScreen({
  circles,
  cycleId,
}: MultiCircleSubmissionScreenProps) {
  const [activeCircleId, setActiveCircleId] = useState<string>(circles[0]?.id ?? '')
  const [draftTexts, setDraftTexts] = useState<Map<string, Map<string, string>>>(new Map())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deadlineTimestamp = useMemo(() => getDeadlineTimestamp(), [])
  const { isPast: deadlineIsPast } = useDeadlineCountdown(deadlineTimestamp)

  const activeCircle = circles.find((c) => c.id === activeCircleId)

  // Track submission_started when user opens/switches to a circle
  useEffect(() => {
    if (!activeCircleId) return
    try {
      trackEvent('submission_started', { circle_id: activeCircleId, cycle_id: cycleId })
    } catch {}
  }, [activeCircleId, cycleId])

  // Queries for the active circle
  const submissionData = useQuery(
    api.submissions.getSubmissionForCircle,
    activeCircleId ? { circleId: activeCircleId as Id<'circles'>, cycleId } : 'skip'
  )
  const promptsData = useQuery(
    api.submissions.getPromptsForCircle,
    activeCircleId ? { circleId: activeCircleId as Id<'circles'> } : 'skip'
  )

  // Mutations
  const createSubmission = useMutation(api.submissions.createSubmission)
  const updateResponse = useMutation(api.submissions.updateResponse)
  const removeMedia = useMutation(api.submissions.removeMediaFromResponse)
  const lockSubmission = useMutation(api.submissions.lockSubmission)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!submissionData?._id || isSubmitting) return
    setIsSubmitting(true)
    try {
      await lockSubmission({ submissionId: submissionData._id })
      try {
        trackEvent('submission_locked', { circle_id: activeCircleId, cycle_id: cycleId })
      } catch {}
    } finally {
      setIsSubmitting(false)
    }
  }, [submissionData, isSubmitting, lockSubmission, activeCircleId, cycleId])

  // Initialise draft texts from server data when data loads
  useEffect(() => {
    if (!submissionData || !promptsData) return
    if (!activeCircleId) return

    setDraftTexts((prev) => {
      // Only initialise if we don't already have drafts for this circle
      if (prev.has(activeCircleId)) return prev

      const circleMap = new Map<string, string>()
      for (const prompt of promptsData) {
        const response = submissionData.responses.find((r) => r.promptId === prompt._id)
        circleMap.set(prompt._id, response?.text ?? '')
      }

      const next = new Map(prev)
      next.set(activeCircleId, circleMap)
      return next
    })
  }, [submissionData, promptsData, activeCircleId])

  // Also initialise with empty map when prompts load but no submission exists
  useEffect(() => {
    if (submissionData !== null || !promptsData) return
    if (!activeCircleId) return

    setDraftTexts((prev) => {
      if (prev.has(activeCircleId)) return prev

      const circleMap = new Map<string, string>()
      for (const prompt of promptsData) {
        circleMap.set(prompt._id, '')
      }

      const next = new Map(prev)
      next.set(activeCircleId, circleMap)
      return next
    })
  }, [submissionData, promptsData, activeCircleId])

  // Get current draft map for active circle (stable reference for debounce)
  const activeDraftMap = draftTexts.get(activeCircleId) ?? new Map<string, string>()

  // Debounce the active draft map — convert to plain object for debounce comparison
  const activeDraftObj = useMemo(() => {
    const obj: Record<string, string> = {}
    activeDraftMap.forEach((text, promptId) => {
      obj[promptId] = text
    })
    return obj
  }, [activeDraftMap])

  const debouncedDraftObj = useDebounce(activeDraftObj, 2000)

  // Auto-save: run when debounced value changes
  const autoSaveCircleId = useRef(activeCircleId)
  autoSaveCircleId.current = activeCircleId

  useEffect(() => {
    if (!promptsData || promptsData.length === 0) return
    if (!debouncedDraftObj || Object.keys(debouncedDraftObj).length === 0) return

    const circleId = autoSaveCircleId.current

    // Check if anything differs from server data
    const serverResponses = submissionData?.responses ?? []
    const changedPrompts: Array<{ promptId: string; text: string }> = []

    for (const [promptId, text] of Object.entries(debouncedDraftObj)) {
      const serverResponse = serverResponses.find((r) => r.promptId === promptId)
      const serverText = serverResponse?.text ?? ''
      if (text !== serverText) {
        changedPrompts.push({ promptId, text })
      }
    }

    if (changedPrompts.length === 0) return

    const doSave = async () => {
      setSaveStatus('saving')

      try {
        let submissionId = submissionData?._id

        if (!submissionId) {
          submissionId = await createSubmission({
            circleId: circleId as Id<'circles'>,
            cycleId,
          })
        }

        await Promise.all(
          changedPrompts.map(({ promptId, text }) =>
            updateResponse({
              submissionId: submissionId as Id<'submissions'>,
              promptId: promptId as Id<'prompts'>,
              text,
            })
          )
        )

        setSaveStatus('saved')
        setLastSaved(new Date())

        const totalPrompts = promptsData.length
        const answeredPrompts = Object.values(debouncedDraftObj).filter(
          (t) => t.trim().length > 0
        ).length

        try {
          trackEvent('submission_saved_draft', {
            circle_id: circleId,
            cycle_id: cycleId,
            prompts_answered: answeredPrompts,
            total_prompts: totalPrompts,
          })
          if (answeredPrompts === totalPrompts && totalPrompts > 0) {
            trackEvent('submission_completed', {
              circle_id: circleId,
              cycle_id: cycleId,
            })
          }
        } catch {}

        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
      } catch {
        setSaveStatus('error')
      }
    }

    doSave()
    // We intentionally only re-run when debouncedDraftObj changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraftObj])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  // Handler: text change for a prompt
  const handleValueChange = useCallback((circleId: string, promptId: string, value: string) => {
    setDraftTexts((prev) => {
      const next = new Map(prev)
      const circleMap = new Map(next.get(circleId) ?? [])
      circleMap.set(promptId, value)
      next.set(circleId, circleMap)
      return next
    })
  }, [])

  // Handler: media upload complete (media is saved immediately)
  const handleMediaUpload = useCallback(
    (_mediaId: unknown, type: 'image' | 'video') => {
      setSaveStatus('saved')
      setLastSaved(new Date())
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
      try {
        trackEvent(type === 'video' ? 'submission_video_added' : 'submission_photo_added', {
          circle_id: activeCircleId,
          cycle_id: cycleId,
        })
      } catch {}
    },
    [activeCircleId, cycleId]
  )

  // Handler: remove media from a response
  const handleMediaRemove = useCallback(
    async (mediaId: Id<'media'>) => {
      try {
        await removeMedia({ mediaId })
        setSaveStatus('saved')
        setLastSaved(new Date())
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
      } catch {
        setSaveStatus('error')
      }
    },
    [removeMedia]
  )

  // Compute progress for active circle
  const circleProgress = useMemo(() => {
    const prompts = promptsData ?? []
    if (prompts.length === 0) return undefined
    const draftMap = draftTexts.get(activeCircleId) ?? new Map<string, string>()
    const answered = prompts.filter((p) => (draftMap.get(p._id) ?? '').trim().length > 0).length
    return answered / prompts.length
  }, [promptsData, draftTexts, activeCircleId])

  // Build circles with computed progress
  const circlesWithProgress = useMemo(
    () =>
      circles.map((c) =>
        c.id === activeCircleId && circleProgress !== undefined
          ? { ...c, progress: circleProgress }
          : c
      ),
    [circles, activeCircleId, circleProgress]
  )

  const isDisabled =
    deadlineIsPast || activeCircle?.status === 'locked' || activeCircle?.status === 'submitted'

  const isLoading = submissionData === undefined || promptsData === undefined

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-end gap-3 px-4 py-2 border-b border-border/50">
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        <DeadlineCountdown deadlineTimestamp={deadlineTimestamp} />
      </div>

      {/* Locked banner */}
      {deadlineIsPast && (
        <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2.5">
          <Lock className="size-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Submissions are locked for this cycle.
          </p>
        </div>
      )}

      {/* Tabs */}
      <CircleSubmissionTabs
        circles={circlesWithProgress}
        activeCircleId={activeCircleId}
        onCircleChange={setActiveCircleId}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissionData === null && promptsData !== undefined && promptsData.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No prompts available for this circle.
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {(promptsData ?? []).map((prompt) => {
              const serverResponse = submissionData?.responses.find(
                (r) => r.promptId === prompt._id
              )
              const responseId =
                serverResponse?._id ?? (`temp-${prompt._id}` as unknown as Id<'responses'>)
              const draftValue =
                draftTexts.get(activeCircleId)?.get(prompt._id) ?? serverResponse?.text ?? ''
              const existingMedia = (serverResponse?.media ?? [])
                .filter((m) => m.url !== null)
                .map((m) => ({
                  _id: m._id,
                  type: m.type as 'image' | 'video',
                  url: m.url as string,
                  thumbnailUrl: m.thumbnailUrl,
                }))

              return (
                <PromptResponseCard
                  key={prompt._id}
                  promptId={prompt._id}
                  promptText={prompt.text}
                  responseId={responseId}
                  initialValue={draftValue}
                  existingMedia={existingMedia}
                  onValueChange={(value) => handleValueChange(activeCircleId, prompt._id, value)}
                  onMediaUpload={handleMediaUpload}
                  onMediaRemove={isDisabled ? undefined : handleMediaRemove}
                  disabled={isDisabled}
                />
              )
            })}
          </div>
        )}
      </CircleSubmissionTabs>

      {/* Submit footer */}
      {!deadlineIsPast && !isLoading && (
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
          {activeCircle?.status === 'submitted' ? (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
              <Check className="size-4" />
              Submitted
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!submissionData?._id || isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
