<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import {
		emailsStore,
		emailVersionsStore,
		trainersStore,
		forbiddenWordsStore,
		knowledgeStore,
		hitRatesStore,
		scanEmailForRisks,
		genId
	} from '$lib/stores';
	import { goto } from '$app/navigation';

	let { params } = $props();
	const isEdit = !!params?.id;
	const emailId = isEdit ? Number(params.id) : null;

	let subject = $state('');
	let content = $state('');
	let recipient = $state('');
	let sender = $state('');
	let trainerId = $state<number | ''>('');
	let status = $state<'draft' | 'pending'>('draft');
	let changeNote = $state('');
	let saveAsVersion = $state(true);

	const existingEmail = $derived(isEdit ? $emailsStore.find((e) => e.id === emailId) : null);
	const existingVersions = $derived(isEdit ? $emailVersionsStore.filter((v) => v.emailId === emailId).sort((a, b) => b.version - a.version) : []);

	$effect(() => {
		if (existingEmail && !subject) {
			subject = existingEmail.subject;
			content = existingEmail.content;
			recipient = existingEmail.recipient || '';
			sender = existingEmail.sender || '';
			trainerId = existingEmail.trainerId || '';
		}
	});

	const detectedRisks = $derived(scanEmailForRisks(content, subject));
	const maxSeverity = $derived(() => {
		const order: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
		let max: any = 'low';
		for (const r of detectedRisks) {
			if (order[r.word.severity] > order[max]) max = r.word.severity;
		}
		return max;
	});

	const save = async (e: Event) => {
		e.preventDefault();
		if (!subject.trim()) {
			alert('请填写邮件主题');
			return;
		}
		if (!content.trim()) {
			alert('请填写邮件内容');
			return;
		}

		const now = new Date().toISOString();
		const finalTrainerId = trainerId === '' ? undefined : Number(trainerId);
		const riskLevel = detectedRisks.length > 0 ? maxSeverity() : 'low';
		const needsReview = detectedRisks.some((r) => r.word.severity === 'high' || r.word.severity === 'critical');

		if (isEdit && emailId) {
			emailsStore.update((arr) =>
				arr.map((em) =>
					em.id === emailId
						? {
								...em,
								subject,
								content,
								recipient: recipient || undefined,
								sender: sender || undefined,
								trainerId: finalTrainerId,
								status: status || em.status,
								riskLevel,
								needsReview: em.needsReview || needsReview,
								updatedAt: now
							}
						: em
				)
			);
			if (saveAsVersion) {
				const nextVer = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;
				emailVersionsStore.update((arr) => [
					...arr,
					{
						id: genId(),
						emailId,
						version: nextVer,
						subject,
						content,
						changeNote: changeNote || `编辑更新`,
						createdBy: '管理员',
						createdAt: now
					}
				]);
				for (const r of detectedRisks) {
					if (finalTrainerId) {
						hitRatesStore.update((arr) => [
							...arr,
							{
								id: genId(),
								emailId,
								forbiddenWordId: r.word.id,
								trainerId: finalTrainerId,
								hitType: 'forbidden',
								matchText: r.matchText,
								hitDate: now.split('T')[0],
								count: 1,
								createdAt: now
							}
						]);
					}
				}
			}
			await goto(`/emails/${emailId}`);
		} else {
			const newId = genId();
			emailsStore.update((arr) => [
				...arr,
				{
					id: newId,
					uuid: crypto.randomUUID(),
					subject,
					content,
					recipient: recipient || undefined,
					sender: sender || undefined,
					status: status,
					trainerId: finalTrainerId,
					riskLevel,
					needsReview,
					reviewed: false,
					createdAt: now,
					updatedAt: now
				}
			]);
			emailVersionsStore.update((arr) => [
				...arr,
				{
					id: genId(),
					emailId: newId,
					version: 1,
					subject,
					content,
					changeNote: changeNote || '创建初稿',
					createdBy: '管理员',
					createdAt: now
				}
			]);
			if (finalTrainerId) {
				for (const r of detectedRisks) {
					hitRatesStore.update((arr) => [
						...arr,
						{
							id: genId(),
							emailId: newId,
							forbiddenWordId: r.word.id,
							trainerId: finalTrainerId,
							hitType: 'forbidden',
							matchText: r.matchText,
							hitDate: now.split('T')[0],
							count: 1,
							createdAt: now
						}
					]);
				}
			}
			await goto(`/emails/${newId}`);
		}
	};

	const restoreVersion = (v: any) => {
		if (confirm(`确认恢复到版本 v${v.version}？当前编辑内容将被覆盖。`)) {
			subject = v.subject;
			content = v.content;
		}
	};

	const insertKnowledge = (k: any) => {
		content = content + '\n\n【合规参考】' + k.content;
	};
</script>

<PageHeader
	title={isEdit ? '编辑邮件' : '新建邮件'}
	subtitle={isEdit ? `正在编辑邮件 #${emailId}` : '创建新的销售邮件草稿并保存版本'}
