import {
  RiverSection,
  SamplingPoint,
  SamplingAgency,
  WaterQualityRecord,
  RainfallRecord,
  IndicatorKey,
  SampleType
} from '@/types';
import { INDICATOR_STANDARDS } from './indicators';

export const RIVER_SECTIONS: RiverSection[] = [
  {
    id: 'section-001',
    name: '上游河段',
    riverName: '清水河',
    coordinates: [[116.3, 39.95], [116.35, 39.93], [116.4, 39.91]]
  },
  {
    id: 'section-002',
    name: '中游河段',
    riverName: '清水河',
    coordinates: [[116.4, 39.91], [116.45, 39.89], [116.5, 39.87]]
  },
  {
    id: 'section-003',
    name: '下游河段',
    riverName: '清水河',
    coordinates: [[116.5, 39.87], [116.55, 39.85], [116.6, 39.83]]
  },
  {
    id: 'section-004',
    name: '支流A',
    riverName: '支流河',
    coordinates: [[116.38, 39.92], [116.42, 39.90], [116.46, 39.88]]
  }
];

export const SAMPLING_AGENCIES: SamplingAgency[] = [
  { id: 'agency-001', name: '市环境监测中心站', contact: '张工 010-12345678' },
  { id: 'agency-002', name: '区环保局监测站', contact: '李工 010-87654321' },
  { id: 'agency-003', name: '第三方检测机构', contact: '王工 010-11112222' }
];

export const SAMPLING_POINTS: SamplingPoint[] = [
  { id: 'point-001', name: '青龙峡入口', sectionId: 'section-001', type: 'auto', lat: 39.95, lng: 116.30, agencyId: 'agency-001' },
  { id: 'point-002', name: '水库出口', sectionId: 'section-001', type: 'manual', lat: 39.93, lng: 116.35, agencyId: 'agency-001' },
  { id: 'point-003', name: '城区断面', sectionId: 'section-002', type: 'auto', lat: 39.91, lng: 116.40, agencyId: 'agency-002' },
  { id: 'point-004', name: '工业园区旁', sectionId: 'section-002', type: 'manual', lat: 39.89, lng: 116.45, agencyId: 'agency-002' },
  { id: 'point-005', name: '污水处理厂出口', sectionId: 'section-003', type: 'auto', lat: 39.87, lng: 116.50, agencyId: 'agency-003' },
  { id: 'point-006', name: '河口感潮区', sectionId: 'section-003', type: 'manual', lat: 39.85, lng: 116.55, agencyId: 'agency-003' },
  { id: 'point-007', name: '支流汇入点', sectionId: 'section-004', type: 'manual', lat: 39.90, lng: 116.42, agencyId: 'agency-001' },
  { id: 'point-008', name: '支流农业区', sectionId: 'section-004', type: 'auto', lat: 39.88, lng: 116.46, agencyId: 'agency-002' }
];

function generateWaterQualityData(): WaterQualityRecord[] {
  const records: WaterQualityRecord[] = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  
  let recordId = 1;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    for (const point of SAMPLING_POINTS) {
      const sampleTypes: SampleType[] = point.type === 'auto' ? ['auto'] : ['manual'];
      
      for (const sampleType of sampleTypes) {
        if (sampleType === 'manual' && Math.random() > 0.3) continue;
        
        const isMissing = Math.random() < 0.05;
        
        const baseSeasonalTemp = 10 + 15 * Math.sin((d.getMonth() / 12) * Math.PI * 2 - Math.PI / 2);
        const temperature = isMissing ? null : Math.round((baseSeasonalTemp + (Math.random() - 0.5) * 8) * 10) / 10;
        
        const ph = isMissing ? null : Math.round((7.5 + (Math.random() - 0.5) * 2.5) * 100) / 100;
        
        const doBase = 8 - 0.15 * Math.abs(baseSeasonalTemp - 20);
        const dissolvedOxygen = isMissing ? null : Math.max(0, Math.round((doBase + (Math.random() - 0.5) * 4) * 10) / 10);
        
        let ammoniaBase = 0.3;
        if (point.id === 'point-004' || point.id === 'point-005') ammoniaBase = 1.2;
        if (point.id === 'point-008') ammoniaBase = 0.8;
        const ammoniaNitrogen = isMissing ? null : Math.max(0, Math.round((ammoniaBase + Math.random() * 1.5) * 100) / 100);
        
        const exceedIndicators: IndicatorKey[] = [];
        let status: 'normal' | 'warning' | 'exceed' = 'normal';
        
        if (!isMissing) {
          const std = INDICATOR_STANDARDS;
          
          if (temperature !== null && std.temperature.standard.max !== null && temperature > std.temperature.standard.max) {
            exceedIndicators.push('temperature');
          }
          if (ph !== null) {
            if ((std.ph.standard.min !== null && ph < std.ph.standard.min) ||
                (std.ph.standard.max !== null && ph > std.ph.standard.max)) {
              exceedIndicators.push('ph');
            }
          }
          if (dissolvedOxygen !== null && std.dissolvedOxygen.standard.min !== null && dissolvedOxygen < std.dissolvedOxygen.standard.min) {
            exceedIndicators.push('dissolvedOxygen');
          }
          if (ammoniaNitrogen !== null && std.ammoniaNitrogen.standard.max !== null && ammoniaNitrogen > std.ammoniaNitrogen.standard.max) {
            exceedIndicators.push('ammoniaNitrogen');
          }
          
          if (exceedIndicators.length > 0) {
            status = 'exceed';
          } else if (
            (ph !== null && (ph < 6.5 || ph > 8.5)) ||
            (dissolvedOxygen !== null && dissolvedOxygen < 6) ||
            (ammoniaNitrogen !== null && ammoniaNitrogen > 1.0)
          ) {
            status = 'warning';
          }
        }
        
        records.push({
          id: `record-${String(recordId++).padStart(5, '0')}`,
          pointId: point.id,
          sampleTime: `${dateStr}T${sampleType === 'auto' ? '12:00:00' : '09:30:00'}`,
          sampleType,
          temperature,
          ph,
          dissolvedOxygen,
          ammoniaNitrogen,
          isMissing,
          status,
          exceedIndicators
        });
      }
    }
  }
  
  return records;
}

function generateRainfallData(): RainfallRecord[] {
  const records: RainfallRecord[] = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  
  let recordId = 1;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth();
    
    let baseRainfall = 5;
    if (month >= 6 && month <= 8) baseRainfall = 20;
    else if (month >= 4 && month <= 5) baseRainfall = 12;
    else if (month >= 9 && month <= 10) baseRainfall = 10;
    
    const hasRain = Math.random() < 0.35;
    
    for (const point of SAMPLING_POINTS) {
      if (hasRain) {
        records.push({
          id: `rain-${String(recordId++).padStart(5, '0')}`,
          pointId: point.id,
          date: dateStr,
          rainfallMm: Math.round((baseRainfall * (0.5 + Math.random())) * 10) / 10
        });
      } else {
        records.push({
          id: `rain-${String(recordId++).padStart(5, '0')}`,
          pointId: point.id,
          date: dateStr,
          rainfallMm: 0
        });
      }
    }
  }
  
  return records;
}

export const WATER_QUALITY_RECORDS = generateWaterQualityData();
export const RAINFALL_RECORDS = generateRainfallData();
