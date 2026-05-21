import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Detection } from '../types/detection.types'
import BoundingBox from './BoundingBox'

type Props = {
  imageSrc: string | null
  detections: Detection[]
  onSize?: (w: number, h: number) => void
}

export default function DetectionCanvas({ imageSrc, detections, onSize }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [natural, setNatural] = useState<{w:number,h:number}|null>(null)

  useEffect(() => {
    if (!imgRef.current) return
    const img = imgRef.current
    const handleLoad = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
      if (onSize) onSize(img.naturalWidth, img.naturalHeight)
    }
    img.addEventListener('load', handleLoad)
    if (img.complete) handleLoad()
    return () => img.removeEventListener('load', handleLoad)
  }, [imageSrc, onSize])

  return (
    <div ref={containerRef} className="relative w-full h-96 rounded-2xl overflow-hidden bg-black/20">
      {imageSrc ? (
        <div className="w-full h-full relative">
          <img ref={imgRef} src={imageSrc} alt="scan" className="w-full h-full object-contain" />
          <AnimatePresence>
            {natural && (
              <BoundingBox
                key={imageSrc}
                containerRef={containerRef}
                naturalSize={natural}
                detections={detections}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60">No image selected</div>
      )}
    </div>
  )
}
