import { request } from './client';
import type { Game, Player } from '../types';

export const gameApi = {
  createGame: (data: { name: string; max_players: number; player_name: string; session_token?: string }) =>
    request.post<{ game: Game; player: Player }>('/games', data),

  getGames: () => request.get<Game[]>('/games'),

  getGame: (gameId: number) => request.get<Game>(`/games/${gameId}`),

  getGamePlayers: (gameId: number) => request.get<Player[]>(`/games/${gameId}/players`),

  startGame: (gameId: number) => request.post(`/games/${gameId}/start`),
};
