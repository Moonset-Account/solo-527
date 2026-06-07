<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { ConversionData } from '$lib/types';

  interface Props {
    data: ConversionData[];
  }

  let { data }: Props = $props();

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts;
  let viewMode: string = $state('stacked');

  onMount(() => {
    chart = echarts.init(chartEl);
    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!data || !chart) return;
    renderChart();
  });

  function renderChart() {
    if (viewMode === 'stacked') {
      renderStackedBar();
    } else {
      renderRateChart();
    }
  }

  function renderStackedBar() {
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['到店成交', '后续成交', '未成交'],
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.model_name),
        axisLabel: { rotate: 30, fontSize: 11 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '到店成交',
          type: 'bar',
          stack: 'total',
          data: data.map(d => d.in_store_conversion),
          itemStyle: { color: '#10b981', borderRadius: [0, 0, 0, 0] }
        },
        {
          name: '后续成交',
          type: 'bar',
          stack: 'total',
          data: data.map(d => d.follow_up_conversion),
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: '未成交',
          type: 'bar',
          stack: 'total',
          data: data.map(d => d.total_completed - d.in_store_conversion - d.follow_up_conversion),
          itemStyle: { color: '#d1d5db', borderRadius: [4, 4, 0, 0] }
        }
      ]
    }, true);
  }

  function renderRateChart() {
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: Record<string, unknown>[]) => {
          let html = (params[0] as Record<string, unknown>).axisValue as string;
          for (const p of params) {
            const pd = p as Record<string, unknown>;
            html += `<br/>${pd.seriesName}: ${pd.value}%`;
          }
          return html;
        }
      },
      legend: {
        data: ['到店转化率', '后续转化率', '总转化率'],
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.model_name),
        axisLabel: { rotate: 30, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' },
        max: 100
      },
      series: [
        {
          name: '到店转化率',
          type: 'bar',
          data: data.map(d => d.in_store_rate),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '后续转化率',
          type: 'bar',
          data: data.map(d => d.follow_up_rate),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '总转化率',
          type: 'line',
          data: data.map(d => d.total_rate),
          itemStyle: { color: '#ec4899' },
          lineStyle: { width: 2 },
          symbolSize: 6
        }
      ]
    }, true);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <h3>成交转化分析</h3>
    <div class="tab-group">
      <button class:active={viewMode === 'stacked'} onclick={() => viewMode = 'stacked'}>构成</button>
      <button class:active={viewMode === 'rate'} onclick={() => viewMode = 'rate'}>转化率</button>
    </div>
  </div>
  <div class="chart-container" bind:this={chartEl}></div>

  {#if data.length > 0}
    <div class="swap-info">
      <div class="swap-title">调车信息（保留原预约车型）</div>
      {#each data.filter(d => d.vehicle_swap_count > 0) as item}
        <div class="swap-item">
          <span class="model-name">{item.model_name}</span>
          <span class="swap-count">调车 {item.vehicle_swap_count} 次</span>
          <span class="preserve-count">原车型保留 {item.original_model_preserved} 次</span>
        </div>
      {/each}
      {#if data.filter(d => d.vehicle_swap_count > 0).length === 0}
        <div class="no-swap">当前筛选条件下无调车记录</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .panel {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 20px;
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
    color: #10b981;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }

  .chart-container {
    height: 300px;
    min-height: 300px;
  }

  .swap-info {
    margin-top: 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px;
  }

  .swap-title {
    font-size: 13px;
    font-weight: 600;
    color: #166534;
    margin-bottom: 8px;
  }

  .swap-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    font-size: 12px;
    color: #15803d;
  }

  .model-name {
    font-weight: 600;
    min-width: 80px;
  }

  .swap-count {
    color: #f59e0b;
  }

  .preserve-count {
    color: #3b82f6;
  }

  .no-swap {
    font-size: 12px;
    color: #9ca3af;
  }
</style>
