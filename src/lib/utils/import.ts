import type { SensorReading, DataUpdateInfo } from '$lib/types';
import { sensorReadings, dataUpdateInfo, loading } from '$lib/stores/appStore';
import { getSensorReadings, getDataUpdateInfo } from '$lib/data/store';
import { get } from 'svelte/store';
import { filters } from '$lib/stores/appStore';

export async function importCSVFile(file: File): Promise<{
  success: boolean;
  importedCount?: number;
  skippedCount?: number;
  errors?: string[];
  error?: string;
  importedReadings?: SensorReading[];
}> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    loading.set(true);
    const response = await fetch('/api/data', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (result.success && result.importedReadings) {
      mergeImportedReadings(result.importedReadings);
      await updateDataInfo();
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  } finally {
    loading.set(false);
  }
}

function mergeImportedReadings(newReadings: SensorReading[]): void {
  const current = get(sensorReadings);
  const existingIds = new Set(current.map((r) => r.id));
  const merged = [...current];

  for (const reading of newReadings) {
    if (!existingIds.has(reading.id)) {
      merged.push(reading);
    }
  }

  sensorReadings.set(merged);
}

async function updateDataInfo(): Promise<void> {
  const updateInfo = await getDataUpdateInfo();
  dataUpdateInfo.set(updateInfo);
}

export async function refreshFrontendData(): Promise<void> {
  const currentFilters = get(filters);
  const [{ readings }, updateInfo] = await Promise.all([
    getSensorReadings(currentFilters),
    getDataUpdateInfo()
  ]);

  sensorReadings.set(readings);
  dataUpdateInfo.set(updateInfo);
}

export async function triggerImportFileSelect(): Promise<{
  success: boolean;
  importedCount?: number;
  skippedCount?: number;
  errors?: string[];
  error?: string;
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const result = await importCSVFile(file);
        resolve(result);
      } else {
        resolve(null);
      }
    };
    input.oncancel = () => {
      resolve(null);
    };
    input.click();
  });
}
