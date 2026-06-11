<script lang="ts">
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { currentUser as userStore } from '$lib/stores';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    Users,
    CheckSquare,
    AlertTriangle,
    DollarSign,
    ShieldCheck,
    Receipt,
    UserCheck,
    ChevronRight,
    Clock,
    Tag,
    Building2,
    UserCircle,
    Calendar,
    FileCheck2
  } from 'lucide-svelte';
  import {
    materialAuthLabel,
    subscriptionStatusLabel,
    invoiceCycleLabel,
    priorityLabel,
    todoTypeLabel,
    todoStatusLabel,
    exceptionStatusLabel,
    planTypeLabel,
    formatDate,
    formatDateTime,
    daysFromNow
  } from '$lib/utils';
  import type { ExceptionRecord, TodoItem, User, MemberSubscription } from '$lib/types';

  export let data: {
    users: User[];
    subscriptions: MemberSubscription[];
    todos: TodoItem[];
    exceptions: ExceptionRecord[];
  };

  $: {
    const role = ($page.url.searchParams.get('role') as 'host' | 'operator') || 'host';
    const user = data.users.find((u) => u.role === role) || data.users[0];
    userStore.set(user);
  }

  let selectedException: ExceptionRecord | null = null;
  let resolveResult = '';
  let resolveRemark = '';

  $: host = $userStore;

  $: hostSubscriptions = data.subscriptions.filter((s) => {
    if (host.role === 'operator') return true;
    const brand = data.subscriptions.find((x) => x.brandId === s.brandId);
    return s.brandId !== '';
  });

  $: hostTodos = data.todos.filter((t) => t.assigneeId === host.id || host.role === 'operator');
  $: pendingTodos = hostTodos.filter((t) => t.status !== 'done');

  $: hostExceptions = data.exceptions;
  $: exceptionsByBrand = hostExceptions.reduce<Record<string, ExceptionRecord[]>>((acc, ex) => {
    if (!acc[ex.brandId]) acc[ex.brandId] = [];
    acc[ex.brandId].push(ex);
    return acc;
  }, {});
  $: unconfirmedCount = hostExceptions.filter((e) => e.status === 'unconfirmed').length;

  const openResolve = (ex: ExceptionRecord) => {
    selectedException = ex;
    resolveResult = '';
    resolveRemark = '';
  };

  const closeResolve = () => {
    selectedException = null;
  };

  const handleResolve = async () => {
    if (!selectedException) return;
    try {
      const res = await fetch('/api/exceptions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedException.id,
          result: resolveResult,
          remark: resolveRemark,
          hostId: host.id,
          hostName: host.name
        })
      });
      const json = await res.json();
      if (json.ok) {
        await invalidateAll();
      }
    } catch {
      await invalidateAll();
    }
    closeResolve();
  };

  const markTodoProcessing = async (todo: TodoItem) => {
    try {
      const res = await fetch('/api/todos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todo.id, status: 'processing' })
      });
      const json = await res.json();
      if (json.ok) {
        await invalidateAll();
      }
    } catch {
      await invalidateAll();
    }
  };

  const markTodoDone = async (todo: TodoItem) => {
    try {
      const res = await fetch('/api/todos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todo.id, status: 'done' })
      });
      const json = await res.json();
      if (json.ok) {
        await invalidateAll();
      }
    } catch {
      await invalidateAll();
    }
  };
</script>

<PageHeader
  title="主理人工作台"
  subtitle="{host.name} · {host.role === 'host' ? '播客主理人' : '运营负责人'}"
/>

