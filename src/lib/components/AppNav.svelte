<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		LayoutDashboard,
		Image as ImageIcon,
		FileText,
		ClipboardList,
		CalendarDays,
		AlertTriangle,
		Newspaper,
		User
	} from 'lucide-svelte';

	interface NavItem {
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: '仪表盘', icon: LayoutDashboard },
		{ href: '/materials', label: '素材库', icon: ImageIcon },
		{ href: '/topics', label: '选题管理', icon: FileText },
		{ href: '/tasks', label: '任务分派', icon: ClipboardList },
		{ href: '/schedule', label: '发布排期', icon: CalendarDays },
		{ href: '/anomalies', label: '异常清单', icon: AlertTriangle }
	];

	let currentUser = $derived(store.getCurrentUser());
	let openAnomaliesCount = $derived(
		store.anomalies.filter((a) => a.status !== 'closed').length
	);

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/') return path === '/';
		return path === href || path.startsWith(href + '/');
	}

	function roleLabel(role: string): string {
		const map: Record<string, string> = {
			supervisor: '编辑主管',
			editor: '记者/编辑',
			shooter: '摄像',
			cutter: '剪辑'
		};
		return map[role] ?? role;
	}
</script>

<nav class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-60 lg:border-r lg:border-warm-gray-dark lg:bg-ink lg:text-white">
	<div class="flex items-center gap-2 px-6 py-5 border-b border-ink-light">
		<div class="w-9 h-9 rounded-lg bg-copper flex items-center justify-center shrink-0">
			<Newspaper size={20} />
		</div>
		<div class="min-w-0">
			<h1 class="font-serif font-bold text-base truncate">选题策划台</h1>
			<p class="text-[11px] text-white/50">News Planning Desk</p>
		</div>
	</div>

	<div class="flex-1 flex flex-col gap-0.5 px-3 py-4 overflow-y-auto">
		{#each navItems as item}
			<a
				href={item.href}
				class="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 {isActive(item.href)
					? 'bg-copper text-white shadow-lg shadow-copper/20'
					: 'text-white/60 hover:text-white hover:bg-ink-light/50'}"
			>
				<item.icon size={18} class="shrink-0" />
				<span class="font-medium">{item.label}</span>
				{#if item.href === '/anomalies' && openAnomaliesCount > 0}
					<span class="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-danger text-white rounded-full">
						{openAnomaliesCount > 99 ? '99+' : openAnomaliesCount}
					</span>
				{/if}
			</a>
		{/each}
	</div>

	<div class="px-3 py-4 border-t border-ink-light">
		<div class="flex items-center gap-3 px-3 py-2">
			<div class="w-9 h-9 rounded-full bg-copper/20 flex items-center justify-center shrink-0">
				<User size={18} class="text-copper" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium truncate">{currentUser.name}</p>
				<p class="text-[11px] text-white/50 truncate">{roleLabel(currentUser.role)}</p>
			</div>
		</div>
	</div>
</nav>

<nav class="hidden md:flex lg:hidden md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-16 md:border-r md:border-warm-gray-dark md:bg-ink md:text-white">
	<div class="flex flex-col items-center py-4 gap-1">
		<div class="w-10 h-10 rounded-lg bg-copper flex items-center justify-center mb-2">
			<Newspaper size={20} />
		</div>
		{#each navItems as item}
			<a
				href={item.href}
				title={item.label}
				class="relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 {isActive(item.href)
					? 'bg-copper text-white'
					: 'text-white/60 hover:text-white hover:bg-ink-light/50'}"
			>
				<item.icon size={18} />
				{#if item.href === '/anomalies' && openAnomaliesCount > 0}
					<span class="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
				{/if}
			</a>
		{/each}
	</div>
	<div class="mt-auto flex flex-col items-center pb-4">
		<div class="w-10 h-10 rounded-full bg-copper/20 flex items-center justify-center">
			<User size={18} class="text-copper" />
		</div>
	</div>
</nav>

<nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-warm-gray-dark shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
	<div class="grid grid-cols-6">
		{#each navItems as item}
			<a
				href={item.href}
				class="relative flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors {isActive(item.href) ? 'text-copper' : 'text-ink/50'}"
			>
				<div class="relative">
					<item.icon size={20} />
					{#if item.href === '/anomalies' && openAnomaliesCount > 0}
						<span class="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-danger text-white rounded-full">
							{openAnomaliesCount > 99 ? '99+' : openAnomaliesCount}
						</span>
					{/if}
				</div>
				<span class="text-[10px] font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<div class="lg:pl-60 md:pl-16 pb-16 md:pb-0"></div>
