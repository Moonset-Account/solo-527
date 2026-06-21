<script lang="ts">
  import { Search, Download, Plus, Filter } from 'lucide-svelte';
  import Pagination from '$components/Pagination.svelte';
  import { getMetricData } from '$server/services/metrics';
  import type { MetricData } from '$types';
  import { formatNumber, formatPercent } from '$utils';

  export let data: {
    metrics: { data: MetricData[]; total: number; page: number; pageSize: number; totalPages: number };
  };

  let currentPage = 1;

  $: paginatedData = data.metrics;
</script>

<svelte:head>
  <title>数据管理 - 后台管理</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">数据管理</h1>
      <p class="mt-1 text-sm text-slate-500">管理指标数据的录入、修改和导出</p>
    </div>
    <div class="flex items-center gap-3">
      <button class="btn-secondary">
        <Plus class="w-4 h-4 mr-1.5" />
        新增数据
      </button>
      <button class="btn-primary">
        <Download class="w-4 h-4 mr-1.5" />
        导出
      </button>
    </div>
  </div>

  <div class="card p-4">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-64">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="搜索指标名称..." class="input pl-10" />
        </div>
      </div>
      <select class="select w-40">
        <option>全部指标</option>
        <option>日活</option>
        <option>新增用户</option>
        <option>留存率</option>
      </select>
      <input type="date" class="input w-40" />
      <span class="text-slate-400">至</span>
      <input type="date" class="input w-40" />
      <button class="btn-secondary">
        <Filter class="w-4 h-4 mr-1.5" />
        筛选
      </button>
    </div>
  </div>

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="table-header text-left py-3 px-4">日期</th>
            <th class="table-header text-left py-3 px-4">指标</th>
            <th class="table-header text-right py-3 px-4">数值</th>
            <th class="table-header text-right py-3 px-4">日环比</th>
            <th class="table-header text-right py-3 px-4">周同比</th>
            <th class="table-header text-left py-3 px-4">来源</th>
            <th class="table-header text-center py-3 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedData.data as item}
            <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="table-cell text-slate-600">{item.date}</td>
              <td class="table-cell font-medium">{item.metricKey}</td>
              <td class="table-cell text-right font-mono">{formatNumber(item.value, 2)}</td>
              <td class={`table-cell text-right font-medium ${item.dod && item.dod >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
                {item.dod !== undefined ? (item.dod >= 0 ? '+' : '') + formatPercent(item.dod, 2) : '-'}
              </td>
              <td class={`table-cell text-right font-medium ${item.wow && item.wow >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
                {item.wow !== undefined ? (item.wow >= 0 ? '+' : '') + formatPercent(item.wow, 2) : '-'}
              </td>
              <td class="table-cell">
                <span class="badge badge-slate">{item.source}</span>
              </td>
              <td class="table-cell text-center">
                <div class="flex items-center justify-center gap-2">
                  <button class="text-primary-600 hover:text-primary-700 text-sm">编辑</button>
                  <button class="text-danger-600 hover:text-danger-700 text-sm">删除</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="p-4 border-t border-slate-200">
      <Pagination 
        page={paginatedData.page} 
        totalPages={paginatedData.totalPages} 
        total={paginatedData.total}
        pageSize={paginatedData.pageSize}
      />
    </div>
  </div>
</div>
