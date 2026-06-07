import type { MonitoringSite, Measurement, User, AnomalyNote } from '../types';
import { RIVER_SECTIONS, ORGANIZATIONS } from './constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomBetween(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDates(startDate: Date, endDate: Date, daysInterval: number): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + daysInterval);
  }
  return dates;
}

export function generateSites(): MonitoringSite[] {
  const sites: MonitoringSite[] = [];
  const siteNames = [
    '江口断面', '水库入口', '大桥下', '污水处理厂出口', '自来水厂取水口',
    '支流汇合口', '生态公园断面', '工业园区下游', '农业区断面', '自然保护区',
    '自动监测站A', '自动监测站B', '自动监测站C', '自动监测站D',
  ];

  const baseLon = 118.7969;
  const baseLat = 32.0603;

  siteNames.forEach((name, index) => {
    const isAutomatic = index >= 10;
    sites.push({
      id: generateId(),
      name,
      code: `WH-${String(index + 1).padStart(3, '0')}`,
      riverSection: randomChoice(RIVER_SECTIONS),
      longitude: baseLon + randomBetween(-0.15, 0.15, 6),
      latitude: baseLat + randomBetween(-0.1, 0.1, 6),
      organization: randomChoice(ORGANIZATIONS),
      type: isAutomatic ? 'automatic' : 'manual',
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      createdAt: new Date(2023, 0, 1).toISOString(),
    });
  });

  return sites;
}

export function generateMeasurements(sites: MonitoringSite[]): Measurement[] {
  const measurements: Measurement[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  sites.forEach((site) => {
    const interval = site.type === 'automatic' ? 1 : 7;
    const dates = generateDates(startDate, endDate, interval);

    dates.forEach((date) => {
      if (Math.random() > 0.12) {
        const baseTemp = 15 + 10 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
        const tempNoise = randomBetween(-3, 3);

        const isAnomaly = Math.random() < 0.08;
        let anomalyReason: string | undefined;

        const measurement: Measurement = {
          id: generateId(),
          siteId: site.id,
          sampleTime: date.toISOString(),
          temperature: Math.random() > 0.05 ? Math.round((baseTemp + tempNoise + randomBetween(-2, 2)) * 10) / 10 : null,
          ph: Math.random() > 0.03 ? randomBetween(6.5, 8.5) : null,
          dissolvedOxygen: Math.random() > 0.04 ? randomBetween(3, 10) : null,
          ammoniaNitrogen: Math.random() > 0.05 ? randomBetween(0.1, 1.8) : null,
          rainfall: Math.random() > 0.4 ? randomBetween(0, 50, 1) : 0,
          dataSource: site.type,
          organization: site.organization,
          isAnomaly: false,
          sampledBy: site.type === 'manual' ? `采样员${Math.floor(Math.random() * 10) + 1}` : undefined,
        };

        if (isAnomaly) {
          const anomalyType = randomChoice(['temperature', 'ph', 'dissolvedOxygen', 'ammoniaNitrogen']);
          const reasons = [
            '上游排污口异常排放',
            '降雨导致面源污染',
            '季节性水温异常',
            '藻类爆发影响',
            '设备故障待复核',
            '农业面源污染',
          ];
          anomalyReason = randomChoice(reasons);
          measurement.isAnomaly = true;
          measurement.anomalyReason = anomalyReason;

          switch (anomalyType) {
            case 'temperature':
              measurement.temperature = randomBetween(32, 38);
              break;
            case 'ph':
              measurement.ph = randomBetween(5, 5.8);
              break;
            case 'dissolvedOxygen':
              measurement.dissolvedOxygen = randomBetween(0.5, 2);
              break;
            case 'ammoniaNitrogen':
              measurement.ammoniaNitrogen = randomBetween(2.5, 5);
              break;
          }
        }

        measurements.push(measurement);
      }
    });
  });

  return measurements.sort((a, b) => 
    new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime()
  );
}

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    role: 'admin',
    organization: '市环境监测中心站',
  },
  {
    id: 'user-2',
    username: 'researcher1',
    role: 'researcher',
    organization: '市环境监测中心站',
  },
  {
    id: 'user-3',
    username: 'researcher2',
    role: 'researcher',
    organization: '省水利科学研究院',
  },
];

export function generateAnomalyNotes(measurements: Measurement[]): AnomalyNote[] {
  const notes: AnomalyNote[] = [];
  const anomalies = measurements.filter((m) => m.isAnomaly);

  anomalies.slice(0, 15).forEach((m) => {
    if (Math.random() > 0.5) {
      notes.push({
        id: generateId(),
        measurementId: m.id,
        userId: randomChoice(MOCK_USERS).id,
        userName: randomChoice(MOCK_USERS).username,
        content: '已现场核查，确认数据属实，已通知相关部门处理。',
        createdAt: new Date().toISOString(),
      });
    }
  });

  return notes;
}

export const MOCK_SITES = generateSites();
export const MOCK_MEASUREMENTS = generateMeasurements(MOCK_SITES);
export const MOCK_ANOMALY_NOTES = generateAnomalyNotes(MOCK_MEASUREMENTS);
