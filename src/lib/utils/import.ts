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

    if (result.success) {
      await refreshFrontendData();
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
