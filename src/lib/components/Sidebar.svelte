<script lang="ts">
	import { page } from '$app/stores';

	const menuItems = [
		{ path: '/', label: '异常概览', icon: '📊' },
		{ path: '/analysis', label: '多维度分析', icon: '📈' },
		{ path: '/settings', label: '阈值配置', icon: '⚙️' },
		{ path: '/export', label: '日报导出', icon: '📥' }
	];
</script>

<aside class="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-50">
	<div class="p-6 border-b border-slate-100">
		<h1 class="text-xl font-bold text-primary-600 flex items-center gap-2">
			<span class="text-2xl">🍱</span>
			<span>养老餐配送看板</span>
		</h1>
		<p class="text-xs text-slate-500 mt-1">温度与准时率监控系统</p>
	</div>
	
	<nav class="p-4">
		<ul class="space-y-1">
			{#each menuItems as item}
				<li>
					<a
						href={item.path}
						class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 {
							$page.url.pathname === item.path
								? 'bg-primary-50 text-primary-600 font-medium'
								: 'text-slate-600 hover:bg-slate-50'
						}"
					>
						<span class="text-xl">{item.icon}</span>
						<span>{item.label}</span>
						{#if $page.url.pathname === item.path}
							<span class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	
	<div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
		<div class="flex items-center gap-3 px-4 py-3">
			<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
				站
			</div>
			<div>
				<p class="text-sm font-medium text-slate-700">王站长</p>
				<p class="text-xs text-slate-500">阳光社区配送站</p>
			</div>
		</div>
	</div>
</aside>
