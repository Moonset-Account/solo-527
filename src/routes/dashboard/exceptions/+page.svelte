<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Tag,
    Building2,
    Clock,
    UserCircle,
    Plus
  } from 'lucide-svelte';
  import { mockExceptions } from '$lib/mock-data';
  import type { ExceptionRecord } from '$lib/types';
  import { exceptionStatusLabel, formatDateTime } from '$lib/utils';
  import { currentUser } from '$lib/stores';

  let brandFilter = '';
  let statusFilter = '';
  let expandedBrands: Set<string> = new Set();
  let selectedException: ExceptionRecord | null = null;
  let resolveResult = '';
  let resolveRemark = '';
  let viewDetail: ExceptionRecord | null = null;

  $: brands = Array.from(new Set(mockExceptions.map((e) => e.brandName)));

  $: filtered = mockExceptions.filter((e) => {
    if (brandFilter && e.brandName !== brandFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  $: grouped = filtered.reduce<Record<string, ExceptionRecord[]>>((acc, ex) => {
    const key = `${ex.brandId}||${ex.brandName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  $: {
    Object.keys(grouped).forEach((k) => {
      if (!expandedBrands.has(k)) expandedBrands.add(k);
    });
  }

  const toggleBrand = (key: string) => {
    if (expandedBrands.has(key)) expandedBrands.delete(key);
    else expandedBrands.add(key);
    expandedBrands = new Set(expandedBrands);
  };

  const openResolve = (ex: ExceptionRecord) => {
    selectedException = ex;
    resolveResult = '';
    resolveRemark = '';
  };

  const closeResolve = () => {
    selectedException = null;
  };

  const handleResolve = () => {
    if (!selectedException) return;
    const idx = mockExceptions.findIndex((e) => e.id === selectedException.id);
    if (idx >= 0) {
      mockExceptions[idx] = {
        ...mockExceptions[idx],
        status: 'resolved',
        result: resolveResult,
        remark: resolveRemark,
        hostId: $currentUser.id,
        hostName: $currentUser.name,
        resolvedAt: new Date().toISOString()
      };
    }
    closeResolve();
  };

  const unconfirmed = mockExceptions.filter((e) => e.status === 'unconfirmed').length;
  const confirmed = mockExceptions.filter((e) => e.status === 'confirmed').length;
  const resolved = mockExceptions.filter((e) => e.status === 'resolved').length;
</script>

<PageHeader title="异常池" subtitle="按品牌归类的异常记录，办结后需补充结果和说明" />

<div class="p-8 space-y-6">
  <div class="grid grid-cols-3 gap-4">
    <div class="card p-4 bg-warn-orange-50/60 border-warn-orange-200">
      <p class="text-xs text-warn-orange-700">未确认</p>
      <p class="font-display text-2xl text-warn-orange-700 mt-1">{unconfirmed}</p>
    </div>
    <div class="card p-4 bg-amber-gold-50/60 border-amber-gold-200">
      <p class="text-xs text-amber-gold-700">已确认/处理中</p>
      <p class="font-display text-2xl text-amber-gold-700 mt-1">{confirmed}</p>
    </div>
    <div class="card p-4 bg-success-green-50/60 border-success-green-200">
      <p class="text-xs text-success-green-700">已办结</p>
      <p class="font-display text-2xl text-success-green-700 mt-1">{resolved}</p>
    </div>
  </div>

  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 flex-1">
      <AlertTriangle class="w-4 h-4 text-navy-400" stroke-width={1.8} />
      <select bind:value={brandFilter} class="input w-auto">
        <option value="">全部品牌</option>
        {#each brands as b (b)}
          <option value={b}>{b}</option>
        {/each}
      </select>
      <select bind:value={statusFilter} class="input w-auto">
        <option value="">全部状态</option>
        <option value="unconfirmed">未确认</option>
        <option value="confirmed">已确认</option>
        <option value="resolved">已办结</option>
      </select>
    </div>
    <button class="btn-secondary">
      <Plus class="w-4 h-4" stroke-width={1.8} />
      上报异常
    </button>
  </div>

  <div class="space-y-4">
    {#each Object.entries(grouped) as [key, list] (key)}
      {@const [brandId, brandName] = key.split('||')}
      {@const expanded = expandedBrands.has(key)}
      <div class="card overflow-hidden animate-fade-in-up">
        <button
          on:click={() => toggleBrand(key)}
          class="w-full flex items-center gap-3 px-5 py-4 hover:bg-navy-50/60 transition text-left"
        >
          {#if expanded}
            <ChevronDown class="w-5 h-5 text-navy-400" stroke-width={1.8} />
          {:else}
            <ChevronRight class="w-5 h-5 text-navy-400" stroke-width={1.8} />
          {/if}
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-gold-200 to-amber-gold-300 flex items-center justify-center">
            <Building2 class="w-4.5 h-4.5 text-amber-gold-800" stroke-width={1.8} />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-navy-900">{brandName}</p>
            <p class="text-xs text-navy-500 mt-0.5">{list.length} 条异常记录</p>
          </div>
          <div class="flex items-center gap-2">
            {#each ['unconfirmed', 'confirmed', 'resolved'] as st}
              {@const count = list.filter((x) => x.status === st).length}
              {#if count > 0}
                <StatusBadge
                  label={`${exceptionStatusLabel[st]} ${count}`}
                  value={st}
                  variant="exception"
                />
              {/if}
            {/each}
          </div>
        </button>

        {#if expanded}
          <div class="border-t border-navy-100">
            <table class="w-full text-sm">
              <thead class="bg-navy-50/40 text-xs text-navy-500 uppercase tracking-wider">
                <tr>
                  <th class="px-5 py-3 text-left font-medium">异常</th>
                  <th class="px-5 py-3 text-left font-medium">分类</th>
                  <th class="px-5 py-3 text-left font-medium">状态</th>
                  <th class="px-5 py-3 text-left font-medium">跟进人</th>
                  <th class="px-5 py-3 text-left font-medium">创建时间</th>
                  <th class="px-5 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-navy-100">
                {#each list as ex, i (ex.id)}
                  <tr class="hover:bg-navy-50/40 transition">
                    <td class="px-5 py-3.5">
                      <button on:click={() => (viewDetail = ex)} class="text-left">
                        <p class="font-medium text-navy-900 hover:text-navy-700">{ex.title}</p>
                        {#if ex.description}
                          <p class="text-xs text-navy-500 mt-0.5 line-clamp-1">{ex.description}</p>
                        {/if}
                      </button>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex items-center gap-1 text-xs text-navy-600">
                        <Tag class="w-3.5 h-3.5 text-navy-400" stroke-width={1.8} />
                        {ex.category}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <StatusBadge
                        label={exceptionStatusLabel[ex.status]}
                        value={ex.status}
                        variant="exception"
                      />
                    </td>
                    <td class="px-5 py-3.5">
                      {#if ex.hostName}
                        <div class="flex items-center gap-2">
                          <Avatar name={ex.hostName} size="sm" />
                          <span class="text-sm text-navy-700">{ex.hostName}</span>
                        </div>
                      {:else}
                        <span class="text-xs text-navy-400">未指派</span>
                      {/if}
                    </td>
                    <td class="px-5 py-3.5 text-xs text-navy-500">
                      {formatDateTime(ex.createdAt)}
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-1">
                        <button on:click={() => (viewDetail = ex)} class="btn-ghost text-xs px-2.5 py-1">详情</button>
                        {#if ex.status !== 'resolved'}
                          <button on:click={() => openResolve(ex)} class="btn-primary text-xs px-2.5 py-1">
                            办结
                          </button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/each}
    {#if Object.keys(grouped).length === 0}
      <div class="card p-16 text-center text-navy-400">暂无异常记录 ✨</div>
    {/if}
  </div>
</div>

<Modal
  open={!!selectedException}
  title="办结异常"
  description={selectedException?.title || ''}
  on:close={closeResolve}
>
  <div class="space-y-4">
    <div>
      <label class="label">处理结果 <span class="text-warn-orange-500">*</span></label>
      <textarea
        bind:value={resolveResult}
        rows="3"
        placeholder="请输入异常处理的最终结果..."
        class="input resize-none"
      />
    </div>
    <div>
      <label class="label">补充说明</label>
      <textarea
        bind:value={resolveRemark}
        rows="3"
        placeholder="可选：原因分析、后续跟进建议等"
        class="input resize-none"
      />
    </div>
    {#if selectedException}
      <div class="rounded-lg bg-navy-50 p-3 text-xs space-y-1">
        <p><span class="text-navy-500">品牌：</span>{selectedException.brandName}</p>
        <p><span class="text-navy-500">分类：</span>{selectedException.category}</p>
        <p><span class="text-navy-500">创建：</span>{formatDateTime(selectedException.createdAt)}</p>
      </div>
    {/if}
  </div>
  <div slot="footer">
    <button on:click={closeResolve} class="btn-ghost">取消</button>
    <button on:click={handleResolve} class="btn-primary" disabled={!resolveResult.trim()}>确认办结</button>
  </div>
</Modal>

<Modal open={!!viewDetail} title="异常详情" on:close={() => (viewDetail = null)}>
  {#if viewDetail}
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <StatusBadge
          label={exceptionStatusLabel[viewDetail.status]}
          value={viewDetail.status}
          variant="exception"
        />
        <span class="badge bg-navy-50 text-navy-600">{viewDetail.category}</span>
      </div>
      <div>
        <p class="text-xs text-navy-500 mb-1">描述</p>
        <p class="text-sm text-navy-800 leading-relaxed">
          {viewDetail.description || '无详细描述'}
        </p>
      </div>
      {#if viewDetail.result}
        <div>
          <p class="text-xs text-navy-500 mb-1">处理结果</p>
          <p class="text-sm text-success-green-700 leading-relaxed bg-success-green-50 p-3 rounded-lg">
            {viewDetail.result}
          </p>
        </div>
      {/if}
      {#if viewDetail.remark}
        <div>
          <p class="text-xs text-navy-500 mb-1">补充说明</p>
          <p class="text-sm text-navy-700 leading-relaxed">{viewDetail.remark}</p>
        </div>
      {/if}
      <div class="grid grid-cols-2 gap-3 pt-2 border-t border-navy-100 text-xs">
        <div>
          <p class="text-navy-500">所属品牌</p>
          <p class="text-navy-800 mt-1">{viewDetail.brandName}</p>
        </div>
        <div>
          <p class="text-navy-500">跟进人</p>
          <p class="text-navy-800 mt-1">{viewDetail.hostName || '未指派'}</p>
        </div>
        <div>
          <p class="text-navy-500">创建时间</p>
          <p class="text-navy-800 mt-1">{formatDateTime(viewDetail.createdAt)}</p>
        </div>
        <div>
          <p class="text-navy-500">办结时间</p>
          <p class="text-navy-800 mt-1">{formatDateTime(viewDetail.resolvedAt)}</p>
        </div>
      </div>
    </div>
  {/if}
  <div slot="footer">
    {#if viewDetail && viewDetail.status !== 'resolved'}
      <button on:click={() => { openResolve(viewDetail); viewDetail = null; }} class="btn-primary">
        立即办结
      </button>
    {/if}
  </div>
</Modal>
