import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { Team, Player, Match, Standing, ImportExportTask, Venue, Season } from '@/lib/db/models';
import connectDB from '@/lib/db/connect';
import type { ImportExportEntity } from '@/lib/types';
import { randomUUID } from 'crypto';

interface ImportRecord {
  row: number;
  data: any;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  importErrors: Array<{ row: number; message: string }>;
}

export async function createImportTask(
  entity: ImportExportEntity,
  fileBuffer: Buffer,
  fileName: string,
  createdBy: string
): Promise<string> {
  const batchId = randomUUID();
  
  const task = await ImportExportTask.create({
    type: 'IMPORT',
    entity,
    status: 'PENDING',
    fileName,
    batchId,
    totalRecords: 0,
    processedRecords: 0,
    progress: 0,
    errors: [],
    createdBy,
  });

  processImport(task._id.toString(), fileBuffer, entity, batchId).catch(console.error);

  return task._id.toString();
}

export async function processImport(
  taskId: string,
  fileBuffer: Buffer,
  entity: ImportExportEntity,
  batchId: string
): Promise<ImportResult> {
  await connectDB();
  
  const session = await (await import('mongoose')).startSession();
  
  try {
    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'PROCESSING',
      progress: 5,
    });

    const records = await parseImportFile(fileBuffer, entity);
    
    await ImportExportTask.findByIdAndUpdate(taskId, {
      totalRecords: records.length,
      progress: 20,
    });

    session.startTransaction();

    const result: ImportResult = {
      total: records.length,
      successful: 0,
      failed: 0,
      importErrors: []
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        await importRecord(record.data, entity, batchId);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.importErrors.push({
          row: record.row,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const progress = Math.floor(20 + ((i + 1) / records.length) * 70);
      await ImportExportTask.findByIdAndUpdate(taskId, {
        processedRecords: i + 1,
        progress,
      });
    }

    if (result.failed > 0 && result.successful === 0) {
      await session.abortTransaction();
      await ImportExportTask.findByIdAndUpdate(taskId, {
        status: 'FAILED',
        progress: 100,
        importErrors: result.importErrors,
      });
      return result;
    }

    await session.commitTransaction();

    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'COMPLETED',
      progress: 100,
      importErrors: result.importErrors,
    });

    return result;
  } catch (error) {
    await session.abortTransaction();
    
    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'FAILED',
      progress: 100,
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }],
    });

    throw error;
  } finally {
    session.endSession();
  }
}

async function parseImportFile(fileBuffer: Buffer, entity: ImportExportEntity): Promise<ImportRecord[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);
  
  const worksheet = workbook.worksheets[0];
  const records: ImportRecord[] = [];
  
  const headers = worksheet.getRow(1).values as string[];
  
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const data: any = {};
    
    headers.forEach((header, index) => {
      if (header && index > 0) {
        data[header.toString().trim()] = row.getCell(index).value;
      }
    });

    if (Object.values(data).some(v => v !== null && v !== undefined && v !== '')) {
      records.push({
        row: i,
        data,
        valid: true,
        errors: []
      });
    }
  }

  return records;
}

async function importRecord(data: any, entity: ImportExportEntity, batchId: string): Promise<void> {
  const currentSeason = await Season.findOne({ status: 'ONGOING' }).sort({ createdAt: -1 });
  const seasonId = currentSeason?._id;

  switch (entity) {
    case 'TEAMS':
      await Team.create([{
        seasonId,
        name: data['队名'],
        city: data['城市'],
        coach: data['教练'],
        contactName: data['联系人'],
        contactPhone: data['联系电话'],
        status: 'APPROVED',
      }]);
      break;

    case 'PLAYERS':
      const team = await Team.findOne({ name: data['球队名'], seasonId });
      if (!team) throw new Error(`球队不存在: ${data['球队名']}`);
      
      await Player.create([{
        teamId: team._id,
        name: data['姓名'],
        idNumber: data['身份证号'],
        jerseyNumber: parseInt(data['球衣号码']),
        position: data['位置'],
        batchId,
      }]);
      break;

    case 'SCHEDULE':
      const homeTeam = await Team.findOne({ name: data['主队'], seasonId });
      const awayTeam = await Team.findOne({ name: data['客队'], seasonId });
      const venue = await Venue.findOne({ name: data['场馆'] });
      
      if (!homeTeam) throw new Error(`主队不存在: ${data['主队']}`);
      if (!awayTeam) throw new Error(`客队不存在: ${data['客队']}`);
      if (!venue) throw new Error(`场馆不存在: ${data['场馆']}`);

      const startTime = new Date(data['比赛时间']);
      
      await Match.create([{
        seasonId,
        round: parseInt(data['轮次']),
        homeTeamId: homeTeam._id,
        awayTeamId: awayTeam._id,
        venueId: venue._id,
        startTime,
        batchId,
      }]);
      break;

    default:
      throw new Error(`Unsupported entity: ${entity}`);
  }
}

export async function rollbackImport(batchId: string): Promise<{ deleted: number }> {
  let deleted = 0;

  const players = await Player.deleteMany({ batchId });
  deleted += players.deletedCount;

  const matches = await Match.deleteMany({ batchId });
  deleted += matches.deletedCount;

  return { deleted };
}

