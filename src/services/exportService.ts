import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';
import { AggregatedResult, FilterDimensions, DateRange, ExportTask } from '../types';

export const generateStandardExcel = (
  aggregatedResult: AggregatedResult,
  filters: FilterDimensions,
  dateRange: DateRange
): Blob => {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['SaaS 留存分析看板 - 数据导出报告'],
    [''],
    ['导出时间', new Date().toLocaleString('zh-CN')],
    ['日期范围', `${dateRange.start} ~ ${dateRange.end}`],
    ['查询ID', aggregatedResult.queryId],
    ['数据生成时间', new Date(aggregatedResult.generatedAt).toLocaleString('zh-CN')],
    [''],
    ['筛选条件'],
    ['用户', filters.users.length > 0 ? filters.users.join(', ') : '全部'],
    ['团队', filters.teams.length > 0 ? filters.teams.join(', ') : '全部'],
    ['渠道', filters.channels.length > 0 ? filters.channels.join(', ') : '全部'],
    ['版本', filters.versions.length > 0 ? filters.versions.join(', ') : '全部'],
    ['功能模块', filters.modules.length > 0 ? filters.modules.join(', ') : '全部'],
    ['流量类型', filters.trafficType === 'all' ? '全部' : filters.trafficType === 'experiment' ? '实验组' : '自然流量'],
    [''],
    ['核心指标汇总'],
    ['总用户数', aggregatedResult.totalUsers],
    ['激活率(%)', aggregatedResult.summary.activationRate],
    ['付费转化率(%)', aggregatedResult.summary.payConversionRate],
    ['7日平均留存(%)', aggregatedResult.summary.avgRetention7d],
    ['总会话数', aggregatedResult.summary.totalSessions],
    ['平均会话时长(秒)', aggregatedResult.summary.avgSessionDuration],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '数据概览');

  const funnelData = [
    ['步骤', '用户数', '转化率(%)', '流失率(%)'],
    ...aggregatedResult.funnel.steps.map((s) => [
      s.name,
      s.count,
      s.conversionRate,
      s.dropOffRate,
    ]),
    [''],
    ['总用户数', aggregatedResult.funnel.totalUsers],
    ['整体转化率(%)', aggregatedResult.funnel.overallConversion],
  ];
  const wsFunnel = XLSX.utils.aoa_to_sheet(funnelData);
  XLSX.utils.book_append_sheet(wb, wsFunnel, '转化漏斗');

  const cohortHeaders = ['Cohort', '用户数', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  const cohortRows = aggregatedResult.cohort.map((r) => [
    r.cohort,
    r.cohortSize,
    r.week0,
    r.week1 ?? '-',
    r.week2 ?? '-',
    r.week3 ?? '-',
    r.week4 ?? '-',
    r.week5 ?? '-',
    r.week6 ?? '-',
    r.week7 ?? '-',
  ]);
  const wsCohort = XLSX.utils.aoa_to_sheet([cohortHeaders, ...cohortRows]);
  XLSX.utils.book_append_sheet(wb, wsCohort, 'Cohort留存');

  const featureHeaders = ['功能名称', '模块', '使用用户数', '会话数', '平均使用时长(秒)', '渗透率(%)', '变化趋势(%)'];
  const featureRows = aggregatedResult.features.map((f) => [
    f.name,
    f.module,
    f.users,
    f.sessions,
    f.avgDuration,
    f.adoptionRate,
    f.trend,
  ]);
  const wsFeatures = XLSX.utils.aoa_to_sheet([featureHeaders, ...featureRows]);
  XLSX.utils.book_append_sheet(wb, wsFeatures, '功能热度');

  const pathNodeHeaders = ['节点ID', '节点名称', '用户数', '分类'];
  const pathNodeRows = aggregatedResult.paths.nodes.map((n) => [n.id, n.name, n.value, n.category]);
  const wsPathNodes = XLSX.utils.aoa_to_sheet([pathNodeHeaders, ...pathNodeRows]);
  XLSX.utils.book_append_sheet(wb, wsPathNodes, '路径-节点');

  const pathLinkHeaders = ['源节点', '目标节点', '流量'];
  const pathLinkRows = aggregatedResult.paths.links.map((l) => [l.source, l.target, l.value]);
  const wsPathLinks = XLSX.utils.aoa_to_sheet([pathLinkHeaders, ...pathLinkRows]);
  XLSX.utils.book_append_sheet(wb, wsPathLinks, '路径-连接');

  const churnHeaders = ['流失原因', '数量', '占比(%)'];
  const churnRows = aggregatedResult.churn.map((r) => [r.reason, r.count, r.percentage]);
  const wsChurn = XLSX.utils.aoa_to_sheet([churnHeaders, ...churnRows]);
  XLSX.utils.book_append_sheet(wb, wsChurn, '流失原因');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

export const generateStandardPDF = (
  aggregatedResult: AggregatedResult,
  filters: FilterDimensions,
  dateRange: DateRange
): Blob => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 50;

  doc.setFontSize(20);
  doc.setTextColor(14, 165, 233);
  doc.text('SaaS 留存分析看板 - 数据报告', pageWidth / 2, yPos, { align: 'center' });
  yPos += 30;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 40, yPos);
  doc.text(`日期范围: ${dateRange.start} ~ ${dateRange.end}`, pageWidth - 40, yPos, { align: 'right' });
  yPos += 25;

  const filterSummary = [
    filters.users.length > 0 ? `用户: ${filters.users.join(', ')}` : null,
    filters.teams.length > 0 ? `团队: ${filters.teams.join(', ')}` : null,
    filters.channels.length > 0 ? `渠道: ${filters.channels.join(', ')}` : null,
    filters.versions.length > 0 ? `版本: ${filters.versions.join(', ')}` : null,
    filters.modules.length > 0 ? `模块: ${filters.modules.join(', ')}` : null,
    filters.trafficType !== 'all' ? `流量: ${filters.trafficType === 'experiment' ? '实验组' : '自然流量'}` : null,
  ].filter(Boolean).join(' | ');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`筛选条件: ${filterSummary || '无'}`, 40, yPos);
  yPos += 30;

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('核心指标汇总', 40, yPos);
  yPos += 25;

  const summaryData = [
    ['总用户数', aggregatedResult.totalUsers.toLocaleString()],
    ['激活率', `${aggregatedResult.summary.activationRate}%`],
    ['付费转化率', `${aggregatedResult.summary.payConversionRate}%`],
    ['7日平均留存', `${aggregatedResult.summary.avgRetention7d}%`],
    ['总会话数', aggregatedResult.summary.totalSessions.toLocaleString()],
    ['平均会话时长', `${aggregatedResult.summary.avgSessionDuration} 秒`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['指标', '数值']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    tableWidth: 300,
    margin: { left: 40 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 30;

  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = 50;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('转化漏斗', 40, yPos);
  yPos += 20;

  autoTable(doc, {
    startY: yPos,
    head: [['步骤', '用户数', '转化率(%)', '流失率(%)']],
    body: aggregatedResult.funnel.steps.map((s) => [
      s.name,
      s.count.toLocaleString(),
      s.conversionRate.toString(),
      s.dropOffRate.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 40, right: 40 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 30;

  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = 50;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('Cohort 留存分析', 40, yPos);
  yPos += 20;

  autoTable(doc, {
    startY: yPos,
    head: [['Cohort', '用户数', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']],
    body: aggregatedResult.cohort.map((r) => [
      r.cohort,
      r.cohortSize.toLocaleString(),
      `${r.week0}%`,
      r.week1 ? `${r.week1}%` : '-',
      r.week2 ? `${r.week2}%` : '-',
      r.week3 ? `${r.week3}%` : '-',
      r.week4 ? `${r.week4}%` : '-',
      r.week5 ? `${r.week5}%` : '-',
      r.week6 ? `${r.week6}%` : '-',
      r.week7 ? `${r.week7}%` : '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 40, right: 40 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 30;

  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = 50;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('功能热度 Top 10', 40, yPos);
  yPos += 20;

  autoTable(doc, {
    startY: yPos,
    head: [['功能名称', '模块', '用户数', '渗透率(%)']],
    body: aggregatedResult.features.slice(0, 10).map((f) => [
      f.name,
      f.module,
      f.users.toLocaleString(),
      f.adoptionRate.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 40, right: 40 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 30;

  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = 50;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('流失原因分析', 40, yPos);
  yPos += 20;

  autoTable(doc, {
    startY: yPos,
    head: [['流失原因', '数量', '占比(%)']],
    body: aggregatedResult.churn.map((r) => [r.reason, r.count.toLocaleString(), `${r.percentage}%`]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 40, right: 200 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by SaaS Retention Analytics Platform | 第 ${i} 页 / 共 ${pageCount} 页`,
      pageWidth / 2,
      pageHeight - 30,
      { align: 'center' }
    );
  }

  return doc.output('blob');
};

export const generateCSV = (
  aggregatedResult: AggregatedResult,
  _filters: FilterDimensions,
  dateRange: DateRange
): Blob => {
  const rows: string[][] = [];

  rows.push(['SaaS 留存分析看板 - 数据导出']);
  rows.push(['导出时间', new Date().toLocaleString('zh-CN')]);
  rows.push(['日期范围', `${dateRange.start} ~ ${dateRange.end}`]);
  rows.push(['查询ID', aggregatedResult.queryId]);
  rows.push([]);

  rows.push(['=== 数据概览 ===']);
  rows.push(['总用户数', aggregatedResult.totalUsers.toString()]);
  rows.push(['激活率(%)', aggregatedResult.summary.activationRate.toString()]);
  rows.push(['付费转化率(%)', aggregatedResult.summary.payConversionRate.toString()]);
  rows.push(['7日平均留存(%)', aggregatedResult.summary.avgRetention7d.toString()]);
  rows.push(['总会话数', aggregatedResult.summary.totalSessions.toString()]);
  rows.push(['平均会话时长(秒)', aggregatedResult.summary.avgSessionDuration.toString()]);
  rows.push([]);

  rows.push(['=== 转化漏斗 ===']);
  rows.push(['步骤', '用户数', '转化率(%)', '流失率(%)']);
  aggregatedResult.funnel.steps.forEach((s) => {
    rows.push([s.name, s.count.toString(), s.conversionRate.toString(), s.dropOffRate.toString()]);
  });
  rows.push([]);

  rows.push(['=== Cohort 留存 ===']);
  rows.push(['Cohort', '用户数', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']);
  aggregatedResult.cohort.forEach((r) => {
    rows.push([
      r.cohort,
      r.cohortSize.toString(),
      r.week0?.toString() || '-',
      r.week1?.toString() || '-',
      r.week2?.toString() || '-',
      r.week3?.toString() || '-',
      r.week4?.toString() || '-',
      r.week5?.toString() || '-',
      r.week6?.toString() || '-',
      r.week7?.toString() || '-',
    ]);
  });
  rows.push([]);

  rows.push(['=== 功能热度 ===']);
  rows.push(['功能名称', '模块', '使用用户数', '会话数', '平均使用时长(秒)', '渗透率(%)', '趋势(%)']);
  aggregatedResult.features.forEach((f) => {
    rows.push([
      f.name,
      f.module,
      f.users.toString(),
      f.sessions.toString(),
      f.avgDuration.toString(),
      f.adoptionRate.toString(),
      f.trend.toString(),
    ]);
  });
  rows.push([]);

  rows.push(['=== 流失原因 ===']);
  rows.push(['原因', '数量', '占比(%)']);
  aggregatedResult.churn.forEach((r) => {
    rows.push([r.reason, r.count.toString(), r.percentage.toString()]);
  });

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const exportTaskManager = {
  tasks: [] as ExportTask[],

  async createExport(
    format: 'csv' | 'xlsx' | 'pdf',
    aggregatedResult: AggregatedResult,
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<ExportTask> {
    const task: ExportTask = {
      id: `export_${Date.now()}`,
      name: `${format.toUpperCase()}_${dateRange.start}_${dateRange.end}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(task);

    try {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

      let blob: Blob;
      let filename: string;
      const timestamp = formatDate(new Date(), 'yyyyMMdd_HHmmss');

      switch (format) {
        case 'xlsx':
          blob = generateStandardExcel(aggregatedResult, filters, dateRange);
          filename = `留存分析报告_${timestamp}.xlsx`;
          break;
        case 'pdf':
          blob = generateStandardPDF(aggregatedResult, filters, dateRange);
          filename = `留存分析报告_${timestamp}.pdf`;
          break;
        case 'csv':
        default:
          blob = generateCSV(aggregatedResult, filters, dateRange);
          filename = `留存分析报告_${timestamp}.csv`;
      }

      downloadBlob(blob, filename);

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      console.error('Export failed:', error);
    }

    return task;
  },

  getTasks(): ExportTask[] {
    return [...this.tasks];
  },
};
