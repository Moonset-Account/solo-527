<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import {
    Terminal,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Repeat,
    ChevronDown,
    ChevronRight,
    Filter,
    Search
  } from 'lucide-svelte';
  import { mockApiLogs } from '$lib/mock-data';
  import { formatDateTime } from '$lib/utils';

  let onlyFailed = true;
  let search = '';
  let expandedId: string | null = null;

  $: filtered = mockApiLogs.filter((l) => {
    if (onlyFailed && l.success) return false;
    if (search && !l.endpoint.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  $: totalFail = mockApiLogs.filter((l) => !l.success).length;
  $: totalSuccess = mockApiLogs.filter((l) => l.success).length;
  $: totalRetries = mockApiLogs.reduce((sum, l) => sum + l.retryCount, 0);

  const toggle = (id: string) => {
    expandedId = expandedId === id ? null : id;
  };

  const retry = async (id: string) => {
    const idx = mockApiLogs.findIndex((l) => l.id === id);
    if (idx >= 0) {
      try {
        const res = await fetch('/api/api-logs/retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const json = await res.json();
        if (json.ok && json.data) {
          mockApiLogs[idx] = json.data;
          return;
        }
      } catch {}
      mockApiLogs[idx] = {
        ...mockApiLogs[idx],
        lastRetryAt: new Date().toISOString(),
        retryCount: mockApiLogs[idx].retryCount + 1
      };
    }
  };
</script>

<PageHeader title="接口监控" subtitle="记录接口失败原因和最近重试，便于排查" />

<div class="p-8 space-y-6">
  <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard label="失败请求" value={totalFail} accent="warn" iconComponent={AlertCircle} />
    <StatCard label="成功请求" value={totalSuccess} accent="success" iconComponent={CheckCircle2} />
    <StatCard label="累计重试" value={totalRetries} accent="amber" iconComponent={Repeat} />
    <StatCard label="今日请求" value={mockApiLogs.length} accent="navy" iconComponent={Terminal} />
  </section>

  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[240px]">
      <Search class="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" stroke-width={1.8} />
      <input bind:value={search} type="text" placeholder="搜索接口路径..." class="input pl-9" />
    </div>
    <label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer bg-navy-50 hover:bg-navy-100 transition">
      <input type="checkbox" bind:checked={onlyFailed} class="rounded border-navy-300 text-navy-700 focus:ring-navy-400" />
      <span class="text-sm text-navy-700">仅看失败</span>
    </label>
    <button class="btn-secondary">
      <RefreshCw class="w-4 h-4" stroke-width={1.8} />
      刷新
    </button>
  </div>

  <div class="card overflow-hidden">
    <div class="divide-y divide-navy-100">
      {#each filtered as log, i (log.id)}
        {@const expanded = expandedId === log.id}
        <div
          class="animate-fade-in-up"
          style="animation-delay: {i * 0.02}s"
        >
          <div
            on:click={() => toggle(log.id)}
            class="w-full flex items-center gap-4 px-6 py-4 hover:bg-navy-50/60 transition text-left cursor-pointer"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 {log.success
                ? 'bg-success-green-50 text-success-green-600'
                : 'bg-warn-orange-50 text-warn-orange-600'}"
            >
              {#if log.success}
                <CheckCircle2 class="w-4.5 h-4.5" stroke-width={1.8} />
              {:else}
                <AlertCircle class="w-4.5 h-4.5" stroke-width={1.8} />
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold {log.method === 'GET'
                    ? 'bg-navy-100 text-navy-700'
                    : log.method === 'POST'
                      ? 'bg-success-green-100 text-success-green-700'
                      : log.method === 'PUT'
                        ? 'bg-amber-gold-100 text-amber-gold-700'
                        : 'bg-warn-orange-100 text-warn-orange-700'}"
                >
                  {log.method}
                </span>
                <code class="font-mono text-sm text-navy-800 truncate">{log.endpoint}</code>
              </div>
              <div class="flex items-center gap-4 text-xs text-navy-500">
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" stroke-width={1.8} />
                  {formatDateTime(log.requestedAt)}
                </span>
                {#if !log.success}
                  <span class="flex items-center gap-1">
                    <Repeat class="w-3.5 h-3.5" stroke-width={1.8} />
                    重试 {log.retryCount} 次
                  </span>
                  {#if log.lastRetryAt}
                    <span>最近：{formatDateTime(log.lastRetryAt)}</span>
                  {/if}
                {/if}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              {#if !log.success}
                <button
                  on:click|stopPropagation={() => retry(log.id)}
                  class="btn-warn text-xs px-3 py-1.5"
                >
                  <Repeat class="w-3.5 h-3.5" stroke-width={1.8} />
                  重试
                </button>
              {/if}
              {#if expanded}
                <ChevronDown class="w-4 h-4 text-navy-400" stroke-width={1.8} />
              {:else}
                <ChevronRight class="w-4 h-4 text-navy-400" stroke-width={1.8} />
              {/if}
            </div>
          </div>
          {#if expanded && !log.success}
            <div class="px-6 pb-5 pt-1 ml-13">
              <div class="rounded-xl bg-warn-orange-50 border border-warn-orange-200 p-4">
                <p class="text-xs font-semibold text-warn-orange-700 mb-1.5">错误信息</p>
                <pre class="text-xs text-warn-orange-800 font-mono whitespace-pre-wrap leading-relaxed">{log.errorMessage}</pre>
              </div>
            </div>
          {/if}
        </div>
      {/each}
      {#if filtered.length === 0}
        <div class="p-16 text-center text-navy-400">没有匹配的接口日志</div>
      {/if}
    </div>
  </div>
</div>
