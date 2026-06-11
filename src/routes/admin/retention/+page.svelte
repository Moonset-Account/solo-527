<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import {
    TrendingDown,
    Bell,
    AlertTriangle,
    Check,
    Building2,
    Clock,
    RefreshCw
  } from 'lucide-svelte';
  import { mockRetentionAlerts } from '$lib/mock-data';
  import type { RetentionAlert } from '$lib/types';
  import { alertStatusLabel, formatDateTime } from '$lib/utils';

  let statusFilter = '';

  const statusOptions = [
    { v: '', l: '全部' },
    { v: 'active', l: '预警中' },
    { v: 'acknowledged', l: '已认领' },
    { v: 'resolved', l: '已解决' }
  ];

  $: filtered = mockRetentionAlerts.filter((a) => !statusFilter || a.status === statusFilter);

  $: activeCount = mockRetentionAlerts.filter((a) => a.status === 'active').length;
  $: ackCount = mockRetentionAlerts.filter((a) => a.status === 'acknowledged').length;
  $: resolvedCount = mockRetentionAlerts.filter((a) => a.status === 'resolved').length;

  const acknowledge = async (alert: RetentionAlert) => {
    const idx = mockRetentionAlerts.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      try {
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: alert.id, action: 'acknowledge' })
        });
        const json = await res.json();
        if (json.ok && json.data) {
          mockRetentionAlerts[idx] = json.data;
          return;
        }
      } catch {}
      mockRetentionAlerts[idx] = { ...mockRetentionAlerts[idx], status: 'acknowledged', notifiedAt: new Date().toISOString() };
    }
  };

  const resolve = async (alert: RetentionAlert) => {
    const idx = mockRetentionAlerts.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      try {
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: alert.id, action: 'resolve' })
        });
        const json = await res.json();
        if (json.ok && json.data) {
          mockRetentionAlerts[idx] = json.data;
          return;
        }
      } catch {}
      mockRetentionAlerts[idx] = { ...mockRetentionAlerts[idx], status: 'resolved' };
    }
  };
</script>

<PageHeader title="付费留存预警" subtitle="自动检测留存异常并提醒对应负责人" />

<div class="p-8 space-y-6">
  <section class="grid grid-cols-3 gap-4">
    <StatCard label="预警中" value={activeCount} accent="warn" iconComponent={AlertTriangle} />
    <StatCard label="已认领" value={ackCount} accent="amber" iconComponent={Clock} />
    <StatCard label="已解决" value={resolvedCount} delta={5} accent="success" iconComponent={Check} />
  </section>

  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 flex-1">
      {#each statusOptions as opt (opt.v)}
        <button
          on:click={() => (statusFilter = statusFilter === opt.v ? '' : opt.v)}
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition {statusFilter === opt.v
            ? 'bg-navy-700 text-white'
            : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}"
        >
          {opt.l}
        </button>
      {/each}
    </div>
    <button class="btn-secondary">
      <RefreshCw class="w-4 h-4" stroke-width={1.8} />
      刷新指标
    </button>
  </div>

  <div class="space-y-4">
    {#each filtered as alert, i (alert.id)}
      <div
        class="card p-6 animate-fade-in-up {alert.status === 'active'
          ? 'border-l-4 border-l-warn-orange-400'
          : alert.status === 'acknowledged'
            ? 'border-l-4 border-l-amber-gold-400'
            : 'border-l-4 border-l-success-green-400'}"
        style="animation-delay: {i * 0.04}s"
      >
        <div class="flex items-start justify-between gap-6">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap mb-3">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-warn-orange-100 to-warn-orange-50 border border-warn-orange-200 flex items-center justify-center">
                  <TrendingDown class="w-4.5 h-4.5 text-warn-orange-600" stroke-width={1.8} />
                </div>
                <div>
                  <p class="font-semibold text-navy-900 flex items-center gap-2">
                    <Building2 class="w-4 h-4 text-navy-400" stroke-width={1.8} />
                    {alert.brandName}
                  </p>
                  <p class="text-xs text-navy-500 mt-0.5">{alert.metric} 低于阈值</p>
                </div>
              </div>
              <StatusBadge label={alertStatusLabel[alert.status]} value={alert.status} variant="alert" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div class="rounded-xl bg-navy-50 p-4">
                <p class="text-xs text-navy-500">当前值</p>
                <p class="mt-1 font-display text-2xl text-warn-orange-600">{alert.currentValue}%</p>
              </div>
              <div class="rounded-xl bg-navy-50 p-4">
                <p class="text-xs text-navy-500">阈值</p>
                <p class="mt-1 font-display text-2xl text-navy-800">{alert.threshold}%</p>
              </div>
              <div class="rounded-xl bg-navy-50 p-4">
                <p class="text-xs text-navy-500">缺口</p>
                <p class="mt-1 font-display text-2xl text-warn-orange-600">
                  {(Number(alert.threshold) - Number(alert.currentValue)).toFixed(1)}%
                </p>
              </div>
            </div>

            <div class="w-full bg-navy-100 rounded-full h-2 overflow-hidden mb-4">
              <div
                class="h-full rounded-full bg-gradient-to-r from-warn-orange-300 via-warn-orange-400 to-warn-orange-500 transition-all"
                style="width: {Math.min(100, (Number(alert.currentValue) / Number(alert.threshold)) * 100)}%"
              />
            </div>

            <div class="flex items-center gap-4 text-xs text-navy-500">
              <div class="flex items-center gap-1.5">
                <Avatar name={alert.ownerName} size="sm" className="w-5 h-5 text-[10px]" />
                <span>负责人：{alert.ownerName}</span>
              </div>
              {#if alert.notifiedAt}
                <span>上次提醒：{formatDateTime(alert.notifiedAt)}</span>
              {/if}
              <span>创建：{formatDateTime(alert.createdAt)}</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 shrink-0">
            {#if alert.status === 'active'}
              <button class="btn-warn text-xs px-3 py-2">
                <Bell class="w-3.5 h-3.5" stroke-width={1.8} />
                再次提醒
              </button>
              <button on:click={() => acknowledge(alert)} class="btn-secondary text-xs px-3 py-2">
                我来认领
              </button>
            {/if}
            {#if alert.status === 'acknowledged'}
              <button on:click={() => resolve(alert)} class="btn-success text-xs px-3 py-2">
                <Check class="w-3.5 h-3.5" stroke-width={1.8} />
                标记已解决
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
    {#if filtered.length === 0}
      <div class="card p-16 text-center text-navy-400">暂无留存预警 ✨</div>
    {/if}
  </div>
</div>
