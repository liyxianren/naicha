import { create } from 'zustand';

export interface SessionState {
  sessionToken: string | null;
  nickname: string;
  playerId: number | null;
  gameId: number | null;
  hydrated: boolean;
  hydrateFromStorage: () => void;
  setSession: (token: string, nickname: string) => void;
  setPlayerContext: (playerId: number, gameId: number) => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'mt_session';

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionToken: null,
  nickname: '',
  playerId: null,
  gameId: null,
  hydrated: false,

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    if (typeof localStorage === 'undefined') {
      set({ hydrated: true });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          sessionToken: parsed?.sessionToken || null,
          nickname: parsed?.nickname || '',
          playerId: parsed?.playerId ?? null,
          gameId: parsed?.gameId ?? null,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch (e) {
      console.warn('Failed to hydrate session', e);
      set({ hydrated: true });
    }
  },

  setSession: (token, nickname) => {
    const payload = { sessionToken: token, nickname, playerId: null, gameId: null };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    set({ ...payload, hydrated: true });
  },

  setPlayerContext: (playerId, gameId) => {
    const current = get();
    const payload = {
      sessionToken: current.sessionToken,
      nickname: current.nickname,
      playerId,
      gameId,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    set({ playerId, gameId });
  },

  clearSession: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      sessionToken: null,
      nickname: '',
      playerId: null,
      gameId: null,
      hydrated: true,
    });
  },
}));
