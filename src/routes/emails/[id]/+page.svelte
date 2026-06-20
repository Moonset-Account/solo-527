<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import {
		emailsStore,
		emailVersionsStore,
		riskSamplesStore,
		reviewsStore,
		knowledgeStore,
		forbiddenWordsStore,
		missingReasonsStore,
		hitRatesStore,
		trainersStore,
		referenceSourcesStore,
		scanEmailForRisks,
		genId
	} from '$lib/stores';

	let { params } = $props();

	const emailId = Number(params.id);

	let activeTab = $state<'content' | 'versions' | 'risks' | 'reviews' | 'hits'>('content');
	let showAddRisk = $state(false);
	let showAssignReview = $state(false);

	const email = $derived($emailsStore.find((e) => e.id === emailId));
	const versions = $derived($emailVersionsStore.filter((v) => v.emailId === emailId).sort((a, b) => b.version - a.version));
	const risks = $derived($riskSamplesStore.filter((r) => r.emailId === emailId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
	const reviews = $derived($reviewsStore.filter((r) => r.emailId === emailId).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()));
	const hits = $derived($hitRatesStore.filter((h) => h.emailId === emailId));

	const getTrainerName = (id?: number) => id ? $trainersStore.find((t) => t.id === id)?.name || '未分配' : '未分配';
	const getRefTitle = (id?: number) => id ? $referenceSourcesStore.find((r) => r.id === id)?.title : '';

	let newRisk = $state({ riskType: '', description: '', severity: 'medium' as const, location: '' });
	let newReview = $state({ reviewer: '', comment: '', dueDate: '' });

	const saveVersion = () => {
		if (!email) return;
		const nextVer = versions.length > 0 ? versions[0].version + 1 : 1;
		emailVersionsStore.update((arr) => [
			...arr,
			{
				id: genId(),
				emailId,
				version: nextVer,
				subject: email.subject,
				content: email.content,
				changeNote: '手动保存版本',
				createdBy: '管理员',
				createdAt: new Date().toISOString()
			}
		]);
		alert(`已保存版本 v${nextVer}`);
	};

	const addRisk = () => {
		if (!newRisk.riskType || !newRisk.description) return;
		riskSamplesStore.update((arr) => [
			...arr,
			{
				id: genId(),
				emailId,
				riskType: newRisk.riskType,
				description: newRisk.description,
				severity: newRisk.severity,
				location: newRisk.location,
				markedBy: '管理员',
				resolved: false,
				createdAt: new Date().toISOString()
			}
		]);
		newRisk = { riskType: '', description: '', severity: 'medium', location: '' };
		showAddRisk = false;
	};

	const resolveRisk = (riskId: number) => {
		riskSamplesStore.update((arr) =>
			arr.map((r) => (r.id === riskId ? { ...r, resolved: true, resolvedAt: new Date().toISOString() } : r))
		);
	};

	const assignReview = () => {
		if (!newReview.reviewer) return;
		reviewsStore.update((arr) => [
			...arr,
			{
				id: genId(),
				emailId,
				reviewer: newReview.reviewer,
				comment: newReview.comment,
				verdict: 'pending',
				assignedAt: new Date().toISOString(),
				dueDate: newReview.dueDate || undefined
			}
		]);
		emailsStore.update((arr) =>
			arr.map((e) => (e.id === emailId ? { ...e, needsReview: true, status: 'pending' } : e))
		);
		newReview = { reviewer: '', comment: '', dueDate: '' };
		showAssignReview = false;
	};

	const resolveReview = (reviewId: number, verdict: 'approved' | 'rejected' | 'needs_revision') => {
		reviewsStore.update((arr) =>
			arr.map((r) => (r.id === reviewId ? { ...r, verdict, completedAt: new Date().toISOString() } : r))
		);
		emailsStore.update((arr) =>
			arr.map((e) => (e.id === emailId ? { ...e, reviewed: true, reviewedAt: new Date().toISOString(), reviewedBy: '管理员', status: verdict === 'approved' ? 'reviewed' : 'pending' } : e))
		);
	};

	const autoScan = () => {
		if (!email) return;
		const results = scanEmailForRisks(email.content, email.subject);
		let added = 0;
		for (const r of results) {
			const exists = risks.some((x) => x.matchText === undefined && x.description.includes(r.word.word));
			if (!exists) {
				riskSamplesStore.update((arr) => [
					...arr,
					{
						id: genId(),
						emailId,
						riskType: r.word.category || '禁用词命中',
						description: `检测到禁用词：${r.word.word}。${r.word.description || ''}`,
						severity: r.word.severity,
						markedBy: '系统自动',
						resolved: false,
						createdAt: new Date().toISOString()
					}
				]);
				added++;
			}
		}
		alert(added > 0 ? `扫描完成，新增 ${added} 条风险标记` : '扫描完成，未发现新风险');
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

	const tabs = [
		{ key: 'content', label: '邮件内容', icon: '📄' },
		{ key: 'versions', label: `版本记录 (${versions.length})`, icon: '📑' },
		{ key: 'risks', label: `风险标记 (${risks.length})`, icon: '⚠️' },
		{ key: 'reviews', label: `复核任务 (${reviews.length})`, icon: '🔍' },
		{ key: 'hits', label: `命中记录 (${hits.length})`, icon: '🎯' }
	] as const;

	const reviewVerdictLabel: Record<string, string> = {
		pending: '待处理',
		approved: '已通过',
		rejected: '已驳回',
		needs_revision: '需修改'
	};
	const reviewVerdictStyle: Record<string, string> = {
		pending: 'bg-amber-50 text-amber-700 border-amber-200',
		approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		rejected: 'bg-rose-50 text-rose-700 border-rose-200',
		needs_revision: 'bg-orange-50 text-orange-700 border-orange-200'
	};
</script>

{#if !email}
	<PageHeader title="邮件不存在" />
	<div class="card p-12 text-center text-slate-500">未找到该邮件，<a href="/" class="text-indigo-600 hover:underline">返回列表</a></div>
{:else}
	<PageHeader title={email.subject} subtitle={`邮件 ID: ${email.id} · 创建于 ${formatDate(email.createdAt)}`}>
		{#snippet actions()}
			<button class="btn-secondary" onclick={autoScan}>
				<span>🔍</span> 自动扫描风险
			</button>
			<button class="btn-secondary" onclick={saveVersion}>
				<span>💾</span> 保存版本
			</button>
			<a href={`/emails/${email.id}/edit`} class="btn-primary">
				<span>✏️</span> 编辑邮件
			</a>
		{/snippet}
	</PageHeader>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
		<div class="card p-3">
			<p class="text-xs text-slate-500">状态</p>
			<div class="mt-1"><StatusBadge status={email.status} /></div>
		</div>
		<div class="card p-3">
			<p class="text-xs text-slate-500">风险等级</p>
			<div class="mt-1"><RiskBadge level={email.riskLevel} /></div>
		</div>
		<div class="card p-3">
			<p class="text-xs text-slate-500">培训负责人</p>
			<p class="mt-1 text-sm font-medium text-slate-900">{getTrainerName(email.trainerId)}</p>
		</div>
		<div class="card p-3">
			<p class="text-xs text-slate-500">需人工复核</p>
			<p class="mt-1 text-sm font-medium">
				{email.needsReview
					? `<span class="text-rose-600">是${email.reviewed ? '（已完成）' : '（待处理）'}</span>`
					: `<span class="text-emerald-600">否</span>`}
			</p>
		</div>
	</div>

	<div class="card overflow-hidden">
		<div class="border-b border-slate-200 px-4">
			<nav class="flex gap-1 -mb-px overflow-x-auto">
				{#each tabs as tab}
					<button
						class="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 {activeTab === tab.key
							? 'border-indigo-600 text-indigo-600'
							: 'border-transparent text-slate-500 hover:text-slate-700'}"
						onclick={() => (activeTab = tab.key)}
					>
						<span class="mr-1.5">{tab.icon}</span>{tab.label}
					</button>
				{/each}
			</nav>
		</div>

		<div class="p-6">
			{#if activeTab === 'content'}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="md:col-span-2">
						<div class="mb-4 grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-slate-500 text-xs mb-1">发件人</p>
								<p class="text-slate-900">{email.sender || '-'}</p>
							</div>
							<div>
								<p class="text-slate-500 text-xs mb-1">收件人</p>
								<p class="text-slate-900">{email.recipient || '-'}</p>
							</div>
						</div>
						<div class="card !border-slate-200 p-5 bg-slate-50">
							<pre class="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{email.content}</pre>
						</div>
					</div>
					<div class="space-y-4">
						<div class="card p-4">
							<h3 class="font-semibold text-slate-900 mb-3">处理操作</h3>
							<button class="btn-primary w-full mb-2" onclick={() => (showAssignReview = true)}>
								<span>➕</span> 指派复核
							</button>
							<button class="btn-secondary w-full mb-2" onclick={() => (showAddRisk = true)}>
								<span>🏷️</span> 手动标记风险
							</button>
							<button
								class="btn-secondary w-full"
								onclick={() => {
									if (confirm('确认标记为已发送？')) {
										emailsStore.update((arr) => arr.map((e) => (e.id === emailId ? { ...e, status: 'sent', sentAt: new Date().toISOString() } : e)));
									}
								}}
							>
								<span>📤</span> 标记已发送
							</button>
						</div>
						<div class="card p-4">
							<h3 class="font-semibold text-slate-900 mb-3">关联信息</h3>
							<div class="text-sm space-y-2 text-slate-600">
								<p><span class="text-slate-400">UUID:</span> {email.uuid.slice(0, 13)}...</p>
								<p><span class="text-slate-400">创建:</span> {formatDate(email.createdAt)}</p>
								<p><span class="text-slate-400">更新:</span> {formatDate(email.updatedAt)}</p>
								{#if email.reviewedBy}
									<p><span class="text-slate-400">复核人:</span> {email.reviewedBy}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'versions'}
				{#if versions.length === 0}
					<p class="text-slate-400 text-center py-8">暂无版本记录</p>
				{:else}
					<ol class="relative border-l border-slate-200 ml-3 space-y-6">
						{#each versions as v}
							<li class="ml-6">
								<span class="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-500">
									<span class="text-[10px] font-bold text-indigo-700">{v.version}</span>
								</span>
								<div class="card p-4">
									<div class="flex items-start justify-between mb-2">
										<div>
											<h4 class="font-semibold text-slate-900">版本 v{v.version}</h4>
											<p class="text-xs text-slate-500 mt-0.5">
												{v.createdBy || '未知用户'} · {formatDate(v.createdAt)}
											</p>
										</div>
									</div>
									{#if v.changeNote}<p class="text-sm text-slate-600 mb-3 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">📝 {v.changeNote}</p>{/if}
									<p class="text-xs text-slate-500 mb-1">主题: {v.subject}</p>
									<pre class="text-xs text-slate-600 bg-slate-50 rounded p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{v.content}</pre>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			{/if}

			{#if activeTab === 'risks'}
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-slate-900">风险样本列表</h3>
					<button class="btn-secondary !py-1.5" onclick={() => (showAddRisk = true)}>
						<span>➕</span> 新增
					</button>
				</div>
				{#if risks.length === 0}
					<p class="text-slate-400 text-center py-8">暂无风险标记</p>
				{:else}
					<div class="space-y-3">
						{#each risks as r}
							<div class="card p-4 flex items-start gap-4 {r.resolved ? 'opacity-60' : ''}">
								<div class="flex-shrink-0 mt-0.5">
									<RiskBadge level={r.severity} />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-2">
										<h4 class="font-medium text-slate-900">
											{r.riskType}
											{#if r.resolved}
												<span class="chip bg-emerald-100 text-emerald-700 ml-2">已解决</span>
											{/if}
										</h4>
										<span class="text-xs text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</span>
									</div>
									<p class="text-sm text-slate-600 mt-1">{r.description}</p>
									<div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
										{#if r.location}<span>📍 {r.location}</span>{/if}
										{#if r.markedBy}<span>👤 {r.markedBy}</span>{/if}
									</div>
								</div>
								{#if !r.resolved}
									<button class="btn-secondary !py-1 !px-2 text-xs" onclick={() => resolveRisk(r.id)}>
										标记解决
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			{#if activeTab === 'reviews'}
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-slate-900">复核记录</h3>
					<button class="btn-secondary !py-1.5" onclick={() => (showAssignReview = true)}>
						<span>➕</span> 指派复核
					</button>
				</div>
				{#if reviews.length === 0}
					<p class="text-slate-400 text-center py-8">暂无复核记录</p>
				{:else}
					<div class="space-y-3">
						{#each reviews as rv}
							<div class="card p-4">
								<div class="flex items-start justify-between gap-2 mb-2">
									<div class="flex items-center gap-2">
										<div class="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
											{rv.reviewer.slice(0, 1)}
										</div>
										<div>
											<p class="font-medium text-sm text-slate-900">{rv.reviewer}</p>
											<p class="text-xs text-slate-500">指派于 {formatDate(rv.assignedAt)}</p>
										</div>
									</div>
									<span class="chip border {reviewVerdictStyle[rv.verdict]}">{reviewVerdictLabel[rv.verdict]}</span>
								</div>
								{#if rv.comment}
									<p class="text-sm text-slate-600 bg-slate-50 rounded p-2.5 mt-2">💬 {rv.comment}</p>
								{/if}
								<div class="flex items-center gap-2 mt-3 text-xs text-slate-500">
									{#if rv.dueDate}<span>📅 截止: {rv.dueDate}</span>{/if}
									{#if rv.completedAt}<span>✅ 完成: {formatDate(rv.completedAt)}</span>{/if}
								</div>
								{#if rv.verdict === 'pending'}
									<div class="flex gap-2 mt-3 pt-3 border-t border-slate-100">
										<button class="btn-primary !py-1 !px-3 text-xs" onclick={() => resolveReview(rv.id, 'approved')}>通过</button>
										<button class="btn-secondary !py-1 !px-3 text-xs" onclick={() => resolveReview(rv.id, 'needs_revision')}>需修改</button>
										<button class="btn-danger !py-1 !px-3 text-xs" onclick={() => resolveReview(rv.id, 'rejected')}>驳回</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			{#if activeTab === 'hits'}
				{#if hits.length === 0}
					<p class="text-slate-400 text-center py-8">暂无命中记录</p>
				{:else}
					<table class="table">
						<thead>
							<tr>
								<th>类型</th>
								<th>命中内容</th>
								<th>关联</th>
								<th>缺失原因</th>
								<th>日期</th>
								<th>次数</th>
							</tr>
						</thead>
						<tbody>
							{#each hits as h}
								<tr>
									<td>
										{#if h.hitType === 'knowledge'}
											<span class="chip bg-blue-100 text-blue-700">知识库</span>
										{:else if h.hitType === 'forbidden'}
											<span class="chip bg-rose-100 text-rose-700">禁用词</span>
										{:else}
											<span class="chip bg-orange-100 text-orange-700">缺失引用</span>
										{/if}
									</td>
									<td class="font-mono text-xs">{h.matchText || '-'}</td>
									<td class="text-sm">
										{#if h.knowledgeId}<span class="text-blue-600">📚 {$knowledgeStore.find((k) => k.id === h.knowledgeId)?.title || ''}</span>{/if}
										{#if h.forbiddenWordId}<span class="text-rose-600">🚫 {$forbiddenWordsStore.find((w) => w.id === h.forbiddenWordId)?.word || ''}</span>{/if}
									</td>
									<td class="text-sm">{h.missingReasonId ? $missingReasonsStore.find((r) => r.id === h.missingReasonId)?.name || '-' : '-'}</td>
									<td class="text-sm text-slate-500">{h.hitDate}</td>
									<td class="text-sm font-medium">{h.count}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			{/if}
		</div>
	</div>

	{#if showAddRisk}
		<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={() => (showAddRisk = false)}>
			<div class="card p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-semibold text-slate-900 mb-4">标记风险样本</h3>
				<div class="space-y-3">
					<div>
						<label class="label">风险类型</label>
						<input class="input" bind:value={newRisk.riskType} placeholder="如：绝对化用语、收益承诺..." />
					</div>
					<div>
						<label class="label">风险描述</label>
						<textarea class="textarea" bind:value={newRisk.description} placeholder="详细描述风险点..." />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="label">严重程度</label>
							<select class="select" bind:value={newRisk.severity}>
								<option value="low">低</option>
								<option value="medium">中</option>
								<option value="high">高</option>
								<option value="critical">严重</option>
							</select>
						</div>
						<div>
							<label class="label">位置</label>
							<input class="input" bind:value={newRisk.location} placeholder="如：正文第一段" />
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-5">
					<button class="btn-secondary" onclick={() => (showAddRisk = false)}>取消</button>
					<button class="btn-primary" onclick={addRisk}>确认添加</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showAssignReview}
		<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={() => (showAssignReview = false)}>
			<div class="card p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-semibold text-slate-900 mb-4">指派人工复核</h3>
				<div class="space-y-3">
					<div>
						<label class="label">复核人</label>
						<select class="select" bind:value={newReview.reviewer}>
							<option value="">请选择复核人</option>
							{#each $trainersStore as t}
								<option value={t.name}>{t.name} ({t.team || ''})</option>
							{/each}
							<option value="质检主管">质检主管</option>
						</select>
					</div>
					<div>
						<label class="label">截止日期</label>
						<input type="date" class="input" bind:value={newReview.dueDate} />
					</div>
					<div>
						<label class="label">复核意见（可选）</label>
						<textarea class="textarea" bind:value={newReview.comment} placeholder="填写复核说明..." />
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-5">
					<button class="btn-secondary" onclick={() => (showAssignReview = false)}>取消</button>
					<button class="btn-primary" onclick={assignReview}>确认指派</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
