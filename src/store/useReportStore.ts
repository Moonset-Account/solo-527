import { create } from 'zustand';
import {
  reportApi,
  ConversionReportDto,
  TechnicianPerformanceDto,
  ReportQueryRequest
} from '@/services/api';

interface ReportState {
  conversionReports: ConversionReportDto[];
  technicianPerformances: TechnicianPerformanceDto[];
  loading: boolean;
  error: string | null;

  fetchConversionReport: (params: ReportQueryRequest) => Promise<void>;
  fetchTechnicianPerformance: (params: ReportQueryRequest) => Promise<void>;
  exportConversionReport: (params: ReportQueryRequest) => Promise<string>;
  exportTechnicianPerformance: (params: ReportQueryRequest) => Promise<string>;
  clearError: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  conversionReports: [],
  technicianPerformances: [],
  loading: false,
  error: null,

  fetchConversionReport: async (params: ReportQueryRequest) => {
    set({ loading: true, error: null });
    try {
      const data = await reportApi.getConversionReport(params);
      set({ conversionReports: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取转化率报表失败', loading: false });
    }
  },

  fetchTechnicianPerformance: async (params: ReportQueryRequest) => {
    set({ loading: true, error: null });
    try {
      const data = await reportApi.getTechnicianPerformance(params);
      set({ technicianPerformances: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取技师绩效报表失败', loading: false });
    }
  },

  exportConversionReport: async (params: ReportQueryRequest) => {
    set({ loading: true, error: null });
    try {
      const data = await reportApi.getConversionReport(params);
      const csvContent = [
        ['周期', '总预约数', '到店数', '到店率', '完成数', '完成率', '平均收入'],
        ...data.map(item => [
          item.period,
          item.totalAppointments.toString(),
          item.arrivedCount.toString(),
          (item.arrivalRate * 100).toFixed(1) + '%',
          item.completedCount.toString(),
          (item.completionRate * 100).toFixed(1) + '%',
          item.avgRevenue.toFixed(2)
        ])
      ].map(row => row.join(',')).join('\n');
      
      set({ loading: false });
      return csvContent;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '导出转化率报表失败', loading: false });
      throw err;
    }
  },

  exportTechnicianPerformance: async (params: ReportQueryRequest) => {
    set({ loading: true, error: null });
    try {
      const data = await reportApi.getTechnicianPerformance(params);
      const csvContent = [
        ['技师ID', '技师姓名', '服务次数', '总收入', '评分'],
        ...data.map(item => [
          item.technicianId,
          item.technicianName,
          item.serviceCount.toString(),
          item.revenue.toFixed(2),
          item.rating.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      
      set({ loading: false });
      return csvContent;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '导出技师绩效报表失败', loading: false });
      throw err;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
