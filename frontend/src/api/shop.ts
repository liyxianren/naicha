import { request } from './client';
import type { Shop, DecorationCosts } from '../types';

// 店铺管理API
export const shopApi = {
  // 开店（玩家自定义租金）
  openShop: (data: { player_id: number; round_number: number; rent: number }) => {
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
