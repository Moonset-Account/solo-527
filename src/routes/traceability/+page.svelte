<script lang="ts">
	let { data } = $props();

	let selectedRouteId = $state('');
	let selectedItineraryId = $state('');
	let activeTab = $state('reminders');
	let itineraries = $state<any[]>([]);
	let tabData: any = $state(null);
	let tabLoading = $state(false);
	let tabError = $state('');
	let itinerariesLoading = $state(false);

	let replyingReviewId = $state<string | null>(null);
	let replyText = $state('');
	let processingNote = $state('');
	let replyError = $state('');
	let replyLoading = $state(false);

	let showAssignmentForm = $state(false);
	let assignmentForm = $state({ driverName: '', vehiclePlate: '', changeReason: '' });
	let assignmentError = $state('');
	let assignmentLoading = $state(false);

	let showDisputeForm = $state(false);
	let disputeForm = $state({ category: 'assembly', content: '', evidence: '' });
	let disputeError = $state('');
	let disputeLoading = $state(false);

	const tabs = [
		{ key: 'reminders', label: '集合提醒' },
		{ key: 'reviews', label: '游客评价' },
		{ key: 'assignments', label: '司机车辆' },
		{ key: 'disputes', label: '争议备注' }
	];

	$effect(() => {
		if (selectedRouteId) {
			itinerariesLoading = true;
			itineraries = [];
			selectedItineraryId = '';
			fetch(`/api/routes/${selectedRouteId}/itineraries`)
				.then((r) => r.json())
				.then((d) => {
					itineraries = d.itineraries || [];
				})
				.catch((e) => {
					console.error('获取行程失败', e);
					itineraries = [];
				})
				.finally(() => {
					itinerariesLoading = false;
				});
		} else {
			itineraries = [];
			selectedItineraryId = '';
		}
	});

	$effect(() => {
		if (selectedItineraryId && activeTab) {
			loadTabData();
		} else {
			tabData = null;
		}
	});

	async function loadTabData() {
		if (!selectedItineraryId) return;
		tabLoading = true;
		tabError = '';
		tabData = null;
		try {
			let url = '';
			switch (activeTab) {
				case 'reminders':
					url = `/api/traceability/reminders/${selectedItineraryId}`;
					break;
				case 'reviews':
					url = `/api/traceability/reviews/${selectedItineraryId}`;
					break;
				case 'assignments':
					url = `/api/traceability/assignments/${selectedItineraryId}`;
					break;
				case 'disputes':
					url = `/api/traceability/disputes/${selectedItineraryId}`;
					break;
			}
			const res = await fetch(url);
			if (!res.ok) throw new Error('加载数据失败');
			const d = await res.json();
			switch (activeTab) {
				case 'reminders':
					tabData = d.reminders || [];
					break;
				case 'reviews':
					tabData = d.reviews || [];
					break;
				case 'assignments':
					tabData = d.assignments || [];
					break;
				case 'disputes':
					tabData = d.disputes || [];
					break;
			}
		} catch (e: any) {
			tabError = e.message || '加载数据失败';
		} finally {
			tabLoading = false;
		}
	}

	function formatTime(ts: string): string {
		if (!ts) return '-';
		return new Date(ts).toLocaleString('zh-CN', {
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function methodIcon(method: string): string {
		switch (method) {
			case 'sms': return '📱';
			case 'wechat': return '💬';
			case 'app_push': return '🔔';
			default: return '📱';
		}
	}

	function methodLabel(method: string): string {
		switch (method) {
			case 'sms': return 'SMS';
			case 'wechat': return '微信';
			case 'app_push': return 'App推送';
			default: return method;
		}
	}

	function statusConfig(status: string) {
		switch (status) {
			case 'sent': return { label: '已发送', cls: 'bg-blue-500/15 text-blue-600' };
			case 'delivered': return { label: '已送达', cls: 'bg-success/15 text-success' };
			case 'failed': return { label: '发送失败', cls: 'bg-danger/15 text-danger' };
			default: return { label: status, cls: 'bg-gray-400/15 text-gray-500' };
		}
	}

	function categoryLabel(cat: string): string {
		switch (cat) {
			case 'assembly': return '集合';
			case 'review': return '评价';
			case 'driver_vehicle': return '司机车辆';
			case 'other': return '其他';
			default: return cat;
		}
	}

	function categoryBadgeClass(cat: string): string {
		switch (cat) {
			case 'assembly': return 'bg-blue-500/15 text-blue-600';
			case 'review': return 'bg-accent/15 text-accent';
			case 'driver_vehicle': return 'bg-purple-500/15 text-purple-600';
			case 'other': return 'bg-gray-400/15 text-gray-500';
			default: return 'bg-gray-400/15 text-gray-500';
		}
	}

	function startReply(reviewId: string) {
		replyingReviewId = reviewId;
		replyText = '';
		processingNote = '';
		replyError = '';
	}

	function cancelReply() {
		replyingReviewId = null;
		replyText = '';
		processingNote = '';
		replyError = '';
	}

	async function submitReply(reviewId: string) {
		if (!replyText.trim()) {
			replyError = '回复内容不能为空';
			return;
		}
		replyLoading = true;
		replyError = '';
		try {
			const res = await fetch(`/api/traceability/reviews/${reviewId}/reply`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reply: replyText.trim(),
					processingNote: processingNote.trim(),
					operatorId: 'admin',
					operatorName: '管理员'
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '回复失败');
			}
			cancelReply();
			await loadTabData();
		} catch (e: any) {
			replyError = e.message || '回复失败';
		} finally {
			replyLoading = false;
		}
	}

	async function submitAssignment() {
		if (!assignmentForm.driverName.trim() || !assignmentForm.vehiclePlate.trim() || !assignmentForm.changeReason.trim()) {
			assignmentError = '所有字段均为必填';
			return;
		}
		assignmentLoading = true;
		assignmentError = '';
		try {
			const res = await fetch('/api/traceability/assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itineraryId: selectedItineraryId,
					driverName: assignmentForm.driverName.trim(),
					vehiclePlate: assignmentForm.vehiclePlate.trim(),
					assignedBy: 'admin',
					assignedByName: '管理员',
					changeReason: assignmentForm.changeReason.trim()
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '新增分配失败');
			}
			showAssignmentForm = false;
			assignmentForm = { driverName: '', vehiclePlate: '', changeReason: '' };
			await loadTabData();
		} catch (e: any) {
			assignmentError = e.message || '新增分配失败';
		} finally {
			assignmentLoading = false;
		}
	}

	async function submitDispute() {
		if (!disputeForm.content.trim() || !disputeForm.evidence.trim()) {
			disputeError = '内容和处理依据均为必填';
			return;
		}
		disputeLoading = true;
		disputeError = '';
		try {
			const res = await fetch('/api/traceability/disputes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itineraryId: selectedItineraryId,
					category: disputeForm.category,
					content: disputeForm.content.trim(),
					evidence: disputeForm.evidence.trim(),
					operatorId: 'admin',
					operatorName: '管理员'
				})
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '新增备注失败');
			}
			showDisputeForm = false;
			disputeForm = { category: 'assembly', content: '', evidence: '' };
			await loadTabData();
		} catch (e: any) {
			disputeError = e.message || '新增备注失败';
		} finally {
			disputeLoading = false;
		}
	}
