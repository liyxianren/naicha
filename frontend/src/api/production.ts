import { request } from './client';
import type { Production, RoundProduction, MaterialPreviewResponse } from '../types';

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
    return request.get<RoundProduction[]>(`/production/${playerId}/${roundNumber}`);
  },

  // 预览原材料成本
  previewMaterialCost: (data: { productions: Production[] }) => {
    return request.post<MaterialPreviewResponse>('/production/material-preview', data);
  },
};
