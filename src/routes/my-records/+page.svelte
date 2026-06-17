<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Clock,
		Download,
		Filter,
		Search,
		Calendar,
		MapPin,
		CheckCircle2,
		XCircle,
		Loader2,
		ChevronLeft,
		ChevronRight,
		TrendingUp,
		Award,
		User
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import {
		formatDate,
		formatDateTime,
		formatNumber,
		statusToText,
		debounce,
		formatFileSize
	} from '$lib/utils/format';
	import { mockGetUserSigninRecords, mockProjects, mockCreateExportTask } from '$lib/mock/service';
	import type { SigninRecordWithDetails, ServiceRecordFilters } from '$lib/types';

	let records: SigninRecordWithDetails[] = [];
	let total = 0;
	let loading = true;
	let exporting = false;
	let filters: ServiceRecordFilters = {
		projectId: '',
		status: []
	};
	let page = 1;
	let pageSize = 20;
	let dateFrom = '';
	let dateTo = '';
	let keyword = '';

	const statusOptions = [
		{ value: 'confirmed', label: '已确认' },
		{ value: 'pending', label: '待确认' },
		{ value: 'rejected', label: '已拒绝' }
	];

	let totalHours = 0;
	let totalDays = 0;

	$: stats = {
		totalHours,
		totalDays,
		totalRecords: total,
		avgHours: totalDays > 0 ? (totalHours / totalDays).toFixed(2) : '0'
	};

	async function loadRecords() {
		if (!$auth.isAuthenticated) return;

		loading = true;
		try {
			const combinedFilters: ServiceRecordFilters = {
				...filters,
				startDate: dateFrom || undefined,
				endDate: dateTo || undefined
			};
			const result = await mockGetUserSigninRecords(
				$auth.user!.id,
				combinedFilters,
				{ page, pageSize }
			);
			records = result.data;
			total = result.total;

			totalHours = records.reduce((sum, r) => sum + parseFloat(r.durationHours || '0'), 0);
			totalDays = new Set(records.map((r) => formatDate(r.signinTime))).size;
		} finally {
			loading = false;
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
		loadRecords();
	}

	function applyDateFilter() {
		filters.startDate = dateFrom || undefined;
		filters.endDate = dateTo || undefined;
		page = 1;
		loadRecords();
	}

	const handleKeywordSearch = debounce((e: Event) => {
		const target = e.target as HTMLInputElement;
		keyword = target.value;
		page = 1;
	}, 300);

	async function handleExport() {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}
		exporting = true;
		try {
			const result = await mockCreateExportTask($auth.user!.id, 'signin', {
				...filters,
				dateFrom,
				dateTo
			});
			if (result) {
				toast.success('导出任务已创建，可在导出中心查看进度');
			} else {
				toast.error('导出任务创建失败');
			}
		} finally {
			exporting = false;
		}
	}

	function downloadCertificate(record: SigninRecordWithDetails) {
		toast.info(`正在生成「${record.projectName}」服务证明...`);
	}

	$: filteredRecords = keyword
		? records.filter(
				(r) =>
					r.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
					r.shiftName.toLowerCase().includes(keyword.toLowerCase())
			)
		: records;

	onMount(() => {
		loadRecords();
	});
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="mb-8">
		<h1 class="font-display text-2xl md:text-3xl font-bold text-text-primary mb-2">我的服务记录</h1>
		<p class="text-text-secondary">查看和管理您的志愿服务记录，下载服务证明</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">累计服务时长</p>
				<Clock class="w-5 h-5 text-primary" />
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{formatNumber(stats.totalHours, 1)}
				<span class="text-base font-normal text-text-muted">小时</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">服务天数</p>
				<Calendar class="w-5 h-5 text-secondary" />
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{stats.totalDays}
				<span class="text-base font-normal text-text-muted">天</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">参与项目</p>
				<Award class="w-5 h-5 text-success" />
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{stats.totalRecords}
				<span class="text-base font-normal text-text-muted">次</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">平均时长</p>
				<TrendingUp class="w-5 h-5 text-warning" />
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{stats.avgHours}
				<span class="text-base font-normal text-text-muted">小时/天</span>
			</p>
		</div>
	</div>

	<div class="card p-4 mb-6">
		<div class="flex flex-col lg:flex-row lg:items-center gap-4">
			<div class="flex items-center gap-2 lg:flex-shrink-0">
				<Filter class="w-4 h-4 text-text-muted" />
				<span class="text-sm font-medium text-text-primary">筛选条件</span>
			</div>

			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<input
					type="text"
					placeholder="搜索项目或班次..."
					class="input pl-10 text-sm"
					on:input={handleKeywordSearch}
				/>
			</div>

			<div class="flex flex-wrap gap-2">
				<select
					bind:value={filters.projectId}
					on:change={() => { page = 1; loadRecords(); }}
					class="input text-sm py-2"
				>
					<option value="">全部项目</option>
					{#each mockProjects as p}
						<option value={p.id}>{p.title}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-wrap gap-2">
				<input
					type="date"
					bind:value={dateFrom}
					on:change={applyDateFilter}
					class="input text-sm py-2"
					placeholder="开始日期"
				/>
				<input
					type="date"
					bind:value={dateTo}
					on:change={applyDateFilter}
					class="input text-sm py-2"
					placeholder="结束日期"
				/>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each statusOptions as opt}
					<button
						on:click={() => toggleStatus(opt.value)}
						class="px-3 py-1.5 text-sm rounded-full border transition-all {
							filters.status?.includes(opt.value as never)
								? 'bg-primary text-white border-primary'
								: 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-primary'
						}"
					>
						{opt.label}
					</button>
				{/each}
			</div>

			<button
				on:click={handleExport}
				disabled={exporting || records.length === 0}
				class="btn btn-secondary text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if exporting}
					<Loader2 class="w-4 h-4 animate-spin" />
					导出中...
				{:else}
					<Download class="w-4 h-4" />
					导出记录
				{/if}
			</button>
		</div>
	</div>

	<div class="card overflow-hidden">
		{#if loading}
			<div class="p-8">
				<div class="animate-pulse space-y-4">
					{#each Array(5) as _}
						<div class="flex items-center gap-4 p-4">
							<div class="w-10 h-10 bg-surface-alt rounded-full" />
							<div class="flex-1 space-y-2">
								<div class="h-4 bg-surface-alt rounded w-1/4" />
								<div class="h-3 bg-surface-alt rounded w-1/3" />
							</div>
							<div class="h-8 bg-surface-alt rounded w-20" />
						</div>
					{/each}
				</div>
			</div>
		{:else if filteredRecords.length === 0}
			<div class="p-16 text-center">
				<Clock class="w-16 h-16 text-text-muted mx-auto mb-4" />
				<h3 class="font-display text-lg font-semibold text-text-primary mb-2">暂无服务记录</h3>
				<p class="text-text-secondary mb-6">快去参与志愿服务吧！</p>
				<a href="/" class="btn btn-primary">
					浏览活动项目
				</a>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-surface-alt">
						<tr>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">日期</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">项目名称</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">班次</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">签到时间</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">签退时间</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">服务时长</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">状态</th>
							<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">操作</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-light">
						{#each filteredRecords as record}
							<tr class="hover:bg-surface-alt/50 transition-colors">
								<td class="px-6 py-4 text-sm text-text-primary whitespace-nowrap">
									{formatDate(record.signinTime)}
								</td>
								<td class="px-6 py-4">
									<div class="text-sm font-medium text-text-primary">{record.projectName}</div>
									<div class="text-xs text-text-muted flex items-center gap-1 mt-1">
										<MapPin class="w-3 h-3" />
										{record.location || '-'}
									</div>
								</td>
								<td class="px-6 py-4 text-sm text-text-secondary">{record.shiftName}</td>
								<td class="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
									{formatDateTime(record.signinTime)}
								</td>
								<td class="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
									{record.signoutTime ? formatDateTime(record.signoutTime) : '-'}
								</td>
								<td class="px-6 py-4">
									<span class="text-sm font-semibold text-text-primary">
										{formatNumber(record.durationHours, 2)} 小时
									</span>
								</td>
								<td class="px-6 py-4">
									<span
										class="badge {
											record.status === 'confirmed'
												? 'badge-success'
												: record.status === 'pending'
													? 'badge-warning'
													: 'badge-danger'
										}"
									>
										{statusToText(record.status)}
									</span>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										{#if record.status === 'confirmed'}
											<button
												on:click={() => downloadCertificate(record)}
												class="btn btn-ghost text-sm py-1.5 px-3"
											>
												<Download class="w-4 h-4" />
												证明
											</button>
										{/if}
										<a
											href={`/projects/${record.projectId}`}
											class="btn btn-ghost text-sm py-1.5 px-3"
										>
											查看项目
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if total > pageSize}
				<div class="flex justify-center items-center gap-2 px-6 py-4 border-t border-border-light">
					<button
						on:click={() => { page--; loadRecords(); }}
						disabled={page <= 1}
						class="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ChevronLeft class="w-4 h-4" />
						上一页
					</button>
					<span class="text-sm text-text-muted px-4">
						第 {page} / {Math.ceil(total / pageSize)} 页，共 {total} 条记录
					</span>
					<button
						on:click={() => { page++; loadRecords(); }}
						disabled={page >= Math.ceil(total / pageSize)}
						class="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
					>
						下一页
						<ChevronRight class="w-4 h-4" />
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
