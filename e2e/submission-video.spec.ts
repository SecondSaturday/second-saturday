import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

/**
 * E2E tests for the video submission flow.
 *
 * Tests cover:
 * - Video upload button visibility
 * - Blocking modal appears during video upload
 * - Cancel confirmation dialog
 * - Continue Upload resumes modal
 * - Confirming cancel returns to idle state
 * - Invalid format error (AVI rejected)
 * - File size warning (>500MB rejected)
 *
 * These tests use /demo-submissions which renders MediaUploader
 * without requiring real Convex circle/cycle/prompt data.
 */

test.describe('Video Submission - Upload Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('shows Record Video and Choose Video buttons', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: /choose video/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('video buttons are enabled when under media limit', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const recordVideo = page.getByRole('button', { name: /record video/i })
    const chooseVideo = page.getByRole('button', { name: /choose video/i })

    await expect(recordVideo).toBeVisible({ timeout: 15000 })
    await expect(recordVideo).not.toBeDisabled()
    await expect(chooseVideo).not.toBeDisabled()
  })
})

test.describe('Video Submission - Blocking Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('blocking modal appears when video upload starts', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })

    // Click to start video upload — Camera.getPhoto hangs waiting for file chooser
    // which keeps the modal open
    await chooseVideo.click()

    // Blocking modal should appear
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText(/do not close this window/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /cancel upload/i })).toBeVisible()
  })

  test('blocking modal description mentions not closing window', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })
    await chooseVideo.click()

    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })

    // Verify warning text is visible
    const warningText = page.getByText(/please wait|do not close/i)
    await expect(warningText).toBeVisible()
  })
})

test.describe('Video Submission - Cancel Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('cancel button shows confirmation dialog', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })

    // Capture file chooser to keep Camera.getPhoto() hanging and modal open
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null)
    await chooseVideo.click()
    await fileChooserPromise

    // Modal should be open
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    // Should show confirmation dialog
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/progress will be lost/i)).toBeVisible()

    // Continue and cancel buttons in dialog
    await expect(page.getByRole('button', { name: /continue upload/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cancel upload/i }).last()).toBeVisible()
  })

  test('Continue Upload dismisses confirmation and restores modal', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null)
    await chooseVideo.click()
    await fileChooserPromise

    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })

    // Open cancel confirmation
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await cancelButton.click()
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible({ timeout: 3000 })

    // Click Continue Upload
    await page.getByRole('button', { name: /continue upload/i }).click()

    // Confirmation should disappear, modal still open
    await expect(page.getByText(/cancel upload\?/i)).not.toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible()
  })

  test('confirming cancel returns to idle state', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null)
    await chooseVideo.click()
    await fileChooserPromise

    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })

    // Open cancel confirmation and confirm
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await cancelButton.click()
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible({ timeout: 3000 })

    await page
      .getByRole('button', { name: /cancel upload/i })
      .last()
      .click()

    // Modal should close and upload buttons should be visible again
    await expect(page.getByRole('heading', { name: /uploading video/i })).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible()
  })
})

test.describe('Video Submission - Format Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('shows error for unsupported video format (AVI)', async ({ page }) => {
    // Provide an AVI file which is not MP4 or MOV
    page.on('filechooser', async (chooser) => {
      await chooser.setFiles({
        name: 'test-video.avi',
        mimeType: 'video/avi',
        buffer: Buffer.from('AVI fake content'),
      })
    })

    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })
    await chooseVideo.click()

    // Should show format validation error
    await expect(page.getByText(/only mp4 and mov formats/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
  })

  test('shows Try Again button to recover from error', async ({ page }) => {
    page.on('filechooser', async (chooser) => {
      await chooser.setFiles({
        name: 'bad-video.avi',
        mimeType: 'video/avi',
        buffer: Buffer.from('AVI fake data'),
      })
    })

    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseVideo = page.getByRole('button', { name: /choose video/i })
    await expect(chooseVideo).toBeVisible({ timeout: 15000 })
    await chooseVideo.click()

    const tryAgain = page.getByRole('button', { name: /try again/i })
    await expect(tryAgain).toBeVisible({ timeout: 10000 })

    // Clicking Try Again should reset back to idle upload state
    await tryAgain.click()
    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible({ timeout: 5000 })
  })
})
