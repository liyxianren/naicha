import { request } from './client';
import type { RoundSummary, CustomerFlow } from '../types';

// 回合管理API
export const roundApi = {
  // 推进回合
  advanceRound: (gameId: number) => {
    return request.post(`/rounds/${gameId}/advance`);
  },

  // 获取回合总结
  getRoundSummary: (gameId: number, roundNumber: number) => {
    return request.get<RoundSummary[]>(`/rounds/${gameId}/${roundNumber}/summary`);
  },

  // 生成客流
  generateCustomerFlow: (gameId: number, roundNumber: number) => {
    return request.post<CustomerFlow>('/rounds/generate-customer-flow', {
      game_id: gameId,
      round_number: roundNumber,
    });
  },
};
