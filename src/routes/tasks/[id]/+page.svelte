<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { store } from '$lib/stores/mock-data.svelte';
	import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '$lib/types';
	import type { TaskStatus, TaskType } from '$lib/types';
	import {
		ArrowLeft,
		Calendar,
		User,
		FileText,
		Clock,
		Plus,
		X,
		Paperclip,
		CheckCircle2
	} from 'lucide-svelte';

	let id = $derived($page.params.id);
	let task = $derived(store.tasks.find((t) => t.id === id));
	let showDeliverableForm = $state(false);
	let deliverableFileType = $state('video/mp4');
	let deliverableNote = $state('');

	let topic = $derived(task ? store.topics.find((t) => t.id === task.topicId) : undefined);
	let assignee = $derived(task ? store.users.find((u) => u.id === task.assigneeId) : undefined);
	let creator = $derived(task ? store.users.find((u) => u.id === task.createdBy) : undefined);

	let isOverdue = $derived(
		task ? task.status !== 'completed' && new Date(task.deadline) < new Date() : false
	);

	const statusActions: Record<TaskStatus, { label: string; nextStatus: TaskStatus } | null> = {
		assigned: { label: '开始', nextStatus: 'in_progress' },
		in_progress: { label: '提交', nextStatus: 'submitted' },
		submitted: { label: '审核', nextStatus: 'reviewing' },
		reviewing: { label: '完成', nextStatus: 'completed' },
		completed: null
	};

	const statusTimeline: TaskStatus[] = [
		'assigned',
		'in_progress',
		'submitted',
		'reviewing',
		'completed'
	];

	onMount(async () => {
		try {
			const res = await fetch(`/api/tasks/${id}`);
			if (res.ok) {
				const data = await res.json();
				store.addTask({
					...data,
					deliverables: data.deliverables ?? []
				});
			}
		} catch (e) {
			console.error(e);
		}
	});

	function typeBadgeClass(type: TaskType) {
		return type === 'shooting'
			? 'bg-blue-100 text-blue-700'
			: 'bg-purple-100 text-purple-700';
	}

	function statusBadgeClass(status: TaskStatus) {
		const map: Record<TaskStatus, string> = {
			assigned: 'bg-warm-gray-dark text-ink',
			in_progress: 'bg-blue-100 text-blue-700',
			submitted: 'bg-warning-light text-warning',
			reviewing: 'bg-copper-light/30 text-copper',
			completed: 'bg-success-light text-success'
		};
		return map[status];
	}

	async function handleStatusAction() {
		if (!task) return;
		const action = statusActions[task.status];
		if (!action) return;
		try {
			const res = await fetch(`/api/tasks/${task.id}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: action.nextStatus })
			});
			if (!res.ok) throw new Error('状态更新失败');
			store.updateTaskStatus(task.id, action.nextStatus);
		} catch (e) {
			console.error(e);
			alert('状态更新失败');
		}
	}

	async function handleSubmitDeliverable() {
		if (!task || !deliverableNote.trim()) return;
		const payload = {
			fileUrl: `/deliverables/${crypto.randomUUID()}.${deliverableFileType.split('/')[1]}`,
			fileType: deliverableFileType,
			note: deliverableNote
		};
		try {
			const res = await fetch(`/api/tasks/${task.id}/deliverables`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('提交失败');
			const created = await res.json();
			store.addDeliverable({ ...payload, id: created.id, taskId: task.id, submittedAt: created.submittedAt });
			showDeliverableForm = false;
			deliverableFileType = 'video/mp4';
			deliverableNote = '';
		} catch (e) {
			console.error(e);
			alert('提交交付物失败');
		}
	}

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString('zh-CN');
	}

	function formatDateTime(d: Date | string) {
		return new Date(d).toLocaleString('zh-CN');
	}
</script>

{#if task}
	<div class="min-h-screen bg-warm-gray">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
			<a
				href="/tasks"
				class="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-copper transition-colors mb-4"
			>
				<ArrowLeft size={16} />
				返回任务列表
			</a>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex flex-wrap items-start justify-between gap-4 mb-4">
					<div>
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs px-2 py-0.5 rounded-full {typeBadgeClass(task.type)}">
								{TASK_TYPE_LABELS[task.type]}
							</span>
							<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(task.status)}">
								{TASK_STATUS_LABELS[task.status]}
							</span>
							{#if isOverdue}
								<span class="text-xs px-2 py-0.5 rounded-full bg-danger-light text-danger">已逾期</span>
							{/if}
						</div>
						<h1 class="text-xl font-bold text-ink">{task.title}</h1>
					</div>
					{#if statusActions[task.status]}
						<button
							onclick={handleStatusAction}
							class="{task.status === 'reviewing' ? 'bg-success hover:bg-success/90' : 'bg-copper hover:bg-copper-dark'} text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
						>
							{statusActions[task.status]!.label}
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					{#if topic}
						<div class="flex items-center gap-2 text-ink/70">
							<FileText size={16} class="text-copper" />
							<span>选题：</span>
							<a href="/topics/{topic.id}" class="text-copper hover:underline">{topic.title}</a>
						</div>
					{/if}
					{#if assignee}
						<div class="flex items-center gap-2 text-ink/70">
							<User size={16} class="text-copper" />
							<span>执行人：</span>
							<span class="font-medium text-ink">{assignee.name}</span>
						</div>
					{/if}
					<div class="flex items-center gap-2 {isOverdue ? 'text-danger' : 'text-ink/70'}">
						<Calendar size={16} class="{isOverdue ? 'text-danger' : 'text-copper'}" />
						<span>截止日期：</span>
						<span class="font-medium {isOverdue ? 'text-danger' : 'text-ink'}">{task.deadline}</span>
					</div>
					{#if creator}
						<div class="flex items-center gap-2 text-ink/70">
							<User size={16} class="text-copper" />
							<span>创建人：</span>
							<span class="font-medium text-ink">{creator.name}</span>
						</div>
					{/if}
				</div>

				{#if task.description}
					<div class="mt-4 pt-4 border-t border-warm-gray-dark">
						<h3 class="text-sm font-semibold text-ink/70 mb-2">任务描述</h3>
						<p class="text-sm text-ink/80 whitespace-pre-wrap">{task.description}</p>
					</div>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-base font-bold text-ink">交付物</h2>
					{#if task.status !== 'completed'}
						<button
							onclick={() => (showDeliverableForm = true)}
							class="flex items-center gap-1 text-sm text-copper hover:text-copper-dark transition-colors"
						>
							<Plus size={16} />
							提交交付物
						</button>
					{/if}
				</div>

				{#if showDeliverableForm}
					<div class="bg-warm-gray rounded-lg p-4 mb-4 space-y-3">
						<div>
							<label class="block text-sm font-medium text-ink/70 mb-1">文件类型</label>
							<select
								bind:value={deliverableFileType}
								class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
							>
								<option value="video/mp4">视频 (MP4)</option>
								<option value="video/mov">视频 (MOV)</option>
								<option value="image/jpeg">图片 (JPEG)</option>
								<option value="image/png">图片 (PNG)</option>
								<option value="audio/mp3">音频 (MP3)</option>
								<option value="document/pdf">文档 (PDF)</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-ink/70 mb-1">备注</label>
							<textarea
								bind:value={deliverableNote}
								rows="2"
								class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
								placeholder="交付物说明"
							></textarea>
						</div>
						<div class="flex justify-end gap-2">
							<button
								onclick={() => (showDeliverableForm = false)}
								class="px-3 py-1.5 text-sm rounded-lg border border-warm-gray-dark text-ink/60 hover:bg-warm-gray transition-colors"
							>
								取消
							</button>
							<button
								onclick={handleSubmitDeliverable}
								disabled={!deliverableNote.trim()}
								class="px-3 py-1.5 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors disabled:opacity-50"
							>
								提交
							</button>
						</div>
					</div>
				{/if}

				{#if task.deliverables.length === 0}
					<p class="text-sm text-ink/40 text-center py-4">暂无交付物</p>
				{:else}
					<div class="space-y-3">
						{#each task.deliverables as dv}
							<div class="flex items-start gap-3 p-3 bg-warm-gray rounded-lg">
								<Paperclip size={16} class="text-copper mt-0.5 shrink-0" />
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 text-sm font-medium text-ink">
										<span class="text-xs px-2 py-0.5 rounded bg-ink/10 text-ink/60">{dv.fileType}</span>
										<span class="text-xs text-ink/40">{formatDate(dv.submittedAt)}</span>
									</div>
									<p class="text-sm text-ink/70 mt-1">{dv.note}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6">
				<h2 class="text-base font-bold text-ink mb-4">状态时间线</h2>
				<div class="relative">
					{#each statusTimeline as status, i}
						{@const isActive = statusTimeline.indexOf(task.status) >= i}
						{@const isCurrent = task.status === status}
						<div class="flex items-start gap-3 pb-6 last:pb-0">
							<div class="flex flex-col items-center">
								<div
									class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {isActive ? 'bg-copper text-white' : 'bg-warm-gray-dark text-ink/30'}"
								>
									{#if isCurrent}
										<CheckCircle2 size={18} />
									{:else if isActive}
										<CheckCircle2 size={18} />
									{:else}
										<span class="text-xs font-bold">{i + 1}</span>
									{/if}
								</div>
								{#if i < statusTimeline.length - 1}
									<div class="w-0.5 h-6 {isActive && statusTimeline.indexOf(task.status) > i ? 'bg-copper' : 'bg-warm-gray-dark'}"></div>
								{/if}
							</div>
							<div class="pt-1">
								<span class="text-sm font-medium {isCurrent ? 'text-ink' : isActive ? 'text-ink/70' : 'text-ink/30'}">
									{TASK_STATUS_LABELS[status]}
								</span>
								{#if isCurrent}
									<span class="text-xs text-ink/40 ml-2">当前状态</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-warm-gray flex items-center justify-center">
		<p class="text-ink/40">任务不存在</p>
	</div>
{/if}
