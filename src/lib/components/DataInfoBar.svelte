<script lang="ts">
  import { dataUpdateInfo, readingStats, offlineSensors, activeAlerts, filters } from '$lib/stores/appStore';
  import { Clock, Database, AlertTriangle, WifiOff, Filter, Activity } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';

  dayjs.extend(relativeTime);
</script>

<div class="bg-gh-panel/50 border-b border-gh-border px-4 py-2">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-6 text-sm">
      {#if $dataUpdateInfo}
        <div class="flex items-center gap-2 text-gh-muted">
          <Clock size={14} />
          <span>数据更新: {dayjs($dataUpdateInfo.lastUpdateTime).fromNow()}</span>
          <span class="text-xs text-gh-muted/60">
            ({dayjs($dataUpdateInfo.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss')})
          </span>
        </div>

        <div class="flex items-center gap-2 text-gh-muted">
          <Database size={14} />
          <span>样本量: <span class="text-gh-text font-medium">{$readingStats.total.toLocaleString()}</span></span>
        </div>

        <div class="flex items-center gap-2 text-gh-muted">
          <Activity size={14} />
          <span>有效: <span class="text-gh-success font-medium">{$readingStats.valid.toLocaleString()}</span></span>
        </div>

        <div class="flex items-center gap-2 text-gh-muted">
          <AlertTriangle size={14} class="text-gh-warning" />
          <span>缺失: <span class="text-gh-warning font-medium">{$readingStats.missing}</span></span>
        </div>

        <div class="flex items-center gap-2 text-gh-muted">
          <AlertTriangle size={14} class="text-gh-danger" />
          <span>异常: <span class="text-gh-danger font-medium">{$readingStats.anomalies}</span></span>
        </div>

        {#if $offlineSensors.length > 0}
          <div class="flex items-center gap-2 text-gh-danger">
            <WifiOff size={14} />
            <span>离线传感器: <span class="font-medium">{$offlineSensors.length}</span></span>
          </div>
        {/if}

        {#if $activeAlerts.length > 0}
          <div class="flex items-center gap-2 text-gh-warning">
            <AlertTriangle size={14} />
            <span>活跃告警: <span class="font-medium">{$activeAlerts.length}</span></span>
          </div>
        {/if}
      {/if}
    </div>

    <div class="flex items-center gap-3 text-sm">
      <div class="flex items-center gap-1 text-gh-muted">
        <Filter size={14} />
        <span>筛选条件:</span>
      </div>
      
      <div class="flex items-center gap-2 flex-wrap">
        {#if $filters.greenhouseIds.length > 0}
          <span class="badge badge-info">温室: {$filters.greenhouseIds.length}</span>
        {/if}
        {#if $filters.sensorTypes.length > 0}
          <span class="badge badge-info">类型: {$filters.sensorTypes.length}</span>
        {/if}
        {#if $filters.deviceStatuses.length > 0}
          <span class="badge badge-info">状态: {$filters.deviceStatuses.length}</span>
        {/if}
        {#if $filters.batchIds.length > 0}
          <span class="badge badge-info">批次: {$filters.batchIds.length}</span>
        {/if}
        {#if !$filters.showMissing}
          <span class="badge badge-muted">隐藏缺失</span>
        {/if}
        {#if !$filters.showAnomalies}
          <span class="badge badge-muted">隐藏异常</span>
        {/if}
        {#if $filters.greenhouseIds.length === 0 && $filters.sensorTypes.length === 0 && $filters.deviceStatuses.length === 0 && $filters.batchIds.length === 0 && $filters.showMissing && $filters.showAnomalies}
          <span class="text-gh-muted text-xs">无筛选</span>
        {/if}
      </div>

      <div class="text-gh-muted text-xs border-l border-gh-border pl-3 ml-2">
        时间范围: {dayjs($filters.timeRange.start).format('MM-DD')} ~ {dayjs($filters.timeRange.end).format('MM-DD')}
      </div>
    </div>
  </div>
</div>