>
	{#snippet actions()}
		{#if isEdit}
			<a href={`/emails/${emailId}`} class="btn-secondary">返回详情</a>
		{:else}
			<a href="/" class="btn-secondary">取消</a>
		{/if}
	{/snippet}
</PageHeader>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
	<div class="lg:col-span-2 space-y-6">
		<form class="card p-6 space-y-4" onsubmit={save}>
			<div>
				<label class="label">邮件主题 <span class="text-rose-500">*</span></label>
				<input class="input !text-base" placeholder="请输入邮件主题..." bind:value={subject} />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">发件人</label>
					<input class="input" placeholder="sender@company.com" bind:value={sender} />
				</div>
				<div>
					<label class="label">收件人</label>
					<input class="input" placeholder="client@example.com" bind:value={recipient} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">培训负责人</label>
					<select class="select" bind:value={trainerId}>
						<option value="">未分配</option>
						{#each $trainersStore as t}
							<option value={t.id}>{t.name} ({t.team || ''})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">保存状态</label>
					<select class="select" bind:value={status}>
						<option value="draft">保存为草稿</option>
						<option value="pending">提交待复核</option>
					</select>
				</div>
			</div>
			<div>
				<label class="label">邮件正文 <span class="text-rose-500">*</span></label>
				<textarea
					class="textarea !min-h-[360px] !font-mono !text-sm !leading-relaxed"
					placeholder="请输入邮件内容..."
					bind:value={content}
				/>
			</div>

			{#if detectedRisks.length > 0}
				<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
					<div class="flex items-start justify-between mb-2">
						<div>
							<h4 class="font-semibold text-amber-900">⚠️ 实时风险检测</h4>
							<p class="text-xs text-amber-700 mt-0.5">检测到 {detectedRisks.length} 个潜在合规风险</p>
						</div>
						<RiskBadge level={maxSeverity()} />
					</div>
					<ul class="space-y-1.5">
						{#each detectedRisks as r}
							<li class="flex items-start gap-2 text-sm">
								<RiskBadge level={r.word.severity} />
								<div>
									<code class="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-xs">
										{r.matchText}
									</code>
									<span class="text-amber-800 ml-2">- {r.word.category || ''} {r.word.description || ''}</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else if content.length > 10}
				<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
					✅ 当前内容未检测到禁用词风险
				</div>
			{/if}

			{#if isEdit}
				<div class="border-t border-slate-100 pt-4 space-y-3">
					<label class="inline-flex items-center gap-2 cursor-pointer">
						<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600" bind:checked={saveAsVersion} />
						<span class="text-sm text-slate-700">保存为新版本</span>
					</label>
					{#if saveAsVersion}
						<div>
							<label class="label">版本变更说明</label>
							<input class="input" placeholder="描述本次修改内容..." bind:value={changeNote} />
						</div>
					{/if}
				</div>
			{/if}

			<div class="flex justify-end gap-2 pt-2">
				<button type="submit" class="btn-primary">
					💾 {isEdit ? '保存修改' : '创建邮件'}
				</button>
			</div>
		</form>

		{#if isEdit && existingVersions.length > 0}
			<div class="card p-6">
				<h3 class="font-semibold text-slate-900 mb-4">📑 历史版本 ({existingVersions.length})</h3>
				<div class="space-y-3 max-h-96 overflow-y-auto">
					{#each existingVersions as v}
						<div class="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
							<div class="flex items-center justify-between mb-1">
								<span class="font-medium text-slate-900">v{v.version}</span>
								<button class="btn-ghost !px-2 !py-1 text-xs" onclick={() => restoreVersion(v)}>恢复此版本</button>
							</div>
							<p class="text-xs text-slate-500 mb-1">
								{v.createdBy || '未知'} · {new Date(v.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
							</p>
							{#if v.changeNote}<p class="text-sm text-indigo-700 bg-indigo-50 rounded px-2 py-1">📝 {v.changeNote}</p>{/if}
							<pre class="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap max-h-24 overflow-hidden">{v.content}</pre>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="space-y-6">
		<div class="card p-5">
			<h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
				<span>📚</span> 快速插入知识库
			</h3>
			<p class="text-xs text-slate-500 mb-3">点击条目将合规内容插入邮件末尾</p>
			<div class="space-y-2 max-h-80 overflow-y-auto">
				{#each $knowledgeStore.filter((k) => k.active) as k}
					<button
						class="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
						onclick={() => insertKnowledge(k)}
					>
						<div class="flex items-center justify-between">
							<span class="font-medium text-sm text-slate-900">{k.title}</span>
							<span class="chip bg-slate-100 text-slate-600 text-[10px]">{k.category}</span>
						</div>
						<p class="text-xs text-slate-500 mt-1 line-clamp-2">{k.content}</p>
					</button>
				{/each}
			</div>
		</div>

		<div class="card p-5">
			<h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
				<span>🚫</span> 禁用词提示
			</h3>
			<p class="text-xs text-slate-500 mb-3">共 {$forbiddenWordsStore.filter((w) => w.active).length} 个禁用词处于监控中</p>
			<div class="flex flex-wrap gap-1.5">
				{#each $forbiddenWordsStore.filter((w) => w.active).slice(0, 30) as w}
					<span class="chip bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">{w.word}</span>
				{/each}
			</div>
		</div>
	</div>
</div>
