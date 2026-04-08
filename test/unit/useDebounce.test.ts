import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('updates to new value after the delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    rerender({ value: 'updated', delay: 500 })

    // Value should not have changed yet
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('does not update before the delay expires', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 1000 },
    })

    rerender({ value: 'updated', delay: 1000 })

    act(() => {
      vi.advanceTimersByTime(999)
    })

    expect(result.current).toBe('initial')
  })

  it('resets the timer when value changes rapidly (debounce behaviour)', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    rerender({ value: 'first', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should still be initial — timer reset on next change
    expect(result.current).toBe('initial')

    rerender({ value: 'second', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // 300ms elapsed since 'second' — still not 500ms
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Now 500ms elapsed since 'second'
    expect(result.current).toBe('second')
  })

  it('cleans up the timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { rerender, unmount } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    rerender({ value: 'updated', delay: 500 })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('does not update the debounced value after unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    rerender({ value: 'updated', delay: 500 })
    unmount()

    // Advance time past the delay — should not throw or cause updates
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // The last snapshot of result should still be the pre-unmount value
    expect(result.current).toBe('initial')
  })

  it('works with a short delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 100 },
    })

    rerender({ value: 42, delay: 100 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(42)
  })

  it('works with a long delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 5000 },
    })

    rerender({ value: 'b', delay: 5000 })

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('works with object values', () => {
    const initialObj = { key: 'initial' }
    const updatedObj = { key: 'updated' }

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialObj, delay: 300 },
    })

    expect(result.current).toBe(initialObj)

    rerender({ value: updatedObj, delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe(updatedObj)
  })
})
