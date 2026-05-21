import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import type { Detection } from '../types/detection.types'

type Props = {
  containerRef: React.RefObject<HTMLElement>
  naturalSize: { w: number, h: number }
  detections: Detection[]
}

export default function BoundingBox({ containerRef, naturalSize, detections }: Props) {
  const [displaySize, setDisplaySize] = useState<{w:number,h:number}>({w:0,h:0})

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setDisplaySize({ w: rect.width, h: rect.height })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  const scaleX = displaySize.w && naturalSize.w ? displaySize.w / naturalSize.w : 1
  const scaleY = displaySize.h && naturalSize.h ? displaySize.h / naturalSize.h : 1

  return (
    <div className="absolute left-0 top-0 pointer-events-none" style={{ width: displaySize.w, height: displaySize.h }}>
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.bbox
        const left = x1 * scaleX
        const top = y1 * scaleY
        const w = (x2 - x1) * scaleX
        const h = (y2 - y1) * scaleY
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.26 }}
            style={{ left, top, width: w, height: h }}
            className="absolute border-2 rounded-md shadow-lg"
          >
            <div className="absolute -top-5 left-0 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-semibold">
              {d.class} • {(d.confidence * 100).toFixed(0)}%
            </div>
            <div className="w-full h-full rounded-md border-2" style={{ boxShadow: '0 6px 18px rgba(0,255,80,0.14)', borderColor: 'rgba(0,255,80,0.95)' }} />
          </motion.div>
        )
      })}
    </div>
  )
}
