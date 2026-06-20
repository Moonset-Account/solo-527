import ExcelJS from 'exceljs';
import type { KnowledgeHit, Knowledge, SLARule, Trajectory } from '@prisma/client';

export type ExportData = {
  hits?: (KnowledgeHit & { knowledge?: { title: string }; ticket?: { title: string } })[];
  knowledge?: Knowledge[];
  sla?: SLARule[];
  trajectory?: (Trajectory & { operator?: { name: string } })[];
};

export async function exportToExcel(
  data: ExportData,
  sheetName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  let rows: Record<string, unknown>[] = [];
  let headers: string[] = [];

  if (data.hits) {
    headers = ['ID', '知识标题', '工单标题', '匹配度', '匹配关键词', '状态', '筛查人', '创建时间'];
    rows = data.hits.map(hit => ({
      id: hit.id,
      knowledgeTitle: hit.knowledge?.title || '-',
      ticketTitle: hit.ticket?.title || '-',
      matchScore: `${(Number(hit.matchScore) * 100).toFixed(1)}%`,
      keywords: hit.matchKeywords.join(', '),
      status: getStatusText(hit.status),
      screener: hit.screenedBy || '-',
      createdAt: formatDateTime(hit.createdAt),
    }));
  } else if (data.knowledge) {
    headers = ['ID', '标题', '分类', '类型', '状态', '标签', '浏览次数', '有用次数', '创建时间'];
    rows = data.knowledge.map(k => ({
      id: k.id,
      title: k.title,
      category: k.category,
      type: k.type === 'ANSWER' ? '答案' : '教程',
      status: getStatusText(k.status),
      tags: k.tags.join(', '),
      viewCount: k.viewCount,
      usefulCount: k.usefulCount,
      createdAt: formatDateTime(k.createdAt),
    }));
  } else if (data.sla) {
    headers = ['ID', '规则名称', '分类', '响应时间', '解决时间', '状态', '版本', '创建人', '创建时间'];
    rows = data.sla.map(rule => ({
      id: rule.id,
      name: rule.name,
      category: rule.category,
      responseTime: formatMinutes(rule.responseTime),
      resolutionTime: formatMinutes(rule.resolutionTime),
      status: rule.isActive ? '启用' : '禁用',
      version: `v${rule.version}`,
      createdBy: rule.createdBy,
      createdAt: formatDateTime(rule.createdAt),
    }));
  } else if (data.trajectory) {
    headers = ['ID', '工单ID', '动作类型', '描述', '改进动作', '操作人', '创建时间'];
    rows = data.trajectory.map(t => ({
      id: t.id,
      ticketId: t.ticketId,
      actionType: getActionTypeText(t.actionType),
      description: t.description,
      improvementAction: t.improvementAction || '-',
      operator: t.operator?.name || '-',
      createdAt: formatDateTime(t.createdAt),
    }));
  }

  worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/\s+/g, ''), width: 20 }));
  worksheet.addRows(rows);

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e3a5f' },
  };
  worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportToCSV(
  data: ExportData
): Promise<string> {
  let rows: string[][] = [];
  let headers: string[] = [];

  if (data.hits) {
    headers = ['ID', '知识标题', '工单标题', '匹配度', '匹配关键词', '状态', '创建时间'];
    rows = data.hits.map(hit => [
      hit.id,
      hit.knowledge?.title || '-',
      hit.ticket?.title || '-',
      `${(Number(hit.matchScore) * 100).toFixed(1)}%`,
      `"${hit.matchKeywords.join(', ')}"`,
      getStatusText(hit.status),
      formatDateTime(hit.createdAt),
    ]);
  }

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return '\uFEFF' + csvContent;
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: '待审核',
    VALID: '有效命中',
    FALSE_POSITIVE: '误报',
    ACTIVE: '有效',
    INVALID: '已失效',
    PENDING_INVALID: '待失效',
  };
  return map[status] || status;
}

function getActionTypeText(type: string): string {
  const map: Record<string, string> = {
    CREATE: '创建工单',
    STATUS_CHANGE: '状态变更',
    SLA_CHANGE: 'SLA规则变更',
    IMPROVEMENT: '改进措施',
    RESOLVE: '工单解决',
  };
  return map[type] || type;
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
  return `${Math.floor(minutes / 1440)}天`;
}
