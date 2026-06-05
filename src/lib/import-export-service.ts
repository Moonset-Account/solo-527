import { db } from '@/db';
import { importExportTasks, clients, projects, timeEntries, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

async function ensureExportDir() {
  await fs.mkdir(EXPORT_DIR, { recursive: true });
}

type EntityType = 'clients' | 'projects' | 'time-entries';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  importedIds: string[];
}

interface ExportOptions {
  entity: EntityType;
  format: 'csv' | 'xlsx';
  filters?: Record<string, unknown>;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }

  return data;
}

function parseExcel(buffer: Buffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
  }) as Record<string, string>[];
}

async function importClients(data: Record<string, string>[], createdBy: string): Promise<ImportResult> {
  const result: ImportResult = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [],
    importedIds: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      if (!row['公司名称'] && !row['company_name'] && !row['companyname']) {
        throw new Error(`第 ${i + 1} 行：缺少公司名称`);
      }

      const [client] = await db
        .insert(clients)
        .values({
          companyName: row['公司名称'] || row['company_name'] || row['companyname'] || '',
          contactPerson: row['联系人'] || row['contact_person'] || row['contactperson'] || '',
          phone: row['电话'] || row['phone'] || '',
          address: row['地址'] || row['address'] || '',
        })
        .returning();

      result.importedIds.push(client.id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push((error as Error).message);
    }
  }

  return result;
}

async function importProjects(data: Record<string, string>[], createdBy: string): Promise<ImportResult> {
  const result: ImportResult = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [],
    importedIds: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      if (!row['项目名称'] && !row['项目名'] && !row['name'] && !row['project_name']) {
        throw new Error(`第 ${i + 1} 行：缺少项目名称`);
      }

      const [project] = await db
        .insert(projects)
        .values({
          name: row['项目名称'] || row['项目名'] || row['name'] || row['project_name'] || '',
          description: row['描述'] || row['description'] || '',
          status: (row['状态'] || row['status'] || 'draft') as typeof projects.$inferInsert.status,
          totalAmount: parseFloat(row['金额'] || row['amount'] || row['total_amount'] || '0'),
          startDate: row['开始日期'] || row['start_date'] ? new Date(row['开始日期'] || row['start_date']) : null,
          endDate: row['结束日期'] || row['end_date'] ? new Date(row['结束日期'] || row['end_date']) : null,
          clientId: row['客户ID'] || row['client_id'] || null,
          createdBy,
        })
        .returning();

      result.importedIds.push(project.id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push((error as Error).message);
    }
  }

  return result;
}

async function importTimeEntries(data: Record<string, string>[], userId: string): Promise<ImportResult> {
  const result: ImportResult = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [],
    importedIds: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const duration = parseInt(row['时长(分钟)'] || row['duration'] || row['duration_minutes'] || '0');
      if (duration <= 0) {
        throw new Error(`第 ${i + 1} 行：时长必须大于 0`);
      }

      const projectId = row['项目ID'] || row['project_id'] || row['projectId'];
      if (!projectId) {
        throw new Error(`第 ${i + 1} 行：缺少项目ID`);
      }

      const startTime = new Date(row['开始时间'] || row['start_time'] || row['startTime'] || new Date());
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const [entry] = await db
        .insert(timeEntries)
        .values({
          projectId,
          taskId: row['任务ID'] || row['task_id'] || null,
          userId,
          startTime,
          endTime,
          durationMinutes: duration,
          description: row['描述'] || row['description'] || row['备注'] || '',
          isBillable: (row['是否计费'] || row['is_billable'] || 'true') === 'true',
        })
        .returning();

      result.importedIds.push(entry.id);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push((error as Error).message);
    }
  }

  return result;
}

export async function processImport(
  entity: EntityType,
  fileBuffer: Buffer,
  fileFormat: 'csv' | 'xlsx',
  userId: string
) {
  const taskId = uuidv4();

  await db.insert(importExportTasks).values({
    id: taskId,
    type: 'import',
    entity,
    status: 'processing',
    fileFormat,
    createdBy: userId,
  });

  try {
    let data: Record<string, string>[];

    if (fileFormat === 'csv') {
      data = parseCSV(fileBuffer.toString('utf-8'));
    } else {
      data = parseExcel(fileBuffer);
    }

    let result: ImportResult;

    switch (entity) {
      case 'clients':
        result = await importClients(data, userId);
        break;
      case 'projects':
        result = await importProjects(data, userId);
        break;
      case 'time-entries':
        result = await importTimeEntries(data, userId);
        break;
      default:
        throw new Error(`不支持的实体类型: ${entity}`);
    }

    await db
      .update(importExportTasks)
      .set({
        status: 'completed',
        resultSummary: JSON.stringify(result),
        completedAt: new Date(),
      })
      .where(eq(importExportTasks.id, taskId));

    return { taskId, result };
  } catch (error) {
    await db
      .update(importExportTasks)
      .set({
        status: 'failed',
        resultSummary: JSON.stringify({ error: (error as Error).message }),
        completedAt: new Date(),
      })
      .where(eq(importExportTasks.id, taskId));

    throw error;
  }
}

async function exportToCSV(data: Record<string, unknown>[]): Promise<string> {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerLine = headers.join(',');
  const lines = data.map((row) =>
    headers.map((h) => {
      const value = String(row[h] ?? '');
      return value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );

  return [headerLine, ...lines].join('\n');
}

async function exportToExcel(data: Record<string, unknown>[]): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function processExport(options: ExportOptions, userId: string) {
  await ensureExportDir();

  const taskId = uuidv4();
  const fileName = `${options.entity}_${Date.now()}.${options.format}`;
  const filePath = path.join(EXPORT_DIR, fileName);

  await db.insert(importExportTasks).values({
    id: taskId,
    type: 'export',
    entity: options.entity,
    status: 'processing',
    filePath: fileName,
    fileFormat: options.format,
    createdBy: userId,
  });

  try {
    let data: Record<string, unknown>[] = [];

    switch (options.entity) {
      case 'clients':
        data = await db.query.clients.findMany();
        break;
      case 'projects':
        data = await db.query.projects.findMany();
        break;
      case 'time-entries':
        data = await db.query.timeEntries.findMany();
        break;
    }

    let fileContent: string | Buffer;

    if (options.format === 'csv') {
      fileContent = await exportToCSV(data);
      await fs.writeFile(filePath, fileContent, 'utf-8');
    } else {
      fileContent = await exportToExcel(data);
      await fs.writeFile(filePath, fileContent);
    }

    await db
      .update(importExportTasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        resultSummary: JSON.stringify({ count: data.length }),
      })
      .where(eq(importExportTasks.id, taskId));

    return { taskId, filePath: fileName, count: data.length };
  } catch (error) {
    await db
      .update(importExportTasks)
      .set({
        status: 'failed',
        completedAt: new Date(),
        resultSummary: JSON.stringify({ error: (error as Error).message }),
      })
      .where(eq(importExportTasks.id, taskId));

    throw error;
  }
}

export async function getImportExportTask(taskId: string) {
  return db.query.importExportTasks.findFirst({
    where: eq(importExportTasks.id, taskId),
  });
}

export function getExportFilePath(fileName: string) {
  return path.join(EXPORT_DIR, fileName);
}
