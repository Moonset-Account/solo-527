<script lang="ts">
  import { filteredAlerts, greenhouses, sensors } from '$lib/stores/appStore';
  import { AlertTriangle, CheckCircle, WifiOff, Thermometer, Droplets, Sun, Droplet, X } from 'lucide-svelte';
  import { ALERT_LEVEL_LABELS } from '$lib/data/dictionary';
  import dayjs from 'dayjs';
  import type { Alert } from '$lib/types';

  let showResolved = false;

  function getAlertIcon(type: string) {
    switch (type) {
      case 'offline':
        return WifiOff;
      case 'threshold':
        return Thermometer;
      case 'valve_fault':
        return Droplets;
      case 'anomaly':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  }

  function getAlertTypeLabel(type: string) {
    switch (type) {
      case 'offline':
        return '设备离线';
      case 'threshold':
        return '阈值超限';
      case 'valve_fault':
        return '阀门故障';
      case 'anomaly':
        return '数据异常';
      default:
        return type;
    }
  }

  function getSensorName(sensorId?: string) {
    if (!sensorId) return '-';
    return $sensors.find((s) => s.id === sensorId)?.name || sensorId;
  }

  function getGreenhouseName(ghId: string) {
    return $greenhouses.find((g) => g.id === ghId)?.name || ghId;
  }
</script>

<div class="panel h-full flex flex-col">
  <div class="panel-header">
    <div class="flex items-center gap-2">
      <AlertTriangle size={18} class="text-gh-warning" />
      <span class="panel-title">告警中心</span>
      <span class="badge badge-danger">{$filteredAlerts.filter((a) => !a.resolved).length}</span>
    </div>
    <label class="flex items-center gap-1 text-xs text-gh-muted cursor-pointer">
      <input
        type="checkbox"
        bind:checked={showResolved}
        class="rounded border-gh-border bg-gh-bg"
      />
      显示已解决
    </label>
  </div>

  <div class="panel-body flex-1 overflow-auto p-0">
    <div class="divide-y divide-gh-border/50">
      {#each $filteredAlerts.filter((a) => showResolved || !a.resolved) as alert (alert.id)}
        <div
          class="p-3 hover:bg-gh-bg/50 transition-colors cursor-pointer"
          class:opacity-60={alert.resolved}
        >
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 p-1.5 rounded {alert.level === 'critical'
                ? 'bg-gh-danger/20 text-gh-danger'
                : alert.level === 'warning'
                  ? 'bg-gh-warning/20 text-gh-warning'
                  : 'bg-gh-info/20 text-gh-info'}"
            >
              <svelte:component this={getAlertIcon(alert.type)} size={16} />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium">{alert.message}</span>
                {#if alert.resolved}
                  <span class="badge badge-success flex items-center gap-1">
                    <CheckCircle size={10} />
                    已解决
                  </span>
                {/if}
              </div>
              <div class="flex items-center gap-3 text-xs text-gh-muted">
                <span>{getGreenhouseName(alert.greenhouseId)}</span>
                {#if alert.sensorId}
                  <span>· {getSensorName(alert.sensorId)}</span>
                {/if}
                <span>· {getAlertTypeLabel(alert.type)}</span>
                <span>· {dayjs(alert.timestamp).fromNow()}</span>
              </div>
            </div>

            <span
              class={`badge ${alert.level === 'critical'
                ? 'badge-danger'
                : alert.level === 'warning'
                  ? 'badge-warning'
                  : 'badge-info'}`}
            >
              {ALERT_LEVEL_LABELS[alert.level]}
            </span>
          </div>
        </div>
      {:else}
        <div class="p-8 text-center text-gh-muted">
          <CheckCircle size={32} class="mx-auto mb-2 text-gh-success" />
          <p class="text-sm">暂无告警</p>
        </div>
      {/each}
    </div>
  </div>
</div>
