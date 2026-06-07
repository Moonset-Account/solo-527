import { randomUUID } from 'crypto';
import { getExportData } from './clickhouse.js';
import type { FilterParams } from './clickhouse.js';
import * as XLSX from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportTask {
  taskId: string;
  status: ExportStatus;
  format: ExportFormat;
  params: FilterParams;
  createdAt: number;
  completedAt?: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
  downloadUrl?: string;
}

const tasks: Map<string, ExportTask> = new Map();
const results: Map<string, Buffer> = new Map();

function desensitizePlate(plate: string): string {
  if (!plate || plate.length < 4) return plate;
  return plate.slice(0, 4) + '***';
}

function desensitizeIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.slice(0, 3) + '***********' + idCard.slice(-4);
}

async function processTask(task: ExportTask) {
  try {
    task.status = 'processing';
    tasks.set(task.taskId, task);

    const data = await getExportData(task.params);

    const exportRows = data.map(r => ({
      '时间': new Date(r.passTime).toLocaleString('zh-CN'),
      '车牌号码': desensitizePlate(r.plateNumber),
      '证件号码': desensitizeIdCard(r.idCard),
      '访客类型': r.visitorTypeName,
      '入口': r.gateName,
      '车道': r.laneName,
      '被访企业': r.enterpriseName,
      '是否异常': r.isAbnormal ? '是' : '否',
      '异常原因': r.abnormalReason || '',
      '操作员': r.operator || '',
      '备注': r.remark || '',
    }));

    let buffer: Buffer;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (task.format === 'csv') {
      const headers = Object.keys(exportRows[0] || {}).join(',');
      const rows = exportRows.map(row =>
        Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      const csv = '\uFEFF' + [headers, ...rows].join('\n');
      buffer = Buffer.from(csv, 'utf-8');
      task.fileName = `访客流量分析_${timestamp}.csv`;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '访客记录');
      buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      task.fileName = `访客流量分析_${timestamp}.xlsx`;
    }

    results.set(task.taskId, buffer);
    task.fileSize = buffer.length;
    task.status = 'completed';
    task.completedAt = Date.now();
    task.downloadUrl = `/api/export/${task.taskId}/download`;
    tasks.set(task.taskId, task);

  } catch (err: any) {
    task.status = 'failed';
    task.error = err.message;
    tasks.set(task.taskId, task);
  }
}

export function createExportTask(format: ExportFormat, params: FilterParams): ExportTask {
  const task: ExportTask = {
    taskId: randomUUID(),
    status: 'pending',
    format,
    params,
    createdAt: Date.now(),
  };
  tasks.set(task.taskId, task);
  setTimeout(() => processTask(task), 100);
  return task;
}

export function getTaskStatus(taskId: string): ExportTask | undefined {
  return tasks.get(taskId);
}

export function getExportFile(taskId: string): { buffer: Buffer; fileName: string } | null {
  const task = tasks.get(taskId);
  const buffer = results.get(taskId);
  if (!task || !buffer || task.status !== 'completed') return null;
  return { buffer, fileName: task.fileName || 'export' };
}

export function listTasks(): ExportTask[] {
  return Array.from(tasks.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);
}
