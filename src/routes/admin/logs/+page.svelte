<script lang="ts">
	import { onMount } from 'svelte';
	import {
		List,
		Filter,
		Search,
		Download,
		User,
		Clock,
		Target,
		Loader2,
		ChevronLeft,
		ChevronRight,
		Calendar,
		Globe,
		FileJson
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import { formatDateTime, debounce, statusToText } from '$lib/utils/format';
	import { mockGetLogs, getAllUsers, mockCreateExportTask } from '$lib/mock/service';
	import type { OperationLog, LogFilters } from '$lib/server/db/schema';

	type LogWithUser = OperationLog & { userName: string | null };

	let logs: LogWithUser[] = [];
	let total = 0;
	let loading = true;
	let exporting = false;
	let filters: LogFilters = {
		action: '',
		userId: '',
		targetType: ''
	};
	let page = 1;
	let pageSize = 100;
	let dateFrom = '';
	let dateTo = '';
	let keyword = '';

	let allUsers = getAllUsers();

	const actionOptions = [
		'login',
		'logout',
		'view_project',
		'register_shift',
		'signin',
		'signout',
		'create_project',
		'update_project',
		'create_shift',
		'process_feedback',
		'add_budget_item',
		'export_data',
		'upload_photo'
	];

	const targetOptions = ['project', 'shift', 'user', 'feedback', 'budget', 'log', 'photo'];

	function actionToText(action: string): string {
		const map: Record<string, string> = {
			login: '登录',
			logout: '登出',
			view_project: '查看项目',
			register_shift: '报名班次',
			signin: '签到',
			signout: '签退',
			create_project: '创建项目',
			update_project: '更新项目',
			create_shift: '创建班次',
			process_feedback: '处理反馈',
			add_budget_item: '添加预算项',
			export_data: '导出数据',
			upload_photo: '上传照片'
		};
		return map[action] || action;
	}

	function targetToText(target: string): string {
		const map: Record<string, string> = {
			project: '项目',
			shift: '班次',
			user: '用户',
			feedback: '反馈',
			budget: '预算',
			log: '日志',
			photo: '照片'
		};
		return map[target] || target;
	}

	function actionBadgeClass(action: string): string {
		if (action.includes('create') || action === 'login' || action === 'signin') {
			return 'badge-success';
		}
		if (action.includes('update') || action.includes('process') || action.includes('export')) {
			return 'badge-info';
		}
		if (action === 'logout' || action === 'signout') {
			return 'badge-warning';
		}
		return 'badge bg-secondary/10 text-secondary';
	}

	async function loadLogs() {
		loading = true;
		try {
			const combinedFilters: LogFilters = {
				...filters,
				startDate: dateFrom || undefined,
				endDate: dateTo || undefined
			};
			const result = await mockGetLogs(combinedFilters, { page, pageSize });
			logs = result.data as LogWithUser[];
			total = result.total;
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		page = 1;
		loadLogs();
	}

	const handleKeywordSearch = debounce((e: Event) => {
		const target = e.target as HTMLInputElement;
		keyword = target.value;
	}, 300);

	async function handleExport() {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}
		exporting = true;
		try {
			const result = await mockCreateExportTask($auth.user!.id, 'log', {
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

	$: filteredLogs = keyword
		? logs.filter(
				(l) =>
					(l.userName || '').toLowerCase().includes(keyword.toLowerCase()) ||
					l.action.toLowerCase().includes(keyword.toLowerCase()) ||
					(l.targetType || '').toLowerCase().includes(keyword.toLowerCase())
			)
		: logs;

	onMount(() => {
		loadLogs();
	});
</script>

<div class="h-full flex flex-col gap-4">
	<div class="card p-4 flex-shrink-0">
		<div class="flex flex-col lg:flex-row lg:items-center gap-4">
			<div class="flex items-center gap-2 flex-shrink-0">
				<Filter class="w-4 h-4 text-text-muted" />
				<span class="text-sm font-medium text-text-primary">筛选条件</span>
				<span class="text-xs text-text-muted">（共 {total} 条记录）</span>
			</div>

			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<input
					type="text"
					placeholder="搜索操作人、动作..."
					class="input pl-10 text-sm py-2"
					on:input={handleKeywordSearch}
				/>
			</div>

			<div class="flex flex-wrap gap-2">
				<select
					bind:value={filters.userId}
					on:change={applyFilters}
					class="input text-sm py-2"
				>
					<option value="">全部用户</option>
					{#each allUsers as u}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>

				<select
					bind:value={filters.action}
					on:change={applyFilters}
					class="input text-sm py-2"
				>
					<option value="">全部操作</option>
					{#each actionOptions as act}
						<option value={act}>{actionToText(act)}</option>
					{/each}
				</select>

				<select
					bind:value={filters.targetType}
					on:change={applyFilters}
					class="input text-sm py-2"
				>
					<option value="">全部类型</option>
					{#each targetOptions as t}
						<option value={t}>{targetToText(t)}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-wrap gap-2">
				<input
					type="date"
					bind:value={dateFrom}
					on:change={applyFilters}
					class="input text-sm py-2"
				/>
				<input
					type="date"
					bind:value={dateTo}
					on:change={applyFilters}
					class="input text-sm py-2"
				/>
			</div>

			<button
				on:click={handleExport}
				disabled={exporting || logs.length === 0}
				class="btn btn-secondary text-sm ml-auto disabled:opacity-50"
			>
				{#if exporting}
					<Loader2 class="w-4 h-4 animate-spin" />
					导出中...
				{:else}
					<Download class="w-4 h-4" />
					导出日志
				{/if}
			</button>
		</div>
	</div>

	<div class="card flex-1 overflow-hidden flex flex-col min-h-0">
		<div class="px-5 py-3 border-b border-border-light bg-surface-alt grid grid-cols-12 gap-2 text-xs font-semibold text-text-primary flex-shrink-0">
			<div class="col-span-2">操作时间</div>
			<div class="col-span-2">操作人</div>
			<div class="col-span-2">操作类型</div>
			<div class="col-span-2">目标类型</div>
			<div class="col-span-2">IP地址</div>
			<div class="col-span-2">详情</div>
		</div>

		<div class="flex-1 overflow-auto">
			{#if loading}
				<div class="p-8 text-center">
					<Loader2 class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
					<p class="text-text-muted text-sm">加载中...</p>
				</div>
			{:else if filteredLogs.length === 0}
				<div class="p-16 text-center">
					<List class="w-16 h-16 text-text-muted mx-auto mb-4" />
					<h3 class="font-display text-lg font-semibold text-text-primary mb-2">暂无日志记录</h3>
					<p class="text-text-secondary">请调整筛选条件</p>
				</div>
			{:else}
				<div class="divide-y divide-border-light">
					{#each filteredLogs as log, index}
						<div
							class="px-5 py-3 grid grid-cols-12 gap-2 items-center text-sm hover:bg-surface-alt/50 transition-colors"
						>
							<div class="col-span-2 text-text-secondary whitespace-nowrap flex items-center gap-1.5">
								<Clock class="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
								{formatDateTime(log.createdAt)}
							</div>
							<div class="col-span-2 text-text-primary flex items-center gap-1.5">
								<User class="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
								<span class="truncate">{log.userName || '系统'}</span>
							</div>
							<div class="col-span-2">
								<span class={`badge ${actionBadgeClass(log.action)}`}>
									{actionToText(log.action)}
								</span>
							</div>
							<div class="col-span-2 text-text-secondary flex items-center gap-1.5">
								<Target class="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
								{log.targetType ? targetToText(log.targetType) : '-'}
							</div>
							<div class="col-span-2 text-text-secondary flex items-center gap-1.5">
								<Globe class="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
								<span class="font-mono text-xs">{log.ipAddress || '-'}</span>
							</div>
							<div class="col-span-2 text-text-muted flex items-center gap-1.5 truncate">
								<FileJson class="w-3.5 h-3.5 flex-shrink-0" />
								<span class="truncate text-xs">
									{log.details ? JSON.stringify(log.details) : '-'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if total > pageSize}
			<div class="flex justify-center items-center gap-2 px-5 py-3 border-t border-border-light flex-shrink-0">
				<button
					on:click={() => { page--; loadLogs(); }}
					disabled={page <= 1}
					class="btn btn-ghost text-sm disabled:opacity-50"
				>
					<ChevronLeft class="w-4 h-4" />
					上一页
				</button>
				<span class="text-sm text-text-muted px-4">
					第 {page} / {Math.ceil(total / pageSize)} 页，共 {total} 条
				</span>
				<button
					on:click={() => { page++; loadLogs(); }}
					disabled={page >= Math.ceil(total / pageSize)}
					class="btn btn-ghost text-sm disabled:opacity-50"
				>
					下一页
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		{/if}
	</div>
</div>
