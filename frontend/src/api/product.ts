import { request } from './client';
import type { ProductRecipe, PlayerProduct, ResearchResult } from '../types';

// 产品管理API
export const productApi = {
  // 研发产品
  researchProduct: (data: { player_id: number; recipe_id: number; round_number: number; dice_result: number }) => {
    return request.post<ResearchResult>('/products/research', data);
  },

  // 获取所有配方
  getAllRecipes: (playerId?: number) => {
    return request.get<ProductRecipe[]>('/products/recipes', playerId ? { player_id: playerId } : undefined);
  },

  // 获取已解锁产品
  getUnlockedProducts: (playerId: number) => {
    return request.get<PlayerProduct[]>(`/products/player/${playerId}/unlocked`);
  },

  // 获取研发历史
  getResearchHistory: (playerId: number) => {
    return request.get(`/products/player/${playerId}/research-history`);
  },
};
