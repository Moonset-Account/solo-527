<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentUser } from '$stores/user';
  import TodoCard from '$components/TodoCard.svelte';
  import RiskAlert from '$components/RiskAlert.svelte';
  import StatCard from '$components/StatCard.svelte';
  import StatusBadge from '$components/StatusBadge.svelte';
  import {
    FileText, Calendar, TestTube, FlaskConical, Archive, Shield, AlertTriangle, ChevronRight } from 'lucide-svelte';
  import { todoTypeMap, formatDate } from '$utils/format';
  import {
    mockTodos,
    mockRisks,
    getTodoStats,
    getRiskStats,
    getComplianceStats
  } from '$server/mockData';
  import type { TodoItem, RiskAlert as RiskAlertType } from '$types';

  let todos = $state<TodoItem[]>([]);
  let risks = $state<RiskAlertType[]>([]);
  let loading = $state(true);
  let activeTab = $state<'all' | 'project_report' | 'instrument_booking' | 'sample_tracking'>('all');
  let todoStats = $state(getTodoStats());
  let riskStats = $state(getRiskStats());
  let complianceStats = $state(getComplianceStats());

  let user = $derived(get(currentUser));

  let filteredTodos = $derived(activeTab === 'all'
    ? todos.filter((t) => t.status !== 'completed')
    : todos.filter((t) => t.type === activeTab && t.status !== 'completed'));

  let myRisks = $derived(risks.filter((r) => r.userId === user?.id && r.status !== 'resolved'));

  onMount(async () => {
    try {
      todos = [...mockTodos];
      risks = [...mockRisks];
      todoStats = getTodoStats(user.id);
      riskStats = getRiskStats(user.id);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      loading = false;
    }
  });

  function handleProcessTodo(id: string) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx >= 0) {
      todos[idx].status = 'processing';
      todos = [...todos];
      todoStats = getTodoStats(user.id);
    }
  }

  function handleCompleteTodo(id: string) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx >= 0) {
      todos[idx].status = 'completed';
      todos = [...todos];
      todoStats = getTodoStats(user.id);
      complianceStats = getComplianceStats();
    }
  }

  function handleProcessRisk(id: string) {
    const idx = risks.findIndex((r) => r.id === id);
    if (idx >= 0) {
      risks[idx].status = 'processing';
      risks = [...risks];
      riskStats = getRiskStats(user.id);
    }
  }

  function handleResolveRisk(id: string, resolution: string) {
    const idx = risks.findIndex((r) => r.id === id);
    if (idx >= 0) {
      risks[idx].status = 'resolved';
      risks[idx].resolution = resolution;
      risks[idx].resolvedAt = new Date();
      risks = [...risks];
      riskStats = getRiskStats(user.id);
      complianceStats = getComplianceStats();
    }
  }

  const tabConfig = [
    { key: 'all', label: '全部待办', icon: FileText },
    { key: 'project_report', label: '课题报表', icon: FileText },
    { key: 'instrument_booking', label: '仪器预约', icon: Calendar },
    { key: 'sample_tracking', label: '样本去向', icon: TestTube }
  ];
</script>

<div class="page-container">
  <div class="animate-fade-in">
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold text-gray-900 mb-2">
      欢迎回来，{user.name}
      </h1>
      <p class="text-gray-500">
        {user.role === 'admin' ? '实验室管理员' : '研究生'} · {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="待办事项"
        value={todoStats.pending + todoStats.processing}
        icon={FileText}
        color="blue"
        trend="down"
        trendValue="较昨日 +2"
      />
      <StatCard
        title="待处理风险"
        value={riskStats.pending + riskStats.processing}
        icon={AlertTriangle}
        color="orange"
        trend="neutral"
        trendValue="需关注"
      />
      <StatCard
        title="本月合规记录"
        value={complianceStats.total}
        icon={Shield}
        color="green"
        trend="up"
        trendValue="完整记录"
      />
      <StatCard
        title="试剂库存"
        value={8}
        icon={FlaskConical}
        color="purple"
        trend="neutral"
        trendValue="品类"
      />
    </div>

    {#if myRisks.length > 0}
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-warning-600" />
            危化风险提醒
          </h2>
          <span class="text-sm text-warning-600 font-medium">
            {myRisks.length} 项待处理
          </span>
        </div>
        <div class="space-y-4">
          {#each myRisks as risk}
            <RiskAlert
            {risk}
            onProcess={handleProcessRisk}
            onResolve={handleResolveRisk}
            />
          {/each}
        </div>
      </div>
    {/if}

    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 class="section-title mb-0">待办事项</h2>
        <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {#each tabConfig as tab}
            <button
              on:click={() => activeTab = tab.key as typeof activeTab}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
              class:bg-white={activeTab === tab.key}
              class:text-primary-700={activeTab === tab.key}
              class:shadow-sm={activeTab === tab.key}
              class:text-gray-600={activeTab !== tab.key}
            >
              <tab.icon class="w-3.5 h-3.5" />
              {tab.label}
              {#if tab.key === 'all'}
                <span class="ml-1 text-xs">({todoStats.pending + todoStats.processing})</span>
              {:else}
                <span class="ml-1 text-xs">({todoStats.byType[tab.key as keyof typeof todoStats.byType]})</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      {#if loading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each Array(3) as _}
            <div class="h-48 bg-gray-100 rounded-xl animate-pulse" />
          {/each}
        </div>
      {:else if filteredTodos.length === 0}
        <div class="card p-12 text-center">
          <div class="text-5xl mb-4">🎉</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无待办事项</h3>
          <p class="text-gray-500">所有任务已完成，继续保持！</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each filteredTodos as todo (todo.id)}
            <TodoCard
            {todo}
            onProcess={handleProcessTodo}
            onComplete={handleCompleteTodo}
            />
          {/each}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a
        href="/requisition"
        class="card-hover p-6 group cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FlaskConical class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">试剂领用申请</h3>
            <p class="text-sm text-gray-500">快速提交领用申请</p>
          </div>
        </div>
        <div class="flex items-center text-sm text-primary-600 font-medium">
          立即申请
          <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>

      <a
        href="/archive"
        class="card-hover p-6 group cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Archive class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">实验数据归档</h3>
            <p class="text-sm text-gray-500">归档实验原始数据</p>
          </div>
        </div>
        <div class="flex items-center text-primary-600 font-medium">
          开始归档
          <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>

      <a
        href="/compliance"
        class="card-hover p-6 group cursor-pointer"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-success-100 text-success-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">安全合规</h3>
            <p class="text-sm text-gray-500">查看记录 & 导出数据</p>
          </div>
        </div>
        <div class="flex items-center text-primary-600 font-medium">
          查看详情
          <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
    </div>
  </div>
</div>
