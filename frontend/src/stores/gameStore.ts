import { create } from 'zustand';
import type { Game, Player } from '../types';

interface GameState {
  currentGame: Game | null;
  currentPlayer: Player | null;
  players: Player[];
  setCurrentGame: (game: Game | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setPlayers: (players: Player[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  currentPlayer: null,
  players: [],

  setCurrentGame: (game) => set({ currentGame: game }),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setPlayers: (players) => set({ players }),

  reset: () => set({
    currentGame: null,
    currentPlayer: null,
    players: [],
  }),
}));
