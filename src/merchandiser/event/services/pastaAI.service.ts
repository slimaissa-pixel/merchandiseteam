import { API_BASE_URL } from '@/constants/api';
import type { PredictResponse } from '../types/detection.types'

const API_URL = `${API_BASE_URL}/api/detection/detect`

export async function detectImage(file: File, visualize = false): Promise<PredictResponse> {
  const fd = new FormData()
  fd.append('file', file)
  const q = visualize ? '?visualize=true' : ''
  const res = await fetch(API_URL + q, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || 'Detection API error')
  }
  const json = await res.json()
  return json as PredictResponse
}
