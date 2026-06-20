<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import { emailsStore, trainersStore, riskSamplesStore } from '$lib/stores';
	import type { Email } from '$lib/types';

	let searchQuery = $state('');
	let filterStatus = $state<string>('all');
	let filterRisk = $state<string>('all');
	let filterTrainer = $state<string>('all');
	let reviewOnly = $state(false);

	const filteredEmails = $derived.by(() => {
		let list = $emailsStore;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(e) => e.subject.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || (e.recipient || '').toLowerCase().includes(q)
			);
		}
		if (filterStatus !== 'all') list = list.filter((e) => e.status === filterStatus);
		if (filterRisk !== 'all') list = list.filter((e) => e.riskLevel === filterRisk);
		if (filterTrainer !== 'all') list = list.filter((e) => String(e.trainerId) === filterTrainer);
		if (reviewOnly) list = list.filter((e) => e.needsReview && !e.reviewed);
		return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	});

	const stats = $derived.by(() => {
		const emails = $emailsStore;
		const risks = $riskSamplesStore;
		return {
			total: emails.length,
			pending: emails.filter((e) => e.status === 'pending').length,
			highRisk: emails.filter((e) => e.riskLevel === 'high' || e.riskLevel === 'critical').length,
			needsReview: emails.filter((e) => e.needsReview && !e.reviewed).length,
			unresolvedRisks: risks.filter((r) => !r.resolved).length
		};
	});

	const getTrainerName = (id?: number) => {
		if (!id) return '未分配';
		return $trainersStore.find((t) => t.id === id)?.name || '未分配';
	};

	const formatDate = (iso: string) => {
		const d = new Date(iso);
		return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	};

	const getRiskCount = (emailId: number) => {
		return $riskSamplesStore.filter((r) => r.emailId === emailId && !r.resolved).length;
	};

	const exportCSV = () => {
		const rows = [
			['ID', '主题', '收件人', '状态', '风险等级', '培训负责人', '创建时间', '更新时间']
		];
		for (const e of filteredEmails) {
			rows.push([
				String(e.id),
				e.subject,
				e.recipient || '',
				e.status,
				e.riskLevel,
				getTrainerName(e.trainerId),
				e.createdAt,
				e.updatedAt
			]);
		}
		const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `emails_${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
</script>

<PageHeader
	title="邮件列表"
	subtitle="管理和质检所有销售邮件草稿与发送记录"
>
	{#snippet actions()}
		<button class="btn-secondary" onclick={exportCSV}>
			<span>📥</span> 导出 CSV
		</button>
		<a href="/emails/new" class="btn-primary">
			<span>✏️</span> 新建邮件
		</a>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
	<div class="card p-4">
		<p class="text-sm text-slate-500">邮件总数</p>
		<p class="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
	</div>
	<div class="card p-4">
		<p class="text-sm text-slate-500">待复核</p>
		<p class="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
	</div>
	<div class="card p-4">
		<p class="text-sm text-slate-500">高风险</p>
		<p class="mt-1 text-2xl font-bold text-rose-600">{stats.highRisk}</p>
	</div>
	<div class="card p-4">
		<p class="text-sm text-slate-500">需人工复核</p>
		<p class="mt-1 text-2xl font-bold text-orange-600">{stats.needsReview}</p>
	</div>
	<div class="card p-4">
		<p class="text-sm text-slate-500">未处理风险</p>
		<p class="mt-1 text-2xl font-bold text-red-600">{stats.unresolvedRisks}</p>
	</div>
</div>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-5 gap-3">
		<div class="md:col-span-2">
			<input
				class="input"
				placeholder="🔍 搜索主题、内容、收件人..."
				bind:value={searchQuery}
			/>
		</div>
		<select class="select" bind:value={filterStatus}>
			<option value="all">全部状态</option>
			<option value="draft">草稿</option>
			<option value="pending">待复核</option>
			<option value="reviewed">已复核</option>
			<option value="sent">已发送</option>
		</select>
		<select class="select" bind:value={filterRisk}>
			<option value="all">全部风险等级</option>
			<option value="low">低风险</option>
			<option value="medium">中风险</option>
			<option value="high">高风险</option>
			<option value="critical">严重</option>
		</select>
		<select class="select" bind:value={filterTrainer}>
			<option value="all">全部负责人</option>
			{#each $trainersStore as t}
				<option value={t.id}>{t.name} ({t.team || ''})</option>
			{/each}
		</select>
	</div>
	<div class="mt-3 flex items-center">
		<label class="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
			<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" bind:checked={reviewOnly} />
			仅显示待人工复核
		</label>
	</div>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>主题</th>
					<th>收件人</th>
					<th>负责人</th>
					<th>状态</th>
					<th>风险</th>
					<th>未处理风险</th>
					<th>更新时间</th>
					<th class="text-right">操作</th>
				</tr>
			</thead>
			<tbody>
				{#if filteredEmails.length === 0}
					<tr>
						<td colspan="8" class="py-12 text-center text-slate-400">暂无邮件数据</td>
					</tr>
				{/if}
				{#each filteredEmails as email}
					{@const rc = getRiskCount(email.id)}
					<tr class="cursor-pointer" onclick={() => (window.location.href = `/emails/${email.id}`)}>
						<td>
							<div class="font-medium text-slate-900 max-w-xs truncate">{email.subject}</div>
							<div class="text-xs text-slate-400 mt-0.5 max-w-xs truncate">#{email.id} · {email.sender || '未指定发件人'}</div>
						</td>
						<td class="text-slate-600">{email.recipient || '-'}</td>
						<td class="text-slate-600">{getTrainerName(email.trainerId)}</td>
						<td><StatusBadge status={email.status} /></td>
						<td><RiskBadge level={email.riskLevel} /></td>
						<td>
							{#if rc > 0}
								<span class="chip bg-rose-100 text-rose-700">{rc} 条</span>
							{:else}
								<span class="chip bg-emerald-100 text-emerald-700">0 条</span>
							{/if}
						</td>
						<td class="text-slate-500 text-xs">{formatDate(email.updatedAt)}</td>
						<td class="text-right">
							<div class="inline-flex gap-1">
								<a href="/emails/{email.id}" class="btn-ghost !px-2 !py-1 text-xs" onclick={(e) => e.stopPropagation()}>查看</a>
								<a href="/emails/{email.id}/edit" class="btn-ghost !px-2 !py-1 text-xs" onclick={(e) => e.stopPropagation()}>编辑</a>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
