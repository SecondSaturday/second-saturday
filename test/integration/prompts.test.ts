/**
 * Integration tests for prompt business logic.
 *
 * Tests the validation rules and logic from convex/prompts.ts
 * in isolation.
 */
import { describe, it, expect } from 'vitest'

// Replicate validation logic from convex/prompts.ts

function validateUpdatePrompts(prompts: Array<{ text: string; order: number; id?: string }>): {
  valid: boolean
  error?: string
} {
  if (prompts.length < 1 || prompts.length > 8) {
    return { valid: false, error: 'Must have 1-8 prompts' }
  }
  for (const p of prompts) {
    if (p.text.length > 200) {
      return { valid: false, error: 'Prompt text must be 200 characters or less' }
    }
  }
  // Check for duplicate prompt texts
  const texts = prompts.map((p) => p.text.trim().toLowerCase())
  const uniqueTexts = new Set(texts)
  if (uniqueTexts.size !== texts.length) {
    return { valid: false, error: 'Duplicate prompts are not allowed' }
  }
  return { valid: true }
}

// Simulate the deactivation + reactivation pattern
function processPromptUpdate(
  existing: Array<{ _id: string; text: string; order: number; active: boolean }>,
  incoming: Array<{ text: string; order: number; id?: string }>
) {
  // Step 1: Deactivate all existing
  const deactivated = existing.map((p) => ({ ...p, active: false }))

  // Step 2: Reactivate or create incoming
  const result: Array<{ _id?: string; text: string; order: number; active: boolean }> = []
  for (const p of incoming) {
    if (p.id) {
      // Update existing prompt
      result.push({ _id: p.id, text: p.text, order: p.order, active: true })
    } else {
      // Create new prompt
      result.push({ text: p.text, order: p.order, active: true })
    }
  }

  return { deactivated, result }
}

describe('updatePrompts validation', () => {
  it('accepts 1 prompt', () => {
    expect(validateUpdatePrompts([{ text: 'Hello', order: 0 }])).toEqual({ valid: true })
  })

  it('accepts 8 prompts', () => {
    const prompts = Array.from({ length: 8 }, (_, i) => ({
      text: `Prompt ${i}`,
      order: i,
    }))
    expect(validateUpdatePrompts(prompts)).toEqual({ valid: true })
  })

  it('rejects 0 prompts', () => {
    expect(validateUpdatePrompts([]).valid).toBe(false)
  })

  it('rejects 9 prompts', () => {
    const prompts = Array.from({ length: 9 }, (_, i) => ({
      text: `Prompt ${i}`,
      order: i,
    }))
    expect(validateUpdatePrompts(prompts).valid).toBe(false)
  })

  it('rejects prompt text over 200 chars', () => {
    const result = validateUpdatePrompts([{ text: 'A'.repeat(201), order: 0 }])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('200')
  })

  it('accepts prompt text of exactly 200 chars', () => {
    expect(validateUpdatePrompts([{ text: 'A'.repeat(200), order: 0 }])).toEqual({ valid: true })
  })

  it('validates all prompts, not just first', () => {
    const result = validateUpdatePrompts([
      { text: 'Valid', order: 0 },
      { text: 'A'.repeat(201), order: 1 },
    ])
    expect(result.valid).toBe(false)
  })
})

