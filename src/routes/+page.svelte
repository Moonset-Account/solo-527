<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, Filter, Heart, Users, Clock, Award, Calendar } from 'lucide-svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { apiFetch, buildQueryString } from '$lib/utils/api';
	import { debounce } from '$lib/utils/format';
	import type { ProjectWithStats, ProjectFilters } from '$lib/types';

	let projects = $state<ProjectWithStats[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let categories = $state<string[]>([]);
	let filters = $state<ProjectFilters>({
		status: ['published', 'ongoing'],
		category: [],
		keyword: ''
	});
	let page = $state(1);
	let pageSize = 12;

	const statusOptions = [
		{ value: 'published', label: '已发布' },
		{ value: 'ongoing', label: '进行中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'draft', label: '草稿' }
	];

	async function loadProjects() {
		loading = true;
		try {
			const params: Record<string, any> = {
				page,
				pageSize
			};
			if (filters.status?.length) params.status = filters.status.join(',');
			if (filters.category?.length) params.category = filters.category.join(',');
			if (filters.keyword) params.keyword = filters.keyword;

			const result = await apiFetch<any>('/api/projects?' + buildQueryString(params));
			projects = result.data || [];
			total = result.total || 0;
			if (result.categories) {
				categories = result.categories;
			}
		} finally {
			loading = false;
		}
	}

	async function loadCategories() {
		if (categories.length === 0) {
			await loadProjects();
		}
	}

	function toggleStatus(status: string) {
		if (!filters.status) filters.status = [];
		const idx = filters.status.indexOf(status as never);
		if (idx > -1) {
			filters.status.splice(idx, 1);
		} else {
			filters.status.push(status as never);
		}
		page = 1;
		loadProjects();
	}

	function toggleCategory(category: string) {
		if (!filters.category) filters.category = [];
		const idx = filters.category.indexOf(category as never);
		if (idx > -1) {
			filters.category.splice(idx, 1);
		} else {
			filters.category.push(category as never);
		}
		page = 1;
		loadProjects();
	}

	const handleSearch = debounce((e: Event) => {
		const target = e.target as HTMLInputElement;
		filters.keyword = target.value;
		page = 1;
		loadProjects();
	}, 300);

	onMount(() => {
		loadCategories();
		loadProjects();
	});
</script>

<section class="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
	</div>
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center max-w-3xl mx-auto animate-fade-in">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
				<Heart class="w-4 h-4" />
				传递温暖，服务社会
			</div>
			<h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
				参与志愿活动<br />
				<span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">共建美好社区</span>
			</h1>
			<p class="text-lg text-text-secondary mb-8">
				发现身边的志愿活动，记录服务时长，让每一份爱心都被看见
			</p>
			<div class="flex flex-wrap justify-center gap-4">
				<a href="#projects" class="btn btn-primary text-base px-8 py-3">
					浏览活动
				</a>
				<a href="/my-records" class="btn btn-outline text-base px-8 py-3">
					我的记录
				</a>
			</div>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
			<StatCard title="志愿项目" value={total} icon={Heart} color="primary" />
			<StatCard title="参与志愿者" value="312" icon={Users} color="secondary" trend="+12%" trendUp={true} />
			<StatCard title="服务时长" value="783.5" icon={Clock} color="success" trend="+8%" trendUp={true} />
			<StatCard title="获得表彰" value="45" icon={Award} color="warning" />
		</div>
	</div>
</section>

<section id="projects" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h2 class="font-display text-2xl sm:text-3xl font-bold text-text-primary">志愿活动项目</h2>
			<p class="text-text-secondary mt-1">发现并参与您感兴趣的志愿活动</p>
		</div>
		<div class="relative flex-1 max-w-md">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
			<input
				type="text"
				placeholder="搜索活动名称..."
				class="input pl-10"
				on:input={handleSearch}
			/>
		</div>
	</div>

	<div class="card p-4 mb-8">
		<div class="flex items-center gap-2 mb-3">
			<Filter class="w-4 h-4 text-text-muted" />
			<span class="text-sm font-medium text-text-primary">筛选条件</span>
		</div>
		<div class="flex flex-wrap gap-3">
			<div class="flex flex-wrap gap-2">
				<span class="text-sm text-text-muted self-center">状态：</span>
				{#each statusOptions as opt}
					<button
						on:click={() => toggleStatus(opt.value)}
						class="px-3 py-1.5 text-sm rounded-full border transition-all {
							filters.status?.includes(opt.value as never)
								? 'bg-primary text-white border-primary'
								: 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
						}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
			{#if categories.length > 0}
				<div class="flex flex-wrap gap-2">
					<span class="text-sm text-text-muted self-center">分类：</span>
					{#each categories as cat}
						<button
							on:click={() => toggleCategory(cat)}
							class="px-3 py-1.5 text-sm rounded-full border transition-all {
								filters.category?.includes(cat as never)
									? 'bg-secondary text-white border-secondary'
									: 'bg-surface text-text-secondary border-border hover:border-secondary hover:text-secondary'
							}"
						>
							{cat}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each Array(8) as _, i}
				<div class="card overflow-hidden h-[360px] animate-pulse">
					<div class="aspect-[16/9] bg-surface-alt" />
					<div class="p-5 space-y-3">
						<div class="h-6 bg-surface-alt rounded w-3/4" />
						<div class="h-4 bg-surface-alt rounded w-full" />
						<div class="h-4 bg-surface-alt rounded w-5/6" />
						<div class="grid grid-cols-2 gap-2 pt-4">
							<div class="h-4 bg-surface-alt rounded" />
							<div class="h-4 bg-surface-alt rounded" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if projects.length === 0}
		<div class="text-center py-20">
			<div class="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
				<Calendar class="w-8 h-8 text-text-muted" />
			</div>
			<h3 class="font-display text-lg font-semibold text-text-primary mb-2">暂无活动项目</h3>
			<p class="text-text-secondary">请尝试调整筛选条件</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each projects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>

		{#if total > pageSize}
			<div class="flex justify-center items-center gap-2 mt-12">
				<button
					on:click={() => { page--; loadProjects(); }}
					disabled={page <= 1}
					class="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
				>
					上一页
				</button>
				<span class="text-sm text-text-muted px-4">
					第 {page} / {Math.ceil(total / pageSize)} 页，共 {total} 个项目
				</span>
				<button
					on:click={() => { page++; loadProjects(); }}
					disabled={page >= Math.ceil(total / pageSize)}
					class="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
				>
					下一页
				</button>
			</div>
		{/if}
	{/if}
</section>
