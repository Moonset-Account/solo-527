<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, Bug, Users, Table2 } from 'lucide-svelte';

	const icons = { LayoutDashboard, Bug, Users, Table2 };

	const navItems = [
		{ href: '/', label: '运营复盘总览', iconKey: 'LayoutDashboard' as const },
		{ href: '/pest-map', label: '病虫害地图', iconKey: 'Bug' as const },
		{ href: '/team-compare', label: '班组对比', iconKey: 'Users' as const },
		{ href: '/detail', label: '明细下钻', iconKey: 'Table2' as const }
	];
</script>

<nav class="bg-[#1B4332] text-white px-6 py-3 flex items-center gap-8 shadow-lg">
	<div class="flex items-center gap-3">
		<div class="w-8 h-8 rounded-lg bg-[#40916C] flex items-center justify-center text-sm font-bold">绿</div>
		<div>
			<div class="text-sm font-semibold tracking-wide">城市绿化养护运营复盘工作台</div>
			<div class="text-[10px] text-[#40916C]">Green Maintenance Analytics</div>
		</div>
	</div>
	<div class="flex gap-1 ml-8">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors {$page.url.pathname === item.href ? 'bg-white/20 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'}"
			>
				{#if item.iconKey === 'LayoutDashboard'}
					<LayoutDashboard size={14} />
				{:else if item.iconKey === 'Bug'}
					<Bug size={14} />
				{:else if item.iconKey === 'Users'}
					<Users size={14} />
				{:else}
					<Table2 size={14} />
				{/if}
				{item.label}
			</a>
		{/each}
	</div>
	<div class="ml-auto text-[10px] text-white/50">
		口径说明：完成率=按时完成/总任务(不含雨天延期) | 雨天延期：降雨≥10mm自动延期
	</div>
</nav>
