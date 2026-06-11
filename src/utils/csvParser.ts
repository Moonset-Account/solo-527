import * as fs from 'fs';
import { ScheduleEntry, ParseResult } from '../types';

export function parseScheduleCsv(filePath: string): ParseResult<ScheduleEntry[]> {
  const errors: string[] = [];
  const entries: ScheduleEntry[] = [];

  if (!fs.existsSync(filePath)) {
    return { data: [], errors, fatalError: `排班表文件不存在: ${filePath}` };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      return { data: [], errors, fatalError: '排班表文件为空' };
    }

    const headers = parseCsvLine(lines[0]);
    const headerMap = mapHeaders(headers);

    if (headerMap.date === undefined || headerMap.agentId === undefined ||
        headerMap.shiftStart === undefined || headerMap.shiftEnd === undefined) {
      return { data: [], errors, fatalError: '排班表表头缺少必要列（日期/坐席ID/上班时间/下班时间）' };
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length < headers.length) {
        errors.push(`第 ${i + 1} 行数据列数不匹配，跳过`);
        continue;
      }

      try {
        const entry = parseScheduleRow(values, headerMap, i + 1);
        entries.push(entry);
      } catch (err) {
        if (err instanceof Error) {
          errors.push(`第 ${i + 1} 行: ${err.message}`);
        }
      }
    }

    if (entries.length === 0 && lines.length > 1) {
      return { data: [], errors, fatalError: '排班表无有效排班记录（所有行解析失败）' };
    }
  } catch (err) {
    if (err instanceof Error) {
      return { data: [], errors, fatalError: `读取排班表失败: ${err.message}` };
    }
  }

  return { data: entries, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    if (normalized.includes('日期') || normalized.includes('date')) {
      map.date = index;
    } else if (normalized.includes('坐席') || normalized.includes('agent') || normalized.includes('id')) {
      if (normalized.includes('姓名') || normalized.includes('name')) {
        map.agentName = index;
      } else {
        map.agentId = index;
      }
    } else if (normalized.includes('姓名') || normalized.includes('name')) {
      map.agentName = index;
    } else if (normalized.includes('上班') || normalized.includes('start') || normalized.includes('签到')) {
      map.shiftStart = index;
    } else if (normalized.includes('下班') || normalized.includes('end') || normalized.includes('签退')) {
      map.shiftEnd = index;
    } else if (normalized.includes('组') || normalized.includes('team') || normalized.includes('部门')) {
      map.team = index;
    }
  });
  return map;
}

function parseScheduleRow(
  values: string[],
  headerMap: Record<string, number>,
  lineNum: number
): ScheduleEntry {
  const date = values[headerMap.date]?.trim();
  const agentId = values[headerMap.agentId]?.trim();
  const agentName = values[headerMap.agentName]?.trim();
  const shiftStart = values[headerMap.shiftStart]?.trim();
  const shiftEnd = values[headerMap.shiftEnd]?.trim();
  const team = values[headerMap.team]?.trim() || '未分组';

  if (!date) throw new Error('日期不能为空');
  if (!agentId) throw new Error('坐席ID不能为空');
  if (!shiftStart) throw new Error('上班时间不能为空');
  if (!shiftEnd) throw new Error('下班时间不能为空');

  const formattedDate = formatDate(date);
  if (!formattedDate) {
    throw new Error(`日期格式不正确: ${date}`);
  }

  return {
    date: formattedDate,
    agentId: agentId.toUpperCase(),
    agentName: agentName || agentId,
    shiftStart: formatTime(shiftStart),
    shiftEnd: formatTime(shiftEnd),
    team,
  };
}

function formatDate(dateStr: string): string | null {
  const patterns = [
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
    /^(\d{4})(\d{2})(\d{2})$/,
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let year, month, day;
      if (pattern === patterns[2]) {
        [, month, day, year] = match;
      } else {
        [, year, month, day] = match;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return null;
}

function formatTime(timeStr: string): string {
  const patterns = [
    /^(\d{1,2}):(\d{2})(:(\d{2}))?$/,
    /^(\d{1,2})\.(\d{2})$/,
    /^(\d{2})(\d{2})$/,
  ];

  for (const pattern of patterns) {
    const match = timeStr.match(pattern);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2].padStart(2, '0');
      const seconds = match[4] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }
  }
  return timeStr;
}
