<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import {
    Users,
    Search,
    Filter,
    ShieldCheck,
    Receipt,
    UserCheck,
    Building2,
    Mail,
    Phone
  } from 'lucide-svelte';
  import { mockSubscriptions } from '$lib/mock-data';
  import {
    materialAuthLabel,
    subscriptionStatusLabel,
    invoiceCycleLabel,
    planTypeLabel,
    formatDate
  } from '$lib/utils';

  let search = '';
  let statusFilter = '';
  let brandFilter = '';

  const brands = Array.from(new Set(mockSubscriptions.map((s) => s.brandName)));

  $: filtered = mockSubscriptions.filter((s) => {
    if (search && !s.memberName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && s.subscriptionStatus !== statusFilter) return false;
    if (brandFilter && s.brandName !== brandFilter) return false;
    return true;
  });
</script>

<PageHeader title="会员订阅" subtitle="管理播客品牌下的所有会员订阅" />

<div class="p-8 space-y-6">
  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[240px]">
      <Search class="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" stroke-width={1.8} />
      <input
        bind:value={search}
        type="text"
        placeholder="搜索会员姓名..."
        class="input pl-9"
      />
    </div>
    <div class="flex items-center gap-2">
      <Filter class="w-4 h-4 text-navy-400" stroke-width={1.8} />
      <select bind:value={statusFilter} class="input w-auto">
        <option value="">全部状态</option>
        <option value="active">有效中</option>
        <option value="expiring">即将到期</option>
        <option value="expired">已过期</option>
        <option value="cancelled">已取消</option>
      </select>
      <select bind:value={brandFilter} class="input w-auto">
        <option value="">全部品牌</option>
        {#each brands as b (b)}
          <option value={b}>{b}</option>
        {/each}
      </select>
    </div>
    <button class="btn-primary">
      <Users class="w-4 h-4" stroke-width={1.8} />
      新增会员
    </button>
  </div>

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-navy-50/70">
          <tr class="text-left text-xs text-navy-600 uppercase tracking-wider">
            <th class="px-6 py-4 font-medium">会员信息</th>
            <th class="px-6 py-4 font-medium">所属品牌</th>
            <th class="px-6 py-4 font-medium">订阅方案</th>
            <th class="px-6 py-4 font-medium">素材授权</th>
            <th class="px-6 py-4 font-medium">发票周期</th>
            <th class="px-6 py-4 font-medium">订阅状态</th>
            <th class="px-6 py-4 font-medium">有效期</th>
            <th class="px-6 py-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-navy-100">
          {#each filtered as sub, i (sub.id)}
            <tr
              class="hover:bg-navy-50/40 transition animate-fade-in-up"
              style="animation-delay: {i * 0.02}s"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <Avatar name={sub.memberName} />
                  <div>
                    <p class="font-medium text-navy-900">{sub.memberName}</p>
                    <p class="text-xs text-navy-400 mt-0.5 flex items-center gap-1.5">
                      <Mail class="w-3 h-3" stroke-width={1.8} />
                      member@example.com
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 text-navy-700">
                  <Building2 class="w-3.5 h-3.5 text-navy-400" stroke-width={1.8} />
                  {sub.brandName}
                </span>
              </td>
              <td class="px-6 py-4 text-navy-700">{planTypeLabel[sub.planType]}</td>
              <td class="px-6 py-4">
                <StatusBadge
                  label={materialAuthLabel[sub.materialAuthStatus]}
                  value={sub.materialAuthStatus}
                  variant="material"
                />
              </td>
              <td class="px-6 py-4">
                <StatusBadge
                  label={invoiceCycleLabel[sub.invoiceCycle]}
                  value={sub.invoiceCycle}
                  variant="invoice"
                />
              </td>
              <td class="px-6 py-4">
                <StatusBadge
                  label={subscriptionStatusLabel[sub.subscriptionStatus]}
                  value={sub.subscriptionStatus}
                  variant="subscription"
                />
              </td>
              <td class="px-6 py-4 text-navy-600">
                {formatDate(sub.startDate)} ~ {formatDate(sub.endDate)}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button class="btn-ghost text-xs px-2.5 py-1">查看</button>
                  <button class="btn-ghost text-xs px-2.5 py-1 text-amber-gold-700">编辑</button>
                </div>
              </td>
            </tr>
          {/each}
          {#if filtered.length === 0}
            <tr>
              <td colspan="8" class="px-6 py-16 text-center text-navy-400">暂无匹配的会员订阅记录</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <div class="flex items-center justify-between px-6 py-4 border-t border-navy-100 text-sm text-navy-500">
      <span>共 {filtered.length} 条记录</span>
      <div class="flex items-center gap-1">
        <button class="btn-ghost text-xs px-2.5 py-1">上一页</button>
        <button class="btn-primary text-xs px-2.5 py-1">1</button>
        <button class="btn-ghost text-xs px-2.5 py-1">下一页</button>
      </div>
    </div>
  </div>
</div>
