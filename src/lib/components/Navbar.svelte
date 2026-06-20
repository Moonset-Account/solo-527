<script lang="ts">
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { currentUser, isAdmin, toggleUserRole } from '$stores/user';
  import {
    Home,
    FileText,
    Archive,
    Shield,
    Settings,
    User,
    ChevronDown,
    Menu,
    X,
    BarChart3,
    AlertTriangle,
    FlaskConical
  } from 'lucide-svelte';

  let mobileMenuOpen = $state(false);

  let user = $derived(get(currentUser));
  let admin = $derived(get(isAdmin));
  let path = $derived(get(page).url.pathname);

  const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/requisition', label: '领用申请', icon: FlaskConical },
    { href: '/archive', label: '数据归档', icon: Archive },
    { href: '/compliance', label: '安全合规', icon: Shield }
  ];

  const adminItems = [
    { href: '/admin/experiments', label: '实验管理', icon: FileText },
    { href: '/admin/compliance-dashboard', label: '合规看板', icon: BarChart3 },
    { href: '/admin/risk-management', label: '风险管理', icon: AlertTriangle }
  ];

  function isActive(href: string) {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  }
</script>

<nav class="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <FlaskConical class="w-5 h-5 text-white" />
          </div>
          <span class="font-display font-bold text-lg text-primary-950 hidden sm:block">
            试剂库存登记站
          </span>
        </a>

        <div class="hidden md:flex items-center gap-1">
          {#each navItems as item}
            <a
              href={item.href}
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}"
            >
              <item.icon class="w-4 h-4" />
              {item.label}
            </a>
          {/each}

          {#if admin}
            <div class="w-px h-6 bg-gray-200 mx-2"></div>
            {#each adminItems as item}
              <a
                href={item.href}
                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}"
              >
                <item.icon class="w-4 h-4" />
                {item.label}
              </a>
            {/each}
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          onclick={toggleUserRole}
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="切换角色"
        >
          <Settings class="w-3.5 h-3.5" />
          {admin ? '管理员' : '科研人员'}
        </button>

        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <User class="w-4 h-4 text-white" />
          </div>
          <div class="hidden sm:block">
            <p class="text-sm font-medium text-gray-900">{user.name}</p>
            <p class="text-xs text-gray-500">{admin ? '实验室管理员' : '研究生'}</p>
          </div>
        </div>

        <button
          onclick={() => mobileMenuOpen = !mobileMenuOpen}
          class="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          {#if mobileMenuOpen}
            <X class="w-5 h-5" />
          {:else}
            <Menu class="w-5 h-5" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  {#if mobileMenuOpen}
    <div class="md:hidden border-t border-gray-200 bg-white">
      <div class="px-4 py-3 space-y-1">
        {#each navItems as item}
          <a
            href={item.href}
            onclick={() => mobileMenuOpen = false}
            class="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}"
          >
            <item.icon class="w-4 h-4" />
            {item.label}
          </a>
        {/each}

        {#if admin}
          <div class="border-t border-gray-100 my-2 pt-2">
            <p class="px-3 py-1 text-xs font-medium text-gray-500">后台管理</p>
            {#each adminItems as item}
              <a
                href={item.href}
                onclick={() => mobileMenuOpen = false}
                class="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}"
              >
                <item.icon class="w-4 h-4" />
                {item.label}
              </a>
            {/each}
          </div>
        {/if}

        <div class="border-t border-gray-100 pt-3">
          <button
            onclick={toggleUserRole}
            class="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <Settings class="w-4 h-4" />
            切换为{admin ? '科研人员' : '管理员'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</nav>
