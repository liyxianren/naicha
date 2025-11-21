import { create } from 'zustand';
import type { DecisionStepKey, DecisionStepStatus } from '../types';

const createDefaultStatuses = (): Record<DecisionStepKey, DecisionStepStatus> => ({
  shop: 'in_progress',
  employees: 'pending',
  market: 'pending',
  research: 'pending',
  production: 'pending',
});

interface GameRoundState {
  activeStep: DecisionStepKey;
  stepStatuses: Record<DecisionStepKey, DecisionStepStatus>;
  lastCompletedStep: DecisionStepKey | null;
  isSummaryVisible: boolean;
  setActiveStep: (step: DecisionStepKey) => void;
  setStepStatus: (step: DecisionStepKey, status: DecisionStepStatus) => void;
  hydrateStepStatuses: (statuses: Partial<Record<DecisionStepKey, DecisionStepStatus>>) => void;
  resetSteps: () => void;
  markWaitingForSummary: () => void;
  setSummaryVisible: (visible: boolean) => void;
}

export const useGameRoundStore = create<GameRoundState>((set, get) => ({
  activeStep: 'shop',
  stepStatuses: createDefaultStatuses(),
  lastCompletedStep: null,
  isSummaryVisible: false,

  setActiveStep: (step) => set({ activeStep: step }),

  setStepStatus: (step, status) => {
    const prevStatuses = get().stepStatuses;
    set({
      stepStatuses: { ...prevStatuses, [step]: status },
      lastCompletedStep: status === 'completed' ? step : get().lastCompletedStep,
    });
  },

  hydrateStepStatuses: (statuses) => set((state) => ({
    stepStatuses: { ...state.stepStatuses, ...statuses },
  })),

  resetSteps: () => set({
    stepStatuses: createDefaultStatuses(),
    activeStep: 'shop',
    lastCompletedStep: null,
    isSummaryVisible: false,
  }),

  markWaitingForSummary: () => set((state) => {
    const waitingStatuses = Object.keys(state.stepStatuses).reduce((acc, key) => {
      acc[key as DecisionStepKey] = 'waiting';
      return acc;
    }, {} as Record<DecisionStepKey, DecisionStepStatus>);

    return { stepStatuses: waitingStatuses };
  }),

  setSummaryVisible: (visible) => set({ isSummaryVisible: visible }),
}));
