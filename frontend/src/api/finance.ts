import { request } from './client';
import type { FinanceRecord } from '../types';

// 财务管理API
export const financeApi = {
  // 获取财务记录
  getRecords: (playerId: number, roundNumber?: number) => {
    return request.get<FinanceRecord[]>(`/finance/player/${playerId}`, roundNumber ? { round_number: roundNumber } : undefined);
  },

  // 获取利润排行
  getProfitRanking: (gameId: number, roundNumber?: number) => {
    return request.get(`/finance/game/${gameId}/ranking`, roundNumber ? { round_number: roundNumber } : undefined);
  },

  // 获取详细报表
  getDetailedReport: (playerId: number, roundNumber: number) => {
    return request.get(`/finance/player/${playerId}/round/${roundNumber}/details`);
  },
};
