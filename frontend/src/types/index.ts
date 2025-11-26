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
  created_round?: number;
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
  is_unlocked: boolean;
  current_ad_score: number;
  total_sold: number;
  current_price?: number;
  last_price_change_round?: number;
  recipe: ProductRecipe;  // 后端返回完整的recipe对象
}

export interface Production {
  product_id: number;
  productivity: number;
  price: number;
}

export interface RoundProduction {
  id: number;
  product_id: number;
  product_name: string;
  allocated_productivity: number;
  price: number;
  produced_quantity: number;
  sold_quantity: number;
  sold_to_high_tier: number;
  sold_to_low_tier: number;
  revenue: number;
}

export interface MaterialCostDetail {
  quantity: number;
  unit_price: number;
  total: number;
  discount_rate?: number;
}

export interface MaterialCosts {
  tea?: MaterialCostDetail;
  milk?: MaterialCostDetail;
  fruit?: MaterialCostDetail;
  ingredient?: MaterialCostDetail;
  total_cost: number;
}

export interface MaterialPreviewResponse {
  material_needs: Record<string, number>;
  material_costs: MaterialCosts;
}

export interface ProductionSubmitResponse {
  material_costs: MaterialCosts;
  all_players_submitted?: boolean;
}

export interface FinanceRecordRevenue {
  total: number;
  breakdown: Record<string, any> | null;
}

export interface FinanceRecordExpenses {
  rent: number;
  salary: number;
  material: number;
  decoration: number;
  market_research: number;
  advertisement: number;
  product_research: number;
  total: number;
}

export interface FinanceRecordProfit {
  round: number;
  cumulative: number;
}

export interface FinanceRecord {
  id: number;
  player_id: number;
  round_number: number;
  revenue: FinanceRecordRevenue;
  expenses: FinanceRecordExpenses;
  profit: FinanceRecordProfit;
  created_at: string | null;
}

export interface CustomerFlow {
  round_number: number;
  high_tier_customers: number;
  low_tier_customers: number;
}

export interface RoundSummary {
  player_id: number;
  player_name?: string;
  nickname: string;
  total_revenue: number;
  total_sold: number;
  round_profit: number;
  productions: Array<{
    product_name: number;
    produced: number;
    sold: number;
    sold_to_high: number;
    sold_to_low: number;
    price: number;
    revenue: number;
  }>;
}

export interface RoundSummaryResponse {
  players: RoundSummary[];
  customer_flow: CustomerFlow;
  all_players_submitted?: boolean;
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
