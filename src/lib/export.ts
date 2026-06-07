import * as XLSX from "xlsx";
import type {
  DashboardMetrics,
  TeamWorkload,
  TimeoutTrendPoint,
  TagDistribution,
  StaffMetrics,
} from "@/types";

interface ExportData {
  metrics?: DashboardMetrics;
  workload?: TeamWorkload[];
  timeoutTrend?: TimeoutTrendPoint[];
  tagDistribution?: TagDistribution[];
  staffRanking?: StaffMetrics[];
  filters?: {
    dateRange?: { start: string; end: string };
    teamIds?: string[];
  };
}

export function exportDashboardToExcel(data: ExportData, filename?: string) {
  const wb = XLSX.utils.book_new();
  const exportDate = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `客服排班看板数据_${exportDate}.xlsx`;

  if (data.metrics) {
    const metricsData = [
      { 指标: "会话总量", 值: data.metrics.totalSessions.toLocaleString(), 单位: "次" },
      { 指标: "平均等待时长", 值: data.metrics.avgWaitTime, 单位: "秒" },
      { 指标: "质检平均分", 值: data.metrics.avgQualityScore, 单位: "分" },
      { 指标: "超时率", 值: (data.metrics.timeoutRate * 100).toFixed(2), 单位: "%" },
      { 指标: "转接率", 值: (data.metrics.transferRate * 100).toFixed(2), 单位: "%" },
      { 指标: "平均满意度", 值: data.metrics.avgSatisfaction, 单位: "星" },
      { 指标: "在岗人数", 值: `${data.metrics.staffOnDuty}/${data.metrics.totalStaff}`, 单位: "人" },
    ];
    const ws = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, ws, "核心指标");
  }

  if (data.workload?.length) {
    const workloadData = data.workload.map((w) => ({
      班组: w.teamName,
      时段: `${w.hour}:00`,
      负载率: `${w.workload}%`,
      会话量: w.sessionCount,
      平均等待秒数: w.avgWaitTime,
      在岗人数: w.staffOnDuty,
    }));
    const ws = XLSX.utils.json_to_sheet(workloadData);
    XLSX.utils.book_append_sheet(wb, ws, "班组负载");
  }

  if (data.timeoutTrend?.length) {
    const trendData = data.timeoutTrend.map((t) => ({
      时间: t.time,
      平均等待秒数: t.avgWaitTime,
      超时报案数: t.timeoutCount,
      超时率: (t.timeoutRate * 100).toFixed(2) + "%",
      会话总量: t.sessionCount,
    }));
    const ws = XLSX.utils.json_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, ws, "超时趋势");
  }

  if (data.tagDistribution?.length) {
    const tagData = data.tagDistribution.map((t) => ({
      问题标签: t.tagName,
      分类: t.category,
      会话量: t.count,
      占比: `${t.percentage}%`,
    }));
    const ws = XLSX.utils.json_to_sheet(tagData);
    XLSX.utils.book_append_sheet(wb, ws, "标签分布");
  }

  if (data.staffRanking?.length) {
    const staffData = data.staffRanking.map((s, idx) => ({
      排名: idx + 1,
      客服姓名: s.staffName,
      是否试用期: s.isProbation ? "是" : "否",
      会话量: s.sessionCount,
      平均等待秒数: s.avgWaitTime,
      平均通话秒数: s.avgDuration,
      转接率: (s.transferRate * 100).toFixed(2) + "%",
      质检分: s.avgQualityScore,
      满意度: s.satisfaction,
      综合负载分: s.workloadScore,
    }));
    const ws = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, ws, "人员排名");
  }

  if (data.filters) {
    const filterData = [
      { 筛选条件: "时间范围", 值: data.filters.dateRange ? `${data.filters.dateRange.start} 至 ${data.filters.dateRange.end}` : "默认" },
      { 筛选条件: "选中班组", 值: data.filters.teamIds?.join(", ") || "全部班组" },
    ];
    const ws = XLSX.utils.json_to_sheet(filterData);
    XLSX.utils.book_append_sheet(wb, ws, "筛选条件");
  }

  XLSX.writeFile(wb, finalFilename);
}

export function exportToCSV(
  data: Record<string, any>[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
