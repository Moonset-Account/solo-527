<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import {
    GitBranch,
    Plus,
    GripVertical,
    CheckCircle2,
    Clock,
    Circle,
    Building2,
    Calendar
  } from 'lucide-svelte';
  import { mockOrders, mockUsers } from '$lib/mock-data';
  import { deliveryStatusLabel, orderStatusLabel, formatDate } from '$lib/utils';

  let selectedBrand = '';
  const brands = Array.from(new Set(mockOrders.map((o) => o.brandName)));
</script>

<PageHeader title="交付节点管理" subtitle="配置交付流程节点、分配责任人、追踪进度" />

<div class="p-8 space-y-6">
  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 flex-1">
      <GitBranch class="w-4 h-4 text-navy-400" stroke-width={1.8} />
      <select bind:value={selectedBrand} class="input w-auto">
        <option value="">全部品牌</option>
        {#each brands as b (b)}
          <option value={b}>{b}</option>
        {/each}
      </select>
    </div>
    <button class="btn-secondary">
      <Plus class="w-4 h-4" stroke-width={1.8} />
      导入流程模板
    </button>
    <button class="btn-primary">
      <Plus class="w-4 h-4" stroke-width={1.8} />
      新增节点
    </button>
  </div>

  <div class="space-y-5">
    {#each mockOrders.filter((o) => !selectedBrand || o.brandName === selectedBrand) as order, oi (order.id)}
      <div class="card overflow-hidden animate-fade-in-up" style="animation-delay: {oi * 0.04}s">
        <div class="px-6 py-4 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-white border border-navy-200 flex items-center justify-center">
              <Building2 class="w-4 h-4 text-navy-600" stroke-width={1.8} />
            </div>
            <div>
              <p class="font-semibold text-navy-900">{order.brandName}</p>
              <p class="text-xs text-navy-500 mt-0.5 font-mono">{order.orderNo} · {order.memberName}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-navy-500">¥ {order.amount}</span>
            <StatusBadge label={orderStatusLabel[order.status]} value={order.status} variant="order" />
          </div>
        </div>
        <div class="p-6">
          <div class="relative">
            <div class="absolute top-5 left-[34px] right-6 h-0.5 bg-navy-100" aria-hidden="true"></div>
            <div class="flex gap-4 overflow-x-auto pb-2">
              {#each order.deliveryNodes as node, i (node.id)}
                <div class="relative flex-1 min-w-[200px] shrink-0">
                  <div
                    class="relative z-10 w-[68px] h-[68px] mx-auto rounded-2xl flex items-center justify-center mb-3 transition-all {node.status === 'completed'
                      ? 'bg-gradient-to-br from-success-green-400 to-success-green-600 text-white shadow-lg shadow-success-green-200'
                      : node.status === 'in_progress'
                        ? 'bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 text-white shadow-lg shadow-amber-gold-200 animate-pulse'
                        : 'bg-white border-2 border-dashed border-navy-200 text-navy-400'}"
                  >
                    {#if node.status === 'completed'}
                      <CheckCircle2 class="w-7 h-7" stroke-width={2} />
                    {:else if node.status === 'in_progress'}
                      <Clock class="w-7 h-7" stroke-width={2} />
                    {:else}
                      <span class="text-lg font-semibold">{i + 1}</span>
                    {/if}
                  </div>
                  <div class="text-center">
                    <p class="font-medium text-sm text-navy-900">{node.name}</p>
                    <div class="mt-2 inline-block">
                      <StatusBadge
                        label={deliveryStatusLabel[node.status]}
                        value={node.status}
                        variant="delivery"
                      />
                    </div>
                    <p class="mt-2 text-xs text-navy-500 flex items-center justify-center gap-1">
                      <Calendar class="w-3 h-3" stroke-width={1.8} />
                      {formatDate(node.deadline)}
                    </p>
                    {#if node.assigneeName}
                      <div class="mt-2 flex items-center justify-center gap-1.5">
                        <Avatar name={node.assigneeName} size="sm" className="w-5 h-5 text-[10px]" />
                        <span class="text-xs text-navy-600">{node.assigneeName}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
