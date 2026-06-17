<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Wallet,
		MessageSquare,
		List,
		FileText,
		Users,
		Clock,
		TrendingUp,
		ChevronRight,
		AlertTriangle,
		CheckCircle2,
		AlertCircle,
		ArrowUpRight,
		ClipboardList
	} from 'lucide-svelte';
	import { mockGetAllBudgets, mockGetAllFeedbacks, mockGetExportTasks } from '$lib/mock/service';
	import { formatCurrency, formatNumber, formatDateTime } from '$lib/utils/format';
	import type { FeedbackWithDetails, ExportTaskWithUser } from '$lib/types';

	let budgetCount = 0;
	let pendingFeedbacks: FeedbackWithDetails[] = [];
	let processingExports: ExportTaskWithUser[] = [];
	let loading = true;

	async function loadStats() {
		loading = true;
		try {
			const [budgets, feedbacks, exports] = await Promise.all([
				mockGetAllBudgets(),
				mockGetAllFeedbacks(),
				mockGetExportTasks()
			]);
			budgetCount = budgets.length;
			pendingFeedbacks = feedbacks.filter((f) => f.status === 'pending');
			processingExports = exports.filter((e) => e.status === 'processing' || e.status === 'pending');
		} finally {
			loading = false;
		}
	}

	const quickLinks = [
		{ href: '/admin/budget', label: '预算管理', icon: Wallet, desc: '维护项目预算与支出', color: 'primary' },
		{ href: '/admin/feedback', label: '反馈审核', icon: MessageSquare, desc: '处理用户反馈与建议', color: 'warning' },
		{ href: '/admin/logs', label: '日志中心', icon: List, desc: '查看系统操作日志', color: 'secondary' },
		{ href: '/admin/exports', label: '导出中心', icon: FileText, desc: '批量导出数据', color: 'success' }
	];

	function urgencyBadgeClass(urgency: string): string {
		switch (urgency) {
			case 'high':
			case 'urgent':
				return 'badge-danger';
			case 'normal':
				return 'badge-warning';
			default:
				return 'badge-info';
		}
	}

	onMount(() => {
		loadStats();
	});
</script>

