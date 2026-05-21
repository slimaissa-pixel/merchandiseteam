import apiClient from './apiClient';

export interface WorkSession {
  id: number;
  merchandiser_id: number;
  supervisor_id: number;
  status: string;
  start_time: string;
  end_time?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: number;
  session_id: number;
  timestamp: string;
  lat: number;
  lng: number;
  note?: string;
  image_url?: string;
}

export class SessionService {
  static async getActiveSessions(): Promise<WorkSession[]> {
    try {
      const response = await apiClient.get('/api/sessions/active');
      return response.data;
    } catch (error) {
      console.error('Failed to get active sessions', error);
      return [];
    }
  }

  static async startSession(merchandiserId: number, startLat?: number, startLng?: number): Promise<WorkSession | null> {
    try {
      const response = await apiClient.post('/api/sessions/start', {
        merchandiser_id: merchandiserId,
        start_lat: startLat,
        start_lng: startLng
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start session', error);
      throw error;
    }
  }

  static async endSession(sessionId: number, endLat?: number, endLng?: number): Promise<WorkSession | null> {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/end`, {
        end_lat: endLat,
        end_lng: endLng
      });
      return response.data;
    } catch (error) {
      console.error('Failed to end session', error);
      throw error;
    }
  }

  static async addCheckpoint(sessionId: number, data: { lat: number, lng: number, note?: string, image_url?: string }): Promise<Checkpoint | null> {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/checkpoint`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to add checkpoint', error);
      throw error;
    }
  }
}
