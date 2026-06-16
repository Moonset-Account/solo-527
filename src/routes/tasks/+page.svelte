<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		TASK_STATUS_LABELS,
		TASK_TYPE_LABELS
	} from '$lib/types';
	import type { TaskType, TaskStatus } from '$lib/types';
	import { Plus, Filter, ChevronDown, Calendar, User, X } from 'lucide-svelte';

	let showNewDialog = $state(false);
	let typeFilter = $state<TaskType | 'all'>('all');
	let statusFilter = $state<TaskStatus | 'all'>('all');
	let assigneeFilter = $state('all');

	let newTitle = $state('');
	let newType = $state<TaskType>('shooting');
	let newDescription = $state('');
	let newTopicId = $state('');
	let newAssigneeId = $state('');
	let newDeadline = $state('');

	const allStatuses: TaskStatus[] = ['assigned', 'in_progress', 'submitted', 'reviewing', 'completed'];
	const allTypes: TaskType[] = ['shooting', 'editing'];

	let filteredTasks = $derived.by(() => {
		let result = store.tasks;
		if (typeFilter !== 'all') result = result.filter((t) => t.type === typeFilter);
		if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
		if (assigneeFilter !== 'all') result = result.filter((t) => t.assigneeId === assigneeFilter);
		return result;
	});

	let kanbanColumns = $derived.by(() => {
		const cols: Record<TaskStatus, typeof store.tasks> = {
			assigned: [],
			in_progress: [],
			submitted: [],
			reviewing: [],
			completed: []
		};
		for (const task of filteredTasks) {
			cols[task.status].push(task);
		}
		return cols;
	});

	let assigneeOptions = $derived(
		store.users.filter((u) => u.role === 'shooter' || u.role === 'cutter')
	);

	function getUserName(id: string) {
		return store.users.find((u) => u.id === id)?.name ?? '未知';
	}

	function getTopicTitle(id: string) {
		return store.topics.find((t) => t.id === id)?.title ?? '未知选题';
	}

	function isOverdue(deadline: string) {
		return new Date(deadline) < new Date();
	}

	function resetForm() {
		newTitle = '';
		newType = 'shooting';
		newDescription = '';
		newTopicId = '';
		newAssigneeId = '';
		newDeadline = '';
	}

	async function handleCreate() {
		if (!newTitle || !newTopicId || !newAssigneeId || !newDeadline) return;
		const payload = {
			topicId: newTopicId,
			type: newType,
			title: newTitle,
			description: newDescription,
			status: 'assigned',
			assigneeId: newAssigneeId,
			deadline: newDeadline,
			createdBy: store.getCurrentUser().id
		};
		try {
			const res = await fetch('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('创建失败');
			const created = await res.json();
			store.addTask({
				...payload,
				id: created.id,
				createdAt: new Date(created.createdAt),
				updatedAt: new Date(created.updatedAt || created.createdAt)
			});
			showNewDialog = false;
			resetForm();
		} catch (e) {
			console.error(e);
			alert('创建任务失败');
		}
	}

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
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-ink">任务分派</h1>
			<button
				onclick={() => (showNewDialog = true)}
				class="flex items-center gap-2 bg-copper text-white px-4 py-2 rounded-lg hover:bg-copper-dark transition-colors"
			>
				<Plus size={18} />
				新建任务
			</button>
		</div>

		<div class="bg-card rounded-xl shadow-sm p-4 mb-6 space-y-4">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm font-medium text-ink/60 mr-1">类型</span>
				<button
					class="px-3 py-1 rounded-full text-sm transition-colors {typeFilter === 'all' ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
					onclick={() => (typeFilter = 'all')}
				>
					全部
				</button>
				{#each allTypes as t}
					<button
						class="px-3 py-1 rounded-full text-sm transition-colors {typeFilter === t ? 'bg-ink text-white' : 'bg-warm-gray text-ink/70 hover:bg-warm-gray-dark'}"
						onclick={() => (typeFilter = t)}
					>
						{TASK_TYPE_LABELS[t]}
					</button>
				{/each}
			</div>

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
						{TASK_STATUS_LABELS[s]}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-ink/60 mr-1">执行人</span>
				<select
					bind:value={assigneeFilter}
					class="border border-warm-gray-dark rounded-lg px-3 py-1.5 text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-copper/40"
				>
					<option value="all">全部</option>
					{#each store.users as u}
						<option value={u.id}>{u.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="hidden lg:grid lg:grid-cols-5 gap-4">
			{#each allStatuses as status}
				<div class="bg-warm-gray/60 rounded-xl p-3">
					<div class="flex items-center justify-between mb-3">
						<span class="text-sm font-semibold text-ink/70">{TASK_STATUS_LABELS[status]}</span>
						<span class="text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full">{kanbanColumns[status].length}</span>
					</div>
					<div class="space-y-3 min-h-[120px]">
						{#each kanbanColumns[status] as task}
							<a
								href="/tasks/{task.id}"
								class="block bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 {task.type === 'shooting' ? 'border-l-blue-500' : 'border-l-purple-500'}"
							>
								<div class="flex items-center gap-2 mb-2">
									<span class="text-xs px-2 py-0.5 rounded-full {typeBadgeClass(task.type)}">
										{TASK_TYPE_LABELS[task.type]}
									</span>
									<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(task.status)}">
										{TASK_STATUS_LABELS[task.status]}
									</span>
								</div>
								<h3 class="text-sm font-semibold text-ink mb-1 line-clamp-2">{task.title}</h3>
								<div class="flex items-center gap-1 text-xs text-ink/50 mb-1">
									<User size={12} />
									{getUserName(task.assigneeId)}
								</div>
								<div class="flex items-center gap-1 text-xs {isOverdue(task.deadline) && task.status !== 'completed' ? 'text-danger' : 'text-ink/50'}">
									<Calendar size={12} />
									{task.deadline}
								</div>
								<div class="text-xs text-copper mt-1 truncate">{getTopicTitle(task.topicId)}</div>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="lg:hidden space-y-3">
			{#each filteredTasks as task}
				<a
					href="/tasks/{task.id}"
					class="block bg-card rounded-xl p-4 shadow-sm border-l-4 {task.type === 'shooting' ? 'border-l-blue-500' : 'border-l-purple-500'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs px-2 py-0.5 rounded-full {typeBadgeClass(task.type)}">
							{TASK_TYPE_LABELS[task.type]}
						</span>
						<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(task.status)}">
							{TASK_STATUS_LABELS[task.status]}
						</span>
					</div>
					<h3 class="text-base font-semibold text-ink mb-1">{task.title}</h3>
					<div class="flex items-center gap-3 text-sm text-ink/60">
						<span class="flex items-center gap-1"><User size={14} />{getUserName(task.assigneeId)}</span>
						<span class="flex items-center gap-1 {isOverdue(task.deadline) && task.status !== 'completed' ? 'text-danger' : ''}">
							<Calendar size={14} />{task.deadline}
						</span>
					</div>
					<div class="text-xs text-copper mt-1">{getTopicTitle(task.topicId)}</div>
				</a>
			{/each}
		</div>
	</div>
</div>

{#if showNewDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onclick={() => (showNewDialog = false)}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-ink">新建任务</h2>
				<button onclick={() => (showNewDialog = false)} class="text-ink/40 hover:text-ink">
					<X size={20} />
				</button>
			</div>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">任务标题</label>
					<input
						type="text"
						bind:value={newTitle}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="输入任务标题"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">任务类型</label>
					<select
						bind:value={newType}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						{#each allTypes as t}
							<option value={t}>{TASK_TYPE_LABELS[t]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">任务描述</label>
					<textarea
						bind:value={newDescription}
						rows="3"
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="输入任务描述"
					></textarea>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">关联选题</label>
					<select
						bind:value={newTopicId}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						<option value="">请选择选题</option>
						{#each store.topics as topic}
							<option value={topic.id}>{topic.title}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">执行人</label>
					<select
						bind:value={newAssigneeId}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						<option value="">请选择执行人</option>
						{#each assigneeOptions as u}
							<option value={u.id}>{u.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">截止日期</label>
					<input
						type="date"
						bind:value={newDeadline}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
					/>
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
					disabled={!newTitle || !newTopicId || !newAssigneeId || !newDeadline}
					class="px-4 py-2 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					创建
				</button>
			</div>
		</div>
	</div>
{/if}
