<script lang="ts">
	interface NavItem {
		href: string;
		label: string;
		icon: string;
		badge?: number;
	}

	let {
		navItems,
		currentPath
	}: {
		navItems: NavItem[];
		currentPath: string;
	} = $props();

	const isActive = (href: string) => {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	};
</script>

<aside class="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0">
	<div class="px-6 py-5 border-b border-slate-800">
		<h1 class="text-lg font-bold text-white flex items-center gap-2">
			<span class="text-2xl">📨</span>
			邮件质检系统
		</h1>
		<p class="text-xs text-slate-400 mt-1">销售运营平台</p>
	</div>

	<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href)
					? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
					: 'text-slate-300 hover:bg-slate-800 hover:text-white'}"
			>
				<span class="text-base">{item.icon}</span>
				<span class="flex-1">{item.label}</span>
				{#if item.badge && item.badge > 0}
					<span
						class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white min-w-[20px]"
					>
						{item.badge > 99 ? '99+' : item.badge}
					</span>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="px-3 py-4 border-t border-slate-800">
		<div class="flex items-center gap-3 px-3 py-2">
			<div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
				管
			</div>
			<div class="text-sm">
				<p class="font-medium text-white">管理员</p>
				<p class="text-xs text-slate-400">admin@company.com</p>
			</div>
		</div>
	</div>
</aside>
