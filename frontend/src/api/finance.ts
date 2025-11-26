import { request } from './client';
import type { FinanceRecord } from '../types';

// 财务管理API
export const financeApi = {
  // 获取单回合财务记录
  getRecord: (playerId: number, roundNumber: number) => {
    return request.get<FinanceRecord>(`/finance/${playerId}/${roundNumber}`);
  },

  // 获取所有财务记录
  getAllRecords: (playerId: number) => {
    return request.get<FinanceRecord[]>(`/finance/${playerId}/all`);
  },

  // 获取利润排行
  getProfitSummary: (gameId: number) => {
    return request.get(`/finance/game/${gameId}/profit-summary`);
  },

  // 获取详细报表
  getDetailedReport: (playerId: number) => {
    return request.get(`/finance/${playerId}/detailed-report`);
  },
};
