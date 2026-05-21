import { CameraIcon, ImageIcon } from 'lucide-react'
import React, { useRef } from 'react'

type Props = {
  onFile: (file: File) => void
  loading?: boolean
}

export default function ScanUpload({ onFile, loading }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="w-full h-96 rounded-2xl border-2 border-dashed border-white/8 glass flex flex-col items-center justify-center gap-4 p-6"
    >
      <div className="flex items-center gap-3">
        <ImageIcon className="text-electric" />
        <h3 className="text-xl font-semibold">Drop image here or click to upload</h3>
      </div>

      <p className="text-sm text-white/70">High-resolution shelf photos work best.</p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-md bg-electric text-navy font-semibold"
        >
          Upload
        </button>
        <label className="px-4 py-2 rounded-md bg-white/6 cursor-pointer flex items-center gap-2">
          <CameraIcon />
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          Capture
        </label>
      </div>
    </div>
  )
}
