<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { FunnelData } from '$lib/types';

  interface Props {
    data: FunnelData | null;
  }

  let { data }: Props = $props();

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts;
  let activeTab: string = $state('overall');

  onMount(() => {
    chart = echarts.init(chartEl);
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!data || !chart) return;

    if (activeTab === 'overall') {
      renderOverallFunnel(data);
    } else {
      renderModelFunnel(data);
    }
  });

  function renderOverallFunnel(funnelData: FunnelData) {
    const maxVal = Math.max(...funnelData.stages.map(s => s.count), 1);
    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: Record<string, unknown>) => {
          const d = params.data as Record<string, unknown>;
          return `${d.name}<br/>数量: ${d.value}<br/>占比: ${((d.value as number) / maxVal * 100).toFixed(1)}%`;
        }
      },
      series: [{
        type: 'funnel',
        left: '10%',
        top: 30,
        bottom: 30,
        width: '80%',
        min: 0,
        max: maxVal,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: Record<string, unknown>) => {
            const d = params.data as Record<string, unknown>;
            return `${d.name}\n${d.value}`;
          },
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        data: funnelData.stages.map((s, i) => ({
          value: s.count,
          name: s.name,
          itemStyle: {
            color: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'][i]
          }
        }))
      }]
    }, true);
  }

  function renderModelFunnel(funnelData: FunnelData) {
    const models = Object.keys(funnelData.by_model);
    const stageNames = ['预约提交', '确认到店', '实际到店', '完成试驾', '成交转化'];

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: stageNames,
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: models,
        axisLabel: { rotate: 30, fontSize: 11 }
      },
      yAxis: {
        type: 'value'
      },
      series: stageNames.map((name, i) => ({
        name,
        type: 'bar',
        stack: 'total',
        data: models.map(m => {
          const stages = funnelData.by_model[m];
          return stages[i]?.count || 0;
        }),
        itemStyle: {
          color: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'][i]
        }
      }))
    }, true);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <h3>预约漏斗</h3>
    <div class="tab-group">
      <button class:active={activeTab === 'overall'} onclick={() => activeTab = 'overall'}>总览</button>
      <button class:active={activeTab === 'model'} onclick={() => activeTab = 'model'}>按车型</button>
    </div>
  </div>
  <div class="chart-container" bind:this={chartEl}></div>
</div>

<style>
  .panel {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 20px;
    height: 420px;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .panel-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .tab-group {
    display: flex;
    gap: 4px;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 2px;
  }

  .tab-group button {
    padding: 4px 14px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    background: transparent;
    color: #6b7280;
    transition: all 0.2s;
  }

  .tab-group button.active {
    background: #fff;
    color: #3b82f6;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }

  .chart-container {
    flex: 1;
    min-height: 0;
  }
</style>
