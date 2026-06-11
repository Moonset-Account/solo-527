<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    ShoppingBag,
    Search,
    Filter,
    Plus,
    ChevronRight,
    CheckCircle2,
    Clock,
    Circle
  } from 'lucide-svelte';
  import { mockOrders } from '$lib/mock-data';
  import type { Order } from '$lib/types';
  import {
    orderStatusLabel,
    deliveryStatusLabel,
    formatDateTime,
    formatDate
  } from '$lib/utils';

  let search = '';
  let statusFilter = '';
  let viewOrder: Order | null = null;

  $: filtered = mockOrders.filter((o) => {
    if (search) {
      const s = search.toLowerCase();
      if (!o.orderNo.toLowerCase().includes(s) && !o.memberName.toLowerCase().includes(s)) return false;
    }
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  });

  const updateOrderStatus = async (order: Order, status: Order['status']) => {
    const idx = mockOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      try {
        const res = await fetch('/api/orders/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: order.id, status })
        });
        const json = await res.json();
        if (json.ok && json.data) {
          mockOrders[idx] = json.data;
          if (viewOrder && viewOrder.id === order.id) {
            viewOrder = json.data;
          }
          return;
        }
      } catch {}
      mockOrders[idx] = { ...mockOrders[idx], status };
      if (viewOrder && viewOrder.id === order.id) {
        viewOrder = { ...viewOrder, status };
      }
    }
  };
</script>

<PageHeader title="订单管理" subtitle="全量订单查询、状态流转和交付进度追踪" />

<div class="p-8 space-y-6">
  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[240px]">
      <Search class="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" stroke-width={1.8} />
      <input bind:value={search} type="text" placeholder="搜索订单号、会员姓名..." class="input pl-9" />
    </div>
    <div class="flex items-center gap-2">
      <Filter class="w-4 h-4 text-navy-400" stroke-width={1.8} />
      <select bind:value={statusFilter} class="input w-auto">
        <option value="">全部状态</option>
        <option value="pending">待支付</option>
        <option value="paid">已支付</option>
        <option value="delivering">交付中</option>
        <option value="completed">已完成</option>
        <option value="refunded">已退款</option>
      </select>
    </div>
    <button class="btn-primary">
      <Plus class="w-4 h-4" stroke-width={1.8} />
      新建订单
    </button>
  </div>

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-navy-50/70">
          <tr class="text-left text-xs text-navy-600 uppercase tracking-wider">
            <th class="px-6 py-4 font-medium">订单号</th>
            <th class="px-6 py-4 font-medium">会员</th>
            <th class="px-6 py-4 font-medium">品牌</th>
            <th class="px-6 py-4 font-medium">金额</th>
            <th class="px-6 py-4 font-medium">支付时间</th>
            <th class="px-6 py-4 font-medium">交付进度</th>
            <th class="px-6 py-4 font-medium">状态</th>
            <th class="px-6 py-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-navy-100">
          {#each filtered as order, i (order.id)}
            <tr
              class="hover:bg-navy-50/40 transition animate-fade-in-up"
              style="animation-delay: {i * 0.02}s"
            >
              <td class="px-6 py-4 font-mono text-xs text-navy-700">{order.orderNo}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                  <Avatar name={order.memberName} size="sm" />
                  <span class="font-medium text-navy-900">{order.memberName}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-navy-700">{order.brandName}</td>
              <td class="px-6 py-4 font-semibold text-navy-900">¥ {order.amount}</td>
              <td class="px-6 py-4 text-xs text-navy-500">{formatDateTime(order.paidAt)}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  {#each order.deliveryNodes as node}
                    <div
                      title={`${node.name}：${deliveryStatusLabel[node.status]}`}
                      class="w-6 h-6 rounded-full flex items-center justify-center {node.status === 'completed'
                        ? 'bg-success-green-100 text-success-green-600'
                        : node.status === 'in_progress'
                          ? 'bg-amber-gold-100 text-amber-gold-600'
                          : 'bg-navy-100 text-navy-400'}"
                    >
                      {#if node.status === 'completed'}
                        <CheckCircle2 class="w-3.5 h-3.5" stroke-width={2} />
                      {:else if node.status === 'in_progress'}
                        <Clock class="w-3.5 h-3.5" stroke-width={2} />
                      {:else}
                        <Circle class="w-3.5 h-3.5" stroke-width={2} />
                      {/if}
                    </div>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4">
                <StatusBadge label={orderStatusLabel[order.status]} value={order.status} variant="order" />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button on:click={() => (viewOrder = order)} class="btn-ghost text-xs px-2.5 py-1">
                    详情
                  </button>
                  {#if order.status === 'paid'}
                    <button
                      on:click={() => updateOrderStatus(order, 'delivering')}
                      class="btn-primary text-xs px-2.5 py-1"
                    >
                      启动交付
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
          {#if filtered.length === 0}
            <tr>
              <td colspan="8" class="px-6 py-16 text-center text-navy-400">暂无匹配的订单</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<Modal open={!!viewOrder} title="订单详情" size="lg" onClose={() => (viewOrder = null)} footer={true}>
  {#if viewOrder}
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-navy-500 mb-1">订单号</p>
          <p class="font-mono text-navy-800">{viewOrder.orderNo}</p>
        </div>
        <div>
          <p class="text-xs text-navy-500 mb-1">状态</p>
          <StatusBadge label={orderStatusLabel[viewOrder.status]} value={viewOrder.status} variant="order" />
        </div>
        <div>
          <p class="text-xs text-navy-500 mb-1">会员</p>
          <p class="text-navy-800">{viewOrder.memberName}</p>
        </div>
        <div>
          <p class="text-xs text-navy-500 mb-1">品牌</p>
          <p class="text-navy-800">{viewOrder.brandName}</p>
        </div>
        <div>
          <p class="text-xs text-navy-500 mb-1">金额</p>
          <p class="font-semibold text-navy-900">¥ {viewOrder.amount}</p>
        </div>
        <div>
          <p class="text-xs text-navy-500 mb-1">创建时间</p>
          <p class="text-navy-800">{formatDateTime(viewOrder.createdAt)}</p>
        </div>
      </div>

      <div>
        <p class="text-sm font-semibold text-navy-900 mb-3">交付节点</p>
        <div class="space-y-2">
          {#each viewOrder.deliveryNodes as node, i (node.id)}
            <div
              class="flex items-center gap-4 p-3 rounded-xl border {node.status === 'completed'
                ? 'border-success-green-200 bg-success-green-50/40'
                : node.status === 'in_progress'
                  ? 'border-amber-gold-200 bg-amber-gold-50/40'
                  : 'border-navy-100 bg-white'}"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {node.status === 'completed'
                  ? 'bg-success-green-500 text-white'
                  : node.status === 'in_progress'
                    ? 'bg-amber-gold-500 text-white'
                    : 'bg-navy-200 text-navy-500'}"
              >
                {i + 1}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-navy-900">{node.name}</p>
                <p class="text-xs text-navy-500 mt-0.5">
                  截止 {formatDate(node.deadline)}
                  {#if node.assigneeName}
                    {' · 责任人 '}{node.assigneeName}
                  {/if}
                </p>
              </div>
              <StatusBadge label={deliveryStatusLabel[node.status]} value={node.status} variant="delivery" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
  <div slot="footer">
    {#if viewOrder && viewOrder.status === 'paid'}
      <button
        on:click={() => updateOrderStatus(viewOrder!, 'delivering')}
        class="btn-primary"
      >
        启动交付流程
      </button>
    {/if}
  </div>
</Modal>
