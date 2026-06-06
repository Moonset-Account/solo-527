<script lang="ts">
  import { filters, greenhouses, sensors, batches } from '$lib/stores/appStore';
  import { SENSOR_TYPE_LABELS, DEVICE_STATUS_LABELS } from '$lib/data/dictionary';
  import { Filter, RefreshCw, Download, Upload, ChevronDown, X } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import { onMount } from 'svelte';
  import { exportToCSV, exportToPDF, downloadFile } from '$lib/utils/export';
  import { sensorReadings, dataUpdateInfo } from '$lib/stores/appStore';
  import { getSensorReadings, refreshData } from '$lib/data/store';
  import type { ExportOptions } from '$lib/types';

  let showFilters = false;
  let showExportMenu = false;
  let selectedTimePreset = '7d';

  const timePresets = [
    { label: '今天', value: 'today' },
    { label: '昨天', value: 'yesterday' },
    { label: '近7天', value: '7d' },
    { label: '近30天', value: '30d' }
  ];

  function applyTimePreset(preset: string) {
    selectedTimePreset = preset;
    let start: string, end: string;
    const now = dayjs();

    switch (preset) {
      case 'today':
        start = now.startOf('day').toISOString();
        end = now.endOf('day').toISOString();
        break;
      case 'yesterday':
        start = now.subtract(1, 'day').startOf('day').toISOString();
        end = now.subtract(1, 'day').endOf('day').toISOString();
        break;
      case '7d':
        start = now.subtract(7, 'day').startOf('day').toISOString();
        end = now.endOf('day').toISOString();
        break;
      case '30d':
        start = now.subtract(30, 'day').startOf('day').toISOString();
        end = now.endOf('day').toISOString();
        break;
      default:
        start = now.subtract(7, 'day').startOf('day').toISOString();
        end = now.endOf('day').toISOString();
    }

    filters.setTimeRange(start, end);
  }

  async function handleRefresh() {
    await refreshData();
  }

  async function handleExport(format: 'csv' | 'pdf') {
    const readings = $sensorReadings;
    const gh = $greenhouses;
    const sen = $sensors;
    const info = $dataUpdateInfo;

    if (!info) return;

    const options: ExportOptions = {
      format,
      includeMetadata: true,
      includeCharts: true,
      filters: $filters,
      dataUpdateInfo: info
    };

    if (format === 'csv') {
      const csv = await exportToCSV(readings, sen, gh, options);
      const filename = `温室监控数据_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
      downloadFile(csv, filename, 'text/csv;charset=utf-8');
    } else {
      const blob = await exportToPDF(readings, sen, gh, options);
      const filename = `温室监控报告_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      downloadFile(blob, filename, 'application/pdf');
    }

    showExportMenu = false;
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('导入文件:', file.name);
      }
    };
    input.click();
  }

  function toggleFilter(key: string, value: string, list: string[]) {
    if (list.includes(value)) {
      return list.filter((v) => v !== value);
    }
    return [...list, value];
  }
</script>

