import { request } from './client';
import type { Employee } from '../types';

// 员工管理API
export const employeeApi = {
  // 招聘员工
  hireEmployee: (data: {
    player_id: number;
    name: string;
    salary: number;
    productivity: number;
    round_number: number;
  }) => {
    return request.post<Employee>('/employees/hire', data);
  },

  // 解雇员工
  fireEmployee: (employeeId: number) => {
    return request.post(`/employees/${employeeId}/fire`);
  },

  // 获取店铺员工
  getShopEmployees: (playerId: number, includeInactive = false) => {
    return request.get<Employee[]>(`/employees/player/${playerId}`, { include_inactive: includeInactive });
  },

  // 获取总生产力
  getTotalProductivity: (playerId: number) => {
    return request.get<{ player_id: number; total_productivity: number }>(`/employees/player/${playerId}/productivity`);
  },

  // 更新员工工资
  updateSalary: (employeeId: number, newSalary: number) => {
    return request.patch(`/employees/${employeeId}/salary`, { new_salary: newSalary });
  },
};
