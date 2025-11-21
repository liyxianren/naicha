import { request } from './client';
import type { Player } from '../types';

export const authApi = {
  login: (nickname: string) =>
    request.post<{ session_token: string; nickname: string }>('/auth/login', { nickname }),

  heartbeat: (sessionToken: string) =>
    request.post('/auth/heartbeat', { session_token: sessionToken }),

  getSession: (sessionToken: string) =>
    request.get<Player>('/auth/session', { session_token: sessionToken }),
};
