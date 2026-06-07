import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { WaterQualityRecord, FilterState, IndicatorKey } from '@/types';
import { INDICATOR_STANDARDS } from '@/data/indicators';
import { getPointById, formatDateTime, getSectionById, getAgencyById } from './dataProcessing';

export async function exportToPDF(
  chartElement: HTMLElement,
  records: WaterQualityRecord[],
  filters: FilterState,
  summaryStats: ReturnType<typeof import('./dataProcessing').calculateSummaryStats>
): Promise<void> {
  const canvas = await html2canvas(chartElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('河流水质监测分析报告', pageWidth / 2, 20, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, 30);
  
  const filterSummary = generateFilterSummary(filters);
  pdf.text(`筛选条件: ${filterSummary}`, 14, 38);

  const imgWidth = pageWidth - 28;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const maxImgHeight = pageHeight - 80;
  const finalHeight = Math.min(imgHeight, maxImgHeight);
  
  pdf.addImage(imgData, 'PNG', 14, 48, imgWidth, finalHeight);

  let yPos = 55 + finalHeight;
  
  if (yPos < pageHeight - 20) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('统计摘要', 14, yPos);
    yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• 总采样次数: ${summaryStats.totalSamples}`, 18, yPos);
    yPos += 6;
    pdf.text(`• 达标率: ${summaryStats.complianceRate}%`, 18, yPos);
    yPos += 6;
    pdf.text(`• 超标次数: ${summaryStats.exceedCount}`, 18, yPos);
    yPos += 6;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('各指标平均值:', 18, yPos);
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    
    (Object.keys(summaryStats.avgIndicators) as IndicatorKey[]).forEach(key => {
      const std = INDICATOR_STANDARDS[key];
      const val = summaryStats.avgIndicators[key];
      if (val !== null) {
        pdf.text(`  ${std.name}: ${val} ${std.unit}`, 22, yPos);
        yPos += 6;
      }
    });
  }

  pdf.save(`水质分析报告_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToExcel(
  records: WaterQualityRecord[],
  filters: FilterState
): void {
  const excelData = records.map(record => {
    const point = getPointById(record.pointId);
    const section = point ? getSectionById(point.sectionId) : undefined;
    const agency = point ? getAgencyById(point.agencyId) : undefined;
    
    return {
      '采样时间': formatDateTime(record.sampleTime),
      '河段': section?.name || '-',
      '采样点': point?.name || '-',
      '采样类型': record.sampleType === 'auto' ? '自动监测站' : '人工采样',
      '采样机构': agency?.name || '-',
      '水温(℃)': record.temperature ?? '-',
      'pH值': record.ph ?? '-',
      '溶解氧(mg/L)': record.dissolvedOxygen ?? '-',
      '氨氮(mg/L)': record.ammoniaNitrogen ?? '-',
      '数据状态': record.isMissing ? '缺测' : (record.status === 'exceed' ? '超标' : record.status === 'warning' ? '预警' : '正常'),
      '超标指标': record.exceedIndicators.map(i => INDICATOR_STANDARDS[i].name).join('、') || '-'
    };
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '水质数据');

  const filterInfo = {
    '筛选条件': generateFilterSummary(filters),
    '导出时间': new Date().toLocaleString('zh-CN')
  };
  const wsInfo = XLSX.utils.json_to_sheet([filterInfo]);
  XLSX.utils.book_append_sheet(wb, wsInfo, '导出说明');

  XLSX.writeFile(wb, `水质数据_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function generateFilterSummary(filters: FilterState): string {
  const parts: string[] = [];
  
  if (filters.selectedSections.length > 0) {
    parts.push(`河段(${filters.selectedSections.length}个)`);
  }
  if (filters.selectedPoints.length > 0) {
    parts.push(`采样点(${filters.selectedPoints.length}个)`);
  }
  if (filters.selectedMonths.length > 0) {
    parts.push(`月份(${filters.selectedMonths.length}个)`);
  }
  if (filters.selectedIndicators.length < 4) {
    parts.push(`指标(${filters.selectedIndicators.length}个)`);
  }
  if (filters.selectedAgencies.length > 0) {
    parts.push(`机构(${filters.selectedAgencies.length}个)`);
  }
  
  parts.push(`日期范围: ${filters.dateRange.start} 至 ${filters.dateRange.end}`);
  
  return parts.join(' | ');
}

export function generateCSV(records: WaterQualityRecord[]): string {
  const headers = ['采样时间', '采样点ID', '采样点名称', '采样类型', '水温', 'pH', '溶解氧', '氨氮', '状态'];
  const rows = records.map(r => {
    const point = getPointById(r.pointId);
    return [
      r.sampleTime,
      r.pointId,
      point?.name || '',
      r.sampleType,
      r.temperature ?? '',
      r.ph ?? '',
      r.dissolvedOxygen ?? '',
      r.ammoniaNitrogen ?? '',
      r.status
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}
