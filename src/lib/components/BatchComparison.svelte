<script lang="ts">
  import { batches, greenhouses, filteredReadings, sensors } from '$lib/stores/appStore';
  import { CROP_PHASE_LABELS, METRIC_CONFIGS, SENSOR_TYPE_LABELS } from '$lib/data/dictionary';
  import { Sprout, BarChart3, Thermometer, Droplets, Sun, Droplet, Filter } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import BaseChart from './charts/BaseChart.svelte';
  import type { CropBatch, SensorType } from '$lib/types';

  let selectedBatches: string[] = [];
  let selectedMetric: SensorType = 'temperature';
  let comparisonChart: any = {};

  function toggleBatch(batchId: string) {
    if (selectedBatches.includes(batchId)) {
      selectedBatches = selectedBatches.filter((id) => id !== batchId);
    } else if (selectedBatches.length < 4) {
      selectedBatches = [...selectedBatches, batchId];
    }
    updateChart();
  }

  function getGreenhouseName(ghId: string) {
    return $greenhouses.find((g) => g.id === ghId)?.name || ghId;
  }

  function getBatchMetrics(batch: CropBatch) {
    const sensorIds = $sensors
      .filter((s) => s.greenhouseId === batch.greenhouseId)
      .map((s) => s.id);
    const batchReadings = $filteredReadings.filter(
      (r) =>
        sensorIds.includes(r.sensorId) &&
        !r.isMissing &&
        new Date(r.timestamp) >= new Date(batch.sowingDate)
    );

    const metrics: Record<string, { avg: number; min: number; max: number }> = {};

    METRIC_CONFIGS.forEach((config) => {
      const typeReadings = batchReadings.filter((r) => {
        const sensor = $sensors.find((s) => s.id === r.sensorId);
        return sensor?.type === config.key;
      });

      const values = typeReadings.map((r) => r.value);
      if (values.length > 0) {
        metrics[config.key] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return metrics;
  }

  function updateChart() {
    if (selectedBatches.length === 0) {
      comparisonChart = {
        backgroundColor: 'transparent',
        tooltip: {},
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: []
      };
      return;
    }

    const batchData = selectedBatches.map((batchId) => {
      const batch = $batches.find((b) => b.id === batchId);
      if (!batch) return null;

      const sensorIds = $sensors
        .filter((s) => s.greenhouseId === batch.greenhouseId && s.type === selectedMetric)
        .map((s) => s.id);

      const groupedByDay: Record<string, number[]> = {};
      $filteredReadings
        .filter((r) => sensorIds.includes(r.sensorId) && !r.isMissing)
        .forEach((r) => {
          const day = dayjs(r.timestamp).format('MM-DD');
          if (!groupedByDay[day]) groupedByDay[day] = [];
          groupedByDay[day].push(r.value);
        });

      const days = Object.keys(groupedByDay).sort();
      const values = days.map((d) => {
        const vals = groupedByDay[d];
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      });

      return {
        name: `${batch.cropType}-${batch.variety}`,
        data: values.map((v, i) => [days[i], v.toFixed(1)])
      };
    }).filter(Boolean);

    const config = METRIC_CONFIGS.find((m) => m.key === selectedMetric);

    comparisonChart = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        textStyle: { color: '#e2e8f0' },
        backgroundColor: '#1e293b',
        borderColor: '#334155'
      },
      legend: {
        data: batchData.map((b: any) => b?.name),
        textStyle: { color: '#94a3b8' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        name: config?.unit,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: batchData.map((b: any, idx: number) => ({
        name: b?.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: b?.data.map((d: any) => d[1]),
        lineStyle: { width: 2 }
      }))
    };
  }

  $: {
    selectedMetric;
    $batches;
    $filteredReadings;
    $sensors;
    updateChart();
  }
</script>

<div class="panel h-full flex flex-col">
  <div class="panel-header">
    <div class="flex items-center gap-2">
      <Sprout size={18} class="text-gh-accent" />
      <span class="panel-title">批次对比分析</span>
      <span class="text-xs text-gh-muted">最多选择4个批次</span>
    </div>
    <div class="flex items-center gap-2">
      <select class="select text-xs py-1" bind:value={selectedMetric}>
        {#each METRIC_CONFIGS as config}
          <option value={config.key}>{config.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="flex-1 overflow-hidden flex flex-col">
    <div class="px-4 py-2 border-b border-gh-border/50">
      <div class="flex flex-wrap gap-2">
        {#each $batches as batch}
          <button
            class="text-xs px-3 py-1.5 rounded border transition-colors {selectedBatches.includes(batch.id)
              ? 'bg-gh-primary border-gh-primary text-white'
              : 'border-gh-border text-gh-muted hover:text-gh-text hover:border-gh-muted'}"
            class:opacity-50={selectedBatches.length >= 4 && !selectedBatches.includes(batch.id)}
            onclick={() => toggleBatch(batch.id)}
          >
            {batch.cropType}-{batch.variety}
            <span class="ml-1 opacity-70">({getGreenhouseName(batch.greenhouseId)})</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="flex-1 overflow-auto p-4">
      {#if selectedBatches.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          <div class="h-64">
            <BaseChart option={comparisonChart} height="100%" />
          </div>

          <div class="space-y-3">
            {#each selectedBatches as batchId}
              {@const batch = $batches.find((b) => b.id === batchId)}
              {#if batch}
                {@const metrics = getBatchMetrics(batch)}
                <div class="p-3 bg-gh-bg/50 rounded border border-gh-border">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <span class="text-sm font-medium">{batch.cropType} - {batch.variety}</span>
                      <span class="text-xs text-gh-muted ml-2">
                        {getGreenhouseName(batch.greenhouseId)}
                      </span>
                    </div>
                    <span class="badge badge-info">{CROP_PHASE_LABELS[batch.phase]}</span>
                  </div>
                  <div class="grid grid-cols-4 gap-2 text-xs">
                    {#each METRIC_CONFIGS as config}
                      <div>
                        <div class="text-gh-muted">{config.name}</div>
                        {#if metrics[config.key]}
                          <div class="text-gh-text font-medium">
                            {metrics[config.key].avg.toFixed(1)}{config.unit}
                          </div>
                        {:else}
                          <div class="text-gh-muted">-</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-gh-border/50 text-xs text-gh-muted">
                    <span>播种: {dayjs(batch.sowingDate).format('MM-DD')}</span>
                    <span>预计采收: {dayjs(batch.expectedHarvestDate).format('MM-DD')}</span>
                    <span>植株: {batch.plantCount}</span>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {:else}
        <div class="h-full flex items-center justify-center text-gh-muted">
          <div class="text-center">
            <BarChart3 size={48} class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">选择批次进行对比分析</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