<div class="bg-gh-panel border-b border-gh-border">
  <div class="px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button
        class="btn btn-secondary flex items-center gap-2"
        onclick={() => (showFilters = !showFilters)}
      >
        <Filter size={16} />
        筛选
        <span class={showFilters ? 'rotate-180' : ''} style="display: inline-block; transition: transform 0.2s;">
          <ChevronDown size={14} />
        </span>
      </button>

      <div class="flex items-center gap-1 bg-gh-bg rounded px-2 py-1">
        {#each timePresets as preset}
          <button
            class="px-3 py-1 text-sm rounded transition-colors {selectedTimePreset === preset.value
              ? 'bg-gh-primary text-white'
              : 'text-gh-muted hover:text-gh-text'}"
            onclick={() => applyTimePreset(preset.value)}
          >
            {preset.label}
          </button>
        {/each}
      </div>

      <div class="flex items-center gap-2 text-sm text-gh-muted">
        <span>开始:</span>
        <input
          type="datetime-local"
          class="input text-xs py-1"
          value={dayjs($filters.timeRange.start).format('YYYY-MM-DDTHH:mm')}
          onchange={(e) => {
            const start = dayjs((e.target as HTMLInputElement).value).toISOString();
            filters.setTimeRange(start, $filters.timeRange.end);
          }}
        />
        <span>结束:</span>
        <input
          type="datetime-local"
          class="input text-xs py-1"
          value={dayjs($filters.timeRange.end).format('YYYY-MM-DDTHH:mm')}
          onchange={(e) => {
            const end = dayjs((e.target as HTMLInputElement).value).toISOString();
            filters.setTimeRange($filters.timeRange.start, end);
          }}
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button class="btn btn-secondary flex items-center gap-2" onclick={handleRefresh}>
        <RefreshCw size={16} />
        刷新数据
      </button>

      <div class="relative">
        <button
          class="btn btn-primary flex items-center gap-2"
          onclick={() => (showExportMenu = !showExportMenu)}
        >
          <Download size={16} />
          导出
        </button>

        {#if showExportMenu}
          <div class="absolute right-0 top-full mt-1 bg-gh-panel border border-gh-border rounded shadow-lg z-50 min-w-[120px]">
            <button
              class="w-full px-4 py-2 text-sm text-left hover:bg-gh-border transition-colors"
              onclick={() => handleExport('csv')}
            >
              导出 CSV
            </button>
            <button
              class="w-full px-4 py-2 text-sm text-left hover:bg-gh-border transition-colors"
              onclick={() => handleExport('pdf')}
            >
              导出 PDF
            </button>
          </div>
        {/if}
      </div>

      <button class="btn btn-secondary flex items-center gap-2" onclick={handleImport}>
        <Upload size={16} />
        导入
      </button>
    </div>
  </div>

  {#if showFilters}
    <div class="px-4 pb-4 pt-2 border-t border-gh-border/50">
      <div class="grid grid-cols-5 gap-4">
        <div>
          <label class="text-xs text-gh-muted mb-2 block">温室</label>
          <div class="flex flex-wrap gap-1">
            {#each $greenhouses as gh}
              <button
                class="text-xs px-2 py-1 rounded border transition-colors {$filters.greenhouseIds.includes(gh.id)
                  ? 'bg-gh-primary border-gh-primary text-white'
                  : 'border-gh-border text-gh-muted hover:text-gh-text'}"
                onclick={() =>
                  filters.setGreenhouses(
                    $filters.greenhouseIds.includes(gh.id)
                      ? $filters.greenhouseIds.filter((id) => id !== gh.id)
                      : [...$filters.greenhouseIds, gh.id]
                  )}
              >
                {gh.name}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label class="text-xs text-gh-muted mb-2 block">传感器类型</label>
          <div class="flex flex-wrap gap-1">
            {#each Object.entries(SENSOR_TYPE_LABELS) as [key, label]}
              <button
                class="text-xs px-2 py-1 rounded border transition-colors {$filters.sensorTypes.includes(key as any)
                  ? 'bg-gh-primary border-gh-primary text-white'
                  : 'border-gh-border text-gh-muted hover:text-gh-text'}"
                onclick={() =>
                  filters.setSensorTypes(
                    $filters.sensorTypes.includes(key as any)
                      ? $filters.sensorTypes.filter((t) => t !== key)
                      : [...$filters.sensorTypes, key as any]
                  )}
              >
                {label}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label class="text-xs text-gh-muted mb-2 block">设备状态</label>
          <div class="flex flex-wrap gap-1">
            {#each Object.entries(DEVICE_STATUS_LABELS) as [key, label]}
              <button
                class="text-xs px-2 py-1 rounded border transition-colors {$filters.deviceStatuses.includes(key as any)
                  ? 'bg-gh-primary border-gh-primary text-white'
                  : 'border-gh-border text-gh-muted hover:text-gh-text'}"
                onclick={() =>
                  filters.setDeviceStatuses(
                    $filters.deviceStatuses.includes(key as any)
                      ? $filters.deviceStatuses.filter((s) => s !== key)
                      : [...$filters.deviceStatuses, key as any]
                  )}
              >
                {label}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label class="text-xs text-gh-muted mb-2 block">数据显示</label>
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={$filters.showMissing}
                onchange={filters.toggleShowMissing}
                class="rounded border-gh-border bg-gh-bg"
              />
              <span class="text-gh-muted">显示缺失值</span>
            </label>
            <label class="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={$filters.showAnomalies}
                onchange={filters.toggleShowAnomalies}
                class="rounded border-gh-border bg-gh-bg"
              />
              <span class="text-gh-muted">显示异常值</span>
            </label>
          </div>
        </div>

        <div>
          <label class="text-xs text-gh-muted mb-2 block">作物批次</label>
          <div class="flex flex-wrap gap-1 max-h-[60px] overflow-auto">
            {#each $batches as batch}
              <button
                class="text-xs px-2 py-1 rounded border transition-colors {$filters.batchIds.includes(batch.id)
                  ? 'bg-gh-primary border-gh-primary text-white'
                  : 'border-gh-border text-gh-muted hover:text-gh-text'}"
                onclick={() =>
                  filters.setBatchIds(
                    $filters.batchIds.includes(batch.id)
                      ? $filters.batchIds.filter((id) => id !== batch.id)
                      : [...$filters.batchIds, batch.id]
                  )}
              >
                {batch.cropType}-{batch.variety}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-3">
        <button class="btn btn-secondary text-xs" onclick={() => filters.reset()}>
          <X size={14} class="inline mr-1" />
          重置筛选
        </button>
      </div>
    </div>
  {/if}
</div>
