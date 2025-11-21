import { create } from 'zustand';
import type {
  Shop,
  Employee,
  PlayerProduct,
  Production,
  DecisionStepKey,
  RoundPhase,
} from '../types';

interface DecisionState {
  // 门店信息
  shop: Shop | null;
  setShop: (shop: Shop | null) => void;
  hasShopInfo: boolean;
  setHasShopInfo: (flag: boolean) => void;

  // 员工列表
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;

  // 已解锁产品
  unlockedProducts: PlayerProduct[];
  setUnlockedProducts: (products: PlayerProduct[]) => void;

  // 生产计划
  productionPlan: Production[];
  setProductionPlan: (plan: Production[]) => void;

  // 客流信息
  customerFlow: { high_tier_customers: number; low_tier_customers: number } | null;
  setCustomerFlow: (flow: { high_tier_customers: number; low_tier_customers: number } | null) => void;

  // 回合状态
  currentRound: number;
  totalRounds: number;
  roundPhase: RoundPhase;
  isRoundLocked: boolean;
  isWaitingForPlayers: boolean;
  submittingStep: DecisionStepKey | null;
  setRoundInfo: (round: number, totalRounds?: number) => void;
  setRoundPhase: (phase: RoundPhase) => void;
  setRoundLocked: (flag: boolean) => void;
  setWaitingForPlayers: (flag: boolean) => void;
  setSubmittingStep: (step: DecisionStepKey | null) => void;

  // 重置
  reset: () => void;
}

const defaultCustomerFlow = null;

export const useDecisionStore = create<DecisionState>((set) => ({
  shop: null,
  hasShopInfo: false,
  employees: [],
  unlockedProducts: [],
  productionPlan: [],
  customerFlow: defaultCustomerFlow,
  currentRound: 1,
  totalRounds: 10,
  roundPhase: 'planning',
  isRoundLocked: false,
  isWaitingForPlayers: false,
  submittingStep: null,

  setShop: (shop) => set({ shop }),
  setHasShopInfo: (flag) => set({ hasShopInfo: flag }),

  setEmployees: (employees) => set({ employees }),

  setUnlockedProducts: (products) => set({ unlockedProducts: products }),

  setProductionPlan: (plan) => set({ productionPlan: plan }),

  setCustomerFlow: (flow) => set({ customerFlow: flow }),

  setRoundInfo: (round, totalRounds = 10) => set({ currentRound: round, totalRounds }),

  setRoundPhase: (phase) => set({ roundPhase: phase }),

  setRoundLocked: (flag) => set({ isRoundLocked: flag }),

  setWaitingForPlayers: (flag) => set({ isWaitingForPlayers: flag }),

  setSubmittingStep: (step) => set({ submittingStep: step }),

  reset: () => set({
    shop: null,
    hasShopInfo: false,
    employees: [],
    unlockedProducts: [],
    productionPlan: [],
    customerFlow: defaultCustomerFlow,
    currentRound: 1,
    totalRounds: 10,
    roundPhase: 'planning',
    isRoundLocked: false,
    isWaitingForPlayers: false,
    submittingStep: null,
  }),
}));
