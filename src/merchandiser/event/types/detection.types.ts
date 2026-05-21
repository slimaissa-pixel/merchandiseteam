export interface Detection {
  class: string
  confidence: number
  bbox: [number, number, number, number]
}

export interface PredictResponse {
  success: boolean
  model: string
  detections: Detection[]
  image_size?: [number, number]
  image_base64?: string
}
