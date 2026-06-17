<script lang="ts">
	import { onMount } from 'svelte';
	import {
		FileText,
		Download,
		Plus,
		Loader2,
		CheckCircle,
		XCircle,
		Clock,
		RefreshCw,
		Trash2,
		FileSpreadsheet,
		File,
		Calendar,
		User,
		X,
		ChevronDown
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import {
		formatDateTime,
		formatFileSize,
		statusToText
	} from '$lib/utils/format';
	import { mockGetExportTasks, mockCreateExportTask, mockProjects } from '$lib/mock/service';
	import type { ExportTaskWithUser, ExportFilters } from '$lib/types';

	let tasks: ExportTaskWithUser[] = [];
	let loading = true;
	let refreshing = false;
	let showCreateModal = false;
	let creating = false;

	let newExport: Partial<ExportFilters> = {
		type: 'signin',
		format: 'csv',
		projectId: ''
	};

	let dateFrom = '';
	let dateTo = '';

	const exportTypes = [
		{ value: 'signin', label: '志愿服务记录', icon: FileSpreadsheet },
		{ value: 'project', label: '项目数据', icon: FileText },
		{ value: 'budget', label: '预算支出', icon: FileText },
		{ value: 'user', label: '用户数据', icon: User },
		{ value: 'log', label: '操作日志', icon: FileText }
	];

	const statusOptions = [
		{ value: 'confirmed', label: '已确认' },
		{ value: 'pending', label: '待确认' },
		{ value: 'rejected', label: '已拒绝' }
	];

	let selectedStatuses: string[] = [];

	async function loadTasks() {
		loading = true;
		try {
			tasks = await mockGetExportTasks();
		} finally {
			loading = false;
		}
	}

	async function refreshTasks() {
		refreshing = true;
		try {
			tasks = await mockGetExportTasks();
			toast.success('已刷新');
		} finally {
			refreshing = false;
		}
	}

	function toggleStatus(status: string) {
		const idx = selectedStatuses.indexOf(status);
		if (idx > -1) {
			selectedStatuses.splice(idx, 1);
		} else {
			selectedStatuses.push(status);
		}
	}

	async function handleCreateExport() {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}

		creating = true;
		try {
			const filters: Record<string, unknown> = {};
			if (newExport.projectId) filters.projectId = newExport.projectId;
			if (selectedStatuses.length > 0) filters.status = selectedStatuses;
			if (dateFrom || dateTo) {
				filters.dateRange = { start: dateFrom, end: dateTo };
			}

			const result = await mockCreateExportTask(
				$auth.user!.id,
				newExport.type!,
				filters
			);
			if (result) {
				toast.success('导出任务已创建，正在后台处理');
				showCreateModal = false;
				loadTasks();
			} else {
				toast.error('创建导出任务失败');
			}
		} finally {
			creating = false;
		}
	}

	function downloadFile(task: ExportTaskWithUser) {
		toast.success(`正在下载：${task.fileName}`);
	}

	function deleteTask(id: string) {
		toast.info('删除功能演示');
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'processing':
				return 'badge-info';
			case 'failed':
				return 'badge-danger';
			default:
				return 'badge-warning';
		}
	}

	function exportTypeLabel(type: string): string {
		return exportTypes.find((t) => t.value === type)?.label || type;
	}

	$: stats = {
		total: tasks.length,
		pending: tasks.filter((t) => t.status === 'pending' || t.status === 'processing').length,
		completed: tasks.filter((t) => t.status === 'completed').length
	};

	onMount(() => {
		loadTasks();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="grid grid-cols-3 gap-4 flex-1 max-w-2xl">
			<div class="card p-4">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
						<FileText class="w-5 h-5 text-primary" />
					</div>
					<div>
						<p class="text-sm text-text-muted">总任务</p>
						<p class="text-xl font-bold text-text-primary">{stats.total}</p>
					</div>
				</div>
			</div>
			<div class="card p-4">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
						<Loader2 class="w-5 h-5 text-accent animate-spin" />
					</div>
					<div>
						<p class="text-sm text-text-muted">处理中</p>
						<p class="text-xl font-bold text-text-primary">{stats.pending}</p>
					</div>
				</div>
			</div>
			<div class="card p-4">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
						<CheckCircle class="w-5 h-5 text-success" />
					</div>
					<div>
						<p class="text-sm text-text-muted">已完成</p>
						<p class="text-xl font-bold text-text-primary">{stats.completed}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex gap-3">
			<button
				on:click={refreshTasks}
				disabled={refreshing}
				class="btn btn-ghost disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4 {refreshing ? 'animate-spin' : ''}" />
				刷新
			</button>
			<button on:click={() => (showCreateModal = true)} class="btn btn-primary">
				<Plus class="w-4 h-4" />
				新建导出
			</button>
		</div>
	</div>

	<div class="card overflow-hidden">
		{#if loading}
			<div class="p-8">
				<div class="animate-pulse space-y-4">
					{#each Array(5) as _}
						<div class="h-16 bg-surface-alt rounded-xl" />
					{/each}
				</div>
			</div>
		{:else if tasks.length === 0}
			<div class="p-16 text-center">
				<FileText class="w-16 h-16 text-text-muted mx-auto mb-4" />
				<h3 class="font-display text-lg font-semibold text-text-primary mb-2">暂无导出任务</h3>
				<p class="text-text-secondary mb-6">点击上方按钮创建新的导出任务</p>
				<button on:click={() => (showCreateModal = true)} class="btn btn-primary">
					<Plus class="w-4 h-4" />
					新建导出
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-surface-alt">
						<tr>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">导出类型</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">创建人</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">筛选条件</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">进度</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">状态</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">创建时间</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">文件信息</th>
							<th class="text-left px-5 py-3 text-sm font-semibold text-text-primary">操作</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-light">
						{#each tasks as task}
							<tr class="hover:bg-surface-alt/50 transition-colors">
								<td class="px-5 py-4">
									<div class="flex items-center gap-2">
										{@const typeInfo = exportTypes.find((t) => t.value === task.exportType)}
										<svelte:component this={typeInfo?.icon || File} class="w-5 h-5 text-primary" />
										<span class="text-sm font-medium text-text-primary">
											{exportTypeLabel(task.exportType)}
										</span>
									</div>
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-2">
										<User class="w-4 h-4 text-text-muted" />
										<span class="text-sm text-text-secondary">{task.userName}</span>
									</div>
								</td>
								<td class="px-5 py-4">
									{#if task.filters && Object.keys(task.filters).length > 0}
										<div class="flex flex-wrap gap-1 max-w-xs">
											{#if task.filters.projectId}
												<span class="badge bg-secondary/10 text-secondary text-xs">
													{mockProjects.find((p) => p.id === task.filters?.projectId)?.title || '指定项目'}
												</span>
											{/if}
											{#if (task.filters as { status?: string[] }).status}
												{#each (task.filters as { status: string[] }).status as s}
													<span class="badge bg-primary/10 text-primary text-xs">
														{statusToText(s)}
													</span>
												{/each}
											{/if}
											{#if (task.filters as { dateRange?: { start: string; end: string } }).dateRange}
												<span class="badge bg-accent/10 text-accent text-xs">
													{(task.filters as { dateRange: { start: string; end: string } }).dateRange.start}
													~ {(task.filters as { dateRange: { start: string; end: string } }).dateRange.end}
												</span>
											{/if}
										</div>
									{:else}
										<span class="text-xs text-text-muted">无筛选条件</span>
									{/if}
								</td>
								<td class="px-5 py-4">
									<div class="w-32">
										<div class="flex justify-between text-xs text-text-muted mb-1">
											<span>进度</span>
											<span>{task.progress}%</span>
										</div>
										<div class="h-2 bg-surface-alt rounded-full overflow-hidden">
											<div
												class={`h-full rounded-full transition-all duration-500 ${
													task.status === 'failed'
														? 'bg-danger'
														: task.status === 'completed'
															? 'bg-success'
															: 'bg-primary'
												}`}
												style={`width: ${task.progress}%`}
											/>
										</div>
									</div>
								</td>
								<td class="px-5 py-4">
									<span class={`badge ${statusBadgeClass(task.status)}`}>
										{#if task.status === 'pending'}
											<Clock class="w-3 h-3 inline mr-1" />
										{:else if task.status === 'processing'}
											<Loader2 class="w-3 h-3 inline mr-1 animate-spin" />
										{:else if task.status === 'completed'}
											<CheckCircle class="w-3 h-3 inline mr-1" />
										{:else if task.status === 'failed'}
											<XCircle class="w-3 h-3 inline mr-1" />
										{/if}
										{statusToText(task.status)}
									</span>
								</td>
								<td class="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
									{formatDateTime(task.createdAt)}
								</td>
								<td class="px-5 py-4">
									{#if task.status === 'completed' && task.fileName}
										<div class="text-sm">
											<p class="text-text-primary font-medium truncate max-w-[160px]">
												{task.fileName}
											</p>
											<p class="text-text-muted text-xs">
												{task.fileSize ? formatFileSize(task.fileSize) : '-'}
											</p>
										</div>
									{:else}
										<span class="text-sm text-text-muted">-</span>
									{/if}
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-2">
										{#if task.status === 'completed' && task.fileUrl}
											<button
												on:click={() => downloadFile(task)}
												class="btn btn-primary text-sm py-1.5 px-3"
											>
												<Download class="w-4 h-4" />
												下载
											</button>
										{/if}
										<button
											on:click={() => deleteTask(task.id)}
											class="btn btn-ghost text-sm py-1.5 px-2 text-danger hover:bg-danger/10 hover:text-danger"
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	{#if showCreateModal}
		<div
			class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
			on:click={() => (showCreateModal = false)}
		>
			<div
				class="card w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
				on:click|stopPropagation
			>
				<div class="p-5 border-b border-border-light flex items-center justify-between flex-shrink-0">
					<h3 class="font-display text-lg font-semibold text-text-primary">创建导出任务</h3>
					<button
						on:click={() => (showCreateModal = false)}
						class="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
					>
						<X class="w-5 h-5 text-text-muted" />
					</button>
				</div>

				<div class="flex-1 overflow-y-auto p-5 space-y-5">
					<div>
						<label class="block text-sm font-medium text-text-primary mb-2">导出类型 *</label>
						<div class="grid grid-cols-2 gap-2">
							{#each exportTypes as type}
								<button
									on:click={() => (newExport.type = type.value)}
									class="p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 {
										newExport.type === type.value
											? 'border-primary bg-primary/5'
											: 'border-border hover:border-primary/50 hover:bg-surface-alt/50'
									}"
								>
									<svelte:component
										this={type.icon}
										class={`w-5 h-5 flex-shrink-0 ${
											newExport.type === type.value ? 'text-primary' : 'text-text-muted'
										}`}
									/>
									<span class="text-sm font-medium">{type.label}</span>
								</button>
							{/each}
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-text-primary mb-2">导出格式</label>
						<div class="flex gap-2">
							<button
								on:click={() => (newExport.format = 'csv')}
								class={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
									newExport.format === 'csv'
										? 'bg-primary text-white'
										: 'bg-surface-alt text-text-secondary hover:bg-border-light'
								}`}
							>
								CSV
							</button>
							<button
								on:click={() => (newExport.format = 'excel')}
								class={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
									newExport.format === 'excel'
										? 'bg-primary text-white'
										: 'bg-surface-alt text-text-secondary hover:bg-border-light'
								}`}
							>
								Excel
							</button>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-text-primary mb-2">项目（可选）</label>
						<select bind:value={newExport.projectId} class="input">
							<option value="">全部项目</option>
							{#each mockProjects as p}
								<option value={p.id}>{p.title}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-text-primary mb-2">日期范围（可选）</label>
						<div class="grid grid-cols-2 gap-3">
							<input
								type="date"
								bind:value={dateFrom}
								class="input"
								placeholder="开始日期"
							/>
							<input
								type="date"
								bind:value={dateTo}
								class="input"
								placeholder="结束日期"
							/>
						</div>
					</div>

					{#if newExport.type === 'signin'}
						<div>
							<label class="block text-sm font-medium text-text-primary mb-2">状态（可选）</label>
							<div class="flex flex-wrap gap-2">
								{#each statusOptions as opt}
									<button
										on:click={() => toggleStatus(opt.value)}
										class="px-3 py-1.5 text-sm rounded-full border transition-all {
											selectedStatuses.includes(opt.value)
												? 'bg-primary text-white border-primary'
												: 'bg-surface text-text-secondary border-border hover:border-primary/50 hover:text-primary'
										}"
									>
										{opt.label}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<div class="bg-surface-alt rounded-xl p-4">
						<div class="flex items-start gap-2">
							<Clock class="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
							<div class="text-sm text-text-secondary">
								<p class="font-medium text-text-primary mb-1">导出说明</p>
								<ul class="space-y-1 list-disc list-inside text-xs">
									<li>大数据量导出将在后台异步处理，您可继续其他操作</li>
									<li>导出完成后可在此页面或站内通知中下载</li>
									<li>导出文件将保留 7 天，过期后自动清理</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<div class="p-5 border-t border-border-light flex justify-end gap-3 flex-shrink-0">
					<button
						on:click={() => (showCreateModal = false)}
						class="btn btn-ghost"
					>
						取消
					</button>
					<button
						on:click={handleCreateExport}
						disabled={creating}
						class="btn btn-primary disabled:opacity-50"
					>
						{#if creating}
							<Loader2 class="w-4 h-4 animate-spin" />
							创建中...
						{:else}
							<FileText class="w-4 h-4" />
							创建任务
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
