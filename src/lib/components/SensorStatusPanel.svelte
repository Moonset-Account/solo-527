<script lang="ts">
  import { sensors, greenhouses, selectedSensor } from '$lib/stores/appStore';
  import { DEVICE_STATUS_LABELS, SENSOR_TYPE_LABELS, METRIC_CONFIGS } from '$lib/data/dictionary';
  import { Wifi, WifiOff, AlertTriangle, Wrench, Thermometer, Droplets, Sun, Droplet } from 'lucide-svelte';
  import dayjs from 'dayjs';
  import type { Sensor, SensorType } from '$lib/types';

  let searchQuery = '';
  let statusFilter = '';
  let typeFilter = '';

  function getStatusIcon(status: string) {
    switch (status) {
      case 'online':
        return Wifi;
      case 'offline':
        return WifiOff;
      case 'warning':
        return AlertTriangle;
      case 'maintenance':
        return Wrench;
      default:
        return Wifi;
    }
  }

  function getTypeIcon(type: SensorType) {
    switch (type) {
      case 'temperature':
        return Thermometer;
      case 'humidity':
        return Droplets;
      case 'light':
        return Sun;
      case 'soil_moisture':
        return Droplet;
      default:
        return Thermometer;
    }
  }

  function getGreenhouseName(ghId: string) {
    return $greenhouses.find((g) => g.id === ghId)?.name || ghId;
  }

  $: filteredSensors = $sensors.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchType = !typeFilter || s.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });
</script>

<div class="panel h-full flex flex-col">
  <div class="panel-header">
    <div class="flex items-center gap-2">
      <Wifi size={18} class="text-gh-success" />
      <span class="panel-title">传感器状态</span>
      <span class="text-xs text-gh-muted">
        {$sensors.filter((s) => s.status === 'online').length}/{$sensors.length} 在线
      </span>
    </div>
  </div>

  <div class="px-4 py-2 border-b border-gh-border/50 flex items-center gap-2">
    <input
      type="text"
      placeholder="搜索传感器..."
      class="input text-xs flex-1 py-1"
      bind:value={searchQuery}
    />
    <select class="select text-xs py-1" bind:value={statusFilter}>
      <option value="">全部状态</option>
      {#each Object.entries(DEVICE_STATUS_LABELS) as [key, label]}
        <option value={key}>{label}</option>
      {/each}
    </select>
    <select class="select text-xs py-1" bind:value={typeFilter}>
      <option value="">全部类型</option>
      {#each Object.entries(SENSOR_TYPE_LABELS) as [key, label]}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="flex-1 overflow-auto p-2">
    <div class="grid grid-cols-1 gap-2">
      {#each filteredSensors as sensor (sensor.id)}
        <div
          class="p-3 rounded border transition-all cursor-pointer hover:border-gh-accent/50 {$selectedSensor?.id === sensor.id
            ? 'border-gh-accent bg-gh-accent/10'
            : 'border-gh-border bg-gh-bg/50'}"
          class:opacity-60={sensor.status === 'offline'}
          onclick={() => ($selectedSensor = $selectedSensor?.id === sensor.id ? null : sensor)}
        >
          <div class="flex items-center gap-3">
            <div
              class={`p-2 rounded ${sensor.status === 'online'
                ? 'bg-gh-success/20 text-gh-success'
                : sensor.status === 'warning'
                  ? 'bg-gh-warning/20 text-gh-warning'
                  : sensor.status === 'offline'
                    ? 'bg-gh-danger/20 text-gh-danger'
                    : 'bg-slate-700 text-gh-muted'}`}
            >
              <svelte:component this={getTypeIcon(sensor.type)} size={18} />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium truncate">{sensor.name}</span>
                <div class={`status-${sensor.status}`} />
              </div>
              <div class="flex items-center gap-2 text-xs text-gh-muted mt-0.5">
                <span>{getGreenhouseName(sensor.greenhouseId)}</span>
                <span>·</span>
                <span>{sensor.location}</span>
              </div>
            </div>

            <div class="text-right">
              <div
                class={`text-xs font-medium ${sensor.status === 'online'
                  ? 'text-gh-success'
                  : sensor.status === 'warning'
                    ? 'text-gh-warning'
                    : sensor.status === 'offline'
                      ? 'text-gh-danger'
                      : 'text-gh-muted'}`}
              >
                {DEVICE_STATUS_LABELS[sensor.status]}
              </div>
              <div class="text-xs text-gh-muted mt-0.5">
                {sensor.status === 'offline'
                  ? `离线 ${dayjs(sensor.lastSeen).fromNow()}`
                  : `心跳 ${dayjs(sensor.lastSeen).fromNow()}`}
              </div>
            </div>
          </div>

          {#if sensor.status === 'offline'}
            <div class="mt-2 pt-2 border-t border-gh-border/50">
              <div class="flex items-center gap-1 text-xs text-gh-danger">
                <WifiOff size={12} />
                <span>传感器离线，数据可能不完整</span>
              </div>
            </div>
          {/if}

          {#if $selectedSensor?.id === sensor.id}
            <div class="mt-3 pt-3 border-t border-gh-border/50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-gh-muted">采样间隔:</span>
                <span class="text-gh-text ml-1">{sensor.samplingInterval}s</span>
              </div>
              <div>
                <span class="text-gh-muted">阈值范围:</span>
                <span class="text-gh-text ml-1">
                  {sensor.thresholdMin} ~ {sensor.thresholdMax}{sensor.unit}
                </span>
              </div>
              <div>
                <span class="text-gh-muted">安装时间:</span>
                <span class="text-gh-text ml-1">{dayjs(sensor.installedAt).format('YYYY-MM-DD')}</span>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="p-8 text-center text-gh-muted text-sm">
          没有找到匹配的传感器
        </div>
      {/each}
    </div>
  </div>
</div>
