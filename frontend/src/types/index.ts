// 游戏类型定义
export interface Game {
  id: number;
  name: string;
  max_players: number;
  current_round: number;
  status: 'waiting' | 'in_progress' | 'finished';
  created_at: string;
}

export interface Player {
  id: number;
  game_id: number;
  name: string;
  cash: number;
  is_ready: boolean;
  turn_order: number;
  status: 'active' | 'bankrupt';
}

export type DecisionStepKey = 'shop' | 'employees' | 'market' | 'research' | 'production';

export type DecisionStepStatus = 'locked' | 'pending' | 'in_progress' | 'completed' | 'waiting';

export type RoundPhase = 'planning' | 'waiting' | 'summary' | 'finished';

export interface Shop {
  id: number;
  player_id: number;
  location: string;
  rent: number;
  decoration_level: number;
  max_employees: number;
}

export interface Employee {
  id: number;
  shop_id: number;
  name: string;
  salary: number;
  productivity: number;
  hired_round: number;
  is_active: boolean;
}

export interface ProductRecipe {
  recipe_id: number;
  name: string;
  recipe_json: Record<string, number>;
  base_fan_rate: number;
  difficulty: number;
  is_unlocked?: boolean;
  research_cost: number;
}

export interface PlayerProduct {
  id: number;
  player_id: number;
  recipe_id: number;
  recipe_name: string;
  recipe_json: Record<string, number>;
  base_fan_rate: number;
  is_unlocked: boolean;
  current_ad_score: number;
  total_sold: number;
  current_price?: number;
  last_price_change_round?: number;
}

export interface Production {
  product_id: number;
  productivity: number;
  price: number;
}

export interface FinanceRecord {
  id: number;
  player_id: number;
  round_number: number;
  revenue: number;
  expenses: number;
  profit: number;
  cash_balance: number;
  created_at: string;
}

export interface CustomerFlow {
  round_number: number;
  high_tier_customers: number;
  low_tier_customers: number;
}

export interface RoundSummary {
  round_number: number;
  player_id: number;
  player_name: string;
  revenue: number;
  expenses: number;
  profit: number;
  cash_balance: number;
  products_sold: Record<string, number>;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 装修费用
export interface DecorationCosts {
  [key: string]: {
    cost: number;
    max_employees: number;
  };
}

// 市场行动费用
export interface MarketCosts {
  advertisement: number;
  market_research: number;
  product_research: number;
}

// 研发结果
export interface ResearchResult {
  dice_result: number;
  required_roll: number;
  research_success: boolean;
  product_unlocked: boolean;
  product_name: string;
  difficulty: number;
  cost: number;
  remaining_cash: number;
}

// 广告结果
export interface AdResult {
  dice_result: number;
  ad_score: number;
  cost: number;
  remaining_cash: number;
}

// 市场调研结果
export interface MarketResearchResult {
  cost: number;
  next_round: number;
  customer_flow: {
    high_tier_customers: number;
    low_tier_customers: number;
  };
  remaining_cash: number;
}
