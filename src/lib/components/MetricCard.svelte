<script lang="ts">
  import { METRIC_CONFIGS, SENSOR_TYPE_LABELS } from '$lib/data/dictionary';
  import type { SensorReading, Sensor, SensorType } from '$lib/types';
  import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

  export let readings: SensorReading[];
  export let sensors: Sensor[];
  export let type: SensorType;

  const config = METRIC_CONFIGS.find((m) => m.key === type);

  let stats = {
    current: null as number | null,
    avg: null as number | null,
    min: null as number | null,
    max: null as number | null,
    trend: 0,
    inRange: 0,
    total: 0
  };

  function updateStats() {
    const sensorIds = sensors.filter((s) => s.type === type).map((s) => s.id);
    const typeReadings = readings.filter(
      (r) => sensorIds.includes(r.sensorId) && !r.isMissing && !isNaN(r.value)
    );

    if (typeReadings.length === 0) {
      stats = { current: null, avg: null, min: null, max: null, trend: 0, inRange: 0, total: 0 };
      return;
    }

    const values = typeReadings.map((r) => r.value);
    const sorted = typeReadings.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const current = sorted[0]?.value;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend = secondAvg - firstAvg;

    const inRange = values.filter(
      (v) => v >= config!.idealMin && v <= config!.idealMax
    ).length;

    stats = {
      current,
      avg,
      min,
      max,
      trend,
      inRange,
      total: values.length
    };
  }

  $: {
    readings;
    sensors;
    type;
    updateStats();
  }
</script>

<div class="panel p-4">
  <div class="flex items-start justify-between mb-3">
    <div>
      <div class="text-xs text-gh-muted mb-1">{SENSOR_TYPE_LABELS[type]}</div>
      <div class="text-2xl font-bold" style="color: {config?.color}">
        {#if stats.current !== null}
          {stats.current.toFixed(1)}
          <span class="text-sm font-normal text-gh-muted">{config?.unit}</span>
        {:else}
          <span class="text-gh-muted">-</span>
        {/if}
      </div>
    </div>
    <div
      class="p-2 rounded-lg"
      style="background: {config?.color}20; color: {config?.color}"
    >
      {#if stats.trend > 0.5}
        <TrendingUp size={20} />
      {:else if stats.trend < -0.5}
        <TrendingDown size={20} />
      {:else}
        <Minus size={20} />
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2 text-xs">
    <div>
      <div class="text-gh-muted">平均值</div>
      <div class="font-medium text-gh-text">
        {stats.avg !== null ? `${stats.avg.toFixed(1)}${config?.unit}` : '-'}
      </div>
    </div>
    <div>
      <div class="text-gh-muted">范围</div>
      <div class="font-medium text-gh-text">
        {stats.min !== null ? `${stats.min.toFixed(0)}-${stats.max.toFixed(0)}` : '-'}
      </div>
    </div>
    <div>
      <div class="text-gh-muted">达标率</div>
      <div class="font-medium text-gh-text">
        {stats.total > 0 ? `${Math.round((stats.inRange / stats.total) * 100)}%` : '-'}
      </div>
    </div>
  </div>

  {#if stats.total > 0}
    <div class="mt-3">
      <div class="h-1.5 bg-gh-bg rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          style="width: {Math.round((stats.inRange / stats.total) * 100)}%; background: {config?.color}"
        />
      </div>
    </div>
  {/if}
</div>
