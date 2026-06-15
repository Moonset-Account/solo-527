<script lang="ts">
	import { page } from '$app/stores';

	let { children } = $props();
	let sidebarOpen = $state(true);

	const navItems = [
		{ icon: '📊', label: '仪表盘', href: '/admin' },
		{ icon: '💅', label: '作品管理', href: '/admin/works' },
		{ icon: '💬', label: '评论审核', href: '/admin/comments' },
		{ icon: '💰', label: '收银记录', href: '/admin/cashier' },
		{ icon: '🎫', label: '疗程卡', href: '/admin/treatment-cards' },
		{ icon: '⏰', label: '提醒管理', href: '/admin/reminders' },
		{ icon: '📋', label: '操作历史', href: '/admin/history' }
	];

	const today = new Date().toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long'
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="flex h-screen overflow-hidden">
	<aside
		class="fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
		style="width: 256px; background-color: #1a1a2e;"
	>
		<div class="flex h-16 items-center gap-3 px-6 border-b border-white/10">
			<span class="text-2xl">🌹</span>
			<span class="text-white font-bold text-lg tracking-wide">Miss Rose</span>
		</div>

		<nav class="flex-1 overflow-y-auto py-4">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.href || (item.href !== '/admin' && $page.url.pathname.startsWith(item.href))}
				<a
					href={item.href}
					class="flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-150 {isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}"
				>
					<span class="text-lg">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="px-6 py-4 border-t border-white/10">
			<span class="text-white/40 text-xs">v1.0.0</span>
		</div>
	</aside>

	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-20 bg-black/50 lg:hidden"
			onclick={toggleSidebar}
			aria-label="关闭侧边栏"
		></button>
	{/if}

	<div class="flex flex-1 flex-col overflow-hidden">
		<header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
			<div class="flex items-center gap-4">
				<button
					onclick={toggleSidebar}
					class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
					aria-label="切换侧边栏"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<h1 class="text-lg font-semibold text-gray-800">Miss Rose 管理后台</h1>
			</div>

			<div class="flex items-center gap-4">
				<span class="hidden text-sm text-gray-500 sm:block">{today}</span>
				<button
					class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
					aria-label="通知"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
					<span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
				</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
			{@render children()}
		</main>
	</div>
</div>
