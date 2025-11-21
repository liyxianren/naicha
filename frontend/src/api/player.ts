import { request } from './client';
import type { Player } from '../types';

export const playerApi = {
  joinGame: (data: { game_id: number; player_name: string; session_token?: string }) =>
    request.post<Player>('/players/join', data),

  leaveGame: (playerId: number) => request.post(`/players/${playerId}/leave`),

  setReady: (playerId: number, isReady: boolean) => request.post(`/players/${playerId}/ready`, { is_ready: isReady }),

  getPlayer: (playerId: number) => request.get<Player>(`/players/${playerId}`),
};
