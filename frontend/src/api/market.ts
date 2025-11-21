import { request } from './client';
import type { AdResult, MarketResearchResult, MarketCosts } from '../types';

export const marketApi = {
  // 投放广告（全局广告分，不选产品）
  placeAdvertisement: (data: { player_id: number; round_number: number; dice_result: number }) =>
    request.post<AdResult>('/market/advertisement', data),

  // 市场调研
  conductResearch: (data: { player_id: number; round_number: number }) =>
    request.post<MarketResearchResult>('/market/research', data),

  // 获取市场行动成本
  getCosts: () => request.get<MarketCosts>('/market/costs'),

  // 获取行动历史
  getMarketActions: (playerId: number, roundNumber?: number) =>
    request.get(`/market/actions/${playerId}`, roundNumber ? { round_number: roundNumber } : undefined),
};
