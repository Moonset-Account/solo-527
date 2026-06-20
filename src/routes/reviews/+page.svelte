<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import { reviewsStore, emailsStore, trainersStore } from '$lib/stores';

	let filterVerdict = $state('all');
	let filterReviewer = $state('all');
	let onlyOverdue = $state(false);

	const today = new Date().toISOString().split('T')[0];

	const list = $derived.by(() => {
		let arr = $reviewsStore.map((r) => {
			const email = $emailsStore.find((e) => e.id === r.emailId);
			return { ...r, email };
		});
		if (filterVerdict !== 'all') arr = arr.filter((r) => r.verdict === filterVerdict);
		if (filterReviewer !== 'all') arr = arr.filter((r) => r.reviewer === filterReviewer);
		if (onlyOverdue) {
			arr = arr.filter((r) => r.verdict === 'pending' && r.dueDate && r.dueDate < today);
		}
		return arr.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
	});

	const stats = $derived.by(() => {
		const all = $reviewsStore;
		return {
			total: all.length,
			pending: all.filter((r) => r.verdict === 'pending').length,
			approved: all.filter((r) => r.verdict === 'approved').length,
			rejected: all.filter((r) => r.verdict === 'rejected').length,
			overdue: all.filter((r) => r.verdict === 'pending' && r.dueDate && r.dueDate < today).length
		};
	});

	const reviewers = $derived(Array.from(new Set($reviewsStore.map((r) => r.reviewer))));

	const resolve = (id: number, verdict: 'approved' | 'rejected' | 'needs_revision') => {
		reviewsStore.update((arr) =>
			arr.map((r) => (r.id === id ? { ...r, verdict, completedAt: new Date().toISOString() } : r))
		);
		const r = $reviewsStore.find((x) => x.id === id);
		if (r) {
			emailsStore.update((arr) =>
				arr.map((e) =>
					e.id === r.emailId
						? {
								...e,
								reviewed: true,
								reviewedAt: new Date().toISOString(),
								reviewedBy: '管理员',
								status: verdict === 'approved' ? 'reviewed' : 'pending'
							}
						: e
				)
			);
		}
	};

	const verdictLabel: Record<string, string> = {
		pending: '待处理',
		approved: '已通过',
		rejected: '已驳回',
		needs_revision: '需修改'
	};
	const verdictStyle: Record<string, string> = {
		pending: 'bg-amber-50 text-amber-700 border-amber-200',
		approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		rejected: 'bg-rose-50 text-rose-700 border-rose-200',
		needs_revision: 'bg-orange-50 text-orange-700 border-orange-200'
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<PageHeader title="复核任务" subtitle="管理所有需要人工复核的邮件任务">
	{#snippet actions()}
		<button class="btn-secondary" onclick={() => {
			const rows = [['ID', '邮件主题', '复核人', '结果', '指派时间', '截止日期', '备注']];
			for (const r of list) {
				rows.push([String(r.id), r.email?.subject || '', r.reviewer, verdictLabel[r.verdict], r.assignedAt, r.dueDate || '', r.comment || '']);
			}
			const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
			const a = document.createElement('a');
			a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
			a.download = `reviews_${Date.now()}.csv`;
			a.click();
		}}>
			<span>📥</span> 导出
		</button>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
	<div class="card p-4"><p class="text-xs text-slate-500">总任务</p><p class="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">待处理</p><p class="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">已通过</p><p class="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">已驳回</p><p class="text-2xl font-bold text-rose-600 mt-1">{stats.rejected}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">已逾期</p><p class="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p></div>
</div>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<select class="select" bind:value={filterVerdict}>
			<option value="all">全部结果</option>
			<option value="pending">待处理</option>
			<option value="approved">已通过</option>
			<option value="needs_revision">需修改</option>
			<option value="rejected">已驳回</option>
		</select>
		<select class="select" bind:value={filterReviewer}>
			<option value="all">全部复核人</option>
			{#each reviewers as rv}
				<option value={rv}>{rv}</option>
			{/each}
		</select>
		<label class="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer self-center">
			<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600" bind:checked={onlyOverdue} />
			仅显示已逾期
		</label>
	</div>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>邮件</th>
					<th>复核人</th>
					<th>结果</th>
					<th>截止</th>
					<th>指派时间</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				{#if list.length === 0}
					<tr><td colspan="6" class="py-12 text-center text-slate-400">暂无复核任务</td></tr>
				{/if}
				{#each list as r}
					<tr>
						<td>
							<a href={`/emails/${r.emailId}`} class="text-indigo-600 hover:underline font-medium text-slate-900">
								{r.email?.subject || `邮件 #${r.emailId}`}
							</a>
							<div class="flex items-center gap-2 mt-1">
								{#if r.email}<StatusBadge status={r.email.status} />{/if}
								{#if r.email}<RiskBadge level={r.email.riskLevel} />{/if}
							</div>
							{#if r.comment}<p class="text-xs text-slate-500 mt-1">💬 {r.comment}</p>{/if}
						</td>
						<td>
							<div class="flex items-center gap-2">
								<div class="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
									{r.reviewer.slice(0, 1)}
								</div>
								{r.reviewer}
							</div>
						</td>
						<td>
							<span class="chip border {verdictStyle[r.verdict]}">{verdictLabel[r.verdict]}</span>
						</td>
						<td>
							{#if r.dueDate}
								<span class={r.verdict === 'pending' && r.dueDate < today ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
									{r.dueDate}
									{r.verdict === 'pending' && r.dueDate < today && ' ⚠️'}
								</span>
							{:else}
								<span class="text-slate-400">-</span>
							{/if}
						</td>
						<td class="text-slate-500 text-xs">{formatDate(r.assignedAt)}</td>
						<td>
							{#if r.verdict === 'pending'}
								<div class="inline-flex gap-1">
									<button class="btn-primary !py-1 !px-2 text-xs" onclick={() => resolve(r.id, 'approved')}>通过</button>
									<button class="btn-secondary !py-1 !px-2 text-xs" onclick={() => resolve(r.id, 'needs_revision')}>修改</button>
									<button class="btn-danger !py-1 !px-2 text-xs" onclick={() => resolve(r.id, 'rejected')}>驳回</button>
								</div>
							{:else}
								<a href={`/emails/${r.emailId}`} class="btn-ghost !py-1 !px-2 text-xs">查看</a>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
