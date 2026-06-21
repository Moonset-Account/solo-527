<script lang="ts">
  import { getLatestMetrics, getMetricsTrend } from '$server/services/metrics';
  import { getTodayAnomaliesCount, getAnomalies } from '$server/services/anomalies';
  import type { AnomalyRecord } from '$types';

  export let data: {
    metrics: Array<{
      metricKey: string;
      metricName: string;
      unit: string;
      value: number;
      dod: number;
      wow: number;
      trendData: number[];
    }>;
    anomalySummary: { total: number; critical: number; high: number };
    recentAnomalies: AnomalyRecord[];
  };
</script>

<svelte:head>
  <title>指标看板 - 用户增长日报</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">指标看板</h1>
      <p class="mt-1 text-sm text-slate-500">今日用户增长数据概览</p>
    </div>
    
    <div class="flex items-center gap-3">
      <select class="select w-40">
        <option>最近7天</option>
        <option>最近30天</option>
        <option>本月</option>
        <option>上月</option>
      </select>
      <button class="btn-secondary">
        <span>导出数据</span>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each data.metrics as metric, i}
      <div class="card card-hover p-5 animate-fade-in-up" style="animation-delay: {i * 50}ms; opacity: 0;">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-sm font-medium text-slate-500">{metric.metricName}</p>
            <p class="mt-1 text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metric.value >= 1000 
                ? metric.value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
                : metric.unit === '%' 
                  ? (metric.value * 100).toFixed(2) + '%'
                  : metric.value.toFixed(2)
              }
              {#if metric.unit && metric.unit !== '%'}
                <span class="text-base font-normal text-slate-500 ml-1">{metric.unit}</span>
              {/if}
            </p>
          </div>
          <div 
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
            class:bg-accent-50={metric.dod >= 0}
            class:text-accent-700={metric.dod >= 0}
            class:bg-danger-50={metric.dod < 0}
            class:text-danger-700={metric.dod < 0}
          >
            {metric.dod >= 0 ? '↑' : '↓'} {Math.abs(metric.dod * 100).toFixed(2)}%
          </div>
        </div>

        {#if metric.trendData.length > 0}
          <div class="h-12 flex items-end gap-0.5">
            {#each metric.trendData as v, idx}
              <div 
                class="flex-1 rounded-sm transition-all duration-300"
                class:bg-primary-200={idx < metric.trendData.length - 1}
                class:bg-primary-500={idx === metric.trendData.length - 1}
                style="height: {Math.max(v * 100, 8)}%"
              ></div>
            {/each}
          </div>
          <p class="mt-2 text-xs text-slate-400">较前日 {metric.dod >= 0 ? '上升' : '下降'} {Math.abs(metric.dod * 100).toFixed(2)}%</p>
        {/if}
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-900">指标趋势</h3>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1 text-xs font-medium rounded-md bg-primary-50 text-primary-700">日活</button>
          <button class="px-3 py-1 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-100">新增</button>
          <button class="px-3 py-1 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-100">留存</button>
        </div>
      </div>
      
      <div class="h-72 flex items-end justify-between gap-1 px-2">
        {#each Array.from({ length: 30 }) as _, i}
          <div class="flex-1 flex flex-col items-center gap-1">
            <div 
              class="w-full bg-primary-400/30 rounded-t-sm relative"
              style="height: {40 + Math.random() * 60}%"
            >
              <div 
                class="absolute bottom-0 w-full bg-primary-500 rounded-t-sm"
                style="height: {30 + Math.random() * 70}%"
              ></div>
            </div>
            {#if i % 5 === 0}
              <span class="text-xs text-slate-400">{30 - i}日前</span>
            {:else}
              <span class="text-xs text-transparent">-</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-900">今日异常</h3>
        <a href="/anomalies" class="text-sm text-primary-600 hover:text-primary-700">查看全部</a>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center p-3 bg-danger-50 rounded-lg">
          <p class="text-2xl font-bold text-danger-600">{data.anomalySummary.critical}</p>
          <p class="text-xs text-danger-600 mt-1">严重</p>
        </div>
        <div class="text-center p-3 bg-orange-50 rounded-lg">
          <p class="text-2xl font-bold text-orange-600">{data.anomalySummary.high}</p>
          <p class="text-xs text-orange-600 mt-1">高</p>
        </div>
        <div class="text-center p-3 bg-slate-50 rounded-lg">
          <p class="text-2xl font-bold text-slate-600">{data.anomalySummary.total}</p>
          <p class="text-xs text-slate-600 mt-1">总计</p>
        </div>
      </div>

      <div class="space-y-3">
        {#each data.recentAnomalies as anomaly}
          <a href="/anomalies/{anomaly.id}" class="block p-3 rounded-lg hover:bg-slate-50 transition-colors group">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span 
                  class="w-2 h-2 rounded-full"
                  class:bg-danger-500={anomaly.severity === 'critical'}
                  class:bg-orange-500={anomaly.severity === 'high'}
                  class:bg-warning-500={anomaly.severity === 'medium'}
                  class:bg-slate-400={anomaly.severity === 'low'}
                ></span>
                <span class="text-sm font-medium text-slate-900">{anomaly.metricName}</span>
              </div>
              <span 
                class="text-sm font-medium"
                class:text-danger-600={anomaly.deviationPercent < 0}
                class:text-accent-600={anomaly.deviationPercent > 0}
              >
                {anomaly.deviationPercent > 0 ? '+' : ''}{(anomaly.deviationPercent * 100).toFixed(1)}%
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-500 line-clamp-1 pl-4">{anomaly.description}</p>
          </a>
        {/each}
      </div>
    </div>
  </div>

  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-slate-900">核心指标明细</h3>
      <div class="flex items-center gap-2">
        <select class="select w-32 text-sm">
          <option>全部指标</option>
          <option>用户规模</option>
          <option>用户增长</option>
          <option>用户留存</option>
          <option>收入转化</option>
        </select>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200">
            <th class="table-header text-left py-3 px-4">指标名称</th>
            <th class="table-header text-right py-3 px-4">今日数值</th>
            <th class="table-header text-right py-3 px-4">昨日数值</th>
            <th class="table-header text-right py-3 px-4">日环比</th>
            <th class="table-header text-right py-3 px-4">周同比</th>
            <th class="table-header text-center py-3 px-4">趋势</th>
          </tr>
        </thead>
        <tbody>
          {#each data.metrics as metric}
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="table-cell font-medium">{metric.metricName}</td>
              <td class="table-cell text-right font-mono">
                {metric.value >= 1000 
                  ? metric.value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
                  : metric.unit === '%' 
                    ? (metric.value * 100).toFixed(2) + '%'
                    : metric.value.toFixed(2)
                }
              </td>
              <td class="table-cell text-right text-slate-500 font-mono">
                {(metric.value / (1 + metric.dod)).toLocaleString('zh-CN', { maximumFractionDigits: metric.unit === '%' ? 4 : 0 })}
              </td>
              <td class={`table-cell text-right font-medium ${metric.dod >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
                {metric.dod >= 0 ? '+' : ''}{(metric.dod * 100).toFixed(2)}%
              </td>
              <td class={`table-cell text-right font-medium ${metric.wow >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
                {metric.wow >= 0 ? '+' : ''}{(metric.wow * 100).toFixed(2)}%
              </td>
              <td class="table-cell">
                <div class="flex items-center justify-center gap-0.5 h-6">
                  {#each metric.trendData.slice(-10) as v}
                    <div 
                      class="w-1.5 rounded-sm"
                      class:bg-primary-300={v < 0.5}
                      class:bg-primary-500={v >= 0.5}
                      style="height: {Math.max(v * 100, 20)}%"
                    ></div>
                  {/each}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
