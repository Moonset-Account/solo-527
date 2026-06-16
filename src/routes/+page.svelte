<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		TOPIC_STATUS_LABELS,
		TASK_STATUS_LABELS,
		SCHEDULE_STATUS_LABELS,
		PLATFORM_COLORS
	} from '$lib/types';
	import type { TopicStatus, TaskStatus } from '$lib/types';
	import {
		LayoutDashboard,
		FileText,
		ClipboardList,
		AlertTriangle,
		Calendar,
		ChevronRight,
		Clock,
		User,
		CalendarClock,
		TrendingUp
	} from 'lucide-svelte';

	let stats = $derived(store.getDashboardStats());

	let topicStatusOrder: TopicStatus[] = [
		'draft',
		'pending_approval',
		'approved',
		'in_production',
		'published',
		'archived'
	];

	let taskStatusOrder: TaskStatus[] = [
		'assigned',
		'in_progress',
		'submitted',
		'reviewing',
		'completed'
	];

	let recentAnomalies = $derived(
		store.anomalies
			.filter((a) => a.status !== 'closed')
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 3)
	);

	let openAnomaliesCount = $derived(
		store.anomalies.filter((a) => a.status !== 'closed').length
	);

	function getTopicTitle(id: string) {
		return store.topics.find((t) => t.id === id)?.title ?? '未知选题';
	}

	function getUserName(id: string) {
		return store.users.find((u) => u.id === id)?.name ?? '未知';
	}

	function getTopicStatusLabel(status: TopicStatus) {
		return TOPIC_STATUS_LABELS[status];
	}

	function topicStatusColor(status: TopicStatus) {
		const map: Record<TopicStatus, string> = {
			draft: 'from-gray-400 to-gray-500',
			pending_approval: 'from-warning to-warning/80',
			approved: 'from-copper to-copper-dark',
			in_production: 'from-blue-500 to-blue-600',
			published: 'from-success to-success/80',
			archived: 'from-ink-lighter to-ink-light'
		};
		return map[status];
	}

	function taskStatusBadgeClass(status: TaskStatus) {
		const map: Record<TaskStatus, string> = {
			assigned: 'bg-warm-gray-dark text-ink',
			in_progress: 'bg-blue-100 text-blue-700',
			submitted: 'bg-warning-light text-warning',
			reviewing: 'bg-copper-light/30 text-copper',
			completed: 'bg-success-light text-success'
		};
		return map[status];
	}

	function anomalySeverityColor(severity: string) {
		const map: Record<string, string> = {
			low: 'bg-warning-light text-warning',
			medium: 'bg-copper-light/30 text-copper',
			high: 'bg-danger-light text-danger'
		};
		return map[severity] ?? 'bg-warm-gray-dark text-ink';
	}

	function platformColor(platform: string) {
		return PLATFORM_COLORS[platform] ?? '#e07a3a';
	}

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN', {
			month: '2-digit',
			day: '2-digit'
		});
	}

	function formatDateTime(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
		<div class="mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold text-ink font-serif">仪表盘</h1>
			<p class="text-sm text-ink-lighter mt-1">选题概览 · 任务进度 · 异常提醒 · 近期排期</p>
		</div>

		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold text-ink font-serif flex items-center gap-2">
					<FileText size={18} class="text-copper" />
					选题概览
				</h2>
				<a href="/topics" class="text-sm text-copper hover:text-copper-dark flex items-center gap-1 transition-colors">
					查看全部 <ChevronRight size={14} />
				</a>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
				{#each topicStatusOrder as status}
					{@const count = stats.topicsByStatus[status] ?? 0}
					<a href="/topics" class="group">
						<div class="relative overflow-hidden rounded-xl bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-copper/20">
							<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r {topicStatusColor(status)} opacity-60 group-hover:opacity-100 transition-opacity"></div>
							<div class="text-3xl font-bold text-ink mb-1">{count}</div>
							<div class="text-xs text-ink-lighter">{getTopicStatusLabel(status)}</div>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
			<div class="lg:col-span-2">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-ink font-serif flex items-center gap-2">
						<ClipboardList size={18} class="text-copper" />
						任务进度看板
					</h2>
					<a href="/tasks" class="text-sm text-copper hover:text-copper-dark flex items-center gap-1 transition-colors">
						查看全部 <ChevronRight size={14} />
					</a>
				</div>
				<div class="bg-card rounded-xl shadow-sm p-4">
					<div class="overflow-x-auto -mx-4 px-4">
						<div class="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5">
							{#each taskStatusOrder as status}
								{@const count = stats.tasksByStatus[status] ?? 0}
								<div class="w-40 lg:w-auto flex-shrink-0">
									<div class="flex items-center justify-between mb-3">
										<span class="text-sm font-semibold text-ink/70">{TASK_STATUS_LABELS[status]}</span>
										<span class="text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full">{count}</span>
									</div>
									<div class="space-y-2 min-h-[120px]">
										{#each store.tasks.filter((t) => t.status === status).slice(0, 3) as task}
											<a
												href="/tasks/{task.id}"
												class="block bg-warm-gray rounded-lg p-3 hover:bg-copper/5 transition-colors"
											>
												<div class="flex items-center gap-1.5 mb-1.5">
													<span class="text-[10px] px-1.5 py-0.5 rounded bg-ink/10 text-ink/50">
														{task.type === 'shooting' ? '拍摄' : '剪辑'}
													</span>
													<span class="text-[10px] px-1.5 py-0.5 rounded-full {taskStatusBadgeClass(task.status)}">
														{TASK_STATUS_LABELS[task.status]}
													</span>
												</div>
												<h3 class="text-xs font-medium text-ink line-clamp-2 mb-1">{task.title}</h3>
												<div class="flex items-center gap-1 text-[10px] text-ink/40">
													<User size={10} />
													{getUserName(task.assigneeId)}
												</div>
											</a>
										{/each}
										{#if count === 0}
											<div class="text-xs text-ink/30 text-center py-4">暂无任务</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-ink font-serif flex items-center gap-2">
						<AlertTriangle size={18} class="text-danger" />
						异常提醒
						{#if openAnomaliesCount > 0}
							<span class="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
								{openAnomaliesCount}
							</span>
						{/if}
					</h2>
					<a href="/anomalies" class="text-sm text-copper hover:text-copper-dark flex items-center gap-1 transition-colors">
						查看全部 <ChevronRight size={14} />
					</a>
				</div>
				<div class="bg-card rounded-xl shadow-sm p-4 space-y-3">
					{#if recentAnomalies.length === 0}
						<div class="text-center py-8">
							<TrendingUp size={32} class="mx-auto mb-2 text-success/50" />
							<p class="text-sm text-ink/40">暂无待处理异常</p>
						</div>
					{:else}
						{#each recentAnomalies as anomaly}
							<a
								href="/anomalies/{anomaly.id}"
								class="block p-3 rounded-lg border-l-4 hover:bg-warm-gray/50 transition-colors {anomaly.severity === 'high'
									? 'border-l-danger'
									: anomaly.severity === 'medium'
										? 'border-l-copper'
										: 'border-l-warning'}"
							>
								<div class="flex items-center gap-2 mb-1.5">
									<span class="text-[10px] px-2 py-0.5 rounded-full {anomalySeverityColor(anomaly.severity)}">
										{anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
									</span>
									<span class="text-[10px] text-ink/40">{formatDateTime(anomaly.createdAt)}</span>
								</div>
								<p class="text-xs text-ink line-clamp-2 mb-1">{anomaly.description}</p>
								<p class="text-[10px] text-copper truncate">{getTopicTitle(anomaly.topicId)}</p>
							</a>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold text-ink font-serif flex items-center gap-2">
					<Calendar size={18} class="text-copper" />
					近期排期
				</h2>
				<a href="/schedule" class="text-sm text-copper hover:text-copper-dark flex items-center gap-1 transition-colors">
					查看全部 <ChevronRight size={14} />
				</a>
			</div>
			<div class="bg-card rounded-xl shadow-sm overflow-hidden">
				{#if stats.upcomingSchedules.length === 0}
					<div class="text-center py-12">
						<CalendarClock size={32} class="mx-auto mb-2 text-ink/20" />
						<p class="text-sm text-ink/40">未来7天暂无排期</p>
					</div>
				{:else}
					<div class="hidden sm:block">
						<table class="w-full text-sm">
							<thead>
								<tr class="bg-warm-gray">
									<th class="text-left px-4 py-3 font-semibold text-ink/60">选题</th>
									<th class="text-left px-4 py-3 font-semibold text-ink/60">平台</th>
									<th class="text-left px-4 py-3 font-semibold text-ink/60">账号</th>
									<th class="text-left px-4 py-3 font-semibold text-ink/60">发布时间</th>
									<th class="text-left px-4 py-3 font-semibold text-ink/60">状态</th>
								</tr>
							</thead>
							<tbody>
								{#each stats.upcomingSchedules as sch}
									<tr class="border-t border-warm-gray-dark hover:bg-warm-gray/50 transition-colors">
										<td class="px-4 py-3">
											<a href="/schedule/{sch.id}" class="text-ink font-medium hover:text-copper transition-colors">
												{getTopicTitle(sch.topicId)}
											</a>
										</td>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
												style="background: {platformColor(sch.platform)}15; color: {platformColor(sch.platform)}"
											>
												<span class="w-1.5 h-1.5 rounded-full" style="background: {platformColor(sch.platform)}"></span>
												{sch.platform}
											</span>
										</td>
										<td class="px-4 py-3 text-ink/70">{sch.accountName}</td>
										<td class="px-4 py-3">
											<span class="flex items-center gap-1 text-ink/70 text-xs">
												<Clock size={12} />
												{formatDate(sch.publishDate)} {sch.publishTime}
											</span>
										</td>
										<td class="px-4 py-3">
											<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
												{SCHEDULE_STATUS_LABELS[sch.status]}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="sm:hidden space-y-2 p-4">
						{#each stats.upcomingSchedules as sch}
							<a href="/schedule/{sch.id}" class="block p-3 rounded-lg border border-warm-gray-dark hover:border-copper/30 hover:bg-warm-gray/30 transition-colors">
								<div class="flex items-start justify-between gap-2 mb-2">
									<h3 class="text-sm font-medium text-ink line-clamp-2">{getTopicTitle(sch.topicId)}</h3>
									<span
										class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
										style="background: {platformColor(sch.platform)}15; color: {platformColor(sch.platform)}"
									>
										{sch.platform}
									</span>
								</div>
								<div class="flex items-center justify-between text-xs text-ink/50">
									<span>{sch.accountName}</span>
									<span class="flex items-center gap-1">
										<Clock size={10} />
										{formatDate(sch.publishDate)} {sch.publishTime}
									</span>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