describe('updatePrompts processing', () => {
  it('deactivates all existing prompts', () => {
    const existing = [
      { _id: 'p1', text: 'Old 1', order: 0, active: true },
      { _id: 'p2', text: 'Old 2', order: 1, active: true },
    ]
    const incoming = [{ text: 'New 1', order: 0 }]

    const { deactivated } = processPromptUpdate(existing, incoming)
    expect(deactivated.every((p) => !p.active)).toBe(true)
  })

  it('creates new prompts for items without id', () => {
    const existing = [{ _id: 'p1', text: 'Old', order: 0, active: true }]
    const incoming = [
      { text: 'Brand New', order: 0 },
      { text: 'Also New', order: 1 },
    ]

    const { result } = processPromptUpdate(existing, incoming)
    expect(result).toHaveLength(2)
    expect(result[0]!._id).toBeUndefined()
    expect(result[0]!.text).toBe('Brand New')
    expect(result[0]!.active).toBe(true)
  })

  it('updates existing prompts when id is provided', () => {
    const existing = [{ _id: 'p1', text: 'Old', order: 0, active: true }]
    const incoming = [{ text: 'Updated', order: 0, id: 'p1' }]

    const { result } = processPromptUpdate(existing, incoming)
    expect(result).toHaveLength(1)
    expect(result[0]!._id).toBe('p1')
    expect(result[0]!.text).toBe('Updated')
    expect(result[0]!.active).toBe(true)
  })

  it('preserves order from incoming prompts', () => {
    const existing = [
      { _id: 'p1', text: 'A', order: 0, active: true },
      { _id: 'p2', text: 'B', order: 1, active: true },
    ]
    const incoming = [
      { text: 'B', order: 0, id: 'p2' },
      { text: 'A', order: 1, id: 'p1' },
    ]

    const { result } = processPromptUpdate(existing, incoming)
    expect(result[0]!.text).toBe('B')
    expect(result[0]!.order).toBe(0)
    expect(result[1]!.text).toBe('A')
    expect(result[1]!.order).toBe(1)
  })

  it('handles mixed new and existing prompts', () => {
    const existing = [{ _id: 'p1', text: 'Keep', order: 0, active: true }]
    const incoming = [
      { text: 'Keep Updated', order: 0, id: 'p1' },
      { text: 'Brand New', order: 1 },
    ]

    const { result } = processPromptUpdate(existing, incoming)
    expect(result).toHaveLength(2)
    expect(result[0]!._id).toBe('p1')
    expect(result[1]!._id).toBeUndefined()
  })
})

describe('updatePrompts duplicate validation', () => {
  it('rejects duplicate prompt texts', () => {
    const result = validateUpdatePrompts([
      { text: 'What did you do?', order: 0 },
      { text: 'What did you do?', order: 1 },
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Duplicate')
  })

  it('rejects case-insensitive duplicates', () => {
    const result = validateUpdatePrompts([
      { text: 'Hello World', order: 0 },
      { text: 'hello world', order: 1 },
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Duplicate')
  })

  it('rejects duplicates with whitespace differences', () => {
    const result = validateUpdatePrompts([
      { text: '  Hello  ', order: 0 },
      { text: 'Hello', order: 1 },
    ])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Duplicate')
  })

  it('accepts unique prompt texts', () => {
    const result = validateUpdatePrompts([
      { text: 'Prompt one', order: 0 },
      { text: 'Prompt two', order: 1 },
    ])
    expect(result.valid).toBe(true)
  })
})

describe('getCirclePrompts logic', () => {
  it('filters to only active prompts', () => {
    const allPrompts = [
      { text: 'Active 1', order: 0, active: true },
      { text: 'Inactive', order: 1, active: false },
      { text: 'Active 2', order: 2, active: true },
    ]
    const active = allPrompts.filter((p) => p.active)
    expect(active).toHaveLength(2)
  })

  it('sorts by order ascending', () => {
    const prompts = [
      { text: 'Third', order: 2, active: true },
      { text: 'First', order: 0, active: true },
      { text: 'Second', order: 1, active: true },
    ]
    const sorted = prompts.filter((p) => p.active).sort((a, b) => a.order - b.order)
    expect(sorted.map((p) => p.text)).toEqual(['First', 'Second', 'Third'])
  })
})

describe('Prompt library constants', () => {
  const PROMPT_LIBRARY: Record<string, string[]> = {
    reflection: ['What did you do this month?', "What's something you learned recently?"],
    fun: ['What are you listening to?', 'Best meal you had this month?'],
    gratitude: ['One Good Thing', 'Who made your month better?'],
    deep: ['On Your Mind', 'What are you looking forward to?'],
  }

  it('has 4 categories', () => {
    expect(Object.keys(PROMPT_LIBRARY)).toHaveLength(4)
  })

  it('has reflection, fun, gratitude, deep categories', () => {
    expect(Object.keys(PROMPT_LIBRARY)).toEqual(
      expect.arrayContaining(['reflection', 'fun', 'gratitude', 'deep'])
    )
  })

  it('each category has at least 2 prompts', () => {
    for (const [, prompts] of Object.entries(PROMPT_LIBRARY)) {
      expect(prompts.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('all prompts are under 200 chars', () => {
    for (const prompts of Object.values(PROMPT_LIBRARY)) {
      for (const text of prompts) {
        expect(text.length).toBeLessThanOrEqual(200)
      }
    }
  })

  it('contains the 4 default prompts', () => {
    const all = Object.values(PROMPT_LIBRARY).flat()
    expect(all).toContain('What did you do this month?')
    expect(all).toContain('One Good Thing')
    expect(all).toContain('On Your Mind')
    expect(all).toContain('What are you listening to?')
  })
})
