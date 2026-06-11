<script lang="ts">
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    Users,
    CheckSquare,
    AlertTriangle,
    ShoppingBag,
    GitBranch,
    TrendingDown,
    Terminal,
    Radio
  } from 'lucide-svelte';
  import Avatar from './Avatar.svelte';
  import { currentUser } from '$lib/stores';

  type MenuItem = {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    roles: ('host' | 'operator')[];
  };

  const hostMenu: MenuItem[] = [
    { href: '/dashboard', label: '工作台', icon: LayoutDashboard, roles: ['host', 'operator'] },
    { href: '/dashboard/members', label: '会员订阅', icon: Users, roles: ['host', 'operator'] },
    { href: '/dashboard/todos', label: '待办面板', icon: CheckSquare, roles: ['host'] },
    { href: '/dashboard/exceptions', label: '异常池', icon: AlertTriangle, roles: ['host', 'operator'] }
  ];

  const adminMenu: MenuItem[] = [
    { href: '/admin', label: '运营概览', icon: LayoutDashboard, roles: ['operator'] },
    { href: '/admin/orders', label: '订单管理', icon: ShoppingBag, roles: ['operator'] },
    { href: '/admin/delivery', label: '交付节点', icon: GitBranch, roles: ['operator'] },
    { href: '/admin/retention', label: '留存预警', icon: TrendingDown, roles: ['operator'] },
    { href: '/admin/api-logs', label: '接口监控', icon: Terminal, roles: ['operator'] }
  ];

  $: role = $currentUser.role;
  $: visibleHost = hostMenu.filter((m) => m.roles.includes(role));
  $: visibleAdmin = adminMenu.filter((m) => m.roles.includes(role));
  $: isHostRoute = $page.url.pathname.startsWith('/dashboard');
  $: isAdminRoute = $page.url.pathname.startsWith('/admin');
</script>

<aside
  class="fixed left-0 top-0 h-screen w-64 bg-navy-900 text-white flex flex-col border-r border-navy-800 z-30"
>
  <div class="h-16 flex items-center gap-3 px-6 border-b border-navy-800">
    <div
      class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center"
    >
      <Radio class="w-5 h-5 text-white" stroke-width={2} />
    </div>
    <div>
      <p class="font-display text-lg leading-tight">播客交付台</p>
      <p class="text-[10px] text-navy-300 tracking-wider uppercase">Podcast Delivery</p>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
    {#if visibleHost.length > 0}
      <div>
        <p class="px-3 text-[11px] uppercase tracking-wider text-navy-400 mb-2">主理人工作台</p>
        <ul class="space-y-1">
          {#each visibleHost as item (item.href)}
            {@const active = $page.url.pathname === item.href}
            <li>
              <a
                href={item.href}
                class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors {active
                  ? 'bg-amber-gold-500/15 text-amber-gold-300'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'}"
              >
                <svelte:component this={item.icon} class="w-4 h-4" stroke-width={1.8} />
                {item.label}
                {#if active}
                  <span
                    class="ml-auto w-1.5 h-1.5 rounded-full bg-amber-gold-400"
                    aria-hidden="true"
                  ></span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if visibleAdmin.length > 0}
      <div>
        <p class="px-3 text-[11px] uppercase tracking-wider text-navy-400 mb-2">运营后台</p>
        <ul class="space-y-1">
          {#each visibleAdmin as item (item.href)}
            {@const active = $page.url.pathname === item.href}
            <li>
              <a
                href={item.href}
                class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors {active
                  ? 'bg-amber-gold-500/15 text-amber-gold-300'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'}"
              >
                <svelte:component this={item.icon} class="w-4 h-4" stroke-width={1.8} />
                {item.label}
                {#if active}
                  <span
                    class="ml-auto w-1.5 h-1.5 rounded-full bg-amber-gold-400"
                    aria-hidden="true"
                  ></span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </nav>

  <div class="p-3 border-t border-navy-800">
    <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-navy-800 cursor-pointer transition">
      <Avatar name={$currentUser.name} size="sm" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{$currentUser.name}</p>
        <p class="text-xs text-navy-400 truncate">
          {$currentUser.role === 'host' ? '播客主理人' : '运营负责人'}
        </p>
      </div>
    </div>
  </div>
</aside>
