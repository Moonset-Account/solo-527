<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		ANOMALY_SEVERITY_LABELS,
		ANOMALY_STATUS_LABELS
	} from '$lib/types';
	import type { AnomalyStatus, AnomalySeverity } from '$lib/types';
	import { Plus, AlertTriangle, X, FileText } from 'lucide-svelte';

	let showNewDialog = $state(false);
	let statusFilter = $state<AnomalyStatus | 'all'>('all');
	let severityFilter = $state<AnomalySeverity | 'all'>('all');

	let newTopicId = $state('');
	let newSeverity = $state<AnomalySeverity>('medium');
	let newDescription = $state('');

	const allStatuses: AnomalyStatus[] = ['open', 'investigating', 'resolving', 'closed'];
	const allSeverities: AnomalySeverity[] = ['low', 'medium', 'high'];

	let openCount = $derived(store.anomalies.filter((a) => a.status !== 'closed').length);

	let filteredAnomalies = $derived.by(() => {
		let result = store.anomalies;
		if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
		if (severityFilter !== 'all') result = result.filter((a) => a.severity === severityFilter);
		return result;
	});

	function getTopicTitle(id: string) {
		return store.topics.find((t) => t.id === id)?.title ?? '未知选题';
	}

	function severityBorderColor(severity: AnomalySeverity) {
		const map: Record<AnomalySeverity, string> = {
			low: 'border-l-warning',
			medium: 'border-l-copper',
			high: 'border-l-danger'
		};
		return map[severity];
	}

	function severityBadgeClass(severity: AnomalySeverity) {
		const map: Record<AnomalySeverity, string> = {
			low: 'bg-warning-light text-warning',
			medium: 'bg-copper-light/30 text-copper',
			high: 'bg-danger-light text-danger'
		};
		return map[severity];
	}

	function statusBadgeClass(status: AnomalyStatus) {
		const map: Record<AnomalyStatus, string> = {
			open: 'bg-warm-gray-dark text-ink',
			investigating: 'bg-blue-100 text-blue-700',
			resolving: 'bg-copper-light/30 text-copper',
			closed: 'bg-success-light text-success'
		};
		return map[status];
	}

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN');
	}

	function resetForm() {
		newTopicId = '';
		newSeverity = 'medium';
		newDescription = '';
	}

	async function handleCreate() {
		if (!newTopicId || !newDescription.trim()) return;
		const payload = {
			topicId: newTopicId,
			type: 'version_conflict',
			severity: newSeverity,
			description: newDescription,
			status: 'open',
			createdBy: store.getCurrentUser().id
		};
		try {
			const res = await fetch('/api/anomalies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('创建失败');
			const created = await res.json();
			store.addAnomaly({ ...payload, id: created.id, createdAt: new Date(created.createdAt) });
			showNewDialog = false;
			resetForm();
		} catch (e) {
			console.error(e);
			alert('创建异常失败');
		}
	}
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-ink">异常清单</h1>
				{#if openCount > 0}
					<span class="bg-danger text-white text-xs font-bold px-2.5 py-1 rounded-full">{openCount}</span>
				{/if}
			</div>
			<button
				onclick={() => (showNewDialog = true)}
				class="flex items-center gap-2 bg-copper text-white px-4 py-2 rounded-lg hover:bg-copper-dark transition-colors"
			>
				<Plus size={18} />
				报告异常
			</button>
		</div>

		<div class="bg-card rounded-xl shadow-sm p-4 mb-6 space-y-4">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm font-medium text-ink/60 mr-1">状态</span>
				<button
					class="px-3 py-1 rounded-full text-sm transition-colors {statusFilter === 'all' ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
					onclick={() => (statusFilter = 'all')}
				>
					全部
				</button>
				{#each allStatuses as s}
					<button
						class="px-3 py-1 rounded-full text-sm transition-colors {statusFilter === s ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
						onclick={() => (statusFilter = s)}
					>
						{ANOMALY_STATUS_LABELS[s]}
					</button>
				{/each}
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm font-medium text-ink/60 mr-1">严重程度</span>
				<button
					class="px-3 py-1 rounded-full text-sm transition-colors {severityFilter === 'all' ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
					onclick={() => (severityFilter = 'all')}
				>
					全部
				</button>
				{#each allSeverities as s}
					<button
						class="px-3 py-1 rounded-full text-sm transition-colors {severityFilter === s ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
						onclick={() => (severityFilter = s)}
					>
						{ANOMALY_SEVERITY_LABELS[s]}
					</button>
				{/each}
			</div>
		</div>

		{#if filteredAnomalies.length === 0}
			<div class="text-center py-12">
				<AlertTriangle size={40} class="text-ink/20 mx-auto mb-3" />
				<p class="text-ink/40">暂无异常记录</p>
			</div>
		{:else}
			<div class="hidden md:block">
				<div class="bg-card rounded-xl shadow-sm overflow-hidden">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-warm-gray">
								<th class="text-left px-4 py-3 font-semibold text-ink/60 w-8"></th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">描述</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">选题</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">严重程度</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">状态</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">创建时间</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredAnomalies as anomaly}
								<a
									href="/anomalies/{anomaly.id}"
									class="contents"
								>
									<tr class="border-t border-warm-gray-dark hover:bg-warm-gray/50 transition-colors cursor-pointer border-l-4 {severityBorderColor(anomaly.severity)}">
										<td class="px-4 py-3"></td>
										<td class="px-4 py-3">
											<p class="text-ink line-clamp-1">{anomaly.description}</p>
											{#if anomaly.status === 'closed' && anomaly.closureNote}
												<p class="text-xs text-ink/40 mt-1 line-clamp-1">关闭备注：{anomaly.closureNote}</p>
											{/if}
										</td>
										<td class="px-4 py-3">
											<span class="text-copper text-xs">{getTopicTitle(anomaly.topicId)}</span>
										</td>
										<td class="px-4 py-3">
											<span class="text-xs px-2 py-0.5 rounded-full {severityBadgeClass(anomaly.severity)}">
												{ANOMALY_SEVERITY_LABELS[anomaly.severity]}
											</span>
										</td>
										<td class="px-4 py-3">
											<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(anomaly.status)}">
												{ANOMALY_STATUS_LABELS[anomaly.status]}
											</span>
										</td>
										<td class="px-4 py-3 text-ink/50">{formatDate(anomaly.createdAt)}</td>
									</tr>
								</a>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="md:hidden space-y-3">
				{#each filteredAnomalies as anomaly}
					<a
						href="/anomalies/{anomaly.id}"
						class="block bg-card rounded-xl p-4 shadow-sm border-l-4 {severityBorderColor(anomaly.severity)}"
					>
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs px-2 py-0.5 rounded-full {severityBadgeClass(anomaly.severity)}">
								{ANOMALY_SEVERITY_LABELS[anomaly.severity]}
							</span>
							<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(anomaly.status)}">
								{ANOMALY_STATUS_LABELS[anomaly.status]}
							</span>
						</div>
						<p class="text-sm text-ink line-clamp-2 mb-2">{anomaly.description}</p>
						<div class="flex items-center justify-between text-xs text-ink/40">
							<span class="text-copper">{getTopicTitle(anomaly.topicId)}</span>
							<span>{formatDate(anomaly.createdAt)}</span>
						</div>
						{#if anomaly.status === 'closed' && anomaly.closureNote}
							<p class="text-xs text-ink/40 mt-1 line-clamp-1">关闭备注：{anomaly.closureNote}</p>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showNewDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onclick={() => (showNewDialog = false)}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-ink">报告异常</h2>
				<button onclick={() => (showNewDialog = false)} class="text-ink/40 hover:text-ink">
					<X size={20} />
				</button>
			</div>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">关联选题</label>
					<select
						bind:value={newTopicId}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						<option value="">请选择选题</option>
						{#each store.topics as t}
							<option value={t.id}>{t.title}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">严重程度</label>
					<select
						bind:value={newSeverity}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						{#each allSeverities as s}
							<option value={s}>{ANOMALY_SEVERITY_LABELS[s]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">异常描述</label>
					<textarea
						bind:value={newDescription}
						rows="4"
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="详细描述异常情况"
					></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button
					onclick={() => (showNewDialog = false)}
					class="px-4 py-2 text-sm rounded-lg border border-warm-gray-dark text-ink/60 hover:bg-warm-gray transition-colors"
				>
					取消
				</button>
				<button
					onclick={handleCreate}
					disabled={!newTopicId || !newDescription.trim()}
					class="px-4 py-2 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					提交
				</button>
			</div>
		</div>
	</div>
{/if}
