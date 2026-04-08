export async function extractVideoThumbnail(file: File, maxWidth = 640): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    const timeout = setTimeout(() => {
      cleanup()
      resolve(null)
    }, 5000)

    const cleanup = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      video.remove()
    }

    video.addEventListener('error', () => {
      cleanup()
      resolve(null)
    })

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(0.5, video.duration || 0)
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve(null)
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            cleanup()
            resolve(blob)
          },
          'image/jpeg',
          0.7
        )
      } catch {
        cleanup()
        resolve(null)
      }
    })

    video.load()
  })
}
