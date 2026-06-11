<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import {
    CheckSquare,
    Plus,
    ShieldCheck,
    Receipt,
    UserCheck,
    Building2,
    UserCircle,
    Calendar,
    FileCheck2,
    Clock
  } from 'lucide-svelte';
  import type { TodoItem } from '$lib/types';
  import {
    materialAuthLabel,
    subscriptionStatusLabel,
    invoiceCycleLabel,
    priorityLabel,
    todoTypeLabel,
    todoStatusLabel,
    formatDate,
    daysFromNow
  } from '$lib/utils';
  import { currentUser } from '$lib/stores';

  export let data: { todos: TodoItem[] };

  let typeFilter = '';
  let statusFilter = '';
  let priorityFilter = '';

  const typeOptions = [
    { v: '', l: '全部' },
    { v: 'material_auth', l: '素材授权' },
    { v: 'invoice_cycle', l: '发票周期' },
    { v: 'subscription', l: '会员订阅' }
  ];

  $: hostId = $currentUser.id;
  $: todos = data.todos.filter((t) => t.assigneeId === hostId || $currentUser.role === 'operator');
  $: filtered = todos.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  const markProcessing = async (todo: TodoItem) => {
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

  const markDone = async (todo: TodoItem) => {
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

<PageHeader title="待办面板" subtitle="素材授权、发票周期、会员订阅等高频事项一览" />

<div class="p-8 space-y-6">
  <div class="card p-5 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 flex-1 flex-wrap">
      <span class="text-sm text-navy-500 mr-1">类型：</span>
      {#each typeOptions as opt (opt.v)}
        <button
          on:click={() => (typeFilter = typeFilter === opt.v ? '' : opt.v)}
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition {typeFilter === opt.v
            ? 'bg-navy-700 text-white'
            : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}"
        >
          {opt.l}
        </button>
      {/each}
    </div>
    <div class="flex items-center gap-2">
      <select bind:value={statusFilter} class="input w-auto text-xs">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="processing">处理中</option>
        <option value="done">已完成</option>
      </select>
      <select bind:value={priorityFilter} class="input w-auto text-xs">
        <option value="">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
    </div>
    <button class="btn-primary">
      <Plus class="w-4 h-4" stroke-width={1.8} />
      新建待办
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {#each filtered as todo, i (todo.id)}
      <div
        class="card card-hover p-5 animate-fade-in-up"
        style="animation-delay: {i * 0.05}s"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <StatusBadge label={priorityLabel[todo.priority]} value={todo.priority} variant="priority" />
            <StatusBadge label={todoStatusLabel[todo.status]} value={todo.status} variant="todo" />
          </div>
          {#if todo.status !== 'done'}
            <button
              on:click={() => markDone(todo)}
              class="w-7 h-7 rounded-lg border border-navy-200 flex items-center justify-center text-navy-400 hover:text-success-green-600 hover:border-success-green-200 hover:bg-success-green-50 transition"
              aria-label="完成"
            >
              <FileCheck2 class="w-4 h-4" stroke-width={1.8} />
            </button>
          {/if}
        </div>

        <h3 class="font-semibold text-navy-900 leading-snug mb-3">{todo.title}</h3>

        <div class="flex flex-wrap gap-1.5 mb-4">
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
          {#if !todo.materialAuthStatus && !todo.invoiceCycle && !todo.subscriptionStatus}
            <span class="badge bg-navy-50 text-navy-500">{todoTypeLabel[todo.type]}</span>
          {/if}
        </div>

        <div class="flex items-center gap-4 text-xs text-navy-500 mb-4 pb-4 border-b border-navy-100">
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
        </div>

        <div class="flex items-center justify-between">
          <span
            class="flex items-center gap-1 text-xs {daysFromNow(todo.dueDate) <= 2
              ? 'text-warn-orange-600'
              : 'text-navy-500'}"
          >
            <Calendar class="w-3.5 h-3.5" stroke-width={1.8} />
            截止 {formatDate(todo.dueDate)}
          </span>
          {#if todo.status === 'pending'}
            <button on:click={() => markProcessing(todo)} class="btn-secondary text-xs px-3 py-1.5">
              开始处理
            </button>
          {:else if todo.status === 'processing'}
            <button on:click={() => markDone(todo)} class="btn-success text-xs px-3 py-1.5">
              完成
            </button>
          {:else}
            <span class="text-xs text-success-green-600 font-medium">✓ 已完成</span>
          {/if}
        </div>
      </div>
    {/each}
    {#if filtered.length === 0}
      <div class="col-span-full card p-16 text-center text-navy-400">没有匹配的待办事项 🎉</div>
    {/if}
  </div>
</div>
