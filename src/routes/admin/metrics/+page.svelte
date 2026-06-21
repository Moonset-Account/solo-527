<script lang="ts">
  import { Plus, Edit2, Trash2, Info } from 'lucide-svelte';
  import { getMetricDefinitions } from '$server/services/metrics';
  import type { MetricDefinition } from '$types';

  export let data: {
    definitions: MetricDefinition[];
  };

  let selectedCategory = '全部';
  
  const categories = ['全部', '用户规模', '用户增长', '用户留存', '收入转化'];
  
  $: filteredDefinitions = selectedCategory === '全部' 
    ? data.definitions 
    : data.definitions.filter(d => d.category === selectedCategory);
</script>

<svelte:head>
  <title>指标口径 - 后台管理</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">指标口径</h1>
      <p class="mt-1 text-sm text-slate-500">维护指标定义、计算公式和数据来源</p>
    </div>
    <button class="btn-primary">
      <Plus class="w-4 h-4 mr-1.5" />
      新增指标
    </button>
  </div>

  <div class="flex items-center gap-2">
    {#each categories as cat}
      <button 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        class:bg-primary-50={selectedCategory === cat}
        class:text-primary-700={selectedCategory === cat}
        class:text-slate-600={selectedCategory !== cat}
        class:hover:bg-slate-100={selectedCategory !== cat}
        on:click={() => selectedCategory = cat}
      >
        {cat}
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each filteredDefinitions as def}
      <div class="card card-hover p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-semibold text-slate-900">{def.name}</h3>
            <p class="text-sm text-slate-500">{def.key}</p>
          </div>
          <span class="badge badge-info">{def.category}</span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex items-start gap-2">
            <Info class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p class="text-slate-500 text-xs">计算公式</p>
              <p class="text-slate-700 font-mono text-xs">{def.formula || '-'}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-500">数据来源</p>
              <p class="text-sm text-slate-700">{def.dataSource || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">更新频率</p>
              <p class="text-sm text-slate-700">{def.updateFrequency}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">计量单位</p>
              <p class="text-sm text-slate-700">{def.unit || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">负责人</p>
              <p class="text-sm text-slate-700">{def.owner || '-'}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <button class="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Edit2 class="w-4 h-4" />
          </button>
          <button class="p-2 text-slate-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
