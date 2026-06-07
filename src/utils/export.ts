import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { FilterState } from '@/types';
import { useDataStore } from '@/store/dataStore';

const timePeriodLabels: Record<string, string> = {
  morning_rush: '早高峰',
  evening_rush: '晚高峰',
  all_day: '全天',
  custom: '自定义',
};

const vehicleStatusLabels: Record<string, string> = {
  dispatchable: '可调度',
  in_repair: '维修中',
  all: '全部',
};

const dispatchStatusLabels: Record<string, string> = {
  all: '全部',
  completed: '已完成',
  pending: '待处理',
  in_progress: '进行中',
};

const weatherLabels: Record<string, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  snowy: '雪天',
  windy: '大风',
};

export async function exportAsPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const canvas = await html2canvas(element, { backgroundColor: '#1a1d23' });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    console.error(e);
  }
}

export async function exportAsPDF(elementId: string, filename: string, nullCount: number = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const canvas = await html2canvas(element, { backgroundColor: '#1a1d23' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const height = Math.min(imgHeight, pageHeight);
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, height);
    const now = new Date().toLocaleString('zh-CN');
    pdf.setFontSize(8);
    pdf.text(`生成时间: ${now}`, 10, pageHeight - 5);
    if (nullCount > 0) {
      pdf.text(`本报告含 ${nullCount} 个空值字段`, pageWidth - 60, pageHeight - 5);
    }
    pdf.save(`${filename}.pdf`);
  } catch (e) {
    console.error(e);
  }
}

export function getFilterDescription(filters: FilterState): string {
  const stations = useDataStore.getState().stations;
  const stationNameMap = new Map(stations.map((s) => [s.id, s.name]));
  const parts: string[] = [];

  if (filters.stationIds.length > 0) {
    const names = filters.stationIds.map((id) => stationNameMap.get(id) ?? id).join(',');
    parts.push(`站点:${names}`);
  } else {
    parts.push('站点:全部');
  }

  parts.push(`时段:${timePeriodLabels[filters.timePeriod] ?? filters.timePeriod}`);
  parts.push(`车辆:${vehicleStatusLabels[filters.vehicleStatus] ?? filters.vehicleStatus}`);
  parts.push(`调度:${dispatchStatusLabels[filters.dispatchStatus] ?? filters.dispatchStatus}`);

  if (filters.weatherConditions.length > 0) {
    const conditions = filters.weatherConditions.map((c) => weatherLabels[c] ?? c).join(',');
    parts.push(`天气:${conditions}`);
  } else {
    parts.push('天气:全部');
  }

  return parts.join(' | ');
}
