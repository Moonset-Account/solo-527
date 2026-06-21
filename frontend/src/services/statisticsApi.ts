import api from './api';
import type {
  ProductionStatistics,
  EquipmentStatistics,
  ShiftPerformance,
} from '../types';

export const statisticsApi = {
  getProduction: (startDate: string, endDate: string, shiftId?: string) =>
    api.get<ProductionStatistics>('/statistics/production', {
      params: { startDate, endDate, shiftId },
    }).then((res) => res.data),

  getEquipmentUtilization: (startDate: string, endDate: string) =>
    api.get<EquipmentStatistics[]>('/statistics/equipment-utilization', {
      params: { startDate, endDate },
    }).then((res) => res.data),

  getShiftPerformance: (startDate: string, endDate: string) =>
    api.get<ShiftPerformance[]>('/statistics/shift-performance', {
      params: { startDate, endDate },
    }).then((res) => res.data),

  getDowntimeReasons: (startDate: string, endDate: string) =>
    api.get<Record<number, number>>('/statistics/downtime-reasons', {
      params: { startDate, endDate },
    }).then((res) => res.data),
};
