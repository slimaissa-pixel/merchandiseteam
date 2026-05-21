import AIStatus from '../components/AIStatus'
import DetectionCanvas from '../components/DetectionCanvas'
import DetectionResults from '../components/DetectionResults'
import ScanUpload from '../components/ScanUpload'
import { usePastaDetection } from '../hooks/usePastaDetection'

export default function ScanPage() {
  const { imageSrc, detections, loading, processingTime, upload, clear } = usePastaDetection()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Scan — AI Detection</h1>
              <p className="text-sm text-white/70 mt-1">Upload a shelf photo to detect pasta products with your pasta-ai model.</p>
            </div>
            <AIStatus model="pasta-ai" status={loading ? 'processing' : 'ready'} processingTime={processingTime} />
          </div>

          <ScanUpload onFile={upload} loading={loading} />

          <div className="mt-4">
            <DetectionCanvas imageSrc={imageSrc} detections={detections} />
            <div className="flex gap-2 mt-3">
              <button onClick={clear} className="px-4 py-2 bg-white/6 rounded">Remove</button>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <DetectionResults detections={detections} processingTime={processingTime} />
        </div>
      </div>
    </div>
  )
}
