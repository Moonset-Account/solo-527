<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		SCHEDULE_STATUS_LABELS,
		PLATFORM_COLORS
	} from '$lib/types';
	import type { ScheduleStatus } from '$lib/types';
	import {
		ArrowLeft,
		Calendar,
		Clock,
		User,
		FileText,
		Link2,
		Pencil,
		Check,
		X,
		StickyNote
	} from 'lucide-svelte';

	let id = $derived($page.params.id);
	let schedule = $derived(store.schedules.find((s) => s.id === id));

	let topic = $derived(schedule ? store.topics.find((t) => t.id === schedule.topicId) : undefined);
	let creator = $derived(schedule ? store.users.find((u) => u.id === schedule.createdBy) : undefined);
	let sourceRecord = $derived(schedule ? store.getTopicSourceRecord(schedule.topicId) : undefined);

	let editingNotes = $state(false);
	let editedNotes = $state('');

	function platformColor(platform: string) {
		return PLATFORM_COLORS[platform] ?? '#e07a3a';
	}

	function statusBadgeClass(status: ScheduleStatus) {
		const map: Record<ScheduleStatus, string> = {
			scheduled: 'bg-blue-100 text-blue-700',
			published: 'bg-success-light text-success',
			cancelled: 'bg-danger-light text-danger'
		};
		return map[status];
	}

	function startEditNotes() {
		if (!schedule) return;
		editedNotes = schedule.supplementaryNotes;
		editingNotes = true;
	}

	function saveNotes() {
		if (!schedule) return;
		store.updateScheduleNotes(schedule.id, editedNotes);
		editingNotes = false;
	}

	function cancelEditNotes() {
		editingNotes = false;
	}

	function handleMarkPublished() {
		if (!schedule) return;
		store.updateSchedule(schedule.id, { status: 'published' });
	}

	function handleCancel() {
		if (!schedule) return;
		store.updateSchedule(schedule.id, { status: 'cancelled' });
	}

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN');
	}

	function getRefLink(refType: string, refId: string) {
		if (refType === 'material') return `/materials/${refId}`;
		if (refType === 'task') return `/tasks/${refId}`;
		if (refType === 'schedule') return `/schedule/${refId}`;
		return '#';
	}
</script>

{#if schedule}
	<div class="min-h-screen bg-warm-gray">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
			<a
				href="/schedule"
				class="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-copper transition-colors mb-4"
			>
				<ArrowLeft size={16} />
				返回排期列表
			</a>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex flex-wrap items-start justify-between gap-4 mb-4">
					<div>
						{#if topic}
							<h1 class="text-xl font-bold text-ink mb-2">{topic.title}</h1>
						{/if}
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
								style="background: {platformColor(schedule.platform)}15; color: {platformColor(schedule.platform)}"
							>
								<span class="w-1.5 h-1.5 rounded-full" style="background: {platformColor(schedule.platform)}"></span>
								{schedule.platform}
							</span>
							<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(schedule.status)}">
								{SCHEDULE_STATUS_LABELS[schedule.status]}
							</span>
						</div>
					</div>
					{#if schedule.status === 'scheduled'}
						<div class="flex gap-2">
							<button
								onclick={handleMarkPublished}
								class="px-4 py-2 text-sm rounded-lg bg-success text-white hover:bg-success/90 transition-colors"
							>
								标记已发布
							</button>
							<button
								onclick={handleCancel}
								class="px-4 py-2 text-sm rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors"
							>
								取消
							</button>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					<div class="flex items-center gap-2 text-ink/70">
						<User size={16} class="text-copper" />
						<span>账号：</span>
						<span class="font-medium text-ink">{schedule.accountName}</span>
					</div>
					<div class="flex items-center gap-2 text-ink/70">
						<Calendar size={16} class="text-copper" />
						<span>发布日期：</span>
						<span class="font-medium text-ink">{schedule.publishDate}</span>
					</div>
					<div class="flex items-center gap-2 text-ink/70">
						<Clock size={16} class="text-copper" />
						<span>发布时间：</span>
						<span class="font-medium text-ink">{schedule.publishTime}</span>
					</div>
					{#if creator}
						<div class="flex items-center gap-2 text-ink/70">
							<User size={16} class="text-copper" />
							<span>创建人：</span>
							<span class="font-medium text-ink">{creator.name}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<h2 class="text-base font-bold text-ink mb-4">来源记录</h2>

				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-semibold text-ink/70 flex items-center gap-1">
							<StickyNote size={14} />
							补充说明
						</h3>
						{#if !editingNotes}
							<button
								onclick={startEditNotes}
								class="text-xs text-copper hover:text-copper-dark flex items-center gap-1"
							>
								<Pencil size={12} />
								编辑
							</button>
						{/if}
					</div>
					{#if editingNotes}
						<div class="space-y-2">
							<textarea
								bind:value={editedNotes}
								rows="3"
								class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
							></textarea>
							<div class="flex justify-end gap-2">
								<button
									onclick={cancelEditNotes}
									class="px-3 py-1.5 text-xs rounded-lg border border-warm-gray-dark text-ink/60 hover:bg-warm-gray transition-colors"
								>
									<X size={14} class="inline" /> 取消
								</button>
								<button
									onclick={saveNotes}
									class="px-3 py-1.5 text-xs rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors"
								>
									<Check size={14} class="inline" /> 保存
								</button>
							</div>
						</div>
					{:else}
						<p class="text-sm text-ink/70 whitespace-pre-wrap">
							{schedule.supplementaryNotes || '暂无补充说明'}
						</p>
					{/if}
				</div>

				{#if sourceRecord}
					<div>
						<h3 class="text-sm font-semibold text-ink/70 mb-2 flex items-center gap-1">
							<FileText size={14} />
							引用记录
						</h3>
						<div class="space-y-2">
							{#each sourceRecord.references as ref}
								<a
									href={getRefLink(ref.refType, ref.refId)}
									class="flex items-center gap-2 p-2 bg-warm-gray rounded-lg hover:bg-warm-gray-dark transition-colors text-sm"
								>
									<Link2 size={14} class="text-copper shrink-0" />
									<span class="text-xs px-1.5 py-0.5 rounded bg-ink/10 text-ink/50">{ref.refType}</span>
									<span class="text-ink/80">{ref.refLabel}</span>
								</a>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-sm text-ink/40">暂无来源记录</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-warm-gray flex items-center justify-center">
		<p class="text-ink/40">排期不存在</p>
	</div>
{/if}
