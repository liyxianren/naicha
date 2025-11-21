import { request } from './client';
import type { Production } from '../types';

// 生产决策API
export const productionApi = {
  // 提交生产计划
  submitPlan: (data: {
    player_id: number;
    round_number: number;
    productions: Production[];
  }) => {
    return request.post('/production/submit', data);
  },

  // 获取生产计划
  getProductionPlan: (playerId: number, roundNumber: number) => {
    return request.get(`/production/player/${playerId}/round/${roundNumber}`);
  },

  // 预览成本
  previewCost: (data: { productions: Production[] }) => {
    return request.post('/production/preview-cost', data);
  },
};