export async function createExportTask(
  entity: ImportExportEntity,
  createdBy: string,
  filters?: any
): Promise<string> {
  const batchId = randomUUID();
  
  const task = await ImportExportTask.create({
    type: 'EXPORT',
    entity,
    status: 'PENDING',
    batchId,
    totalRecords: 0,
    processedRecords: 0,
    progress: 0,
    errors: [],
    createdBy,
  });

  processExport(task._id.toString(), entity, batchId, filters).catch(console.error);

  return task._id.toString();
}

export async function processExport(
  taskId: string,
  entity: ImportExportEntity,
  batchId: string,
  filters?: any
): Promise<string> {
  try {
    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'PROCESSING',
      progress: 10,
    });

    const data = await fetchExportData(entity, filters);
    
    await ImportExportTask.findByIdAndUpdate(taskId, {
      totalRecords: data.length,
      progress: 50,
    });

    const workbook = generateExcelExport(data, entity);
    const fileName = `${entity}_${batchId}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'public', 'exports');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/exports/${fileName}`;

    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'COMPLETED',
      progress: 100,
      fileUrl,
      fileName,
      processedRecords: data.length,
    });

    return fileUrl;
  } catch (error) {
    await ImportExportTask.findByIdAndUpdate(taskId, {
      status: 'FAILED',
      progress: 100,
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Export failed' }],
    });

    throw error;
  }
}

async function fetchExportData(entity: ImportExportEntity, filters?: any): Promise<any[]> {
  const currentSeason = await Season.findOne({ status: 'ONGOING' }).sort({ createdAt: -1 });
  const seasonId = filters?.seasonId || currentSeason?._id;

  switch (entity) {
    case 'TEAMS':
      return Team.find({ seasonId, ...filters }).lean();
    case 'PLAYERS':
      return Player.find().populate('teamId', 'name').lean();
    case 'SCHEDULE':
      return Match.find({ seasonId, ...filters })
        .populate('homeTeamId', 'name')
        .populate('awayTeamId', 'name')
        .populate('venueId', 'name')
        .lean();
    case 'SCORES':
      return Match.find({ seasonId, status: 'FINISHED', ...filters })
        .populate('homeTeamId', 'name')
        .populate('awayTeamId', 'name')
        .lean();
    case 'STANDINGS':
      return Standing.find({ seasonId, ...filters })
        .populate('teamId', 'name city')
        .sort({ rank: 1 })
        .lean();
    default:
      return [];
  }
}

function generateExcelExport(data: any[], entity: ImportExportEntity): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(entity);

  const columns = getExportColumns(entity);
  worksheet.columns = columns;

  data.forEach((row, index) => {
    const formattedRow = formatExportRow(row, entity);
    worksheet.addRow(formattedRow);
    
    if (index % 2 === 0) {
      worksheet.getRow(index + 2).eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      });
    }
  });

  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  return workbook;
}

function getExportColumns(entity: ImportExportEntity): any[] {
  switch (entity) {
    case 'TEAMS':
      return [
        { header: '排名', key: 'rank', width: 8 },
        { header: '队名', key: 'name', width: 20 },
        { header: '城市', key: 'city', width: 15 },
        { header: '教练', key: 'coach', width: 12 },
        { header: '联系人', key: 'contactName', width: 12 },
        { header: '状态', key: 'status', width: 10 },
      ];
    case 'STANDINGS':
      return [
        { header: '排名', key: 'rank', width: 8 },
        { header: '球队', key: 'teamName', width: 20 },
        { header: '场次', key: 'played', width: 8 },
        { header: '胜', key: 'won', width: 6 },
        { header: '平', key: 'drawn', width: 6 },
        { header: '负', key: 'lost', width: 6 },
        { header: '得分', key: 'pointsFor', width: 8 },
        { header: '失分', key: 'pointsAgainst', width: 8 },
        { header: '净胜分', key: 'pointDifference', width: 10 },
        { header: '积分', key: 'points', width: 8 },
      ];
    case 'SCHEDULE':
      return [
        { header: '轮次', key: 'round', width: 8 },
        { header: '主队', key: 'homeTeam', width: 20 },
        { header: '客队', key: 'awayTeam', width: 20 },
        { header: '比赛时间', key: 'startTime', width: 20 },
        { header: '场馆', key: 'venue', width: 20 },
        { header: '状态', key: 'status', width: 10 },
      ];
    default:
      return [];
  }
}

function formatExportRow(row: any, entity: ImportExportEntity): any {
  switch (entity) {
    case 'STANDINGS':
      return {
        rank: row.rank,
        teamName: (row.teamId as any)?.name || '',
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointDifference: row.pointDifference,
        points: row.points,
      };
    case 'SCHEDULE':
      return {
        round: row.round,
        homeTeam: (row.homeTeamId as any)?.name || '',
        awayTeam: (row.awayTeamId as any)?.name || '',
        startTime: new Date(row.startTime).toLocaleString(),
        venue: (row.venueId as any)?.name || '',
        status: row.status,
      };
    default:
      return row;
  }
}