<div class="p-8 space-y-8">
  <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      label="会员订阅"
      value={hostSubscriptions.length}
      delta={12}
      accent="navy"
      iconComponent={Users}
    />
    <StatCard
      label="待办事项"
      value={pendingTodos.length}
      accent="amber"
      iconComponent={CheckSquare}
    />
    <StatCard
      label="未确认异常"
      value={unconfirmedCount}
      accent="warn"
      iconComponent={AlertTriangle}
    />
    <StatCard
      label="本月收入"
      value="¥ 28,560"
      delta={8}
      accent="success"
      iconComponent={DollarSign}
    />
  </section>

  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="card p-6 animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <CheckSquare class="w-5 h-5 text-amber-gold-600" stroke-width={1.8} />
            <h2 class="font-display text-lg text-navy-900">待办事项</h2>
            <span class="badge bg-amber-gold-100 text-amber-gold-700">{pendingTodos.length}</span>
          </div>
          <a href="/dashboard/todos" class="text-sm text-navy-500 hover:text-navy-800 flex items-center gap-1">
            查看全部
            <ChevronRight class="w-4 h-4" stroke-width={1.8} />
          </a>
        </div>

        <div class="space-y-3">
          {#each pendingTodos.slice(0, 4) as todo, i (todo.id)}
            <div
              class="group card-hover p-4 rounded-xl border border-navy-100 bg-white hover:border-navy-200 transition animate-fade-in-up"
              style="animation-delay: {0.15 + i * 0.05}s"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-2">
                    <StatusBadge
                      label={priorityLabel[todo.priority]}
                      value={todo.priority}
                      variant="priority"
                    />
                    <StatusBadge
                      label={todoTypeLabel[todo.type]}
                      value={todo.status}
                      variant="todo"
                    />
                    {#if todo.materialAuthStatus}
                      <StatusBadge
                        label={`素材：${materialAuthLabel[todo.materialAuthStatus]}`}
                        value={todo.materialAuthStatus}
                        variant="material"
                      />
                    {/if}
                    {#if todo.invoiceCycle}
                      <StatusBadge
                        label={`发票：${invoiceCycleLabel[todo.invoiceCycle]}`}
                        value={todo.invoiceCycle}
                        variant="invoice"
                      />
                    {/if}
                    {#if todo.subscriptionStatus}
                      <StatusBadge
                        label={`订阅：${subscriptionStatusLabel[todo.subscriptionStatus]}`}
                        value={todo.subscriptionStatus}
                        variant="subscription"
                      />
                    {/if}
                  </div>
                  <p class="font-medium text-navy-900">{todo.title}</p>
                  <div class="mt-2 flex items-center gap-4 text-xs text-navy-500">
                    <span class="flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" stroke-width={1.8} />
                      {todo.relatedBrandName}
                    </span>
                    {#if todo.relatedMemberName}
                      <span class="flex items-center gap-1">
                        <UserCircle class="w-3.5 h-3.5" stroke-width={1.8} />
                        {todo.relatedMemberName}
                      </span>
                    {/if}
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" stroke-width={1.8} />
                      截止 {formatDate(todo.dueDate)}
                      {#if daysFromNow(todo.dueDate) <= 2}
                        <span class="text-warn-orange-600 font-medium ml-1">（{daysFromNow(todo.dueDate) > 0 ? `还剩${daysFromNow(todo.dueDate)}天` : '已逾期'}）</span>
                      {/if}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  {#if todo.status === 'pending'}
                    <button
                      on:click={() => markTodoProcessing(todo)}
                      class="btn-secondary text-xs px-3 py-1.5"
                    >
                      开始处理
                    </button>
                  {:else if todo.status === 'processing'}
                    <button on:click={() => markTodoDone(todo)} class="btn-success text-xs px-3 py-1.5">
                      <FileCheck2 class="w-3.5 h-3.5" stroke-width={1.8} />
                      完成
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
          {#if pendingTodos.length === 0}
            <div class="py-12 text-center text-navy-400 text-sm">暂无待办事项 🎉</div>
          {/if}
        </div>
      </div>

      <div class="card p-6 animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <Users class="w-5 h-5 text-navy-600" stroke-width={1.8} />
            <h2 class="font-display text-lg text-navy-900">会员订阅</h2>
          </div>
          <a href="/dashboard/members" class="text-sm text-navy-500 hover:text-navy-800 flex items-center gap-1">
            管理
            <ChevronRight class="w-4 h-4" stroke-width={1.8} />
          </a>
        </div>

        <div class="overflow-x-auto -mx-6 px-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-navy-500 uppercase tracking-wider">
                <th class="pb-3 pr-4 font-medium">会员</th>
                <th class="pb-3 pr-4 font-medium">品牌</th>
                <th class="pb-3 pr-4 font-medium">方案</th>
                <th class="pb-3 pr-4 font-medium">素材授权</th>
                <th class="pb-3 pr-4 font-medium">发票周期</th>
                <th class="pb-3 pr-4 font-medium">订阅状态</th>
                <th class="pb-3 font-medium">到期</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-navy-100">
              {#each hostSubscriptions.slice(0, 5) as sub, i (sub.id)}
                <tr class="hover:bg-navy-50/50 transition">
                  <td class="py-3 pr-4">
                    <div class="flex items-center gap-2.5">
                      <Avatar name={sub.memberName} size="sm" />
                      <span class="font-medium text-navy-900">{sub.memberName}</span>
                    </div>
                  </td>
                  <td class="py-3 pr-4 text-navy-700">{sub.brandName}</td>
                  <td class="py-3 pr-4 text-navy-600">{planTypeLabel[sub.planType]}</td>
                  <td class="py-3 pr-4">
                    <StatusBadge
                      label={materialAuthLabel[sub.materialAuthStatus]}
                      value={sub.materialAuthStatus}
                      variant="material"
                    />
                  </td>
                  <td class="py-3 pr-4">
                    <StatusBadge
                      label={invoiceCycleLabel[sub.invoiceCycle]}
                      value={sub.invoiceCycle}
                      variant="invoice"
                    />
                  </td>
                  <td class="py-3 pr-4">
                    <StatusBadge
                      label={subscriptionStatusLabel[sub.subscriptionStatus]}
                      value={sub.subscriptionStatus}
                      variant="subscription"
                    />
                  </td>
                  <td class="py-3 text-navy-600">{formatDate(sub.endDate)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="card p-6 animate-fade-in-up" style="animation-delay: 0.15s">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-warn-orange-500" stroke-width={1.8} />
            <h2 class="font-display text-lg text-navy-900">异常池</h2>
            {#if unconfirmedCount > 0}
              <span class="badge bg-warn-orange-100 text-warn-orange-700">{unconfirmedCount} 待确认</span>
            {/if}
          </div>
          <a href="/dashboard/exceptions" class="text-sm text-navy-500 hover:text-navy-800 flex items-center gap-1">
            全部
            <ChevronRight class="w-4 h-4" stroke-width={1.8} />
          </a>
        </div>

        <div class="space-y-4">
          {#each Object.entries(exceptionsByBrand) as [brandId, list], bi (brandId)}
            <div>
              <div class="flex items-center gap-2 mb-2">
                <Tag class="w-3.5 h-3.5 text-navy-400" stroke-width={1.8} />
                <span class="text-sm font-semibold text-navy-700">
                  {list[0]?.brandName || '未命名品牌'}
                </span>
                <span class="text-xs text-navy-400">({list.length})</span>
              </div>
              <div class="space-y-2 ml-5.5 pl-3 border-l-2 border-navy-100">
                {#each list as ex, i (ex.id)}
                  <div
                    class="p-3 rounded-lg border border-navy-100 bg-white hover:border-navy-200 transition animate-fade-in-up"
                    style="animation-delay: {0.2 + bi * 0.05 + i * 0.03}s"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-navy-900 truncate">{ex.title}</p>
                        <div class="mt-1 flex items-center gap-2 flex-wrap">
                          <StatusBadge
                            label={exceptionStatusLabel[ex.status]}
                            value={ex.status}
                            variant="exception"
                          />
                          <span class="text-[11px] text-navy-400">{ex.category}</span>
                        </div>
                        {#if ex.description}
                          <p class="mt-1.5 text-xs text-navy-500 line-clamp-2">{ex.description}</p>
                        {/if}
                      </div>
                      {#if ex.status !== 'resolved'}
                        <button
                          on:click={() => openResolve(ex)}
                          class="text-[11px] text-navy-600 hover:text-navy-900 font-medium shrink-0 px-2 py-1 rounded hover:bg-navy-50 transition"
                        >
                          办结
                        </button>
                      {/if}
                    </div>
                    {#if ex.hostName}
                      <div class="mt-2 flex items-center gap-1.5 text-[11px] text-navy-500">
                        <Avatar name={ex.hostName} size="sm" className="w-5 h-5 text-[10px]" />
                        <span>跟进人：{ex.hostName}</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>
</div>

<Modal
  open={!!selectedException}
  title="办结异常"
  description={selectedException?.title || ''}
  onClose={closeResolve}
  footer={true}
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
        placeholder="可选：补充说明、后续跟进建议等"
        class="input resize-none"
      />
    </div>
    {#if selectedException}
      <div class="rounded-lg bg-navy-50 p-3 text-xs space-y-1">
        <p><span class="text-navy-500">品牌：</span><span class="text-navy-800">{selectedException.brandName}</span></p>
        <p><span class="text-navy-500">分类：</span><span class="text-navy-800">{selectedException.category}</span></p>
        <p><span class="text-navy-500">创建时间：</span><span class="text-navy-800">{formatDateTime(selectedException.createdAt)}</span></p>
      </div>
    {/if}
  </div>
  <div slot="footer">
    <button on:click={closeResolve} class="btn-ghost">取消</button>
    <button on:click={handleResolve} class="btn-primary" disabled={!resolveResult.trim()}>
      确认办结
    </button>
  </div>
</Modal>
