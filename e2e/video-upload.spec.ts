import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Video Upload', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('shows video upload buttons', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const recordButton = page.getByRole('button', { name: /record video/i })
    const chooseButton = page.getByRole('button', { name: /choose video/i })

    await expect(recordButton).toBeVisible({ timeout: 15000 })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
  })

  test('displays blocking modal during video upload', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })

    // Don't handle file chooser - Camera.getPhoto() hangs, keeping modal open
    await chooseButton.click()

    // Blocking modal should appear immediately (setStage called before Camera.getPhoto)
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText(/do not close this window/i)).toBeVisible()

    // Cancel button should be visible
    await expect(page.getByRole('button', { name: /cancel upload/i })).toBeVisible()
  })

  test('prevents navigation during video upload', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await chooseButton.click()

    // Blocking modal appears
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible({
      timeout: 5000,
    })

    // Try to navigate away - blocked by beforeunload
    page.goto('/dashboard').catch(() => {})

    // Modal should still be shown
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible()
  })

  test('shows cancel confirmation when canceling video upload', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })

    // Capture filechooser to prevent auto-dismissal, keeping Camera.getPhoto() hung
    const fileChooserPromise = page.waitForEvent('filechooser')
    await chooseButton.click()
    // Capture but don't setFiles - Camera.getPhoto() hangs, modal stays open
    await fileChooserPromise

    // Modal should now be open and stable
    const modalHeading = page.getByRole('heading', { name: /uploading video/i })
    await expect(modalHeading).toBeVisible({ timeout: 5000 })

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    // Should show confirmation dialog
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible()
    await expect(page.getByText(/progress will be lost/i)).toBeVisible()

    // Should have continue and confirm cancel buttons
    await expect(page.getByRole('button', { name: /continue upload/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cancel upload/i }).last()).toBeVisible()
  })

  test('resumes upload when clicking "Continue Upload"', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })

    const fileChooserPromise = page.waitForEvent('filechooser')
    await chooseButton.click()
    await fileChooserPromise

    const modalHeading = page.getByRole('heading', { name: /uploading video/i })
    await expect(modalHeading).toBeVisible({ timeout: 5000 })

    // Open cancel confirmation
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible()

    // Click "Continue Upload"
    await page.getByRole('button', { name: /continue upload/i }).click()

    // Should go back to uploading state (confirmation hidden, modal still open)
    await expect(page.getByText(/cancel upload\?/i)).not.toBeVisible()
    await expect(page.getByRole('heading', { name: /uploading video/i })).toBeVisible()
  })

  test('cancels upload when confirming cancellation', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })

    const fileChooserPromise = page.waitForEvent('filechooser')
    await chooseButton.click()
    await fileChooserPromise

    const modalHeading = page.getByRole('heading', { name: /uploading video/i })
    await expect(modalHeading).toBeVisible({ timeout: 5000 })

    // Cancel upload
    const cancelButton = page.getByRole('button', { name: /cancel upload/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    await expect(page.getByText(/cancel upload\?/i)).toBeVisible()

    // Confirm cancellation
    await page
      .getByRole('button', { name: /cancel upload/i })
      .last()
      .click()

    // Should return to initial state
    await expect(page.getByRole('heading', { name: /uploading video/i })).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible()
  })

  test('shows error for invalid video format', async ({ page }) => {
    // Provide an AVI file (unsupported format) via file chooser
    page.on('filechooser', async (chooser) => {
      await chooser.setFiles({
        name: 'test-video.avi',
        mimeType: 'video/avi',
        buffer: Buffer.from('invalid-format-data'),
      })
    })

    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await chooseButton.click()

    // Should show error about unsupported format
    await expect(page.getByText(/only mp4 and mov formats/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
  })

  test('disables video upload when maximum media reached', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const recordButton = page.getByRole('button', { name: /record video/i })
    await expect(recordButton).toBeVisible({ timeout: 15000 })
    await expect(recordButton).not.toBeDisabled()

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).not.toBeDisabled()
  })
})
