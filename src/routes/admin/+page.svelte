<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import {
    ShoppingBag,
    Users,
    DollarSign,
    TrendingDown,
    AlertTriangle,
    ChevronRight,
    Bell
  } from 'lucide-svelte';
  import { orderStatusLabel, formatDateTime, alertStatusLabel } from '$lib/utils';
  import { currentUser } from '$lib/stores';
  import type { Order, MemberSubscription, RetentionAlert, ApiLog, User } from '$lib/types';

  export let data: {
    orders: Order[];
    subscriptions: MemberSubscription[];
    retentionAlerts: RetentionAlert[];
    apiLogs: ApiLog[];
    users: User[];
  };

  $: currentUser.set(data.users.find((u) => u.role === 'operator') || data.users[2]);

  $: totalRevenue = data.orders
    .filter((o) => ['paid', 'delivering', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.amount), 0)
    .toLocaleString('zh-CN');

  $: activeSubs = data.subscriptions.filter((s) => s.subscriptionStatus === 'active').length;
  $: pendingOrders = data.orders.filter((o) => ['pending', 'paid', 'delivering'].includes(o.status)).length;
  $: activeAlerts = data.retentionAlerts.filter((a) => a.status === 'active').length;
  $: failedApis = data.apiLogs.filter((l) => !l.success).length;
</script>

<PageHeader title="运营后台" subtitle="订单、交付、留存全链路监控" />

<div class="p-8 space-y-8">
  <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <StatCard label="本月营收" value={`¥ ${totalRevenue}`} delta={15} accent="success" iconComponent={DollarSign} />
    <StatCard label="活跃会员" value={activeSubs} delta={8} accent="navy" iconComponent={Users} />
    <StatCard label="进行中订单" value={pendingOrders} accent="amber" iconComponent={ShoppingBag} />
    <StatCard label="活跃预警" value={activeAlerts} accent="warn" iconComponent={TrendingDown} />
    <StatCard label="接口失败" value={failedApis} accent="warn" iconComponent={AlertTriangle} />
  </section>

  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 card p-6 animate-fade-in-up">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-5 h-5 text-navy-600" stroke-width={1.8} />
          <h2 class="font-display text-lg text-navy-900">近期订单</h2>
        </div>
        <a href="/admin/orders" class="text-sm text-navy-500 hover:text-navy-800 flex items-center gap-1">
          查看全部
          <ChevronRight class="w-4 h-4" stroke-width={1.8} />
        </a>
      </div>
      <div class="overflow-x-auto -mx-6 px-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-navy-500 uppercase tracking-wider">
              <th class="pb-3 pr-4 font-medium">订单号</th>
              <th class="pb-3 pr-4 font-medium">会员</th>
              <th class="pb-3 pr-4 font-medium">品牌</th>
              <th class="pb-3 pr-4 font-medium">金额</th>
              <th class="pb-3 pr-4 font-medium">状态</th>
              <th class="pb-3 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-navy-100">
            {#each data.orders.slice(0, 5) as order, i (order.id)}
              <tr class="hover:bg-navy-50/50 transition">
                <td class="py-3 pr-4 font-mono text-xs text-navy-700">{order.orderNo}</td>
                <td class="py-3 pr-4">
                  <div class="flex items-center gap-2">
                    <Avatar name={order.memberName} size="sm" />
                    <span class="text-navy-800">{order.memberName}</span>
                  </div>
                </td>
                <td class="py-3 pr-4 text-navy-600">{order.brandName}</td>
                <td class="py-3 pr-4 font-medium text-navy-900">¥ {order.amount}</td>
                <td class="py-3 pr-4">
                  <StatusBadge label={orderStatusLabel[order.status]} value={order.status} variant="order" />
                </td>
                <td class="py-3 text-xs text-navy-500">{formatDateTime(order.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card p-6 animate-fade-in-up" style="animation-delay: 0.05s">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <TrendingDown class="w-5 h-5 text-warn-orange-500" stroke-width={1.8} />
          <h2 class="font-display text-lg text-navy-900">留存预警</h2>
        </div>
        <a href="/admin/retention" class="text-sm text-navy-500 hover:text-navy-800 flex items-center gap-1">
          管理
          <ChevronRight class="w-4 h-4" stroke-width={1.8} />
        </a>
      </div>
      <div class="space-y-3">
        {#each data.retentionAlerts as alert, i (alert.id)}
          <div
            class="p-3.5 rounded-xl border border-navy-100 hover:border-warn-orange-200 bg-white hover:bg-warn-orange-50/30 transition animate-fade-in-up"
            style="animation-delay: {0.08 + i * 0.04}s"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <p class="text-sm font-semibold text-navy-900">{alert.brandName}</p>
                <p class="text-xs text-navy-500 mt-0.5">{alert.metric} 异常</p>
              </div>
              <StatusBadge label={alertStatusLabel[alert.status]} value={alert.status} variant="alert" />
            </div>
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1 bg-navy-100 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-warn-orange-400 to-warn-orange-500"
                  style="width: {Math.min(100, (Number(alert.currentValue) / Number(alert.threshold)) * 100)}%"
                />
              </div>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-navy-500">
                当前 <span class="font-semibold text-warn-orange-600">{alert.currentValue}%</span>
                {' / 阈值 '}
                <span class="font-semibold text-navy-600">{alert.threshold}%</span>
              </span>
              <button
                class="inline-flex items-center gap-1 text-navy-600 hover:text-warn-orange-600 font-medium"
                title="提醒负责人"
              >
                <Bell class="w-3.5 h-3.5" stroke-width={1.8} />
                提醒
              </button>
            </div>
            <div class="mt-2.5 pt-2.5 border-t border-navy-100 flex items-center gap-1.5 text-xs text-navy-500">
              <Avatar name={alert.ownerName} size="sm" className="w-5 h-5 text-[10px]" />
              负责人：{alert.ownerName}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
</div>
