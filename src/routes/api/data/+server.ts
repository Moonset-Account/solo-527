import { json } from '@sveltejs/kit';
import { getSensorReadings, getDataUpdateInfo, getSensors, getGreenhouses, addSensorReadings } from '$lib/data/store';
import type { RequestHandler } from './$types';
import { exportToCSV } from '$lib/utils/export';
import type { FilterState, SensorReading } from '$lib/types';
import Papa from 'papaparse';
import { cleanSensorReadings } from '$lib/data/etl';
import { SENSOR_TYPE_LABELS } from '$lib/data/dictionary';

export const GET: RequestHandler = async ({ url }) => {
  const format = url.searchParams.get('format') || 'csv';
  const greenhouseIds = url.searchParams.get('greenhouseIds')?.split(',') || [];
  const sensorTypes = url.searchParams.get('sensorTypes')?.split(',') || [];
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  const filters: Partial<FilterState> = {
    greenhouseIds,
    sensorTypes: sensorTypes as any,
    timeRange: start && end ? { start, end } : undefined
  };

  const [{ readings }, sensors, greenhouses, updateInfo] = await Promise.all([
    getSensorReadings(filters),
    getSensors(),
    getGreenhouses(),
    getDataUpdateInfo()
  ]);

  if (format === 'csv') {
    const csv = await exportToCSV(
      readings,
      sensors,
      greenhouses,
      {
        format: 'csv',
        includeMetadata: true,
        includeCharts: false,
        filters: {
          greenhouseIds,
          sensorIds: [],
          cropTypes: [],
          timeRange: start && end ? { start, end } : { start: '', end: '' },
          deviceStatuses: [],
          sensorTypes: sensorTypes as any,
          batchIds: [],
          showAnomalies: true,
          showMissing: true
        },
        dataUpdateInfo: updateInfo
      }
    );

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sensor_data_${Date.now()}.csv"`
      }
    });
  }

  return json({
    data: readings,
    metadata: {
      recordCount: readings.length,
      updateInfo
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file provided' }, { status: 400 });
  }

  const text = await file.text();

  try {
    const sensors = await getSensors();
    const sensorMap = new Map(sensors.map((s) => [s.name, s]));
    const sensorIdMap = new Map(sensors.map((s) => [s.id, s]));

    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    const rawData = result.data as any[];
    if (rawData.length === 0) {
      return json({ success: false, error: 'CSV 文件为空或格式不正确' }, { status: 400 });
    }

    const readings: SensorReading[] = [];
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const lineNum = i + 2;

      try {
        let sensor = null;

        if (row['传感器']) {
          sensor = sensorMap.get(row['传感器']) || sensorIdMap.get(row['传感器']);
        }
        if (row['sensorId']) {
          sensor = sensorIdMap.get(row['sensorId']) || sensorMap.get(row['sensorId']);
        }
        if (row['传感器ID']) {
          sensor = sensorIdMap.get(row['传感器ID']) || sensorMap.get(row['传感器ID']);
        }

        if (!sensor) {
          skippedCount++;
          errors.push(`第 ${lineNum} 行: 未找到传感器 ${row['传感器'] || row['sensorId'] || row['传感器ID']}`);
          continue;
        }

        let timestamp: string;
        if (row['采集时间']) {
          timestamp = new Date(row['采集时间']).toISOString();
        } else if (row['timestamp']) {
          timestamp = new Date(row['timestamp']).toISOString();
        } else {
          timestamp = new Date().toISOString();
        }

        if (isNaN(new Date(timestamp).getTime())) {
          skippedCount++;
          errors.push(`第 ${lineNum} 行: 时间格式不正确`);
          continue;
        }

        let value: number;
        if (row['数值'] !== undefined) {
          value = parseFloat(row['数值']);
        } else if (row['value'] !== undefined) {
          value = parseFloat(row['value']);
        } else {
          skippedCount++;
          errors.push(`第 ${lineNum} 行: 缺少数值`);
          continue;
        }

        const isMissing = row['数据质量'] === '缺失' || row['是否缺失'] === '是' || row['isMissing'] === 'true';
        const isOutlier = row['数据质量'] === '异常值' || row['是否异常'] === '是' || row['isOutlier'] === 'true';

        readings.push({
          id: `import_${Date.now()}_${i}`,
          sensorId: sensor.id,
          greenhouseId: sensor.greenhouseId,
          timestamp,
          value: isMissing ? NaN : value,
          isMissing,
          isOutlier,
          quality: isMissing ? 'missing' : isOutlier ? 'outlier' : 'good',
          batchId: row['批次ID'] || row['batchId'] || null
        });
      } catch (e) {
        skippedCount++;
        errors.push(`第 ${lineNum} 行: 解析失败 - ${(e as Error).message}`);
      }
    }

    if (readings.length === 0) {
      return json({
        success: false,
        error: '没有可导入的有效数据',
        details: errors.slice(0, 10)
      }, { status: 400 });
    }

    const cleanedResult = await cleanSensorReadings(readings, sensors, {
      detectOutliers: true,
      markMissing: true,
      outlierMethod: 'iqr'
    });

    const { cleaned: importedReadings } = cleanedResult;
    await addSensorReadings(importedReadings);

    return json({
      success: true,
      message: '导入成功',
      filename: file.name,
      totalRows: rawData.length,
      importedCount: importedReadings.length,
      skippedCount,
      errors: errors.slice(0, 20),
      importedReadings
    });
  } catch (error) {
    return json({
      success: false,
      error: `导入失败: ${(error as Error).message}`
    }, { status: 500 });
  }
};
