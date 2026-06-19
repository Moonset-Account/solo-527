<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	let { children } = $props();

	const currentPath = derived(page, ($page) => $page.url.pathname);

	const navItems = [
		{
			href: '/routes',
			label: '路线总览',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>`
		},
		{
			href: '/inventory',
			label: '库存看板',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
		},
		{
			href: '/traceability',
			label: '追溯中心',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`
		},
		{
			href: '/rules',
			label: '提醒规则',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
		},
		{
			href: '/todos',
			label: '待办中心',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
		}
	];

	function isActive(href: string, path: string): boolean {
		if (href === '/routes') return path === '/routes' || path.startsWith('/routes/');
		return path.startsWith(href);
	}
</script>

<div class="flex h-screen overflow-hidden font-sans text-text">
	<aside class="flex w-64 flex-shrink-0 flex-col bg-primary text-white">
		<div class="flex items-center gap-3 px-6 py-5 border-b border-white/10">
			<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent flex-shrink-0">
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
				<circle cx="12" cy="10" r="3"/>
			</svg>
			<h1 class="font-serif text-xl font-bold tracking-wide">导览协作</h1>
		</div>

		<nav class="flex-1 py-4">
			{#each navItems as item}
				{@const active = isActive(item.href, $currentPath)}
				<a
					href={item.href}
					class="flex items-center gap-3 px-6 py-3 text-sm transition-colors {active
						? 'bg-white/10 border-l-[3px] border-accent text-white font-medium'
						: 'border-l-[3px] border-transparent text-white/70 hover:bg-white/5 hover:text-white'}"
				>
					{@html item.icon}
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="border-t border-white/10 px-6 py-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold">
					管
				</div>
				<div class="text-sm">
					<div class="font-medium">管理员</div>
					<div class="text-xs text-white/50">admin@tour.cn</div>
				</div>
			</div>
		</div>
	</aside>

	<div class="flex flex-1 flex-col overflow-hidden bg-surface">
		{@render children()}
	</div>
</div>
