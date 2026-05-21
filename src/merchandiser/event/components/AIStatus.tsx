type Props = {
  model?: string
  status?: 'ready' | 'processing' | 'error'
  processingTime?: number | null
}

export default function AIStatus({ model = 'pasta-ai', status = 'ready', processingTime }: Props) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/70">Model</div>
          <div className="font-semibold">{model}</div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-sm ${status === 'ready' ? 'bg-green-600/80' : status === 'processing' ? 'bg-yellow-500/80' : 'bg-red-600/80'}`}>
            {status.toUpperCase()}
          </div>
          <div className="text-xs text-white/70 mt-1">{processingTime ? `${processingTime.toFixed(2)}s` : '—'}</div>
        </div>
      </div>
    </div>
  )
}
