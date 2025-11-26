import { request } from './client';
import type { Shop, DecorationCosts } from '../types';

// 店铺管理API
export const shopApi = {
  // 开店（统一租金500元，不再需要位置和租金参数）
  openShop: (data: { player_id: number; round_number: number }) => {
    return request.post<Shop>('/shops/open', data);
  },

  // 升级装修
  upgradeDecoration: (playerId: number, targetLevel: number) => {
    return request.post(`/shops/${playerId}/upgrade`, { target_level: targetLevel });
  },

  // 获取店铺信息
  getShop: (playerId: number) => {
    return request.get<Shop>(`/shops/${playerId}`);
  },

  // 获取装修费用
  getDecorationCosts: () => {
    return request.get<DecorationCosts>('/shops/decoration-costs');
  },
};