</script>

<svelte:head>
	<title>追溯中心 - 导览协作</title>
</svelte:head>

<div class="flex flex-1 flex-col overflow-auto">
	<header class="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
		<h1 class="font-serif text-2xl font-bold text-text">追溯中心</h1>
	</header>

	<main class="flex-1 p-8">
		<div class="mb-6 flex flex-wrap gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
			<div class="flex-1 min-w-[200px]">
				<label class="mb-1.5 block text-xs font-medium text-text-muted">选择路线</label>
				<select
					bind:value={selectedRouteId}
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
				>
					<option value="">请选择路线</option>
					{#each data.routes as route}
						<option value={route.id}>{route.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex-1 min-w-[200px]">
				<label class="mb-1.5 block text-xs font-medium text-text-muted">选择行程</label>
				<select
					bind:value={selectedItineraryId}
					disabled={!selectedRouteId || itinerariesLoading}
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<option value="">{itinerariesLoading ? '加载中...' : '请选择行程'}</option>
					{#each itineraries as itin}
						<option value={itin.id}>V{itin.version} - {formatTime(itin.departureTime)}</option>
					{/each}
				</select>
			</div>
		</div>

		{#if selectedItineraryId}
			<div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
				<div class="flex border-b border-gray-200">
					{#each tabs as tab}
						<button
							type="button"
							onclick={() => { activeTab = tab.key; }}
							class="flex-1 px-6 py-3.5 text-sm font-medium transition-colors {activeTab === tab.key
								? 'text-primary border-b-2 border-primary bg-primary/5'
								: 'text-text-muted hover:text-text hover:bg-surface/50'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>

				<div class="p-6">
					{#if tabLoading}
						<div class="flex items-center justify-center py-16 text-text-muted">
							<svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"></circle>
								<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75"></path>
							</svg>
							加载中...
						</div>
					{:else if tabError}
						<div class="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
							{tabError}
						</div>
					{:else}
						{#if activeTab === 'reminders'}
							{#if tabData && tabData.length > 0}
								<div class="relative pl-8">
									<div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
									{#each tabData as reminder, i (reminder.id)}
										{@const sc = statusConfig(reminder.status)}
										<div class="relative mb-6 last:mb-0">
											<div class="absolute -left-5 top-1 h-4 w-4 rounded-full border-2 {reminder.status === 'failed' ? 'border-danger bg-danger/20' : reminder.status === 'delivered' ? 'border-success bg-success/20' : 'border-blue-500 bg-blue-500/20'}"></div>
											<div class="rounded-lg bg-surface p-4 ml-2">
												<div class="flex items-center justify-between mb-2">
													<div class="flex items-center gap-2">
														<span class="text-lg">{methodIcon(reminder.method)}</span>
														<span class="text-sm font-medium text-text">{methodLabel(reminder.method)}</span>
													</div>
													<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {sc.cls}">
														{sc.label}
													</span>
												</div>
												<div class="flex items-center gap-4 text-xs text-text-muted">
													<span>发送时间: {formatTime(reminder.sendTime)}</span>
													<span>接收人: {reminder.recipient}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-16 text-text-muted">
									<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 opacity-40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
									<p class="text-base">暂无集合提醒记录</p>
								</div>
							{/if}
						{:else if activeTab === 'reviews'}
							{#if tabData && tabData.length > 0}
								<div class="space-y-4">
									{#each tabData as review (review.id)}
										<div class="rounded-lg border border-gray-100 bg-white p-5">
											<div class="flex items-center justify-between mb-3">
												<span class="font-medium text-text">{review.touristName}</span>
												<div class="flex items-center gap-0.5">
													{#each Array(5) as _, i}
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={i < review.rating ? '#E8722A' : 'none'} stroke={i < review.rating ? '#E8722A' : '#CBD5E0'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
													{/each}
												</div>
											</div>
											<p class="text-sm text-text leading-relaxed mb-3">{review.content}</p>

											{#if review.reply}
												<div class="rounded-lg bg-primary/5 border border-primary/10 p-3 mb-3">
													<div class="text-xs font-medium text-primary mb-1">已回复</div>
													<p class="text-sm text-text">{review.reply}</p>
													{#if review.processingNote}
														<p class="text-xs text-text-muted mt-1">处理备注: {review.processingNote}</p>
													{/if}
												</div>
											{:else if replyingReviewId === review.id}
												<div class="rounded-lg border border-gray-200 p-4 space-y-3">
													{#if replyError}
														<div class="rounded bg-danger/10 px-3 py-2 text-xs text-danger">{replyError}</div>
													{/if}
													<div>
														<label class="mb-1 block text-xs font-medium text-text-muted">回复内容</label>
														<textarea
															bind:value={replyText}
															rows={2}
															class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
															placeholder="输入回复..."
														></textarea>
													</div>
													<div>
														<label class="mb-1 block text-xs font-medium text-text-muted">处理备注</label>
														<textarea
															bind:value={processingNote}
															rows={2}
															class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
															placeholder="输入处理备注..."
														></textarea>
													</div>
													<div class="flex gap-2 justify-end">
														<button
															type="button"
															onclick={cancelReply}
															class="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-text-muted hover:bg-surface transition-colors"
														>
															取消
														</button>
														<button
															type="button"
															onclick={() => submitReply(review.id)}
															disabled={replyLoading}
															class="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
														>
															{replyLoading ? '提交中...' : '提交回复'}
														</button>
													</div>
												</div>
											{:else}
												<button
													type="button"
													onclick={() => startReply(review.id)}
													class="text-xs font-medium text-primary hover:text-primary-light transition-colors"
												>
													回复
												</button>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-16 text-text-muted">
									<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 opacity-40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
									<p class="text-base">暂无游客评价</p>
								</div>
							{/if}
						{:else if activeTab === 'assignments'}
							<div class="mb-4 flex justify-end">
								<button
									type="button"
									onclick={() => { showAssignmentForm = true; assignmentError = ''; assignmentForm = { driverName: '', vehiclePlate: '', changeReason: '' }; }}
									class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
								>
									新增分配
								</button>
							</div>

							{#if showAssignmentForm}
								<div class="mb-4 rounded-lg border border-gray-200 bg-surface p-5 space-y-4">
									{#if assignmentError}
										<div class="rounded bg-danger/10 px-3 py-2 text-xs text-danger">{assignmentError}</div>
									{/if}
									<div class="grid grid-cols-2 gap-4">
										<div>
											<label class="mb-1 block text-xs font-medium text-text-muted">司机姓名</label>
											<input
												type="text"
												bind:value={assignmentForm.driverName}
												class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
												placeholder="输入司机姓名"
											/>
										</div>
										<div>
											<label class="mb-1 block text-xs font-medium text-text-muted">车牌号</label>
											<input
												type="text"
												bind:value={assignmentForm.vehiclePlate}
												class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
												placeholder="输入车牌号"
											/>
										</div>
									</div>
									<div>
										<label class="mb-1 block text-xs font-medium text-text-muted">变更原因</label>
										<textarea
											bind:value={assignmentForm.changeReason}
											rows={2}
											class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
											placeholder="输入变更原因..."
										></textarea>
									</div>
									<div class="flex gap-2 justify-end">
										<button
											type="button"
											onclick={() => showAssignmentForm = false}
											class="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-text-muted hover:bg-white transition-colors"
										>
											取消
										</button>
										<button
											type="button"
											onclick={submitAssignment}
											disabled={assignmentLoading}
											class="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
										>
											{assignmentLoading ? '提交中...' : '提交'}
										</button>
									</div>
								</div>
							{/if}

							{#if tabData && tabData.length > 0}
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="bg-surface text-text-muted text-xs">
												<th class="px-4 py-3 text-left font-medium">司机</th>
												<th class="px-4 py-3 text-left font-medium">车牌</th>
												<th class="px-4 py-3 text-left font-medium">分配人</th>
												<th class="px-4 py-3 text-left font-medium">分配时间</th>
												<th class="px-4 py-3 text-left font-medium">变更原因</th>
											</tr>
										</thead>
										<tbody>
											{#each tabData as assignment (assignment.id)}
												<tr class="border-t border-gray-50 hover:bg-surface/50 transition-colors">
													<td class="px-4 py-3 text-text font-medium">{assignment.driverName}</td>
													<td class="px-4 py-3 text-text font-mono">{assignment.vehiclePlate}</td>
													<td class="px-4 py-3 text-text-muted">{assignment.assignedByName}</td>
													<td class="px-4 py-3 text-text-muted whitespace-nowrap">{formatTime(assignment.createdAt)}</td>
													<td class="px-4 py-3 text-text-muted max-w-[200px] truncate" title={assignment.changeReason}>{assignment.changeReason || '-'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-16 text-text-muted">
									<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 opacity-40"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
									<p class="text-base">暂无司机车辆分配记录</p>
								</div>
							{/if}
						{:else if activeTab === 'disputes'}
							<div class="mb-4 flex justify-end">
								<button
									type="button"
									onclick={() => { showDisputeForm = true; disputeError = ''; disputeForm = { category: 'assembly', content: '', evidence: '' }; }}
									class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
								>
									新增备注
								</button>
							</div>

							{#if showDisputeForm}
								<div class="mb-4 rounded-lg border border-gray-200 bg-surface p-5 space-y-4">
									{#if disputeError}
										<div class="rounded bg-danger/10 px-3 py-2 text-xs text-danger">{disputeError}</div>
									{/if}
									<div>
										<label class="mb-1 block text-xs font-medium text-text-muted">类别</label>
										<select
											bind:value={disputeForm.category}
											class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
										>
											<option value="assembly">集合</option>
											<option value="review">评价</option>
											<option value="driver_vehicle">司机车辆</option>
											<option value="other">其他</option>
										</select>
									</div>
									<div>
										<label class="mb-1 block text-xs font-medium text-text-muted">内容</label>
										<textarea
											bind:value={disputeForm.content}
											rows={2}
											class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
											placeholder="输入争议内容..."
										></textarea>
									</div>
									<div>
										<label class="mb-1 block text-xs font-medium text-text-muted">处理依据 <span class="text-danger">*</span></label>
										<textarea
											bind:value={disputeForm.evidence}
											rows={2}
											class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
											placeholder="输入处理依据..."
										></textarea>
									</div>
									<div class="flex gap-2 justify-end">
										<button
											type="button"
											onclick={() => showDisputeForm = false}
											class="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-text-muted hover:bg-white transition-colors"
										>
											取消
										</button>
										<button
											type="button"
											onclick={submitDispute}
											disabled={disputeLoading}
											class="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
										>
											{disputeLoading ? '提交中...' : '提交'}
										</button>
									</div>
								</div>
							{/if}

							{#if tabData && tabData.length > 0}
								<div class="space-y-3">
									{#each tabData as dispute (dispute.id)}
										<div class="rounded-lg border border-gray-100 bg-white p-4">
											<div class="flex items-center justify-between mb-2">
												<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {categoryBadgeClass(dispute.category)}">
													{categoryLabel(dispute.category)}
												</span>
												<span class="text-xs text-text-muted">{formatTime(dispute.createdAt)}</span>
											</div>
											<p class="text-sm text-text mb-2">{dispute.content}</p>
											<div class="rounded bg-surface px-3 py-2 text-xs text-text-muted">
												<span class="font-medium">处理依据:</span> {dispute.evidence}
											</div>
											<div class="mt-2 text-xs text-text-muted">
												操作人: {dispute.operatorName || '-'}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-16 text-text-muted">
									<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-3 opacity-40"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									<p class="text-base">暂无争议备注</p>
								</div>
							{/if}
						{/if}
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-24 text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-30"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
				<p class="text-lg font-serif">请先选择路线和行程</p>
				<p class="mt-1 text-sm">选择后可查看追溯信息</p>
			</div>
		{/if}
	</main>
</div>
