<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { CancellationDetail } from '$lib/types';

  interface Props {
    data: CancellationDetail[];
  }

  let { data }: Props = $props();

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts;
  let viewMode: string = $state('combined');

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
    let filtered = data;
    if (viewMode === 'cancel') filtered = data.filter(d => !d.is_no_show);
    else if (viewMode === 'noshow') filtered = data.filter(d => d.is_no_show);

    if (viewMode === 'combined' || viewMode === 'cancel') {
      renderPieChart(filtered);
    } else {
      renderBarChart(filtered);
    }
  }

  function renderPieChart(details: CancellationDetail[]) {
    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: Record<string, unknown>) => {
          const d = params.data as Record<string, unknown>;
          return `${d.name}<br/>数量: ${d.value}<br/>占比: ${params.percent}%`;
        }
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
          fontSize: 11
        },
        data: details.map(d => ({
          value: d.count,
          name: d.reason + (d.is_no_show ? '(爽约)' : ''),
          itemStyle: {
            color: d.is_no_show ? '#f59e0b' : '#ef4444'
          }
        }))
      }]
    }, true);
  }

  function renderBarChart(details: CancellationDetail[]) {
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: details.map(d => d.reason),
        axisLabel: { rotate: 20, fontSize: 10 }
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: details.map(d => ({
          value: d.count,
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12
        }
      }]
    }, true);
  }
</script>

<div class="panel">
  <div class="panel-header">
    <h3>取消/爽约原因分析</h3>
    <div class="tab-group">
      <button class:active={viewMode === 'combined'} onclick={() => viewMode = 'combined'}>综合</button>
      <button class:active={viewMode === 'cancel'} onclick={() => viewMode = 'cancel'}>取消</button>
      <button class:active={viewMode === 'noshow'} onclick={() => viewMode = 'noshow'}>爽约</button>
    </div>
  </div>

  {#if data.length > 0}
    <div class="chart-container" bind:this={chartEl}></div>
    <div class="detail-table">
      <table>
        <thead>
          <tr>
            <th>原因</th>
            <th>数量</th>
            <th>占比</th>
            <th>类型</th>
            <th>车型缺货</th>
            <th>客户主动改约</th>
          </tr>
        </thead>
        <tbody>
          {#each data as item}
            <tr>
              <td>{item.reason}</td>
              <td>{item.count}</td>
              <td>{item.percentage}%</td>
              <td>
                <span class="badge" class:noshow={item.is_no_show}>
                  {item.is_no_show ? '爽约' : '取消'}
                </span>
              </td>
              <td>{item.model_out_of_stock}</td>
              <td>{item.customer_reschedule}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty">暂无取消/爽约数据</div>
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
    color: #ef4444;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }

  .chart-container {
    height: 250px;
    min-height: 250px;
  }

  .detail-table {
    margin-top: 12px;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  th {
    background: #f9fafb;
    padding: 8px 10px;
    text-align: left;
    color: #6b7280;
    font-weight: 500;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 8px 10px;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    background: #fef2f2;
    color: #ef4444;
  }

  .badge.noshow {
    background: #fffbeb;
    color: #f59e0b;
  }

  .empty {
    text-align: center;
    color: #9ca3af;
    padding: 40px 0;
  }
</style>
