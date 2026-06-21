<script lang="ts">
  import { Calendar, TrendingUp, AlertTriangle, Target } from 'lucide-svelte';
  import { formatNumber, formatPercent } from '$utils';
  import type { AnomalyRecord } from '$types';

  export let data: {
    monthData: { totalAnomalies: number; resolvedRate: number; avgDau: number; avgNewUsers: number };
    monthAnomalies: AnomalyRecord[];
  };

  $: {
  }
</script>

<svelte:head>
  <title>月报复盘 - 用户增长日报</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">月报复盘</h1>
      <p class="mt-1 text-sm text-slate-500">月度数据汇总与异常复盘分析</p>
    </div>
    
    <div class="flex items-center gap-3">
      <select class="select w-40">
        <option>2024年1月</option>
        <option>2024年2月</option>
        <option>2024年3月</option>
      </select>
      <button class="btn-secondary">
        <span>导出月报</span>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-5 animate-fade-in-up" style="animation-delay: 0ms; opacity: 0;">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-primary-100 rounded-lg">
          <Target class="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <p class="text-sm text-slate-500">月度异常数</p>
          <p class="text-2xl font-bold text-slate-900">{data.monthData.totalAnomalies}</p>
        </div>
      </div>
    </div>

    <div class="card p-5 animate-fade-in-up" style="animation-delay: 50ms; opacity: 0;">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-accent-100 rounded-lg">
          <TrendingUp class="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <p class="text-sm text-slate-500">异常解决率</p>
          <p class="text-2xl font-bold text-slate-900">{formatPercent(data.monthData.resolvedRate, 1)}</p>
        </div>
      </div>
    </div>

    <div class="card p-5 animate-fade-in-up" style="animation-delay: 100ms; opacity: 0;">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-warning-100 rounded-lg">
          <AlertTriangle class="w-6 h-6 text-warning-600" />
        </div>
        <div>
          <p class="text-sm text-slate-500">平均日活</p>
          <p class="text-2xl font-bold text-slate-900">{formatNumber(data.monthData.avgDau, 0)}</p>
        </div>
      </div>
    </div>

    <div class="card p-5 animate-fade-in-up" style="animation-delay: 150ms; opacity: 0;">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-purple-100 rounded-lg">
          <Calendar class="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p class="text-sm text-slate-500">平均新增</p>
          <p class="text-2xl font-bold text-slate-900">{formatNumber(data.monthData.avgNewUsers, 0)}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <h3 class="font-semibold text-slate-900 mb-4">月度趋势</h3>
      <div class="h-64 flex items-end justify-between gap-1">
        {#each Array.from({ length: 30 }) as _, i}
          <div class="flex-1 flex flex-col items-center">
            <div 
              class="w-full bg-gradient-to-t from-primary-400 to-primary-300 rounded-t-sm"
              style="height: {30 + Math.random() * 70}%"
            ></div>
          </div>
        {/each}
      </div>
      <div class="flex justify-between mt-2 text-xs text-slate-400">
        <span>月初</span>
        <span>月中</span>
        <span>月末</span>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-slate-900 mb-4">异常分布</h3>
      <div class="space-y-4">
        {#each ['严重', '高', '中', '低'] as level, i}
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-slate-600">{level}级异常</span>
              <span class="text-sm font-medium text-slate-900">{Math.floor(Math.random() * 10) + i * 3} 次</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class={`h-full rounded-full ${i === 0 ? 'bg-danger-500' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-warning-500' : 'bg-slate-400'}`}
                style="width: {80 - i * 20}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="card p-5">
    <h3 class="font-semibold text-slate-900 mb-4">月度异常时间线</h3>
    
    <div class="relative pl-6 space-y-6">
      <div class="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-slate-200"></div>
      
      {#each data.monthAnomalies as anomaly, i}
        <div class="relative animate-fade-in" style="animation-delay: {i * 100}ms">
          <div 
            class="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 z-10"
            class:bg-danger-500={anomaly.severity === 'critical'}
            class:border-danger-500={anomaly.severity === 'critical'}
            class:bg-orange-500={anomaly.severity === 'high'}
            class:border-orange-500={anomaly.severity === 'high'}
            class:bg-warning-500={anomaly.severity === 'medium'}
            class:border-warning-500={anomaly.severity === 'medium'}
            class:bg-white={anomaly.status === 'resolved' || anomaly.status === 'ignored'}
          ></div>
          
          <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-slate-900">{anomaly.metricName}</span>
                  <span 
                    class="badge"
                    class:badge-danger={anomaly.severity === 'critical'}
                    class:badge-warning={anomaly.severity === 'high' || anomaly.severity === 'medium'}
                    class:badge-slate={anomaly.severity === 'low'}
                  >
                    {anomaly.severity === 'critical' ? '严重' : anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
                  </span>
                  <span 
                    class="badge"
                    class:badge-success={anomaly.status === 'resolved'}
                    class:badge-warning={anomaly.status === 'investigating'}
                    class:badge-danger={anomaly.status === 'open'}
                    class:badge-slate={anomaly.status === 'ignored'}
                  >
                    {anomaly.status === 'resolved' ? '已解决' : anomaly.status === 'investigating' ? '调查中' : anomaly.status === 'open' ? '待处理' : '已忽略'}
                  </span>
                </div>
                <p class="text-sm text-slate-500 mt-1">{anomaly.description}</p>
              </div>
              <span class="text-xs text-slate-400 whitespace-nowrap ml-4">{anomaly.date}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
