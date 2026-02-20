import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock heic2any globally — it uses Worker which is unavailable in jsdom
vi.mock('heic2any', () => ({ default: vi.fn() }))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
