<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import {
		hitRatesStore,
		trainersStore,
		knowledgeStore,
		forbiddenWordsStore,
		missingReasonsStore,
		emailsStore,
		getHitRateSummary
	} from '$lib/stores';

	let filterTrainer = $state<string>('all');
	let filterHitType = $state<string>('all');
	let dateFrom = $state('');
	let dateTo = $state('');

	const filteredHits = $derived.by(() => {
		let list = $hitRatesStore;
		if (filterTrainer !== 'all') list = list.filter((h) => String(h.trainerId) === filterTrainer);
		if (filterHitType !== 'all') list = list.filter((h) => h.hitType === filterHitType);
		if (dateFrom) list = list.filter((h) => h.hitDate >= dateFrom);
		if (dateTo) list = list.filter((h) => h.hitDate <= dateTo);
		return list;
	});

	const summary = $derived.by(() => {
		const base = getHitRateSummary();
		const hits = filteredHits;
		const trainers = $trainersStore;
		const reasons = $missingReasonsStore;

		const byTrainerMap = new Map<number, number>();
		const byDateMap = new Map<string, number>();
		const byReasonMap = new Map<number, number>();
		const byTypeMap = new Map<string, number>();
		const byWordMap = new Map<string, number>();

		for (const h of hits) {
			if (h.trainerId) byTrainerMap.set(h.trainerId, (byTrainerMap.get(h.trainerId) || 0) + h.count);
			byDateMap.set(h.hitDate, (byDateMap.get(h.hitDate) || 0) + h.count);
			if (h.missingReasonId) byReasonMap.set(h.missingReasonId, (byReasonMap.get(h.missingReasonId) || 0) + h.count);
			byTypeMap.set(h.hitType, (byTypeMap.get(h.hitType) || 0) + h.count);
			if (h.matchText) byWordMap.set(h.matchText, (byWordMap.get(h.matchText) || 0) + h.count);
		}

		return {
			totalHits: hits.reduce((s, h) => s + h.count, 0),
			uniqueEmails: new Set(hits.map((h) => h.emailId)).size,
			byTrainer: Array.from(byTrainerMap.entries())
				.map(([id, c]) => ({ id, name: trainers.find((t) => t.id === id)?.name || '未分配', count: c }))
				.sort((a, b) => b.count - a.count),
			byDate: Array.from(byDateMap.entries())
				.map(([d, c]) => ({ date: d, count: c }))
				.sort((a, b) => a.date.localeCompare(b.date)),
			byMissingReason: Array.from(byReasonMap.entries())
				.map(([id, c]) => ({ id, name: reasons.find((r) => r.id === id)?.name || '未知', count: c }))
				.sort((a, b) => b.count - a.count),
			byHitType: Array.from(byTypeMap.entries())
				.map(([t, c]) => ({ type: t, count: c }))
				.sort((a, b) => b.count - a.count),
			byWord: Array.from(byWordMap.entries())
				.map(([w, c]) => ({ word: w, count: c }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10)
		};
	});

	const maxTrainer = $derived(summary.byTrainer[0]?.count || 1);
	const maxDate = $derived(summary.byDate.reduce((m, d) => Math.max(m, d.count), 0) || 1);
	const maxReason = $derived(summary.byMissingReason[0]?.count || 1);
	const maxType = $derived(summary.byHitType[0]?.count || 1);
	const maxWord = $derived(summary.byWord[0]?.count || 1);

	const hitTypeLabel: Record<string, string> = {
		knowledge: '知识库命中',
		forbidden: '禁用词命中',
		missing_reference: '引用缺失'
	};
	const hitTypeStyle: Record<string, string> = {
		knowledge: 'bg-blue-100 text-blue-700',
		forbidden: 'bg-rose-100 text-rose-700',
		missing_reference: 'bg-orange-100 text-orange-700'
	};

	const exportCSV = () => {
		const rows = [['ID', '邮件ID', '类型', '命中内容', '培训负责人', '缺失原因', '日期', '次数']];
		for (const h of filteredHits) {
			rows.push([
				String(h.id),
				String(h.emailId),
				hitTypeLabel[h.hitType] || h.hitType,
				h.matchText || '',
				$trainersStore.find((t) => t.id === h.trainerId)?.name || '',
				h.missingReasonId ? $missingReasonsStore.find((r) => r.id === h.missingReasonId)?.name || '' : '',
				h.hitDate,
				String(h.count)
			]);
		}
		const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
		a.download = `hitrates_${Date.now()}.csv`;
		a.click();
	};
</script>

<PageHeader title="命中率分析" subtitle="多维度分析禁用词命中、知识库命中和引用缺失情况">
	{#snippet actions()}
		<button class="btn-secondary" onclick={exportCSV}><span>📥</span> 导出明细</button>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
	<div class="card p-4"><p class="text-xs text-slate-500">总命中次数</p><p class="text-2xl font-bold text-slate-900 mt-1">{summary.totalHits}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">涉及邮件数</p><p class="text-2xl font-bold text-indigo-600 mt-1">{summary.uniqueEmails}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">禁用词命中</p><p class="text-2xl font-bold text-rose-600 mt-1">{summary.byHitType.find((x) => x.type === 'forbidden')?.count || 0}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">引用缺失</p><p class="text-2xl font-bold text-orange-600 mt-1">{summary.byHitType.find((x) => x.type === 'missing_reference')?.count || 0}</p></div>
</div>

<div class="card p-4 mb-6">
	<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
		<select class="select" bind:value={filterHitType}>
			<option value="all">全部命中类型</option>
			<option value="knowledge">知识库命中</option>
			<option value="forbidden">禁用词命中</option>
			<option value="missing_reference">引用缺失</option>
		</select>
		<select class="select" bind:value={filterTrainer}>
			<option value="all">全部培训负责人</option>
			{#each $trainersStore as t}
				<option value={t.id}>{t.name} ({t.team || ''})</option>
			{/each}
		</select>
		<input type="date" class="input" placeholder="开始日期" bind:value={dateFrom} />
		<input type="date" class="input" placeholder="结束日期" bind:value={dateTo} />
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
	<div class="card p-5">
		<h3 class="font-semibold text-slate-900 mb-4">按培训负责人分布</h3>
		{#if summary.byTrainer.length === 0}
			<p class="text-slate-400 text-center py-8">暂无数据</p>
		{:else}
			<div class="space-y-3">
				{#each summary.byTrainer as t}
					<div>
						<div class="flex items-center justify-between text-sm mb-1">
							<span class="font-medium text-slate-700">{t.name}</span>
							<span class="text-slate-500">{t.count} 次</span>
						</div>
						<div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
							<div
								class="h-full bg-indigo-500 rounded-full transition-all"
								style="width: {(t.count / maxTrainer) * 100}%"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="card p-5">
		<h3 class="font-semibold text-slate-900 mb-4">按命中类型分布</h3>
		{#if summary.byHitType.length === 0}
			<p class="text-slate-400 text-center py-8">暂无数据</p>
		{:else}
			<div class="space-y-3">
				{#each summary.byHitType as t}
					<div>
						<div class="flex items-center justify-between text-sm mb-1">
							<span class="chip {hitTypeStyle[t.type]}">{hitTypeLabel[t.type] || t.type}</span>
							<span class="text-slate-500 font-medium">{t.count} 次 ({((t.count / (summary.totalHits || 1)) * 100).toFixed(1)}%)</span>
						</div>
						<div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
							<div
								class={`h-full rounded-full transition-all ${
									t.type === 'forbidden' ? 'bg-rose-500' : t.type === 'missing_reference' ? 'bg-orange-500' : 'bg-blue-500'
								}`}
								style="width: {(t.count / maxType) * 100}%"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="card p-5">
		<h3 class="font-semibold text-slate-900 mb-4">按日期趋势</h3>
		{#if summary.byDate.length === 0}
			<p class="text-slate-400 text-center py-8">暂无数据</p>
		{:else}
			<div class="flex items-end gap-2 h-40">
				{#each summary.byDate as d}
					<div class="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
						<div
							class="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
							style="height: {(d.count / maxDate) * 100}%; min-height: 4px"
							title={`${d.date}: ${d.count}`}
						/>
						<span class="text-[10px] text-slate-500 truncate w-full text-center">{d.date.slice(5)}</span>
					</div>
				{/each}
			</div>
			<div class="mt-3 flex justify-between text-xs text-slate-500">
				<span>{summary.byDate[0]?.date}</span>
				<span>{summary.byDate[summary.byDate.length - 1]?.date}</span>
			</div>
		{/if}
	</div>

	<div class="card p-5">
		<h3 class="font-semibold text-slate-900 mb-4">引用缺失原因分布</h3>
		{#if summary.byMissingReason.length === 0}
			<p class="text-slate-400 text-center py-8">暂无引用缺失数据</p>
		{:else}
			<div class="space-y-3">
				{#each summary.byMissingReason as r}
					<div>
						<div class="flex items-center justify-between text-sm mb-1">
							<span class="font-medium text-slate-700">{r.name}</span>
							<span class="text-slate-500">{r.count} 次</span>
						</div>
						<div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
							<div
								class="h-full bg-orange-500 rounded-full transition-all"
								style="width: {(r.count / maxReason) * 100}%"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<div class="card p-5 mb-6">
	<h3 class="font-semibold text-slate-900 mb-4">TOP 10 高频命中词</h3>
	{#if summary.byWord.length === 0}
		<p class="text-slate-400 text-center py-8">暂无数据</p>
	{:else}
		<div class="grid grid-cols-5 md:grid-cols-10 gap-3">
			{#each summary.byWord as w}
				<div class="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
					<p class="text-sm font-mono font-bold text-rose-700 truncate">{w.word}</p>
					<p class="text-xs text-slate-500 mt-1">{w.count} 次</p>
					<div class="w-full h-1 bg-slate-200 rounded mt-2 overflow-hidden">
						<div class="h-full bg-rose-500 rounded" style="width: {(w.count / maxWord) * 100}%" />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<div class="card overflow-hidden">
	<div class="p-4 border-b border-slate-200">
		<h3 class="font-semibold text-slate-900">命中明细 ({filteredHits.length})</h3>
	</div>
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>邮件</th>
					<th>类型</th>
					<th>命中内容</th>
					<th>负责人</th>
					<th>缺失原因</th>
					<th>日期</th>
					<th>次数</th>
				</tr>
			</thead>
			<tbody>
				{#if filteredHits.length === 0}
					<tr><td colspan="7" class="py-12 text-center text-slate-400">暂无命中记录</td></tr>
				{/if}
				{#each filteredHits as h}
					<tr>
						<td>
							<a href={`/emails/${h.emailId}`} class="text-indigo-600 hover:underline text-sm">
								{$emailsStore.find((e) => e.id === h.emailId)?.subject || `#${h.emailId}`}
							</a>
						</td>
						<td><span class="chip {hitTypeStyle[h.hitType]}">{hitTypeLabel[h.hitType] || h.hitType}</span></td>
						<td>
							{h.matchText
								? `<code class="font-mono text-xs bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">${h.matchText}</code>`
								: h.knowledgeId
									? `<span class="text-blue-600">📚 ${$knowledgeStore.find((k) => k.id === h.knowledgeId)?.title || ''}</span>`
									: '-'}
						</td>
						<td class="text-sm">{$trainersStore.find((t) => t.id === h.trainerId)?.name || '未分配'}</td>
						<td class="text-sm">{h.missingReasonId ? $missingReasonsStore.find((r) => r.id === h.missingReasonId)?.name : '-'}</td>
						<td class="text-sm text-slate-500">{h.hitDate}</td>
						<td class="text-sm font-medium">{h.count}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
