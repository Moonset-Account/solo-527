<script lang="ts">
  import { 
    LayoutDashboard, 
    AlertTriangle, 
    Calendar,
    Settings,
    Database,
    FileText,
    Send,
    BookOpen,
    BarChart3,
    ChevronLeft,
    ChevronRight
  } from 'lucide-svelte';

  export let showSidebar = true;
  export let currentPath = '/';
  export let isAdminRoute = false;

  const mainNav = [
    { href: '/', label: '指标看板', icon: LayoutDashboard },
    { href: '/monthly', label: '月报复盘', icon: Calendar },
  ];

  const adminNav = [
    { href: '/admin/data', label: '数据管理', icon: Database },
    { href: '/admin/metrics', label: '指标口径', icon: BarChart3 },
    { href: '/admin/summary', label: '摘要推送', icon: Send },
    { href: '/admin/logs', label: '日志中心', icon: BookOpen },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }
</script>

<aside 
  class="bg-white border-r border-slate-200 flex flex-col transition-all duration-300 flex-shrink-0"
  class:width-64={showSidebar}
  class:width-20={!showSidebar}
>
  <div class="h-16 flex items-center px-4 border-b border-slate-200">
    {#if showSidebar}
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <BarChart3 class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="font-bold text-slate-900">增长日报</div>
          <div class="text-xs text-slate-500">Growth Dashboard</div>
        </div>
      </div>
    {:else}
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
        <BarChart3 class="w-5 h-5 text-white" />
      </div>
    {/if}
  </div>

  <nav class="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-thin">
    <div>
      {#if showSidebar}
        <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          数据看板
        </p>
      {/if}
      <ul class="space-y-1">
        {#each mainNav as item}
          <li>
            <a 
              href={item.href}
              class="sidebar-link"
              class:sidebar-link-active={isActive(item.href)}
              class:sidebar-link-inactive={!isActive(item.href)}
              class:justify-center={!showSidebar}
            >
              <svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
              {#if showSidebar}
                <span>{item.label}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <div>
      {#if showSidebar}
        <p class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          后台管理
        </p>
      {/if}
      <ul class="space-y-1">
        {#each adminNav as item}
          <li>
            <a 
              href={item.href}
              class="sidebar-link"
              class:sidebar-link-active={isActive(item.href)}
              class:sidebar-link-inactive={!isActive(item.href)}
              class:justify-center={!showSidebar}
            >
              <svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
              {#if showSidebar}
                <span>{item.label}</span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </nav>

  <div class="p-3 border-t border-slate-200">
    <button 
      class="w-full flex items-center justify-center py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      on:click={() => showSidebar = !showSidebar}
    >
      {#if showSidebar}
        <ChevronLeft class="w-5 h-5" />
      {:else}
        <ChevronRight class="w-5 h-5" />
      {/if}
    </button>
  </div>
</aside>

<style>
  .width-64 {
    width: 16rem;
  }
  .width-20 {
    width: 5rem;
  }
</style>
