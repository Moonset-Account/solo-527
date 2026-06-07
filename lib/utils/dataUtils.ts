import type { OverviewStats, QualityCheckResult, Measurement, MonitoringSite, WaterQualityGrade } from '@/types';
import { INDICATORS, WATER_QUALITY_GRADES } from './constants';

export function calculateWaterQualityGrade(
  temperature: number | null,
  ph: number | null,
  dissolvedOxygen: number | null,
  ammoniaNitrogen: number | null
): WaterQualityGrade {
  let worstGrade: WaterQualityGrade = 'Ⅰ';

  if (dissolvedOxygen !== null) {
    if (dissolvedOxygen >= 7.5) worstGrade = worstGrade > 'Ⅰ' ? worstGrade : 'Ⅰ';
    else if (dissolvedOxygen >= 6) worstGrade = worstGrade > 'Ⅱ' ? worstGrade : 'Ⅱ';
    else if (dissolvedOxygen >= 5) worstGrade = worstGrade > 'Ⅲ' ? worstGrade : 'Ⅲ';
    else if (dissolvedOxygen >= 3) worstGrade = worstGrade > 'Ⅳ' ? worstGrade : 'Ⅳ';
    else if (dissolvedOxygen >= 2) worstGrade = worstGrade > 'Ⅴ' ? worstGrade : 'Ⅴ';
    else worstGrade = '劣Ⅴ';
  }

  if (ammoniaNitrogen !== null) {
    if (ammoniaNitrogen <= 0.15) worstGrade = worstGrade > 'Ⅰ' ? worstGrade : 'Ⅰ';
    else if (ammoniaNitrogen <= 0.5) worstGrade = worstGrade > 'Ⅱ' ? worstGrade : 'Ⅱ';
    else if (ammoniaNitrogen <= 1.0) worstGrade = worstGrade > 'Ⅲ' ? worstGrade : 'Ⅲ';
    else if (ammoniaNitrogen <= 1.5) worstGrade = worstGrade > 'Ⅳ' ? worstGrade : 'Ⅳ';
    else if (ammoniaNitrogen <= 2.0) worstGrade = worstGrade > 'Ⅴ' ? worstGrade : 'Ⅴ';
    else worstGrade = '劣Ⅴ';
  }

  return worstGrade;
}

export function isValueAnomaly(code: string, value: number | null): boolean {
  if (value === null) return false;
  const indicator = INDICATORS.find(i => i.code === code);
  if (!indicator) return false;

  switch (code) {
    case 'temperature':
      return value > indicator.standard;
    case 'ph':
      return value < 6 || value > indicator.standard;
    case 'dissolvedOxygen':
      return value < indicator.standard;
    case 'ammoniaNitrogen':
      return value > indicator.standard;
    default:
      return false;
  }
}

