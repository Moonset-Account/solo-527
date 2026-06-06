import { json } from '@sveltejs/kit';
import { getSensorReadings, getDataUpdateInfo, getSensors, getGreenhouses } from '$lib/data/store';
import type { RequestHandler } from './$types';
import { exportToCSV } from '$lib/utils/export';
import type { FilterState } from '$lib/types';

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

  return json({
    success: true,
    message: 'File uploaded successfully',
    filename: file.name,
    size: file.size
  });
};
