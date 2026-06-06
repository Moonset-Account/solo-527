<script lang="ts">
  import { onMount } from 'svelte';
  import {
    greenhouses,
    sensors,
    valves,
    batches,
    sensorReadings,
    irrigationEvents,
    alerts,
    dataUpdateInfo,
    filters,
    loading
  } from '$lib/stores/appStore';
  import {
    getGreenhouses,
    getSensors,
    getValves,
    getBatches,
    getSensorReadings,
    getIrrigationEvents,
    getAlerts,
    getDataUpdateInfo,
    initializeDatabase
  } from '$lib/data/store';

  import FilterBar from '$lib/components/FilterBar.svelte';
  import DataInfoBar from '$lib/components/DataInfoBar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import TimeSeriesChart from '$lib/components/charts/TimeSeriesChart.svelte';
  import AlertPanel from '$lib/components/AlertPanel.svelte';
  import SensorStatusPanel from '$lib/components/SensorStatusPanel.svelte';
  import IrrigationCalendar from '$lib/components/IrrigationCalendar.svelte';
  import BatchComparison from '$lib/components/BatchComparison.svelte';
  import AnomalyPanel from '$lib/components/AnomalyPanel.svelte';
  import DataQualityModal from '$lib/components/DataQualityModal.svelte';
  import { Sprout, BarChart3, Settings, HelpCircle, Leaf, FileCheck } from 'lucide-svelte';
  import type { SensorType } from '$lib/types';

  let activeTab: 'overview' | 'sensors' | 'irrigation' | 'batches' | 'anomalies' = 'overview';
  let showDataQuality = false;

  async function loadData() {
    loading.set(true);
    try {
      await initializeDatabase();

      const [gh, sen, val, bat, alertData, updateInfo] = await Promise.all([
        getGreenhouses(),
        getSensors(),
        getValves(),
        getBatches(),
        getAlerts(),
        getDataUpdateInfo()
      ]);

      greenhouses.set(gh);
      sensors.set(sen);
      valves.set(val);
      batches.set(bat);
      alerts.set(alertData);
      dataUpdateInfo.set(updateInfo);

      await refreshReadings();
    } finally {
      loading.set(false);
    }
  }

  async function refreshReadings() {
    const [{ readings }, events] = await Promise.all([
      getSensorReadings($filters),
      getIrrigationEvents($filters)
    ]);
    sensorReadings.set(readings);
    irrigationEvents.set(events);

    const updateInfo = await getDataUpdateInfo();
    dataUpdateInfo.set(updateInfo);
  }

  let autoRefreshInterval: number | null = null;

  onMount(() => {
    loadData();

    autoRefreshInterval = window.setInterval(() => {
      refreshReadings();
    }, 60000);

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  });

  $: if ($filters) {
    refreshReadings();
  }

  const metricTypes: SensorType[] = ['temperature', 'humidity', 'light', 'soil_moisture'];
  const tabs = [
    { id: 'overview', label: '总览', icon: BarChart3 },
    { id: 'sensors', label: '传感器', icon: Settings },
    { id: 'irrigation', label: '灌溉', icon: Leaf },
    { id: 'batches', label: '批次对比', icon: Sprout },
    { id: 'anomalies', label: '异常分析', icon: HelpCircle }
  ];
</script>

<div class="flex flex-col h-screen">
  <header class="bg-gh-panel border-b border-gh-border px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-gh-primary/20 rounded-lg">
        <Sprout size={24} class="text-gh-accent" />
      </div>
      <div>
        <h1 class="text-lg font-bold">温室传感器与灌溉监控分析工作台</h1>
        <p class="text-xs text-gh-muted">农业物联网数据分析平台</p>
      </div>
    </div>

    <div class="flex items-center gap-1 bg-gh-bg rounded-lg p-1">
      {#each tabs as tab}
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors {activeTab ===
          tab.id
            ? 'bg-gh-primary text-white'
            : 'text-gh-muted hover:text-gh-text hover:bg-gh-border/50'}"
          onclick={() => (activeTab = tab.id as typeof activeTab)}
        >
          <svelte:component this={tab.icon} size={16} />
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="flex items-center gap-3">
      <button
        class="btn btn-secondary flex items-center gap-2 text-xs"
        onclick={() => (showDataQuality = true)}
      >
        <FileCheck size={14} />
        数据校验
      </button>
      {#if $loading}
        <span class="text-xs text-gh-muted flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-gh-accent animate-pulse" />
          加载中...
        </span>
      {/if}
      <div class="w-8 h-8 rounded-full bg-gh-primary/30 flex items-center justify-center text-sm font-medium">
        农
      </div>
    </div>
  </header>

  <FilterBar />
  <DataInfoBar />

  <main class="flex-1 overflow-auto p-4">
    {#if activeTab === 'overview'}
      <div class="space-y-4">
        <div class="grid grid-cols-4 gap-4">
          {#each metricTypes as type}
            <MetricCard readings={$sensorReadings} sensors={$sensors} {type} />
          {/each}
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2 panel h-[400px]">
            <div class="panel-header">
              <span class="panel-title">实时趋势曲线</span>
            </div>
            <div class="p-4 h-[calc(100%-48px)]">
              <TimeSeriesChart readings={$sensorReadings} sensors={$sensors} selectedType="all" />
            </div>
          </div>
          <div class="h-[400px]">
            <AlertPanel />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="h-[350px]">
            <IrrigationCalendar />
          </div>
          <div class="h-[350px]">
            <SensorStatusPanel />
          </div>
        </div>
      </div>
    {:else if activeTab === 'sensors'}
      <div class="grid grid-cols-3 gap-4 h-full">
        <div class="col-span-2 panel">
          <div class="panel-header">
            <span class="panel-title">传感器详细趋势</span>
          </div>
          <div class="p-4 h-[calc(100%-48px)]">
            <TimeSeriesChart readings={$sensorReadings} sensors={$sensors} selectedType="all" />
          </div>
        </div>
        <div class="h-full">
          <SensorStatusPanel />
        </div>
      </div>
    {:else if activeTab === 'irrigation'}
      <div class="h-full">
        <IrrigationCalendar />
      </div>
    {:else if activeTab === 'batches'}
      <div class="h-full">
        <BatchComparison />
      </div>
    {:else if activeTab === 'anomalies'}
      <div class="grid grid-cols-2 gap-4 h-full">
        <div class="h-full">
          <AnomalyPanel />
        </div>
        <div class="panel h-full">
          <div class="panel-header">
            <span class="panel-title">数据质量分布</span>
          </div>
          <div class="p-4 h-[calc(100%-48px)]">
            <div class="grid grid-cols-2 gap-4">
              {#each metricTypes as type}
                <div class="p-4 bg-gh-bg/50 rounded border border-gh-border">
                  <MetricCard readings={$sensorReadings} sensors={$sensors} {type} />
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </main>

  <DataQualityModal isOpen={showDataQuality} onClose={() => (showDataQuality = false)} />
</div>