export function calculateOverviewStats(
  sites: MonitoringSite[],
  measurements: Measurement[]
): OverviewStats {
  const totalRecords = measurements.length;
  const anomalyCount = measurements.filter(m => m.isAnomaly).length;

  let compliantCount = 0;
  measurements.forEach(m => {
    if (!m.isAnomaly) compliantCount++;
  });
  const complianceRate = totalRecords > 0 ? (compliantCount / totalRecords) * 100 : 100;

  const latestDataTime = measurements.length > 0
    ? measurements.reduce((latest, m) =>
        new Date(m.sampleTime) > new Date(latest.sampleTime) ? m : latest
      ).sampleTime
    : new Date().toISOString();

  const indicators = INDICATORS.map(indicator => {
    const values = measurements
      .map(m => (m as any)[indicator.code] as number | null)
      .filter(v => v !== null) as number[];

    const avgValue = values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : null;

    const compliantValues = values.filter(v => !isValueAnomaly(indicator.code, v));
    const indicatorComplianceRate = values.length > 0
      ? (compliantValues.length / values.length) * 100
      : 100;

    return {
      code: indicator.code,
      name: indicator.name,
      unit: indicator.unit,
      avgValue: avgValue !== null ? Number(avgValue.toFixed(2)) : null,
      complianceRate: Number(indicatorComplianceRate.toFixed(1)),
    };
  });

  const riverSectionMap = new Map<string, { sites: MonitoringSite[]; grades: WaterQualityGrade[]; anomalyCount: number }>();

  sites.forEach(site => {
    if (!riverSectionMap.has(site.riverSection)) {
      riverSectionMap.set(site.riverSection, { sites: [], grades: [], anomalyCount: 0 });
    }
    riverSectionMap.get(site.riverSection)!.sites.push(site);
  });

  measurements.forEach(m => {
    const site = sites.find(s => s.id === m.siteId);
    if (!site) return;
    const sectionData = riverSectionMap.get(site.riverSection);
    if (!sectionData) return;

    const grade = calculateWaterQualityGrade(m.temperature, m.ph, m.dissolvedOxygen, m.ammoniaNitrogen);
    sectionData.grades.push(grade);

    if (m.isAnomaly) {
      sectionData.anomalyCount++;
    }
  });

  const gradeOrder: WaterQualityGrade[] = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', '劣Ⅴ'];
  const riverSections = Array.from(riverSectionMap.entries()).map(([name, data]) => {
    const avgGrade = data.grades.length > 0
      ? data.grades.reduce((worst, g) => gradeOrder.indexOf(g) > gradeOrder.indexOf(worst) ? g : worst, 'Ⅰ')
      : 'Ⅰ';

    return {
      name,
      siteCount: data.sites.length,
      avgGrade,
      anomalyCount: data.anomalyCount,
    };
  });

  const recentAnomalies = measurements
    .filter(m => m.isAnomaly)
    .sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime())
    .slice(0, 5)
    .map(m => {
      const site = sites.find(s => s.id === m.siteId);
      const anomalyIndicator = INDICATORS.find(i => isValueAnomaly(i.code, (m as any)[i.code] as number | null));

      return {
        id: m.id,
        siteId: m.siteId,
        siteName: site?.name || '未知站点',
        indicator: anomalyIndicator?.name || '异常',
        sampleTime: m.sampleTime,
        reason: m.anomalyReason,
      };
    });

  return {
    totalSites: sites.length,
    totalRecords,
    anomalyCount,
    complianceRate: Number(complianceRate.toFixed(1)),
    latestDataTime,
    indicators,
    riverSections,
    recentAnomalies,
  };
}

export function checkDataQuality(
  measurements: Measurement[],
  sites: MonitoringSite[]
): QualityCheckResult {
  const totalRecords = measurements.length;
  const anomalyCount = measurements.filter(m => m.isAnomaly).length;

  const missingValues = {
    temperature: measurements.filter(m => m.temperature === null).length,
    ph: measurements.filter(m => m.ph === null).length,
    dissolvedOxygen: measurements.filter(m => m.dissolvedOxygen === null).length,
    ammoniaNitrogen: measurements.filter(m => m.ammoniaNitrogen === null).length,
  };

  const monthlyMap = new Map<string, number>();
  measurements.forEach(m => {
    const month = m.sampleTime.substring(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
  });
  const monthlySamples = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const siteCountMap = new Map<string, number>();
  measurements.forEach(m => {
    siteCountMap.set(m.siteId, (siteCountMap.get(m.siteId) || 0) + 1);
  });

  const siteSampleCounts = Array.from(siteCountMap.entries())
    .map(([siteId, count]) => {
      const site = sites.find(s => s.id === siteId);
      return { siteName: site?.name || siteId, count };
    })
    .sort((a, b) => b.count - a.count);

  const siteMissingRates = sites.map(site => {
    const siteMeasurements = measurements.filter(m => m.siteId === site.id);
    const total = siteMeasurements.length;
    const missingCount = siteMeasurements.filter(m =>
      m.temperature === null || m.ph === null ||
      m.dissolvedOxygen === null || m.ammoniaNitrogen === null
    ).length;

    return {
      siteName: site.name,
      missingRate: total > 0 ? Number(((missingCount / total) * 100).toFixed(1)) : 0,
      total,
    };
  }).sort((a, b) => b.missingRate - a.missingRate);

  return {
    totalRecords,
    anomalyCount,
    missingValues,
    monthlySamples,
    siteSampleCounts,
    siteMissingRates,
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null) return '-';
  return value.toFixed(decimals);
}
