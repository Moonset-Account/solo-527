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
	const emailId = Number(params.id);

	let subject = $state('');
	let content = $state('');
	let recipient = $state('');
	let sender = $state('');
	let trainerId = $state<number | ''>('');
	let status = $state<'draft' | 'pending' | 'reviewed' | 'sent' | 'archived'>('draft');
	let changeNote = $state('');
	let saveAsVersion = $state(true);
	let loaded = $state(false);

	const existingEmail = $derived($emailsStore.find((e) => e.id === emailId));
	const existingVersions = $derived(
		$emailVersionsStore
			.filter((v) => v.emailId === emailId)
			.sort((a, b) => b.version - a.version)
	);

	$effect(() => {
		if (existingEmail && !loaded) {
			subject = existingEmail.subject;
			content = existingEmail.content;
			recipient = existingEmail.recipient || '';
			sender = existingEmail.sender || '';
			trainerId = existingEmail.trainerId || '';
			status = existingEmail.status;
			loaded = true;
		}
	});

	const detectedRisks = $derived(scanEmailForRisks(content, subject));
	const maxSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
		const order: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
		let max: any = 'low';
		for (const r of detectedRisks) {
			if (order[r.word.severity] > order[max]) max = r.word.severity;
		}
		return max;
	};

	const save = async (e: Event) => {
		e.preventDefault();
		if (!subject.trim() || !content.trim()) {
			alert('请填写主题和内容');
			return;
		}
		const now = new Date().toISOString();
		const finalTrainerId = trainerId === '' ? undefined : Number(trainerId);
		const riskLevel = detectedRisks.length > 0 ? maxSeverity() : 'low';
		const needsReview = detectedRisks.some(
			(r) => r.word.severity === 'high' || r.word.severity === 'critical'
		);

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
							status,
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
					changeNote: changeNote || '编辑更新',
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
	};

	const restoreVersion = (v: any) => {
		if (confirm(`恢复到 v${v.version}？当前内容将被覆盖。`)) {
			subject = v.subject;
			content = v.content;
		}
	};

	const insertKnowledge = (k: any) => {
		content = content + '\n\n【合规参考】' + k.content;
	};
</script>

{#if !existingEmail}
	<PageHeader title="邮件不存在" />
	<div class="card p-12 text-center">未找到该邮件</div>
{:else}
	<PageHeader title={`编辑邮件 #${emailId}`} subtitle="修改内容并保存为新版本">
		{#snippet actions()}
			<a href={`/emails/${emailId}`} class="btn-secondary">返回详情</a>
		{/snippet}
	</PageHeader>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<form class="card p-6 space-y-4" onsubmit={save}>
				<div>
					<label class="label">邮件主题</label>
					<input class="input !text-base" bind:value={subject} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">发件人</label>
						<input class="input" bind:value={sender} />
					</div>
					<div>
						<label class="label">收件人</label>
						<input class="input" bind:value={recipient} />
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
						<label class="label">状态</label>
						<select class="select" bind:value={status}>
							<option value="draft">草稿</option>
							<option value="pending">待复核</option>
							<option value="reviewed">已复核</option>
							<option value="sent">已发送</option>
							<option value="archived">已归档</option>
						</select>
					</div>
				</div>
				<div>
					<label class="label">邮件正文</label>
					<textarea class="textarea !min-h-[360px] !font-mono !text-sm" bind:value={content} />
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
									<code class="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-xs">{r.matchText}</code>
									<span class="text-amber-800">- {r.word.category || ''}</span>
								</li>
							{/each}
						</ul>
					</div>
				{:else if content.length > 10}
					<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
						✅ 当前内容未检测到禁用词风险
					</div>
				{/if}

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

				<div class="flex justify-end gap-2 pt-2">
					<button type="submit" class="btn-primary">💾 保存修改</button>
				</div>
			</form>

			{#if existingVersions.length > 0}
				<div class="card p-6">
					<h3 class="font-semibold text-slate-900 mb-4">📑 历史版本 ({existingVersions.length})</h3>
					<div class="space-y-3 max-h-96 overflow-y-auto">
						{#each existingVersions as v}
							<div class="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
								<div class="flex items-center justify-between mb-1">
									<span class="font-medium text-slate-900">v{v.version}</span>
									<button class="btn-ghost !px-2 !py-1 text-xs" onclick={() => restoreVersion(v)}>恢复此版本</button>
								</div>
								<p class="text-xs text-slate-500 mb-1">
									{v.createdBy || '未知'} · {new Date(v.createdAt).toLocaleString('zh-CN')}
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
				<h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2"><span>📚</span> 知识库</h3>
				<p class="text-xs text-slate-500 mb-3">点击快速插入</p>
				<div class="space-y-2 max-h-80 overflow-y-auto">
					{#each $knowledgeStore.filter((k) => k.active) as k}
						<button class="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50" onclick={() => insertKnowledge(k)}>
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
				<h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2"><span>🚫</span> 禁用词</h3>
				<p class="text-xs text-slate-500 mb-3">
					共 {$forbiddenWordsStore.filter((w) => w.active).length} 个
				</p>
				<div class="flex flex-wrap gap-1.5">
					{#each $forbiddenWordsStore.filter((w) => w.active).slice(0, 30) as w}
						<span class="chip bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">{w.word}</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
