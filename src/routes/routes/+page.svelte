<script lang="ts">
	let { data } = $props();

	let searchQuery = $state('');
	let cityFilter = $state('');
	let statusFilter = $state('');

	const cities = $derived(
		[...new Set(data.routes.map((r: any) => r.city))].sort()
	);

	const activeCount = $derived(
		data.routes.filter((r: any) => r.status === 'active').length
	);
	const upcomingCount = $derived(
		data.routes.filter((r: any) => r.status === 'upcoming').length
	);
	const endedCount = $derived(
		data.routes.filter((r: any) => r.status === 'ended').length
	);

	const filteredRoutes = $derived(() => {
		let result = data.routes;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(r: any) =>
					r.name.toLowerCase().includes(q) ||
					r.city.toLowerCase().includes(q)
			);
		}
		if (cityFilter) {
			result = result.filter((r: any) => r.city === cityFilter);
		}
		if (statusFilter) {
			result = result.filter((r: any) => r.status === statusFilter);
		}
		return result;
	});

	const cityGradients: Record<string, string> = {
		'北京': 'from-red-800 to-amber-700',
		'上海': 'from-blue-800 to-cyan-600',
		'广州': 'from-emerald-700 to-teal-500',
		'成都': 'from-purple-800 to-pink-600',
		'杭州': 'from-green-700 to-emerald-500',
		'西安': 'from-amber-800 to-yellow-600',
		'南京': 'from-indigo-800 to-blue-500',
		'重庆': 'from-rose-800 to-red-500'
	};

	function getGradient(city: string): string {
		return cityGradients[city] || 'from-primary-dark to-primary-light';
	}

	function getStatusConfig(status: string) {
		switch (status) {
			case 'active':
				return { label: '进行中', cls: 'bg-success/15 text-success' };
			case 'upcoming':
				return { label: '即将开始', cls: 'bg-blue-500/15 text-blue-600' };
			case 'ended':
				return { label: '已结束', cls: 'bg-gray-400/15 text-gray-500' };
			default:
				return { label: status, cls: 'bg-gray-400/15 text-gray-500' };
		}
	}

	function inventoryPercent(route: any): number {
		if (!route.inventoryTotal || route.inventoryTotal === 0) return 0;
		return Math.round(
			((route.inventoryAvailable || 0) / route.inventoryTotal) * 100
		);
	}
</script>

<svelte:head>
	<title>导览路线总览 - 导览协作</title>
</svelte:head>

<div class="flex flex-1 flex-col overflow-auto">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
		<h1 class="font-serif text-2xl font-bold text-text">导览路线总览</h1>
		<div class="flex items-center gap-3">
			<span class="text-sm text-text-muted">共 {data.routes.length} 条路线</span>
			<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">管</div>
		</div>
	</header>

	<main class="flex-1 p-8">
		<div class="grid grid-cols-3 gap-5 mb-8">
			<div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
				<div class="flex items-center justify-between">
					<span class="text-sm text-text-muted">进行中</span>
					<div class="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
					</div>
				</div>
				<div class="mt-2 font-serif text-3xl font-bold text-text">{activeCount}</div>
			</div>
			<div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
				<div class="flex items-center justify-between">
					<span class="text-sm text-text-muted">即将开始</span>
					<div class="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					</div>
				</div>
				<div class="mt-2 font-serif text-3xl font-bold text-text">{upcomingCount}</div>
			</div>
			<div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
				<div class="flex items-center justify-between">
					<span class="text-sm text-text-muted">已结束</span>
					<div class="h-9 w-9 rounded-lg bg-gray-400/10 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
					</div>
				</div>
				<div class="mt-2 font-serif text-3xl font-bold text-text">{endedCount}</div>
			</div>
		</div>

		<div class="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
			<div class="relative flex-1 min-w-[200px]">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
				<input
					type="text"
					placeholder="搜索路线名称或城市..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-200 bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
				/>
			</div>
			<select
				bind:value={cityFilter}
				class="rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors min-w-[120px]"
			>
				<option value="">全部城市</option>
				{#each cities as city}
					<option value={city}>{city}</option>
				{/each}
			</select>
			<select
				bind:value={statusFilter}
				class="rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors min-w-[120px]"
			>
				<option value="">全部状态</option>
				<option value="active">进行中</option>
				<option value="upcoming">即将开始</option>
				<option value="ended">已结束</option>
			</select>
		</div>

		{#if filteredRoutes().length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-40"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
				<p class="text-lg">没有找到匹配的路线</p>
				<p class="mt-1 text-sm">尝试调整搜索条件或筛选项</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredRoutes() as route (route.id)}
					{@const statusCfg = getStatusConfig(route.status)}
					{@const pct = inventoryPercent(route)}
					<a
						href="/routes/{route.id}"
						class="group rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
					>
						<div class="h-36 bg-gradient-to-br {getGradient(route.city)} relative p-5 flex flex-col justify-between">
							<div class="flex items-start justify-between">
								<span class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
									{route.city}
								</span>
								<span class="rounded-full {statusCfg.cls} px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
									{statusCfg.label}
								</span>
							</div>
							<h3 class="font-serif text-lg font-semibold text-white leading-tight line-clamp-2">
								{route.name}
							</h3>
						</div>

						<div class="p-5">
							<div class="mb-3">
								<div class="flex items-center justify-between text-xs text-text-muted mb-1.5">
									<span>库存余量</span>
									<span class="font-medium text-text">{route.inventoryAvailable || 0} / {route.inventoryTotal || 0}</span>
								</div>
								<div class="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
									<div
										class="h-full rounded-full transition-all {pct > 50 ? 'bg-success' : pct > 20 ? 'bg-warning' : 'bg-danger'}"
										style="width: {pct}%"
									></div>
								</div>
							</div>

							<div class="flex items-center gap-4 text-xs text-text-muted">
								<span class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
									{route.duration} 分钟
								</span>
								{#if route.meetingPoint}
									<span class="flex items-center gap-1 truncate">
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
										{route.meetingPoint}
									</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
