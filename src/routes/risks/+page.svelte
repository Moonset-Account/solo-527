<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import { riskSamplesStore, emailsStore, genId } from '$lib/stores';

	let filterSeverity = $state('all');
	let filterType = $state('all');
	let onlyUnresolved = $state(true);
	let showAdd = $state(false);

	let newRisk = $state({
		emailId: '' as string,
		riskType: '',
		description: '',
		severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
		location: ''
	});

	const list = $derived.by(() => {
		let arr = $riskSamplesStore.map((r) => ({
			...r,
			email: $emailsStore.find((e) => e.id === r.emailId)
		}));
		if (filterSeverity !== 'all') arr = arr.filter((r) => r.severity === filterSeverity);
		if (filterType !== 'all') arr = arr.filter((r) => r.riskType === filterType);
		if (onlyUnresolved) arr = arr.filter((r) => !r.resolved);
		return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	const types = $derived(Array.from(new Set($riskSamplesStore.map((r) => r.riskType))));

	const stats = $derived.by(() => {
		const all = $riskSamplesStore;
		return {
			total: all.length,
			unresolved: all.filter((r) => !r.resolved).length,
			critical: all.filter((r) => !r.resolved && r.severity === 'critical').length,
			high: all.filter((r) => !r.resolved && r.severity === 'high').length
		};
	});

	const toggleResolve = (id: number) => {
		riskSamplesStore.update((arr) =>
			arr.map((r) =>
				r.id === id
					? { ...r, resolved: !r.resolved, resolvedAt: !r.resolved ? new Date().toISOString() : undefined }
					: r
			)
		);
	};

	const submitNew = () => {
		if (!newRisk.emailId || !newRisk.riskType || !newRisk.description) return;
		riskSamplesStore.update((arr) => [
			...arr,
			{
				id: genId(),
				emailId: Number(newRisk.emailId),
				riskType: newRisk.riskType,
				description: newRisk.description,
				severity: newRisk.severity,
				location: newRisk.location || undefined,
				markedBy: '管理员',
				resolved: false,
				createdAt: new Date().toISOString()
			}
		]);
		newRisk = { emailId: '', riskType: '', description: '', severity: 'medium', location: '' };
		showAdd = false;
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<PageHeader title="风险样本" subtitle="所有被标记的邮件合规风险样本">
	{#snippet actions()}
		<button class="btn-secondary" onclick={() => {
			const rows = [['ID', '邮件', '风险类型', '严重程度', '描述', '标记人', '状态', '创建时间']];
			for (const r of list) {
				rows.push([String(r.id), r.email?.subject || '', r.riskType, r.severity, r.description, r.markedBy || '', r.resolved ? '已解决' : '未解决', r.createdAt]);
			}
			const csv = '\uFEFF' + rows.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
			const a = document.createElement('a');
			a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
			a.download = `risks_${Date.now()}.csv`;
			a.click();
		}}>
			<span>📥</span> 导出
		</button>
		<button class="btn-primary" onclick={() => (showAdd = true)}><span>➕</span> 新增风险</button>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
	<div class="card p-4"><p class="text-xs text-slate-500">总样本</p><p class="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">未解决</p><p class="text-2xl font-bold text-amber-600 mt-1">{stats.unresolved}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">高风险</p><p class="text-2xl font-bold text-orange-600 mt-1">{stats.high}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">严重</p><p class="text-2xl font-bold text-rose-600 mt-1">{stats.critical}</p></div>
</div>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<select class="select" bind:value={filterSeverity}>
			<option value="all">全部严重程度</option>
			<option value="low">低</option>
			<option value="medium">中</option>
			<option value="high">高</option>
			<option value="critical">严重</option>
		</select>
		<select class="select" bind:value={filterType}>
			<option value="all">全部风险类型</option>
			{#each types as t}
				<option value={t}>{t}</option>
			{/each}
		</select>
		<label class="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer self-center">
			<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600" bind:checked={onlyUnresolved} />
			仅显示未解决
		</label>
	</div>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>邮件</th>
					<th>风险类型</th>
					<th>严重程度</th>
					<th>描述</th>
					<th>标记人</th>
					<th>状态</th>
					<th>时间</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				{#if list.length === 0}
					<tr><td colspan="8" class="py-12 text-center text-slate-400">暂无风险样本</td></tr>
				{/if}
				{#each list as r}
					<tr class={r.resolved ? 'opacity-60' : ''}>
						<td>
							<a href={`/emails/${r.emailId}`} class="text-indigo-600 hover:underline font-medium text-slate-900 max-w-xs truncate block">
								{r.email?.subject || `#${r.emailId}`}
							</a>
							{#if r.location}<p class="text-xs text-slate-400">📍 {r.location}</p>{/if}
						</td>
						<td><span class="chip bg-slate-100 text-slate-700">{r.riskType}</span></td>
						<td><RiskBadge level={r.severity} /></td>
						<td class="max-w-md">
							<p class="text-sm text-slate-700 truncate">{r.description}</p>
						</td>
						<td class="text-slate-600 text-sm">{r.markedBy || '-'}</td>
						<td>
							{r.resolved
								? `<span class="chip bg-emerald-100 text-emerald-700">已解决</span>`
								: `<span class="chip bg-amber-100 text-amber-700">未解决</span>`}
						</td>
						<td class="text-slate-500 text-xs">{formatDate(r.createdAt)}</td>
						<td>
							<button class="btn-ghost !py-1 !px-2 text-xs" onclick={() => toggleResolve(r.id)}>
								{r.resolved ? '撤销解决' : '标记解决'}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showAdd}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={() => (showAdd = false)}>
		<div class="card p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-900 mb-4">新增风险样本</h3>
			<div class="space-y-3">
				<div>
					<label class="label">关联邮件</label>
					<select class="select" bind:value={newRisk.emailId}>
						<option value="">选择邮件</option>
						{#each $emailsStore as e}
							<option value={e.id}>#{e.id} {e.subject}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">风险类型</label>
					<input class="input" bind:value={newRisk.riskType} placeholder="如：绝对化用语" />
				</div>
				<div>
					<label class="label">描述</label>
					<textarea class="textarea" bind:value={newRisk.description}></textarea>
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
				<button class="btn-secondary" onclick={() => (showAdd = false)}>取消</button>
				<button class="btn-primary" onclick={submitNew}>确认添加</button>
			</div>
		</div>
	</div>
{/if}
