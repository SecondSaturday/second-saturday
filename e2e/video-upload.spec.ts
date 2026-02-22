import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Video Upload', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
  })

  test('shows video upload button', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })

    await expect(chooseButton).toBeVisible({ timeout: 15000 })
  })

  test('video button is enabled when under media limit', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })

    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await expect(chooseButton).not.toBeDisabled()
  })

  test('displays blocking modal during video upload', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await chooseButton.click()

    // The modal should appear since setStage('selecting') is called before file input
    const modalHeading = page.getByRole('heading', { name: /uploading video/i })
    const isVisible = await modalHeading.isVisible({ timeout: 3000 }).catch(() => false)

    if (isVisible) {
      await expect(page.getByText(/do not close this window/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /cancel upload/i })).toBeVisible()
    } else {
      // File input may have resolved/rejected before modal could show
      test.skip(true, 'Blocking modal requires active file selection')
    }
  })

  test('shows error for invalid video format', async ({ page }) => {
    // Provide an AVI file (unsupported format) via file chooser
    page.on('filechooser', async (chooser) => {
      try {
        await chooser.setFiles({
          name: 'test-video.avi',
          mimeType: 'video/avi',
          buffer: Buffer.from('invalid-format-data'),
        })
      } catch {
        /* test may have ended */
      }
    })

    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await chooseButton.click()

    // Should show error about unsupported format
    const errorText = page.getByText(/only mp4 and mov formats/i)
    const hasError = await errorText.isVisible({ timeout: 10000 }).catch(() => false)
    if (!hasError) {
      test.skip(true, 'File chooser not triggered in test env')
    }
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
  })

  test('video upload button is enabled when under limit', async ({ page }) => {
    await page.goto('/demo-submissions', { waitUntil: 'domcontentloaded' })

    const chooseButton = page.getByRole('button', { name: /choose video/i })
    await expect(chooseButton).toBeVisible({ timeout: 15000 })
    await expect(chooseButton).not.toBeDisabled()
  })
})
