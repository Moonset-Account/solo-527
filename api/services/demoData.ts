import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import metricsConfig from '../data/metrics.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { enterprises, gates, lanes, visitorTypes, abnormalReasons } = metricsConfig as any;

const PROVINCE_PREFIXES = ['粤B', '粤A', '沪A', '京A', '浙A', '苏A', '川A', '鄂A'];
const OPERATORS = ['李安保', '王队长', '张执勤', '刘班长', '陈值班'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padZero(num: number, len: number = 2): string {
  return num.toString().padStart(len, '0');
}

function generatePlateNumber(): string {
  const prefix = randomChoice(PROVINCE_PREFIXES);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '0123456789';
  let plate = '';
  for (let i = 0; i < 5; i++) {
    plate += Math.random() > 0.5 ? randomChoice(chars.split('')) : randomChoice(digits.split(''));
  }
  return `${prefix}${plate}`;
}

function generateIdCard(): string {
  const areaCodes = ['440301', '440305', '440306', '310101', '110101', '330102'];
  const area = randomChoice(areaCodes);
  const year = randomInt(1970, 2000);
  const month = padZero(randomInt(1, 12));
  const day = padZero(randomInt(1, 28));
  const seq = padZero(randomInt(1, 999), 3);
  const check = randomInt(0, 9);
  return `${area}${year}${month}${day}${seq}${check}`;
}

function getVisitorWeight(hour: number, isWeekend: boolean): number {
  if (isWeekend) {
    if (hour >= 10 && hour <= 16) return 0.6;
    if (hour >= 8 && hour < 10) return 0.3;
    if (hour > 16 && hour <= 18) return 0.3;
    return 0.05;
  }
  if (hour >= 8 && hour < 10) return 1.0;
  if (hour >= 17 && hour < 19) return 0.9;
  if (hour >= 14 && hour < 17) return 0.6;
  if (hour >= 10 && hour < 14) return 0.5;
  if (hour >= 19 && hour < 21) return 0.2;
  return 0.05;
}

export interface VisitorRecord {
  id: string;
  passTime: string;
  passTimestamp: number;
  plateNumber: string;
  idCard: string;
  visitorType: string;
  visitorTypeName: string;
  enterpriseId: string;
  enterpriseName: string;
  gateId: string;
  gateName: string;
  laneId: string;
  laneName: string;
  appointmentId: string | null;
  isAbnormal: boolean;
  abnormalLevel?: 'critical' | 'warning' | 'info';
  abnormalReason?: string;
  remark?: string;
  operator?: string;
}

export interface DemoDataset {
  records: VisitorRecord[];
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    abnormalCount: number;
    remarkCount: number;
  };
}

export function generateDemoData(): DemoDataset {
  const records: VisitorRecord[] = [];
  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let recordId = 1;
  const missingDay = new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  const peakDay = new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000);
  const peakEnterpriseId = 'e003';

  const remarks: Record<string, string> = {};
  const remarkCount = randomInt(40, 60);

  for (let d = 0; d < 30; d++) {
    const currentDate = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const isMissingDay = currentDate.toDateString() === missingDay.toDateString();
    const isPeakDay = currentDate.toDateString() === peakDay.toDateString();

    for (let hour = 0; hour < 24; hour++) {
      if (isMissingDay && hour >= 13 && hour < 14) continue;

      const baseWeight = getVisitorWeight(hour, isWeekend);
      let recordCount = Math.floor(baseWeight * randomInt(40, 80));
      
      if (isPeakDay && hour >= 9 && hour < 12) {
        recordCount = Math.floor(recordCount * 4);
      }

      for (let i = 0; i < recordCount; i++) {
        const minute = randomInt(0, 59);
        const second = randomInt(0, 59);
        const passTime = new Date(currentDate);
        passTime.setHours(hour, minute, second);

        const isAbnormal = Math.random() < (isPeakDay ? 0.08 : 0.03);
        const visitorType = randomChoice(visitorTypes);
        const enterprise = isPeakDay && Math.random() < 0.6 
          ? enterprises.find(e => e.id === peakEnterpriseId)!
          : randomChoice(enterprises);
        const gate = randomChoice(gates);
        const gateLanes = lanes.filter(l => l.gateId === gate.id);
        const lane = gateLanes.length > 0 ? randomChoice(gateLanes) : lanes[0];

        const record: VisitorRecord = {
          id: `rec${padZero(recordId, 6)}`,
          passTime: passTime.toISOString(),
          passTimestamp: passTime.getTime(),
          plateNumber: gate.isVehicle ? generatePlateNumber() : '',
          idCard: generateIdCard(),
          visitorType: visitorType.id,
          visitorTypeName: visitorType.name,
          enterpriseId: enterprise.id,
          enterpriseName: enterprise.name,
          gateId: gate.id,
          gateName: gate.name,
          laneId: lane.id,
          laneName: lane.name,
          appointmentId: Math.random() > 0.15 ? `apt${padZero(randomInt(1, 99999), 5)}` : null,
          isAbnormal,
        };

        if (isAbnormal) {
          const levelRand = Math.random();
          record.abnormalLevel = levelRand < 0.2 ? 'critical' : levelRand < 0.6 ? 'warning' : 'info';
          record.abnormalReason = randomChoice(abnormalReasons);
          record.operator = randomChoice(OPERATORS);
          
          if (Object.keys(remarks).length < remarkCount && Math.random() < 0.3) {
            const remarkTexts = [
              '已电话联系被访企业确认',
              '安保主管现场核实后放行',
              '该访客为企业重要客户，后续需重点关注',
              '系统故障导致识别失败，人工核实',
              '访客携带大件设备，已安检通过',
              '预约信息填写有误，企业确认身份',
              '高峰期临时增开通道放行',
            ];
            record.remark = randomChoice(remarkTexts);
            remarks[record.id] = record.remark;
          }
        }

        records.push(record);
        recordId++;
      }
    }
  }

  records.sort((a, b) => a.passTimestamp - b.passTimestamp);

  return {
    records,
    summary: {
      totalRecords: records.length,
      dateRange: {
        start: startDate.toISOString(),
        end: today.toISOString(),
      },
      abnormalCount: records.filter(r => r.isAbnormal).length,
      remarkCount: Object.keys(remarks).length,
    },
  };
}

let cachedDataset: DemoDataset | null = null;

export function getDemoDataset(): DemoDataset {
  if (!cachedDataset) {
    cachedDataset = generateDemoData();
    console.log(`[Data] Generated ${cachedDataset.summary.totalRecords} records, ${cachedDataset.summary.abnormalCount} abnormal`);
  }
  return cachedDataset;
}

export function resetDemoData() {
  cachedDataset = null;
}
