<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		ANOMALY_SEVERITY_LABELS,
		ANOMALY_STATUS_LABELS
	} from '$lib/types';
	import type { AnomalyStatus, AnomalySeverity } from '$lib/types';
	import {
		ArrowLeft,
		AlertTriangle,
		CheckCircle2,
		User,
		Clock,
		FileText
	} from 'lucide-svelte';

	let id = $derived($page.params.id);
	let anomaly = $derived(store.anomalies.find((a) => a.id === id));

	let topic = $derived(anomaly ? store.topics.find((t) => t.id === anomaly.topicId) : undefined);
	let creator = $derived(anomaly ? store.users.find((u) => u.id === anomaly.createdBy) : undefined);
	let closedByUser = $derived(
		anomaly?.closedBy ? store.users.find((u) => u.id === anomaly.closedBy) : undefined
	);

	let closureNote = $state('');

	const statusTimeline: AnomalyStatus[] = ['open', 'investigating', 'resolving', 'closed'];

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

	function handleStatusAction(nextStatus: AnomalyStatus) {
		if (!anomaly) return;
		if (nextStatus === 'closed') {
			if (!closureNote.trim()) return;
			store.closeAnomaly(anomaly.id, closureNote);
			closureNote = '';
		} else {
			store.updateAnomaly(anomaly.id, { status: nextStatus });
		}
	}

	function formatDateTime(d: Date | string) {
		return new Date(d).toLocaleString('zh-CN');
	}

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN');
	}
</script>

{#if anomaly}
	<div class="min-h-screen bg-warm-gray">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
			<a
				href="/anomalies"
				class="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-copper transition-colors mb-4"
			>
				<ArrowLeft size={16} />
				返回异常列表
			</a>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex flex-wrap items-center gap-2 mb-4">
					<span class="text-xs px-2 py-0.5 rounded-full {severityBadgeClass(anomaly.severity)}">
						{ANOMALY_SEVERITY_LABELS[anomaly.severity]}
					</span>
					<span class="text-xs px-2 py-0.5 rounded-full bg-ink/10 text-ink/60">
						版本冲突
					</span>
					<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(anomaly.status)}">
						{ANOMALY_STATUS_LABELS[anomaly.status]}
					</span>
				</div>

				{#if topic}
					<a
						href="/topics/{topic.id}"
						class="inline-flex items-center gap-1 text-sm text-copper hover:underline mb-3"
					>
						<FileText size={14} />
						{topic.title}
					</a>
				{/if}

				<div class="mt-4 pt-4 border-t border-warm-gray-dark">
					<h3 class="text-sm font-semibold text-ink/70 mb-2">异常描述</h3>
					<p class="text-sm text-ink/80 whitespace-pre-wrap">{anomaly.description}</p>
				</div>

				{#if anomaly.status === 'closed'}
					<div class="mt-4 pt-4 border-t border-warm-gray-dark">
						<div class="bg-success-light/50 rounded-lg p-4">
							<h3 class="text-sm font-semibold text-success mb-2">关闭信息</h3>
							<p class="text-sm text-ink/80 whitespace-pre-wrap">{anomaly.closureNote}</p>
							<div class="flex items-center gap-4 mt-3 text-xs text-ink/50">
								{#if closedByUser}
									<span class="flex items-center gap-1">
										<User size={12} />
										{closedByUser.name}
									</span>
								{/if}
								{#if anomaly.closedAt}
									<span class="flex items-center gap-1">
										<Clock size={12} />
										{formatDateTime(anomaly.closedAt)}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>

			{#if anomaly.status !== 'closed'}
				<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
					<div class="flex flex-wrap items-center gap-3">
						{#if anomaly.status === 'open'}
							<button
								onclick={() => handleStatusAction('investigating')}
								class="px-4 py-2 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors"
							>
								开始调查
							</button>
						{/if}
						{#if anomaly.status === 'investigating'}
							<button
								onclick={() => handleStatusAction('resolving')}
								class="px-4 py-2 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors"
							>
								开始处理
							</button>
						{/if}
						{#if anomaly.status === 'resolving'}
							<div class="w-full">
								<label class="block text-sm font-medium text-ink/70 mb-2">
									关闭备注 <span class="text-danger">*</span>
								</label>
								<textarea
									bind:value={closureNote}
									rows="3"
									class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40 mb-3"
									placeholder="请填写关闭异常的说明（必填）"
								></textarea>
								<button
									onclick={() => handleStatusAction('closed')}
									disabled={!closureNote.trim()}
									class="px-4 py-2 text-sm rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									关闭异常
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<div class="bg-card rounded-xl shadow-sm p-6">
				<h2 class="text-base font-bold text-ink mb-4">状态时间线</h2>
				<div class="relative">
					{#each statusTimeline as status, i}
						{@const isActive = statusTimeline.indexOf(anomaly.status) >= i}
						{@const isCurrent = anomaly.status === status}
						<div class="flex items-start gap-3 pb-6 last:pb-0">
							<div class="flex flex-col items-center">
								<div
									class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {isActive ? 'bg-copper text-white' : 'bg-warm-gray-dark text-ink/30'}"
								>
									{#if isCurrent && status === 'closed'}
										<CheckCircle2 size={18} />
									{:else if isActive}
										<CheckCircle2 size={18} />
									{:else}
										<span class="text-xs font-bold">{i + 1}</span>
									{/if}
								</div>
								{#if i < statusTimeline.length - 1}
									<div class="w-0.5 h-6 {isActive && statusTimeline.indexOf(anomaly.status) > i ? 'bg-copper' : 'bg-warm-gray-dark'}"></div>
								{/if}
							</div>
							<div class="pt-1">
								<span class="text-sm font-medium {isCurrent ? 'text-ink' : isActive ? 'text-ink/70' : 'text-ink/30'}">
									{ANOMALY_STATUS_LABELS[status]}
								</span>
								{#if isCurrent}
									<span class="text-xs text-ink/40 ml-2">当前状态</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-4 pt-4 border-t border-warm-gray-dark flex items-center gap-4 text-xs text-ink/50">
					{#if creator}
						<span class="flex items-center gap-1">
							<User size={12} />
							报告人：{creator.name}
						</span>
					{/if}
					<span class="flex items-center gap-1">
						<Clock size={12} />
						创建于：{formatDateTime(anomaly.createdAt)}
					</span>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-warm-gray flex items-center justify-center">
		<p class="text-ink/40">异常不存在</p>
	</div>
{/if}
