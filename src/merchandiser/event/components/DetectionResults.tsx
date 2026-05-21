import { motion } from 'framer-motion'
import type { Detection } from '../types/detection.types'

type Props = {
  detections: Detection[]
  processingTime?: number | null
}

export default function DetectionResults({ detections, processingTime }: Props) {
  // group by class
  const grouped = detections.reduce<Record<string, {count:number, avg:number}>>((acc, d) => {
    const key = d.class
    if (!acc[key]) acc[key] = { count: 0, avg: 0 }
    acc[key].count += 1
    acc[key].avg = ((acc[key].avg * (acc[key].count - 1)) + d.confidence) / acc[key].count
    return acc
  }, {})

  return (
    <div className="w-full rounded-2xl glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Detected Products</h4>
        <div className="text-sm text-white/70">{processingTime ? `${processingTime.toFixed(2)}s` : '—'}</div>
      </div>

      <div className="flex flex-col gap-2">
        {Object.keys(grouped).length === 0 && (
          <div className="text-white/60">No products detected.</div>
        )}

        {Object.entries(grouped).map(([name, val]) => (
          <motion.div key={name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between py-2 px-3 bg-white/3 rounded">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center text-detect-green font-bold">✓</div>
              <div>
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-white/70">Qty: {val.count}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{Math.round(val.avg * 100)}%</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
