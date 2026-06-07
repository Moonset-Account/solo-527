import type {
  Measurement,
  MonitoringSite,
  MeasurementQuery,
  OverviewStats,
  TrendData,
  QualityCheckResult,
  WaterQualityGrade,
  TrendPoint,
} from '../types';
import { INDICATORS, WATER_QUALITY_GRADES } from './constants';
import { MOCK_SITES, MOCK_MEASUREMENTS } from './mockData';

export function getWaterQualityGrade(
  indicatorCode: string,
  value: number | null
): WaterQualityGrade | null {
  if (value === null) return null;
  const indicator = INDICATORS.find((i) => i.code === indicatorCode);
  if (!indicator) return null;

  const thresholds = indicator.gradeThresholds;
  const grades: WaterQualityGrade[] = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', '劣Ⅴ'];

  if (indicatorCode === 'dissolvedOxygen') {
    for (let i = 0; i < grades.length; i++) {
      if (value >= thresholds[grades[i]]) {
        return grades[i];
      }
    }
    return '劣Ⅴ';
  } else {
    for (let i = 0; i < grades.length; i++) {
      if (value <= thresholds[grades[i]]) {
        return grades[i];
      }
    }
    return '劣Ⅴ';
  }
}

export function isValueCompliant(indicatorCode: string, value: number | null): boolean {
  if (value === null) return false;
  const indicator = INDICATORS.find((i) => i.code === indicatorCode);
  if (!indicator) return false;
  return value >= indicator.standardMin && value <= indicator.standardMax;
}

export function filterMeasurements(
  measurements: Measurement[],
  query: MeasurementQuery,
  sites: MonitoringSite[]
): Measurement[] {
  return measurements.filter((m) => {
    if (query.siteIds && query.siteIds.length > 0 && !query.siteIds.includes(m.siteId)) {
      return false;
    }
    if (query.riverSections && query.riverSections.length > 0) {
      const site = sites.find((s) => s.id === m.siteId);
      if (!site || !query.riverSections.includes(site.riverSection)) {
        return false;
      }
    }
    if (query.organizations && query.organizations.length > 0) {
      if (!query.organizations.includes(m.organization)) {
        return false;
      }
    }
    if (query.startDate) {
      if (new Date(m.sampleTime) < new Date(query.startDate)) {
        return false;
      }
    }
    if (query.endDate) {
      if (new Date(m.sampleTime) > new Date(query.endDate)) {
        return false;
      }
    }
    if (query.dataSource && query.dataSource !== 'all') {
      if (m.dataSource !== query.dataSource) {
        return false;
      }
    }
    if (query.onlyAnomalies && !m.isAnomaly) {
      return false;
    }
    return true;
  });
}

export function calculateOverviewStats(
  sites: MonitoringSite[],
  measurements: Measurement[]
): OverviewStats {
  const activeSites = sites.filter((s) => s.status === 'active');
  const anomalies = measurements.filter((m) => m.isAnomaly);

  let compliantCount = 0;
  let totalValues = 0;

  INDICATORS.forEach((ind) => {
    measurements.forEach((m) => {
      const value = m[ind.code as keyof Measurement] as number | null;
      if (value !== null) {
        totalValues++;
        if (isValueCompliant(ind.code, value)) {
          compliantCount++;
        }
      }
    });
  });

  const riverSectionStats = [...new Set(sites.map((s) => s.riverSection))].map(
    (section) => {
      const sectionSites = sites.filter((s) => s.riverSection === section);
      const sectionMeasurements = measurements.filter((m) =>
        sectionSites.some((s) => s.id === m.siteId)
      );
      const sectionAnomalies = sectionMeasurements.filter((m) => m.isAnomaly);

      let totalDO = 0;
      let doCount = 0;
      sectionMeasurements.forEach((m) => {
        if (m.dissolvedOxygen !== null) {
          totalDO += m.dissolvedOxygen;
          doCount++;
        }
      });

      const avgDO = doCount > 0 ? totalDO / doCount : null;
      const avgGrade = getWaterQualityGrade('dissolvedOxygen', avgDO) || 'Ⅲ';

      return {
        name: section,
        siteCount: sectionSites.length,
        avgGrade,
        anomalyCount: sectionAnomalies.length,
      };
    }
  );

  const indicatorStats = INDICATORS.map((ind) => {
    const indMeasurements = measurements.filter(
      (m) => m[ind.code as keyof Measurement] !== null
    );
    const values = indMeasurements.map(
      (m) => m[ind.code as keyof Measurement] as number
    );
    const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const compliant = values.filter((v) => isValueCompliant(ind.code, v)).length;
    const indAnomalies = indMeasurements.filter((m) => m.isAnomaly).length;

    return {
      code: ind.code,
      name: ind.name,
      avgValue,
      complianceRate: values.length > 0 ? (compliant / values.length) * 100 : 0,
      anomalyCount: indAnomalies,
      unit: ind.unit,
    };
  });

  const recentAnomalies = anomalies.slice(0, 5).map((m) => {
    const site = sites.find((s) => s.id === m.siteId);
    const anomalyIndicator = INDICATORS.find((ind) => {
      const val = m[ind.code as keyof Measurement] as number | null;
      return val !== null && !isValueCompliant(ind.code, val);
    });

    return {
      id: m.id,
      siteName: site?.name || '未知站点',
      indicator: anomalyIndicator?.name || '多指标异常',
      value: anomalyIndicator
        ? (m[anomalyIndicator.code as keyof Measurement] as number)
        : 0,
      sampleTime: m.sampleTime,
      reason: m.anomalyReason,
    };
  });

  return {
    totalSites: activeSites.length,
    totalRecords: measurements.length,
    anomalyCount: anomalies.length,
    complianceRate: totalValues > 0 ? (compliantCount / totalValues) * 100 : 0,
    latestDataTime: measurements[0]?.sampleTime || new Date().toISOString(),
    indicators: indicatorStats,
    riverSections: riverSectionStats,
    recentAnomalies,
  };
}