<div class="space-y-6">
	<div class="card p-6 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
		<div class="flex items-start justify-between flex-wrap gap-4">
			<div>
				<h2 class="font-display text-2xl font-bold text-text-primary mb-2">欢迎使用管理后台</h2>
				<p class="text-text-secondary">高效管理志愿活动，让每一份爱心都被妥善记录</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
					<Users class="w-6 h-6 text-white" />
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">待处理反馈</p>
				<div class="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
					<AlertTriangle class="w-5 h-5 text-warning" />
				</div>
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{#if loading}<span class="animate-pulse">--</span>{:else}{pendingFeedbacks.length}{/if}
				<span class="text-base font-normal text-text-muted"> 条</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">进行中导出</p>
				<div class="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
					<FileText class="w-5 h-5 text-accent" />
				</div>
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{#if loading}<span class="animate-pulse">--</span>{:else}{processingExports.length}{/if}
				<span class="text-base font-normal text-text-muted"> 个</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">项目预算</p>
				<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
					<Wallet class="w-5 h-5 text-primary" />
				</div>
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{#if loading}<span class="animate-pulse">--</span>{:else}{budgetCount}{/if}
				<span class="text-base font-normal text-text-muted"> 个</span>
			</p>
		</div>
		<div class="card p-5">
			<div class="flex items-center justify-between mb-3">
				<p class="text-sm text-text-muted">本月服务</p>
				<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
					<Clock class="w-5 h-5 text-success" />
				</div>
			</div>
			<p class="text-3xl font-bold text-text-primary">
				{#if loading}<span class="animate-pulse">--</span>{:else}{formatNumber(128.5, 1)}{/if}
				<span class="text-base font-normal text-text-muted"> 小时</span>
			</p>
		</div>
	</div>

	<div class="card p-6">
		<div class="flex items-center justify-between mb-5">
			<div class="flex items-center gap-2">
				<ClipboardList class="w-5 h-5 text-warning" />
				<h3 class="font-display text-lg font-semibold text-text-primary">待办事项</h3>
				<span class="badge badge-warning">{pendingFeedbacks.length + processingExports.length}</span>
			</div>
		</div>

		<div class="space-y-4">
			{#if pendingFeedbacks.length > 0}
				<div>
					<div class="flex items-center gap-2 mb-3">
						<MessageSquare class="w-4 h-4 text-warning" />
						<span class="text-sm font-medium text-text-primary">待处理反馈</span>
						<span class="text-xs text-text-muted">({pendingFeedbacks.length} 条)</span>
					</div>
					<div class="space-y-2 ml-6">
						{#each pendingFeedbacks.slice(0, 3) as feedback}
							<a
								href={`/admin/feedback?highlight=${feedback.id}`}
								class="block p-3 rounded-xl border border-border-light hover:border-primary/30 hover:bg-primary/5 transition-all group"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<span class={`badge ${urgencyBadgeClass(feedback.urgency)} !text-xs`}>
												{feedback.urgency === 'high' ? '紧急' : feedback.urgency === 'normal' ? '一般' : '低'}
											</span>
											<span class="text-xs text-text-muted truncate">{feedback.projectName}</span>
										</div>
										<p class="text-sm text-text-primary truncate">{feedback.content}</p>
										<p class="text-xs text-text-muted mt-1">
											来自 {feedback.userName} · {formatDateTime(feedback.createdAt)}
										</p>
									</div>
									<ArrowUpRight class="w-4 h-4 text-text-muted group-hover:text-primary flex-shrink-0 mt-1" />
								</div>
							</a>
						{/each}
						{#if pendingFeedbacks.length > 3}
							<a
								href="/admin/feedback?filter=pending"
								class="block text-center text-sm text-primary hover:text-primary/80 py-2"
							>
								查看全部 {pendingFeedbacks.length} 条待处理反馈 →
							</a>
						{/if}
					</div>
				</div>
			{/if}

			{#if processingExports.length > 0}
				<div>
					<div class="flex items-center gap-2 mb-3">
						<FileText class="w-4 h-4 text-accent" />
						<span class="text-sm font-medium text-text-primary">进行中的导出</span>
						<span class="text-xs text-text-muted">({processingExports.length} 个)</span>
					</div>
					<div class="space-y-2 ml-6">
						{#each processingExports.slice(0, 3) as exportTask}
							<a
								href="/admin/exports"
								class="block p-3 rounded-xl border border-border-light hover:border-accent/30 hover:bg-accent/5 transition-all group"
							>
								<div class="flex items-center justify-between gap-3">
									<div class="flex-1 min-w-0">
										<p class="text-sm text-text-primary truncate">{exportTask.exportType}</p>
										<p class="text-xs text-text-muted mt-1">
											状态：{exportTask.status === 'processing' ? '处理中' : '等待中'} · 进度 {exportTask.progress || 0}%
										</p>
									</div>
									<ArrowUpRight class="w-4 h-4 text-text-muted group-hover:text-accent flex-shrink-0" />
								</div>
							</a>
						{/each}
						{#if processingExports.length > 3}
							<a
								href="/admin/exports"
								class="block text-center text-sm text-primary hover:text-primary/80 py-2"
							>
								查看全部 {processingExports.length} 个导出任务 →
							</a>
						{/if}
					</div>
				</div>
			{/if}

			{#if pendingFeedbacks.length === 0 && processingExports.length === 0}
				<div class="text-center py-8">
					<CheckCircle2 class="w-12 h-12 text-success mx-auto mb-3" />
					<p class="text-text-primary font-medium">太棒了！当前没有待办事项</p>
					<p class="text-sm text-text-muted mt-1">所有任务都已完成</p>
				</div>
			{/if}
		</div>
	</div>

	<h3 class="font-display text-lg font-semibold text-text-primary mt-2 mb-4">快捷入口</h3>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each quickLinks as link}
			<a
				href={link.href}
				class="card p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
			>
				<div class="w-14 h-14 rounded-xl flex items-center justify-center {
					link.color === 'primary'
						? 'bg-primary/10'
						: link.color === 'secondary'
							? 'bg-secondary/10'
							: link.color === 'warning'
								? 'bg-warning/10'
								: 'bg-success/10'
				}">
					<svelte:component
						this={link.icon}
						class={`w-7 h-7 ${
							link.color === 'primary'
								? 'text-primary'
								: link.color === 'secondary'
									? 'text-secondary'
									: link.color === 'warning'
										? 'text-warning'
										: 'text-success'
						}`}
					/>
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="font-semibold text-text-primary">{link.label}</h4>
					<p class="text-sm text-text-muted mt-0.5">{link.desc}</p>
				</div>
				<ChevronRight class="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
			</a>
		{/each}
	</div>
</div>
