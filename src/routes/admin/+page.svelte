<script lang="ts">
  import { 
    Database, 
    Send, 
    BarChart3, 
    BookOpen,
    ArrowRight
  } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';

  interface AdminCard {
    title: string;
    description: string;
    icon: ComponentType;
    href: string;
    colorClass: string;
  }

  const cards: AdminCard[] = [
    {
      title: '数据管理',
      description: '管理指标数据录入、导入、批量操作',
      icon: Database,
      href: '/admin/data',
      colorClass: 'bg-primary-50 text-primary-600'
    },
    {
      title: '指标口径',
      description: '维护指标定义、计算公式、数据来源',
      icon: BarChart3,
      href: '/admin/metrics',
      colorClass: 'bg-accent-50 text-accent-600'
    },
    {
      title: '摘要推送',
      description: '生成日报摘要、配置推送渠道',
      icon: Send,
      href: '/admin/summary',
      colorClass: 'bg-warning-50 text-warning-600'
    },
    {
      title: '日志中心',
      description: '操作日志、导出任务、错误日志查询',
      icon: BookOpen,
      href: '/admin/logs',
      colorClass: 'bg-danger-50 text-danger-600'
    }
  ];
</script>

<svelte:head>
  <title>后台管理 - 用户增长日报</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-900">后台管理</h1>
    <p class="mt-1 text-sm text-slate-500">系统配置与数据管理中心</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each cards as card, i}
      <a 
        href={card.href}
        class="card card-hover p-6 group animate-fade-in-up"
        style="animation-delay: {i * 50}ms; opacity: 0;"
      >
        <div class="flex items-start gap-4">
          <div class={`p-4 rounded-xl ${card.colorClass}`}>
            <svelte:component this={card.icon} class="w-7 h-7" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
              {card.title}
            </h3>
            <p class="mt-1 text-sm text-slate-500">{card.description}</p>
          </div>
          <ArrowRight class="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </div>
      </a>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-5">
      <h3 class="font-semibold text-slate-900 mb-4">最近操作</h3>
      <div class="space-y-3">
        {#each Array(5) as _, i}
          <div class="flex items-center gap-3 py-2">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <BookOpen class="w-4 h-4 text-slate-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-slate-700 truncate">管理员更新了日活指标口径</p>
              <p class="text-xs text-slate-400">{i + 1}小时前</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-slate-900 mb-4">系统状态</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">数据同步</span>
          <span class="badge badge-success">正常</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">推送服务</span>
          <span class="badge badge-success">正常</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">数据库</span>
          <span class="badge badge-success">正常</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">今日错误数</span>
          <span class="badge badge-warning">3 条</span>
        </div>
      </div>
    </div>
  </div>
</div>
