<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		Wallet,
		MessageSquare,
		FileText,
		List,
		Settings,
		ChevronLeft,
		ChevronRight,
		Heart
	} from 'lucide-svelte';

	let sidebarOpen = true;

	const menuItems = [
		{ id: 'budget', label: '预算管理', icon: Wallet, href: '/admin/budget' },
		{ id: 'feedback', label: '反馈审核', icon: MessageSquare, href: '/admin/feedback' },
		{ id: 'logs', label: '日志中心', icon: List, href: '/admin/logs' },
		{ id: 'exports', label: '导出中心', icon: FileText, href: '/admin/exports' }
	];

	$: activeId = $page.url.pathname.split('/')[2] || 'budget';
</script>

<div class="flex min-h-screen bg-background">
	<aside
		class="relative flex flex-col bg-white border-r border-border transition-all duration-300 {
			sidebarOpen ? 'w-64' : 'w-20'
		}"
	>
		<div class="p-4 border-b border-border flex items-center gap-3">
			<div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center flex-shrink-0">
				<Heart class="w-5 h-5 text-white" />
			</div>
			{#if sidebarOpen}
				<div class="overflow-hidden">
					<p class="font-display font-semibold text-text-primary text-sm whitespace-nowrap">管理后台</p>
					<p class="text-xs text-text-muted whitespace-nowrap">志愿服务系统</p>
				</div>
			{/if}
		</div>

		<nav class="flex-1 p-3 space-y-1">
			{#each menuItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all {
						activeId === item.id
							? 'bg-primary text-white shadow-md shadow-primary/20'
							: 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
					}"
				>
					<svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
					{#if sidebarOpen}
						<span class="text-sm font-medium whitespace-nowrap">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<button
			on:click={() => (sidebarOpen = !sidebarOpen)}
			class="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-surface-alt transition-colors"
		>
			{#if sidebarOpen}
				<ChevronLeft class="w-4 h-4 text-text-muted" />
			{:else}
				<ChevronRight class="w-4 h-4 text-text-muted" />
			{/if}
		</button>
	</aside>

	<div class="flex-1 flex flex-col min-w-0">
		<header class="h-16 bg-white border-b border-border flex items-center justify-between px-6">
			<div>
				<h1 class="font-display text-lg font-semibold text-text-primary">
					{menuItems.find((m) => m.id === activeId)?.label || '管理后台'}
				</h1>
			</div>
			<div class="flex items-center gap-3">
				<a href="/" class="btn btn-ghost text-sm">
					<LayoutDashboard class="w-4 h-4" />
					返回前台
				</a>
			</div>
		</header>
		<main class="flex-1 overflow-auto p-6">
			<slot />
		</main>
	</div>
</div>
