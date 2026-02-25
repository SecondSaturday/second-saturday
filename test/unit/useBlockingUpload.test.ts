import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBlockingUpload } from '@/hooks/useBlockingUpload'

describe('useBlockingUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useBlockingUpload())

    expect(result.current.stage).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.isBlocking).toBe(false)
    expect(result.current.abortController).toBeNull()
  })

  it('creates abort controller', () => {
    const { result } = renderHook(() => useBlockingUpload())

    let controller: AbortController | null = null
    act(() => {
      controller = result.current.createAbortController()
    })

    expect(controller).toBeInstanceOf(AbortController)
    expect(result.current.abortController).toBeInstanceOf(AbortController)
  })

  it('updates stage', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
    })

    expect(result.current.stage).toBe('uploading')
  })

  it('updates progress', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setProgress(50)
    })

    expect(result.current.progress).toBe(50)
  })

  it('updates error', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setError('Upload failed')
    })

    expect(result.current.error).toBe('Upload failed')
  })

  it('isBlocking is true for active stages', () => {
    const { result } = renderHook(() => useBlockingUpload())

    const blockingStages = ['selecting', 'compressing', 'uploading', 'processing'] as const

    for (const stage of blockingStages) {
      act(() => {
        result.current.setStage(stage)
      })
      expect(result.current.isBlocking).toBe(true)
    }
  })

  it('isBlocking is false for idle, complete, and error stages', () => {
    const { result } = renderHook(() => useBlockingUpload())

    const nonBlockingStages = ['idle', 'complete', 'error'] as const

    for (const stage of nonBlockingStages) {
      act(() => {
        result.current.setStage(stage)
      })
      expect(result.current.isBlocking).toBe(false)
    }
  })

  it('adds beforeunload listener when blocking', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
    })

    expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('removes beforeunload listener when not blocking', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
    })

    act(() => {
      result.current.setStage('idle')
    })

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('resets all state', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
      result.current.setProgress(75)
      result.current.setError('Some error')
      result.current.createAbortController()
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.stage).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.abortController).toBeNull()
  })

  it('cancels upload and resets state', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
      result.current.setProgress(50)
      const controller = result.current.createAbortController()
      vi.spyOn(controller, 'abort')
    })

    const controllerSpy = result.current.abortController
    if (controllerSpy) {
      vi.spyOn(controllerSpy, 'abort')
    }

    act(() => {
      result.current.cancel()
    })

    expect(controllerSpy?.abort).toHaveBeenCalled()
    expect(result.current.stage).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.abortController).toBeNull()
  })

  it('calls onCancel when cancel is invoked', () => {
    const onCancel = vi.fn()
    const { result } = renderHook(() => useBlockingUpload({ onCancel }))

    act(() => {
      result.current.cancel()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete when stage becomes complete', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useBlockingUpload({ onComplete }))

    act(() => {
      result.current.setStage('complete')
    })

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  it('auto-resets after complete stage', async () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('complete')
    })

    await waitFor(
      () => {
        expect(result.current.stage).toBe('idle')
      },
      { timeout: 2000 }
    )
  })

  it('calls onError when stage is error', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useBlockingUpload({ onError }))

    act(() => {
      result.current.setError('Test error')
      result.current.setStage('error')
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Test error')
    })
  })

  it('replaces existing abort controller when creating new one', () => {
    const { result } = renderHook(() => useBlockingUpload())

    let firstController: AbortController | null = null
    act(() => {
      firstController = result.current.createAbortController()
      vi.spyOn(firstController, 'abort')
    })

    act(() => {
      const secondController = result.current.createAbortController()
      expect(secondController).not.toBe(firstController)
      expect(firstController?.abort).toHaveBeenCalled()
    })
  })

  it('aborts controller on unmount', () => {
    const { result, unmount } = renderHook(() => useBlockingUpload())

    let abortSpy: ReturnType<typeof vi.spyOn> | undefined
    act(() => {
      const controller = result.current.createAbortController()
      abortSpy = vi.spyOn(controller, 'abort')
    })

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  it('prevents navigation with beforeunload event', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('uploading')
    })

    // Simulate beforeunload event
    const event = new Event('beforeunload') as BeforeUnloadEvent
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: '',
    })

    vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.returnValue).toBe('')
  })

  it('does not interfere with navigation when not blocking', () => {
    const { result } = renderHook(() => useBlockingUpload())

    act(() => {
      result.current.setStage('idle')
    })

    const event = new Event('beforeunload') as BeforeUnloadEvent
    vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    // Should not prevent default when not blocking
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
