import { useCallback, useMemo, useState } from 'react'
import { detectImage } from '../services/pastaAI.service'
import type { Detection } from '../types/detection.types'

export function usePastaDetection() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(false)
  const [processingTime, setProcessingTime] = useState<number | null>(null)

  const upload = useCallback(async (file: File) => {
    setLoading(true)
    setDetections([])
    const preview = URL.createObjectURL(file)
    setImageSrc(preview)
    const t0 = performance.now()
    try {
      const res = await detectImage(file, false)
      const t1 = performance.now()
      setProcessingTime((t1 - t0) / 1000)
      if (res && res.detections) {
        setDetections(res.detections)
      }
    } catch (e) {
      console.error('[PastaDetection] Detect error', e)
      setDetections([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setImageSrc(null)
    setDetections([])
    setProcessingTime(null)
  }, [])

  return useMemo(() => ({ imageSrc, detections, loading, processingTime, upload, clear }), [imageSrc, detections, loading, processingTime, upload, clear])
}
