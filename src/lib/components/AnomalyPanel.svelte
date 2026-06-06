<script lang="ts">
  import { filteredReadings, sensors, greenhouses } from '$lib/stores/appStore';
  import { AlertTriangle, Database, Filter, X, ExternalLink } from 'lucide-svelte';
  import { SENSOR_TYPE_LABELS } from '$lib/data/dictionary';
  import dayjs from 'dayjs';
  import type { SensorReading } from '$lib/types';

  let viewMode: 'missing' | 'anomalies' = 'anomalies';

  function getSensorName(sensorId: string) {
    return $sensors.find((s) => s.id === sensorId)?.name || sensorId;
  }

  function getGreenhouseName(ghId: string) {
    return $greenhouses.find((g) => g.id === ghId)?.name || ghId;
  }

  function getSensorType(sensorId: string) {
    const sensor = $sensors.find((s) => s.id === sensorId);
    return sensor ? SENSOR_TYPE_LABELS[sensor.type] : '-';
  }

  function getSensorUnit(sensorId: string) {
    return $sensors.find((s) => s.id === sensorId)?.unit || '';
  }

  $: missingReadings = $filteredReadings.filter((r) => r.isMissing);
  $: anomalyReadings = $filteredReadings.filter((r) => r.isOutlier);
  $: displayedReadings = viewMode === 'missing' ? missingReadings : anomalyReadings;

  function dismissReading(reading: SensorReading) {
    console.log('标记为已处理:', reading.id);
  }
</script>

<div class="panel h-full flex flex-col">
  <div class="panel-header">
    <div class="flex items-center gap-2">
      <AlertTriangle size={18} class="text-gh-warning" />
      <span class="panel-title">异常样本分析</span>
    </div>
    <div class="flex items-center gap-1 bg-gh-bg rounded p-0.5">
      <button
        class="px-3 py-1 text-xs rounded transition-colors {viewMode === 'anomalies'
          ? 'bg-gh-warning text-white'
          : 'text-gh-muted hover:text-gh-text'}"
        onclick={() => (viewMode = 'anomalies')}
      >
        异常值 ({anomalyReadings.length})
      </button>
      <button
        class="px-3 py-1 text-xs rounded transition-colors {viewMode === 'missing'
          ? 'bg-gh-danger text-white'
          : 'text-gh-muted hover:text-gh-text'}"
        onclick={() => (viewMode = 'missing')}
      >
        缺失值 ({missingReadings.length})
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-auto">
    {#if displayedReadings.length > 0}
      <div class="divide-y divide-gh-border/50">
        {#each displayedReadings.slice(0, 50) as reading (reading.id)}
          <div class="p-3 hover:bg-gh-bg/50 transition-colors">
            <div class="flex items-start gap-3">
              <div
                class={`mt-0.5 p-1.5 rounded ${reading.isMissing
                  ? 'bg-gh-danger/20 text-gh-danger'
                  : 'bg-gh-warning/20 text-gh-warning'}`}
              >
                <AlertTriangle size={14} />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium">
                    {getSensorName(reading.sensorId)}
                  </span>
                  <span class="badge {reading.isMissing ? 'badge-danger' : 'badge-warning'}">
                    {reading.isMissing ? '数据缺失' : '异常值'}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-gh-muted">
                  <span>{getGreenhouseName(reading.greenhouseId)}</span>
                  <span>· {getSensorType(reading.sensorId)}</span>
                  <span>· {dayjs(reading.timestamp).format('MM-DD HH:mm:ss')}</span>
                </div>
                {#if !reading.isMissing}
                  <div class="mt-1 text-sm">
                    <span class="text-gh-muted">检测值:</span>
                    <span class="text-gh-warning font-medium ml-1">
                      {reading.value.toFixed(2)}{getSensorUnit(reading.sensorId)}
                    </span>
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-1">
                <button
                  class="p-1.5 hover:bg-gh-border rounded text-gh-muted hover:text-gh-text transition-colors"
                  title="下钻查看详情"
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  class="p-1.5 hover:bg-gh-border rounded text-gh-muted hover:text-gh-text transition-colors"
                  title="标记为已处理"
                  onclick={() => dismissReading(reading)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if displayedReadings.length > 50}
        <div class="p-3 text-center text-xs text-gh-muted border-t border-gh-border/50">
          显示前 50 条，共 {displayedReadings.length} 条记录
        </div>
      {/if}
    {:else}
      <div class="h-full flex items-center justify-center">
        <div class="text-center text-gh-muted">
          <Database size={40} class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">
            {viewMode === 'missing' ? '暂无缺失数据' : '暂无异常数据'}
          </p>
        </div>
      </div>
    {/if}
  </div>

  <div class="px-4 py-3 border-t border-gh-border/50">
    <div class="grid grid-cols-4 gap-3 text-center">
      <div>
        <div class="text-lg font-bold text-gh-text">{$filteredReadings.length.toLocaleString()}</div>
        <div class="text-xs text-gh-muted">总样本</div>
      </div>
      <div>
        <div class="text-lg font-bold text-gh-success">
          {($filteredReadings.length - missingReadings.length - anomalyReadings.length).toLocaleString()}
        </div>
        <div class="text-xs text-gh-muted">有效数据</div>
      </div>
      <div>
        <div class="text-lg font-bold text-gh-warning">{anomalyReadings.length}</div>
        <div class="text-xs text-gh-muted">异常值</div>
      </div>
      <div>
        <div class="text-lg font-bold text-gh-danger">{missingReadings.length}</div>
        <div class="text-xs text-gh-muted">缺失值</div>
      </div>
    </div>
  </div>
</div>
