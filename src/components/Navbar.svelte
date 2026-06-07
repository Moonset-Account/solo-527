<script lang="ts">
	import { page } from '$app/stores';
	import { BarChart3, Activity, GitCompare, TrendingUp, Database, Download, Globe } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: '仪表盘', icon: BarChart3 },
		{ href: '/process', label: '流程分析', icon: Activity },
		{ href: '/comparison', label: '多维对比', icon: GitCompare },
		{ href: '/trends', label: '趋势分析', icon: TrendingUp },
		{ href: '/data', label: '数据管理', icon: Database },
		{ href: '/export', label: '导出中心', icon: Download }
	];
</script>

<nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="flex items-center justify-between h-16">
			<div class="flex items-center space-x-8">
				<div class="flex items-center space-x-2">
					<div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
						<Activity class="w-5 h-5 text-white" />
					</div>
					<span class="font-bold text-lg text-gray-900">门诊等待时间分析</span>
					<span class="public-badge">
						<Globe class="w-3 h-3 mr-1" />
						公开版
					</span>
				</div>
				<div class="hidden md:flex items-center space-x-1">
					{#each navItems as item}
						<a
							href={item.href}
							class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 {
								$page.url.pathname === item.href
									? 'bg-primary-50 text-primary-600'
									: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
							}"
						>
							<svelte:component this={item.icon} class="w-4 h-4" />
							<span>{item.label}</span>
						</a>
					{/each}
				</div>
			</div>
			<div class="flex items-center space-x-3">
				<span class="text-sm text-gray-500">数据截止: 2024-06-30</span>
			</div>
		</div>
	</div>
</nav>
