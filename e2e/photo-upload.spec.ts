import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Photo Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Clerk authentication for each test
    await setupClerkTestingToken({ page })
  })

  test('displays photo upload buttons', async ({ page }) => {
    // Navigate to a page with PromptResponseCard (adjust URL as needed)
    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    // Check for "Take Photo" button
    const takePhotoButton = page.getByRole('button', { name: /take photo/i })
    await expect(takePhotoButton).toBeVisible()

    // Check for "Choose Photo" button
    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })
    await expect(choosePhotoButton).toBeVisible()
  })

  test('shows upload progress when photo is selected', async ({ page, context }) => {
    // Mock Capacitor Camera API
    await page.addInitScript(() => {
      // @ts-expect-error - mocking Capacitor
      window.Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
      }

      // @ts-expect-error - mocking Camera plugin
      window.Camera = {
        getPhoto: async () => ({
          webPath: 'blob:test-image-url',
          format: 'jpeg',
        }),
      }
    })

    // Grant permissions for file upload
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    // Mock file input for web fallback
    const fileInput = page.locator('input[type="file"]')
    if ((await fileInput.count()) > 0) {
      // Create a test image file
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      await fileInput.setInputFiles({
        name: 'test-photo.png',
        mimeType: 'image/png',
        buffer,
      })
    }

    // Click "Choose Photo" button
    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })
    await choosePhotoButton.click()

    // Wait for progress indicator
    const progressText = page.getByText(/compressing|uploading/i)
    await expect(progressText).toBeVisible({ timeout: 5000 })
  })

  test('enforces maximum media limit', async ({ page }) => {
    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    // Mock scenario where max media is reached
    await page.evaluate(() => {
      // Simulate max media reached by dispatching custom event or state
      const uploader = document.querySelector('[data-testid="media-uploader"]')
      if (uploader) {
        uploader.setAttribute('data-max-reached', 'true')
      }
    })

    // Check that upload buttons are disabled
    const takePhotoButton = page.getByRole('button', { name: /take photo/i })
    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })

    // Buttons should be disabled when max is reached
    await expect(takePhotoButton).toBeDisabled()
    await expect(choosePhotoButton).toBeDisabled()

    // Should show max reached message
    const maxMessage = page.getByText(/maximum.*media.*reached/i)
    await expect(maxMessage).toBeVisible()
  })

  test('displays error message on upload failure', async ({ page }) => {
    // Mock Capacitor Camera to simulate error
    await page.addInitScript(() => {
      // @ts-expect-error - mocking Camera plugin
      window.Camera = {
        getPhoto: async () => {
          throw new Error('Permission denied')
        },
      }
    })

    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })
    await choosePhotoButton.click()

    // Should display error message
    const errorMessage = page.getByText(/permission denied|failed/i)
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Should have "Try Again" button
    const tryAgainButton = page.getByRole('button', { name: /try again/i })
    await expect(tryAgainButton).toBeVisible()
  })

  test('allows canceling upload in progress', async ({ page }) => {
    // Mock slow upload to test cancel functionality
    await page.addInitScript(() => {
      // @ts-expect-error - mocking fetch for slow upload
      const originalFetch = window.fetch
      window.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('upload')) {
          // Simulate slow upload
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
        return originalFetch(url, options)
      }
    })

    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })
    await choosePhotoButton.click()

    // Wait for upload to start
    await page.waitForSelector('[aria-label="Cancel upload"]', { timeout: 2000 })

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await cancelButton.click()

    // Upload should be cancelled and UI should reset
    await expect(choosePhotoButton).toBeVisible({ timeout: 3000 })
  })

  test('handles permission denial gracefully', async ({ page }) => {
    // Mock permission denial
    await page.addInitScript(() => {
      // @ts-expect-error - mocking Camera plugin
      window.Camera = {
        getPhoto: async () => {
          throw new Error('Camera permission denied')
        },
      }
    })

    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    const takePhotoButton = page.getByRole('button', { name: /take photo/i })
    await takePhotoButton.click()

    // Should show permission error message
    const permissionError = page.getByText(/permission denied|enable camera access/i)
    await expect(permissionError).toBeVisible({ timeout: 5000 })
  })

  test('validates file format (JPEG/PNG only)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    // Mock file input with unsupported format
    const fileInput = page.locator('input[type="file"]')
    if ((await fileInput.count()) > 0) {
      // Try to upload a non-image file
      const buffer = Buffer.from('fake file content')
      await fileInput.setInputFiles({
        name: 'test-file.txt',
        mimeType: 'text/plain',
        buffer,
      })

      // Should show format error
      const formatError = page.getByText(/only.*jpeg.*png/i)
      await expect(formatError).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Photo Upload - Compression', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('compresses large images before upload', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    // Mock a large image file (>1MB)
    const fileInput = page.locator('input[type="file"]')
    if ((await fileInput.count()) > 0) {
      // Create a larger mock image
      const largeBuffer = Buffer.alloc(1024 * 1024 * 2) // 2MB
      await fileInput.setInputFiles({
        name: 'large-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer,
      })

      // Should show "Compressing image..." stage
      const compressingText = page.getByText(/compressing image/i)
      await expect(compressingText).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Photo Upload - User Cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('handles user cancelling photo selection', async ({ page }) => {
    // Mock user cancellation
    await page.addInitScript(() => {
      // @ts-expect-error - mocking Camera plugin
      window.Camera = {
        getPhoto: async () => {
          throw new Error('User cancelled photos app')
        },
      }
    })

    await page.goto('/submissions/test', { waitUntil: 'domcontentloaded' })

    const choosePhotoButton = page.getByRole('button', { name: /choose photo/i })
    await choosePhotoButton.click()

    // Should reset silently without showing error
    await expect(choosePhotoButton).toBeVisible({ timeout: 3000 })

    // Should NOT show error message for user cancellation
    const errorMessage = page.getByText(/failed|error/i)
    await expect(errorMessage).not.toBeVisible()
  })
})
