import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SensorReading, ExportOptions, FilterState, DataUpdateInfo, Sensor, Greenhouse, MetricConfig } from '$lib/types';
import { SENSOR_TYPE_LABELS, METRIC_CONFIGS } from '$lib/data/dictionary';
import dayjs from 'dayjs';

export async function exportToCSV(
  readings: SensorReading[],
  sensors: Sensor[],
  greenhouses: Greenhouse[],
  options: ExportOptions
): Promise<string> {
  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const greenhouseMap = new Map(greenhouses.map((g) => [g.id, g]));

  const rows = readings.map((r) => {
    const sensor = sensorMap.get(r.sensorId);
    const greenhouse = greenhouseMap.get(r.greenhouseId);
    return {
      采集时间: dayjs(r.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      温室: greenhouse?.name || r.greenhouseId,
      传感器: sensor?.name || r.sensorId,
      指标类型: sensor ? SENSOR_TYPE_LABELS[sensor.type] : '-',
      数值: r.isMissing ? '缺失' : r.value.toFixed(2),
      单位: sensor?.unit || '-',
      数据质量: r.quality === 'good' ? '正常' : r.quality === 'missing' ? '缺失' : r.quality === 'outlier' ? '异常值' : '异常',
      是否缺失: r.isMissing ? '是' : '否',
      是否异常: r.isOutlier ? '是' : '否',
      批次ID: r.batchId || '-'
    };
  });

  let csvContent = '';

  if (options.includeMetadata) {
    csvContent += generateMetadataHeader(options);
    csvContent += '\n\n';
  }

  csvContent += Papa.unparse(rows);
  return csvContent;
}

export async function exportToPDF(
  readings: SensorReading[],
  sensors: Sensor[],
  greenhouses: Greenhouse[],
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('温室传感器与灌溉监控分析报告', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  let yPos = 35;

  if (options.includeMetadata) {
    doc.setFontSize(12);
    doc.text('报告元数据', 14, yPos);
    yPos += 8;

    const metadata = generateMetadataArray(options);
    autoTable(doc, {
      startY: yPos,
      head: [['项目', '值']],
      body: metadata,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 92, 54] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  doc.setFontSize(12);
  doc.text('数据概览', 14, yPos);
  yPos += 8;

  const summaryData = generateSummaryData(readings, sensors);
  autoTable(doc, {
    startY: yPos,
    head: [['指标', '记录数', '平均值', '最小值', '最大值', '缺失数', '异常数']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 92, 54] }
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.text('详细数据', 14, yPos);
  yPos += 8;

  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const greenhouseMap = new Map(greenhouses.map((g) => [g.id, g]));

  const tableData = readings.slice(0, 100).map((r) => {
    const sensor = sensorMap.get(r.sensorId);
    const greenhouse = greenhouseMap.get(r.greenhouseId);
    return [
      dayjs(r.timestamp).format('MM-DD HH:mm'),
      greenhouse?.name || '-',
      sensor?.name || '-',
      r.isMissing ? '缺失' : r.value.toFixed(2),
      sensor?.unit || '-',
      r.isOutlier ? '异常' : '正常'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['时间', '温室', '传感器', '数值', '单位', '状态']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7 },
    headStyles: { fillColor: [26, 92, 54] }
  });

  return doc.output('blob');
}

function generateMetadataHeader(options: ExportOptions): string {
  const lines: string[] = [];
  lines.push(`# 温室传感器与灌溉监控导出报告`);
  lines.push(`# 导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  lines.push(`# 数据更新时间: ${dayjs(options.dataUpdateInfo.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss')}`);
  lines.push(`# 总记录数: ${options.dataUpdateInfo.recordCount}`);
  lines.push(`# 传感器数量: ${options.dataUpdateInfo.sensorCount}`);
  lines.push(`# 缺失值数量: ${options.dataUpdateInfo.missingCount}`);
  lines.push(`# 异常值数量: ${options.dataUpdateInfo.anomalyCount}`);
  lines.push(`# 数据时间范围: ${dayjs(options.dataUpdateInfo.dataRange.start).format('YYYY-MM-DD')} 至 ${dayjs(options.dataUpdateInfo.dataRange.end).format('YYYY-MM-DD')}`);
  lines.push(`# 筛选条件:`);
  lines.push(`#   - 温室: ${options.filters.greenhouseIds.length > 0 ? options.filters.greenhouseIds.join(', ') : '全部'}`);
  lines.push(`#   - 传感器类型: ${options.filters.sensorTypes.length > 0 ? options.filters.sensorTypes.map(t => SENSOR_TYPE_LABELS[t]).join(', ') : '全部'}`);
  lines.push(`#   - 设备状态: ${options.filters.deviceStatuses.length > 0 ? options.filters.deviceStatuses.join(', ') : '全部'}`);
  lines.push(`#   - 时间范围: ${dayjs(options.filters.timeRange.start).format('YYYY-MM-DD HH:mm')} 至 ${dayjs(options.filters.timeRange.end).format('YYYY-MM-DD HH:mm')}`);
  lines.push(`#   - 显示异常: ${options.filters.showAnomalies ? '是' : '否'}`);
  lines.push(`#   - 显示缺失: ${options.filters.showMissing ? '是' : '否'}`);

  return lines.join('\n');
}

function generateMetadataArray(options: ExportOptions): string[][] {
  return [
    ['导出时间', dayjs().format('YYYY-MM-DD HH:mm:ss')],
    ['数据更新时间', dayjs(options.dataUpdateInfo.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss')],
    ['总记录数', String(options.dataUpdateInfo.recordCount)],
    ['传感器数量', String(options.dataUpdateInfo.sensorCount)],
    ['缺失值数量', String(options.dataUpdateInfo.missingCount)],
    ['异常值数量', String(options.dataUpdateInfo.anomalyCount)],
    ['数据时间范围', `${dayjs(options.dataUpdateInfo.dataRange.start).format('YYYY-MM-DD')} 至 ${dayjs(options.dataUpdateInfo.dataRange.end).format('YYYY-MM-DD')}`],
    ['筛选温室', options.filters.greenhouseIds.length > 0 ? options.filters.greenhouseIds.join(', ') : '全部'],
    ['筛选传感器类型', options.filters.sensorTypes.length > 0 ? options.filters.sensorTypes.map(t => SENSOR_TYPE_LABELS[t]).join(', ') : '全部'],
    ['显示异常', options.filters.showAnomalies ? '是' : '否'],
    ['显示缺失', options.filters.showMissing ? '是' : '否']
  ];
}

function generateSummaryData(readings: SensorReading[], sensors: Sensor[]): string[][] {
  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const grouped: Record<string, SensorReading[]> = {};

  readings.forEach((r) => {
    const sensor = sensorMap.get(r.sensorId);
    if (!sensor) return;
    if (!grouped[sensor.type]) grouped[sensor.type] = [];
    grouped[sensor.type].push(r);
  });

  return METRIC_CONFIGS.map((config: MetricConfig) => {
    const typeReadings = grouped[config.key] || [];
    const validValues = typeReadings.filter((r) => !r.isMissing && !isNaN(r.value)).map((r) => r.value);

    if (validValues.length === 0) {
      return [config.name, String(typeReadings.length), '-', '-', '-', String(typeReadings.filter((r) => r.isMissing).length), String(typeReadings.filter((r) => r.isOutlier).length)];
    }

    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    return [
      config.name,
      String(typeReadings.length),
      avg.toFixed(2) + config.unit,
      min.toFixed(2) + config.unit,
      max.toFixed(2) + config.unit,
      String(typeReadings.filter((r) => r.isMissing).length),
      String(typeReadings.filter((r) => r.isOutlier).length)
    ];
  });
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
