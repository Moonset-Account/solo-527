<script lang="ts">
	import { page } from '$app/stores';
	import { sidebarCollapsed, userStore, showToast } from '$lib/stores';
	import {
		LayoutDashboard,
		Truck,
		AlertTriangle,
		BarChart3,
		Upload,
		BookOpen,
		FileText,
		Settings,
		ChevronLeft,
		ChevronRight,
		LogOut,
		User
	} from 'lucide-svelte';

	const menuItems = [
		{ path: '/dashboard', label: '驾驶舱', icon: LayoutDashboard },
		{ path: '/transport', label: '运输分析', icon: Truck },
		{ path: '/anomaly', label: '异常中心', icon: AlertTriangle },
		{ path: '/analysis', label: '多维分析', icon: BarChart3 },
		{ path: '/data/import', label: '数据导入', icon: Upload },
		{ path: '/data/dictionary', label: '数据字典', icon: BookOpen },
		{ path: '/reports', label: '报表中心', icon: FileText },
		{ path: '/settings', label: '系统设置', icon: Settings }
	];

	function toggleSidebar() {
		sidebarCollapsed.update((v) => !v);
	}

	function handleLogout() {
		userStore.set(null);
		showToast('已退出登录', 'info');
	}
</script>

<div class="flex h-screen bg-slate-50">
	<aside
		class="flex flex-col bg-white border-r border-slate-200 transition-all duration-300 {
			$sidebarCollapsed ? 'w-16' : 'w-64'
		}"
	>
		<div class="flex items-center h-16 px-4 border-b border-slate-200">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
					<Truck class="w-5 h-5 text-white" />
				</div>
				{#if !$sidebarCollapsed}
					<span class="font-semibold text-slate-800">冷链温控追踪</span>
				{/if}
			</div>
		</div>

		<nav class="flex-1 py-4 overflow-y-auto">
			<ul class="space-y-1 px-2">
				{#each menuItems as item}
					<li>
						<a
							href={item.path}
							class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {
								$page.url.pathname.startsWith(item.path)
									? 'bg-primary-50 text-primary-600'
									: 'text-slate-600 hover:bg-slate-100'
							}"
						>
							<svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
							{#if !$sidebarCollapsed}
								<span class="text-sm font-medium">{item.label}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="p-2 border-t border-slate-200">
			{#if !$sidebarCollapsed}
				<div class="flex items-center gap-3 px-3 py-2 mb-2">
					<div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
						<User class="w-4 h-4 text-slate-600" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-slate-800 truncate">运营管理员</p>
						<p class="text-xs text-slate-500 truncate">admin@coldchain.com</p>
					</div>
				</div>
				<button
					on:click={handleLogout}
					class="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
				>
					<LogOut class="w-4 h-4" />
					<span>退出登录</span>
				</button>
			{/if}
			<button
				on:click={toggleSidebar}
				class="flex items-center justify-center w-full py-2 text-slate-500 hover:bg-slate-100 rounded-lg mt-2"
			>
				{#if $sidebarCollapsed}
					<ChevronRight class="w-5 h-5" />
				{:else}
					<ChevronLeft class="w-5 h-5" />
				{/if}
			</button>
		</div>
	</aside>

	<div class="flex-1 flex flex-col overflow-hidden">
		<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
			<div>
				<h1 class="text-lg font-semibold text-slate-800">
					{#each menuItems as item}
						{#if $page.url.pathname.startsWith(item.path)}
							{item.label}
						{/if}
					{/each}
				</h1>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-sm text-slate-500">
					{new Date().toLocaleDateString('zh-CN', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						weekday: 'long'
					})}
				</div>
			</div>
		</header>
		<main class="flex-1 overflow-auto p-6">
			<slot />
		</main>
	</div>
</div>
