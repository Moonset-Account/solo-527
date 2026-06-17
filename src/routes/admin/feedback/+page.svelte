<script lang="ts">
	import { onMount, afterTick } from 'svelte';
	import { page } from '$app/stores';
	import {
		MessageSquare,
		User,
		Calendar,
		AlertTriangle,
		CheckCircle,
		XCircle,
		Clock,
		Loader2,
		Send,
		Users,
		Target,
		Forward,
		FileText,
		ChevronRight,
		Check
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import {
		formatDateTime,
		statusToText,
		urgencyToText,
		roleToText
	} from '$lib/utils/format';
	import { mockGetAllFeedbacks, mockProcessFeedback, getAllUsers } from '$lib/mock/service';
	import type { FeedbackWithDetails, FeedbackProcessing, FeedbackProcessingWithDetails } from '$lib/types';

	let feedbacks: FeedbackWithDetails[] = [];
	let selectedFeedbackId: string | null = null;
	let highlightedId: string | null = null;
	let loading = true;
	let processing = false;
	let statusFilter = 'all';

	let processingData = {
		affectedParties: '',
		responsiblePerson: '',
		nextSteps: '',
		processingResult: '',
		status: 'processing'
	};

	let allUsers: { id: string; name: string; role: string }[] = [];

	$: selectedFeedback = feedbacks.find((f) => f.id === selectedFeedbackId) || null;

	$: filteredFeedbacks = feedbacks.filter((f) => {
		if (statusFilter === 'all') return true;
		return f.status === statusFilter;
	});

	$: stats = {
		pending: feedbacks.filter((f) => f.status === 'pending').length,
		processing: feedbacks.filter((f) => f.status === 'processing').length,
		resolved: feedbacks.filter((f) => f.status === 'resolved' || f.status === 'closed').length
	};

	async function loadFeedbacks() {
		loading = true;
		try {
			feedbacks = await mockGetAllFeedbacks();
			allUsers = getAllUsers();

			const urlParams = new URLSearchParams($page.url.search);
			const highlightId = urlParams.get('highlight');
			const filterParam = urlParams.get('filter');

			if (filterParam) {
				statusFilter = filterParam;
			}

			if (highlightId && feedbacks.find((f) => f.id === highlightId)) {
				selectedFeedbackId = highlightId;
				highlightedId = highlightId;
				statusFilter = 'all';
				setTimeout(() => {
					const el = document.querySelector(`[data-feedback-id="${highlightId}"]`);
					if (el) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
					setTimeout(() => {
						highlightedId = null;
					}, 2000);
				}, 300);
			} else if (feedbacks.length > 0 && !selectedFeedbackId) {
				const firstPending = feedbacks.find((f) => f.status === 'pending');
				selectedFeedbackId = (firstPending || feedbacks[0]).id;
			}
			resetProcessingForm();
		} finally {
			loading = false;
		}
	}

	function resetProcessingForm() {
		processingData = {
			affectedParties: '',
			responsiblePerson: allUsers[0]?.name || '',
			nextSteps: '',
			processingResult: '',
			status: 'processing'
		};
	}

	function selectFeedback(id: string) {
		selectedFeedbackId = id;
		resetProcessingForm();
	}

	async function handleProcess() {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}
		if (!selectedFeedbackId) {
			toast.warning('请选择一条反馈');
			return;
		}
		if (!processingData.affectedParties.trim()) {
			toast.warning('请填写影响对象');
			return;
		}
		if (!processingData.responsiblePerson.trim()) {
			toast.warning('请填写责任人');
			return;
		}
		if (!processingData.nextSteps.trim()) {
			toast.warning('请填写下一步安排');
			return;
		}

		processing = true;
		try {
			const success = await mockProcessFeedback(
				selectedFeedbackId,
				$auth.user!.id,
				processingData
			);
			if (success) {
				toast.success('处理记录已保存');
				await loadFeedbacks();
				resetProcessingForm();
			} else {
				toast.error('处理失败');
			}
		} finally {
			processing = false;
		}
	}

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

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'badge-warning';
			case 'processing':
				return 'badge-info';
			case 'resolved':
			case 'closed':
				return 'badge-success';
			default:
				return 'badge-warning';
		}
	}

	function feedbackTypeText(type: string): string {
		const map: Record<string, string> = {
			general: '一般反馈',
			suggestion: '建议',
			complaint: '投诉',
			praise: '表扬',
			bug: '问题反馈'
		};
		return map[type] || type;
	}

	onMount(() => {
		loadFeedbacks();
	});
</script>

