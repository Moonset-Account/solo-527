<script lang="ts">
  import { Search, Bell, Settings, UserRound } from 'lucide-svelte';
  import Avatar from './Avatar.svelte';
  import { currentUser } from '$lib/stores';

  export let title: string;
  export let subtitle = '';
</script>

<header
  class="sticky top-0 z-20 h-16 bg-cream/80 backdrop-blur-md border-b border-navy-100 flex items-center justify-between px-8"
>
  <div class="min-w-0">
    <h1 class="font-display text-xl text-navy-900 leading-tight">{title}</h1>
    {#if subtitle}
      <p class="text-xs text-navy-500 mt-0.5">{subtitle}</p>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    <div class="relative hidden md:block">
      <Search
        class="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2"
        stroke-width={1.8}
      />
      <input
        type="text"
        placeholder="搜索订单、会员、异常..."
        class="pl-9 pr-4 py-2 w-64 rounded-lg border border-navy-200 bg-white text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
      />
    </div>
    <button
      class="w-9 h-9 rounded-lg flex items-center justify-center text-navy-500 hover:bg-white hover:text-navy-700 transition border border-transparent hover:border-navy-200"
      aria-label="通知"
    >
      <Bell class="w-4 h-4" stroke-width={1.8} />
    </button>
    <button
      class="w-9 h-9 rounded-lg flex items-center justify-center text-navy-500 hover:bg-white hover:text-navy-700 transition border border-transparent hover:border-navy-200"
      aria-label="设置"
    >
      <Settings class="w-4 h-4" stroke-width={1.8} />
    </button>
    <div class="flex items-center gap-2 pl-2 ml-1 border-l border-navy-200">
      <Avatar name={$currentUser.name} size="sm" />
    </div>
  </div>
</header>