export function calculateTrendData(
  measurements: Measurement[],
  indicatorCode: string,
  dataSource: 'manual' | 'automatic',
  siteName?: string
): TrendData {
  const indicator = INDICATORS.find((i) => i.code === indicatorCode);
  if (!indicator) {
    return {
      indicator: indicatorCode,
      indicatorName: indicatorCode,
      unit: '',
      dataSource,
      siteName,
      points: [],
    };
  }

  const filtered = measurements
    .filter((m) => m.dataSource === dataSource)
    .sort((a, b) => new Date(a.sampleTime).getTime() - new Date(b.sampleTime).getTime());

  const points: TrendPoint[] = filtered.map((m) => ({
    time: m.sampleTime,
    value: m[indicatorCode as keyof Measurement] as number | null,
    isAnomaly: m.isAnomaly,
    note: m.note || m.anomalyReason,
  }));

  return {
    indicator: indicatorCode,
    indicatorName: indicator.name,
    unit: indicator.unit,
    dataSource,
    siteName,
    points,
  };
}

export function runQualityCheck(
  measurements: Measurement[],
  sites: MonitoringSite[]
): QualityCheckResult {
  const missingValues = {
    temperature: 0,
    ph: 0,
    dissolvedOxygen: 0,
    ammoniaNitrogen: 0,
    rainfall: 0,
  };

  measurements.forEach((m) => {
    if (m.temperature === null) missingValues.temperature++;
    if (m.ph === null) missingValues.ph++;
    if (m.dissolvedOxygen === null) missingValues.dissolvedOxygen++;
    if (m.ammoniaNitrogen === null) missingValues.ammoniaNitrogen++;
    if (m.rainfall === null) missingValues.rainfall++;
  });

  const sampleCountBySite: Record<string, number> = {};
  sites.forEach((site) => {
    sampleCountBySite[site.name] = measurements.filter((m) => m.siteId === site.id).length;
  });

  const sampleCountByMonth: Record<string, number> = {};
  measurements.forEach((m) => {
    const month = m.sampleTime.substring(0, 7);
    sampleCountByMonth[month] = (sampleCountByMonth[month] || 0) + 1;
  });

  return {
    totalRecords: measurements.length,
    missingValues,
    anomalyCount: measurements.filter((m) => m.isAnomaly).length,
    sampleCountBySite,
    sampleCountByMonth,
  };
}

export function measurementsToCSV(measurements: Measurement[], sites: MonitoringSite[]): string {
  const headers = [
    '采样时间',
    '站点名称',
    '站点编码',
    '所属河段',
    '采样机构',
    '数据来源',
    '水温(°C)',
    'pH值',
    '溶解氧(mg/L)',
    '氨氮(mg/L)',
    '降雨量(mm)',
    '是否异常',
    '异常原因',
    '备注',
    '采样员',
  ];

  const rows = measurements.map((m) => {
    const site = sites.find((s) => s.id === m.siteId);
    return [
      new Date(m.sampleTime).toLocaleString('zh-CN'),
      site?.name || '',
      site?.code || '',
      site?.riverSection || '',
      m.organization,
      m.dataSource === 'manual' ? '人工采样' : '自动站',
      m.temperature?.toString() || '',
      m.ph?.toString() || '',
      m.dissolvedOxygen?.toString() || '',
      m.ammoniaNitrogen?.toString() || '',
      m.rainfall?.toString() || '',
      m.isAnomaly ? '是' : '否',
      m.anomalyReason || '',
      m.note || '',
      m.sampledBy || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export { MOCK_SITES, MOCK_MEASUREMENTS };