<div class="h-full flex flex-col gap-4">
	<div class="grid grid-cols-3 gap-4">
		<div class="card p-4 flex items-center gap-4">
			<div class="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
				<Clock class="w-6 h-6 text-warning" />
			</div>
			<div>
				<p class="text-sm text-text-muted">待处理</p>
				<p class="text-2xl font-bold text-text-primary">{stats.pending}</p>
			</div>
		</div>
		<div class="card p-4 flex items-center gap-4">
			<div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
				<MessageSquare class="w-6 h-6 text-accent" />
			</div>
			<div>
				<p class="text-sm text-text-muted">处理中</p>
				<p class="text-2xl font-bold text-text-primary">{stats.processing}</p>
			</div>
		</div>
		<div class="card p-4 flex items-center gap-4">
			<div class="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
				<CheckCircle class="w-6 h-6 text-success" />
			</div>
			<div>
				<p class="text-sm text-text-muted">已解决</p>
				<p class="text-2xl font-bold text-text-primary">{stats.resolved}</p>
			</div>
		</div>
	</div>

	<div class="flex gap-4 flex-1 min-h-0">
		<div class="w-80 card overflow-hidden flex flex-col flex-shrink-0">
			<div class="p-4 border-b border-border-light">
				<div class="flex gap-2 mb-3 flex-wrap">
					{#each [
						{ value: 'all', label: '全部' },
						{ value: 'pending', label: '待处理' },
						{ value: 'processing', label: '处理中' },
						{ value: 'resolved', label: '已解决' },
						{ value: 'closed', label: '已关闭' }
					] as { value: string; label: string }[]}
						<button
							on:click={() => (statusFilter = value)}
							class="px-3 py-1.5 text-xs rounded-full transition-all {
								statusFilter === value
									? 'bg-primary text-white'
									: 'bg-surface-alt text-text-secondary hover:bg-border-light'
							}"
						>
							{value.label}
						</button>
					{/each}
				</div>
				<input type="text" class="input text-sm py-2" placeholder="搜索反馈..." />
			</div>
			<div class="flex-1 overflow-y-auto">
				{#if loading}
					<div class="p-4 space-y-3">
						{#each Array(5) as _}
							<div class="animate-pulse">
								<div class="h-4 bg-surface-alt rounded w-3/4 mb-2" />
								<div class="h-3 bg-surface-alt rounded w-1/2" />
							</div>
						{/each}
					</div>
				{:else if filteredFeedbacks.length === 0}
					<div class="p-8 text-center text-text-muted text-sm">暂无反馈</div>
				{:else}
					{#each filteredFeedbacks as fb}
						<button
							data-feedback-id={fb.id}
							on:click={() => selectFeedback(fb.id)}
							class="w-full text-left p-4 border-b border-border-light hover:bg-surface-alt/50 transition-all {
								selectedFeedbackId === fb.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
							} {highlightedId === fb.id ? 'ring-2 ring-primary ring-inset bg-primary/10' : ''}"
						>
							<div class="flex items-start justify-between gap-2 mb-2">
								<h4 class="text-sm font-medium text-text-primary line-clamp-1">
									{fb.projectName}
								</h4>
								<span class={`badge ${urgencyBadgeClass(fb.urgency)} flex-shrink-0`}>
									{urgencyToText(fb.urgency)}
								</span>
							</div>
							<p class="text-sm text-text-secondary line-clamp-2 mb-2">{fb.content}</p>
							<div class="flex items-center justify-between text-xs text-text-muted">
								<span class="flex items-center gap-1">
									<User class="w-3 h-3" />
									{fb.userName}
								</span>
								<span class={`badge ${statusBadgeClass(fb.status)}`}>
									{statusToText(fb.status)}
								</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		{#if !selectedFeedback}
			<div class="flex-1 card flex items-center justify-center">
				<div class="text-center">
					<MessageSquare class="w-16 h-16 text-text-muted mx-auto mb-4" />
					<p class="text-text-muted">请选择一条反馈进行处理</p>
				</div>
			</div>
		{:else}
			<div class="flex-1 flex flex-col min-h-0 gap-4">
				<div class="card p-5 flex-shrink-0">
					<div class="flex items-start justify-between gap-4 mb-4">
						<div>
							<div class="flex items-center gap-2 mb-2">
								<h2 class="font-display text-xl font-bold text-text-primary">
									{selectedFeedback.projectName}
								</h2>
								<span class={`badge ${urgencyBadgeClass(selectedFeedback.urgency)}`}>
									{urgencyToText(selectedFeedback.urgency)}
								</span>
								<span class={`badge ${statusBadgeClass(selectedFeedback.status)}`}>
									{statusToText(selectedFeedback.status)}
								</span>
								<span class="badge bg-secondary/10 text-secondary">
									{feedbackTypeText(selectedFeedback.type)}
								</span>
							</div>
							<div class="flex flex-wrap gap-4 text-sm text-text-muted">
								<span class="flex items-center gap-1">
									<User class="w-4 h-4" />
									{selectedFeedback.userName}
								</span>
								<span class="flex items-center gap-1">
									<Calendar class="w-4 h-4" />
									{formatDateTime(selectedFeedback.createdAt)}
								</span>
							</div>
						</div>
					</div>
					<div class="bg-surface-alt rounded-xl p-4">
						<p class="text-text-primary whitespace-pre-wrap">{selectedFeedback.content}</p>
					</div>
				</div>

				<div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
					<div class="card overflow-hidden flex flex-col">
						<div class="p-4 border-b border-border-light flex items-center gap-2">
							<Send class="w-5 h-5 text-primary" />
							<h3 class="font-semibold text-text-primary">处理表单</h3>
							<span class="text-danger text-xs">* 必填</span>
						</div>
						<div class="flex-1 overflow-y-auto p-4 space-y-4">
							<div>
								<label class="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
									<Users class="w-4 h-4 text-primary" />
									影响对象 <span class="text-danger">*</span>
								</label>
								<textarea
									bind:value={processingData.affectedParties}
									class="input min-h-[70px]"
									placeholder="请详细描述受影响的人员、部门或群体..."
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
									<User class="w-4 h-4 text-primary" />
									责任人 <span class="text-danger">*</span>
								</label>
								<select bind:value={processingData.responsiblePerson} class="input">
									{#each allUsers as user}
										<option value={user.name}>
											{user.name}（{roleToText(user.role)}）
										</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
									<Forward class="w-4 h-4 text-primary" />
									下一步安排 <span class="text-danger">*</span>
								</label>
								<textarea
									bind:value={processingData.nextSteps}
									class="input min-h-[90px]"
									placeholder="请列出具体的处理步骤和时间节点..."
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1">
									<FileText class="w-4 h-4 text-primary" />
									处理结果
								</label>
								<textarea
									bind:value={processingData.processingResult}
									class="input min-h-[70px]"
									placeholder="当前已完成的工作和结果..."
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-text-primary mb-1.5">处理状态</label>
								<select bind:value={processingData.status} class="input">
									<option value="processing">处理中</option>
									<option value="resolved">已解决</option>
									<option value="closed">已关闭</option>
								</select>
							</div>
						</div>
						<div class="p-4 border-t border-border-light">
							<button
								on:click={handleProcess}
								disabled={processing}
								class="w-full btn btn-primary disabled:opacity-50"
							>
								{#if processing}
									<Loader2 class="w-5 h-5 animate-spin" />
									保存中...
								{:else}
									<Check class="w-5 h-5" />
									提交处理记录
								{/if}
							</button>
						</div>
					</div>

					<div class="card overflow-hidden flex flex-col">
						<div class="p-4 border-b border-border-light flex items-center gap-2">
							<Target class="w-5 h-5 text-secondary" />
							<h3 class="font-semibold text-text-primary">历史处理记录</h3>
						</div>
						<div class="flex-1 overflow-y-auto p-4">
							{#if selectedFeedback.processings.length === 0}
								<div class="h-full flex items-center justify-center text-center text-text-muted">
									<div>
										<MessageSquare class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p class="text-sm">暂无处理记录</p>
									</div>
								</div>
							{:else}
								<div class="relative pl-6 space-y-6">
									<div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-light" />
									{#each selectedFeedback.processings as proc, i}
										<div class="relative">
											<div
												class="absolute -left-[26px] top-1 w-4 h-4 rounded-full border-2 border-white {
													i === selectedFeedback.processings.length - 1
														? 'bg-primary ring-4 ring-primary/20'
														: 'bg-secondary'
												}"
											/>
											<div class="card p-4">
												<div class="flex items-center justify-between mb-3">
													<div class="flex items-center gap-2">
														<span
															class={`badge ${
																proc.status === 'completed' || proc.status === 'resolved'
																	? 'badge-success'
																	: 'badge-info'
															}`}
														>
															{proc.status === 'completed' ? '已完成' : statusToText(proc.status)}
														</span>
														<span class="text-xs text-text-muted flex items-center gap-1">
															<User class="w-3 h-3" />
															{(proc as FeedbackProcessingWithDetails).processorName || '未知'}
														</span>
													</div>
													<span class="text-xs text-text-muted">{formatDateTime(proc.processedAt)}</span>
												</div>
												<div class="space-y-2 text-sm">
													<div class="flex items-start gap-2">
														<Users class="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
														<div>
															<span class="text-text-muted">影响对象：</span>
															<span class="text-text-primary">{proc.affectedParties}</span>
														</div>
													</div>
													<div class="flex items-start gap-2">
														<User class="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
														<div>
															<span class="text-text-muted">责任人：</span>
															<span class="text-text-primary">{proc.responsiblePerson}</span>
														</div>
													</div>
													<div class="flex items-start gap-2">
														<Forward class="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
														<div>
															<span class="text-text-muted">下一步：</span>
															<span class="text-text-primary whitespace-pre-wrap">{proc.nextSteps}</span>
														</div>
													</div>
													{#if proc.processingResult}
														<div class="flex items-start gap-2">
															<FileText class="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
															<div>
																<span class="text-text-muted">结果：</span>
																<span class="text-text-primary whitespace-pre-wrap">{proc.processingResult}</span>
															</div>
														</div>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
