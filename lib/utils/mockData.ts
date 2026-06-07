import type { MonitoringSite, Measurement } from '@/types';
import { RIVER_SECTIONS, ORGANIZATIONS } from './constants';

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function generateDates(startDate: Date, days: number, intervalHours: number): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  const hoursMs = intervalHours * 60 * 60 * 1000;

  for (let i = 0; i < days * 24 / intervalHours; i++) {
    dates.push(new Date(current));
    current.setTime(current.getTime() + hoursMs);
  }

  return dates;
}

export function generateSites(): MonitoringSite[] {
  const sites: MonitoringSite[] = [];
  const baseLongitude = 116.4;
  const baseLatitude = 39.9;

  for (let i = 0; i < 14; i++) {
    const isAutomatic = i % 4 === 0;
    const riverSection = RIVER_SECTIONS[i % RIVER_SECTIONS.length];
    const organization = ORGANIZATIONS[i % ORGANIZATIONS.length];

    sites.push({
      id: `site-${i + 1}`,
      name: `${riverSection.slice(0, 2)}监测站${i + 1}`,
      code: `RIV-${String(i + 1).padStart(3, '0')}`,
      riverSection,
      longitude: baseLongitude + (Math.random() - 0.5) * 0.5,
      latitude: baseLatitude + (Math.random() - 0.5) * 0.3,
      organization,
      type: isAutomatic ? 'automatic' : 'manual',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  return sites;
}

export function generateMeasurements(sites: MonitoringSite[]): Measurement[] {
  const measurements: Measurement[] = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  sites.forEach((site, siteIndex) => {
    const intervalHours = site.type === 'automatic' ? 6 : 72;
    const dates = generateDates(startDate, 180, intervalHours);

    dates.forEach((date, dateIndex) => {
      const missingChance = site.type === 'manual' ? 0.1 : 0.02;
      const isMissing = Math.random() < missingChance;

      if (isMissing) return;

      const isAnomaly = Math.random() < 0.05;

      let temperature = randomBetween(10, 30);
      let ph = randomBetween(6.5, 8.5);
      let dissolvedOxygen = randomBetween(4, 10);
      let ammoniaNitrogen = randomBetween(0.1, 2);
      let rainfall = Math.random() > 0.7 ? randomBetween(0, 30) : null;

      if (isAnomaly) {
        const anomalyType = Math.floor(Math.random() * 4);
        switch (anomalyType) {
          case 0:
            temperature = randomBetween(32, 40);
            break;
          case 1:
            ph = randomBetween(3, 5);
            break;
          case 2:
            dissolvedOxygen = randomBetween(0, 2);
            break;
          case 3:
            ammoniaNitrogen = randomBetween(3, 8);
            break;
        }
      }

      measurements.push({
        id: `meas-${generateId()}`,
        siteId: site.id,
        sampleTime: date.toISOString(),
        temperature: Math.random() > 0.05 ? Number(temperature.toFixed(1)) : null,
        ph: Math.random() > 0.05 ? Number(ph.toFixed(2)) : null,
        dissolvedOxygen: Math.random() > 0.05 ? Number(dissolvedOxygen.toFixed(2)) : null,
        ammoniaNitrogen: Math.random() > 0.05 ? Number(ammoniaNitrogen.toFixed(3)) : null,
        rainfall: rainfall ? Number(rainfall.toFixed(1)) : null,
        dataSource: site.type,
        organization: site.organization,
        isAnomaly,
        anomalyReason: isAnomaly ? ['降雨后', '高温天气', '排污异常', '设备故障'][Math.floor(Math.random() * 4)] : undefined,
        note: dateIndex % 20 === 0 ? '常规采样' : undefined,
        sampledBy: site.type === 'manual' ? ['张三', '李四', '王五'][siteIndex % 3] : undefined,
      });
    });
  });

  return measurements.sort((a, b) =>
    new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime()
  );
}
