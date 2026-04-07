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
import { CircleRow } from '@/components/submissions/CircleRow'
import { SnapScrollCards } from '@/components/submissions/SnapScrollCards'
import type { Circle, SaveStatus } from '@/components/submissions'
import { useDebounce } from '@/hooks/useDebounce'
import { useDeadlineCountdown } from '@/hooks/useDeadlineCountdown'
import { getSecondSaturdayDeadline } from '@/lib/dates'
import { trackEvent } from '@/lib/analytics'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MultiCircleSubmissionScreenProps {
  circles: Circle[]
  cycleId: string
  variant?: 'legacy' | 'redesign'
  activeCircleId?: string
  onCircleChange?: (circleId: string) => void
  onAnswerStateChange?: (hasAnswers: boolean) => void
}

function getDeadlineTimestamp(): number {
  const now = new Date()
  const deadline = getSecondSaturdayDeadline(now)
  if (now.getTime() > deadline.getTime()) {
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    return getSecondSaturdayDeadline(nextMonth).getTime()
  }
  return deadline.getTime()
}

export function MultiCircleSubmissionScreen({
  circles,
  cycleId,
  variant = 'legacy',
  activeCircleId: controlledCircleId,
  onCircleChange: controlledOnChange,
  onAnswerStateChange,
}: MultiCircleSubmissionScreenProps) {
  const router = useRouter()
  const [internalCircleId, setInternalCircleId] = useState<string>(circles[0]?.id ?? '')
  const activeCircleId = controlledCircleId ?? internalCircleId
  const setActiveCircleId = controlledOnChange ?? setInternalCircleId
  const [draftTexts, setDraftTexts] = useState<Map<string, Map<string, string>>>(new Map())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLockedRef = useRef(false)

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
    isLockedRef.current = true
    try {
      // Flush any pending draft text before locking
      if (promptsData) {
        const currentDrafts = draftTexts.get(activeCircleId)
        if (currentDrafts) {
          const serverResponses = submissionData.responses ?? []
          const pendingChanges: Array<{ promptId: string; text: string }> = []
          currentDrafts.forEach((text, promptId) => {
            const serverText = serverResponses.find((r) => r.promptId === promptId)?.text ?? ''
            if (text !== serverText) {
              pendingChanges.push({ promptId, text })
            }
          })
          if (pendingChanges.length > 0) {
            setSaveStatus('saving')
            await Promise.all(
              pendingChanges.map(({ promptId, text }) =>
                updateResponse({
                  submissionId: submissionData._id,
                  promptId: promptId as Id<'prompts'>,
                  text,
                })
              )
            )
          }
        }
      }

      await lockSubmission({ submissionId: submissionData._id })
      try {
        trackEvent('submission_locked', { circle_id: activeCircleId, cycle_id: cycleId })
      } catch {}
      toast.success('Submission locked! See you on newsletter day.')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    submissionData,
    isSubmitting,
    lockSubmission,
    activeCircleId,
    cycleId,
    promptsData,
    draftTexts,
    updateResponse,
  ])

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
    // Guard against race with submission lock
    if (isLockedRef.current) return

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

  // Handler: switch circle with flush-save
  const handleCircleSwitch = useCallback(
    async (newCircleId: string) => {
      if (newCircleId === activeCircleId) return

      // Flush pending text for current circle
      const currentDrafts = draftTexts.get(activeCircleId)
      if (currentDrafts && submissionData) {
        const serverResponses = submissionData.responses ?? []
        const pendingChanges: Array<{ promptId: string; text: string }> = []
        currentDrafts.forEach((text, promptId) => {
          const serverText = serverResponses.find((r) => r.promptId === promptId)?.text ?? ''
          if (text !== serverText) {
            pendingChanges.push({ promptId, text })
          }
        })
        if (pendingChanges.length > 0) {
          setSaveStatus('saving')
          try {
            await Promise.all(
              pendingChanges.map(({ promptId, text }) =>
                updateResponse({
                  submissionId: submissionData._id,
                  promptId: promptId as Id<'prompts'>,
                  text,
                })
              )
            )
            setSaveStatus('saved')
            setLastSaved(new Date())
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
            savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
          } catch {
            setSaveStatus('error')
          }
        }
      }

      setActiveCircleId(newCircleId)
    },
    [activeCircleId, draftTexts, submissionData, updateResponse]
  )

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

  // Handler: ensure a response exists before media upload (on-demand creation)
  const handleEnsureResponse = useCallback(
    async (promptId: string) => {
      // If response already exists, nothing to do
      const serverResponse = submissionData?.responses.find((r) => r.promptId === promptId)
      if (serverResponse?._id) return

      // Create submission if needed, then create empty response
      let submissionId = submissionData?._id
      if (!submissionId) {
        submissionId = await createSubmission({
          circleId: activeCircleId as Id<'circles'>,
          cycleId,
        })
      }
      await updateResponse({
        submissionId: submissionId as Id<'submissions'>,
        promptId: promptId as Id<'prompts'>,
        text: '',
      })
    },
    [submissionData, activeCircleId, cycleId, createSubmission, updateResponse]
  )

  // Compute progress for active circle
  const circleProgress = useMemo(() => {
    const prompts = promptsData ?? []
    if (prompts.length === 0) return undefined
    const draftMap = draftTexts.get(activeCircleId) ?? new Map<string, string>()
    const answered = prompts.filter((p) => (draftMap.get(p._id) ?? '').trim().length > 0).length
    return answered / prompts.length
  }, [promptsData, draftTexts, activeCircleId])

  // Report answer state to parent
  const hasAnswers = (circleProgress ?? 0) > 0
  useEffect(() => {
    onAnswerStateChange?.(hasAnswers)
  }, [hasAnswers, onAnswerStateChange])

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

  const isDisabled = activeCircle?.status === 'locked' || activeCircle?.status === 'submitted'

  const isLoading = submissionData === undefined || promptsData === undefined

  const prompts = promptsData ?? []
  const totalPrompts = prompts.length

  function renderPromptCards(cardVariant: 'legacy' | 'card') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (submissionData === null && promptsData !== undefined && promptsData.length === 0) {
      return (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No prompts available for this circle.
        </div>
      )
    }
    return prompts.map((prompt, index) => {
      const serverResponse = submissionData?.responses.find((r) => r.promptId === prompt._id)
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
          promptLabel={
            cardVariant === 'card' ? `Prompt ${index + 1} of ${totalPrompts}` : undefined
          }
          responseId={serverResponse?._id}
          initialValue={draftValue}
          existingMedia={existingMedia}
          onValueChange={(value) => handleValueChange(activeCircleId, prompt._id, value)}
          onMediaUpload={handleMediaUpload}
          onMediaRemove={isDisabled ? undefined : handleMediaRemove}
          onEnsureResponse={() => handleEnsureResponse(prompt._id)}
          disabled={isDisabled}
          variant={cardVariant}
        />
      )
    })
  }

  if (variant === 'redesign') {
    const cards = renderPromptCards('card')
    const isCardArray = Array.isArray(cards)

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile circle row */}
        <div className="md:hidden">
          <CircleRow
            circles={circles}
            activeCircleId={activeCircleId}
            onCircleChange={handleCircleSwitch}
          />
        </div>

        {/* Late submission note */}
        {deadlineIsPast && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              The deadline for this cycle has passed. Your submission will be included in next
              month&apos;s newsletter.
            </p>
          </div>
        )}

        {/* Snap-scroll prompt cards + dots */}
        <SnapScrollCards
          cards={isCardArray ? cards : [cards]}
          cardKeys={isCardArray ? prompts.map((p) => p._id) : ['empty']}
          totalPrompts={totalPrompts}
        />
      </div>
    )
  }

  // Legacy layout
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-end gap-3 border-b border-border/50 px-4 py-2">
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        <DeadlineCountdown deadlineTimestamp={deadlineTimestamp} />
      </div>

      {/* Late submission info note */}
      {deadlineIsPast && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
          <Lock className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            The deadline for this cycle has passed. Your submission will be included in next
            month&apos;s newsletter.
          </p>
        </div>
      )}

      {/* Tabs - scrollable area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <CircleSubmissionTabs
          circles={circlesWithProgress}
          activeCircleId={activeCircleId}
          onCircleChange={setActiveCircleId}
        >
          <div className="flex flex-col gap-4 p-4">{renderPromptCards('legacy')}</div>
        </CircleSubmissionTabs>
      </div>

      {/* Submit footer */}
      {!isLoading && (
        <div className="safe-area-bottom shrink-0 border-t border-border bg-background px-4 py-3">
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
