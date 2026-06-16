<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import type { TopicStatus } from '$lib/types';
	import { TOPIC_STATUS_LABELS } from '$lib/types';
	import { Plus, X, FileText, User, Calendar, Link2, FileCode } from 'lucide-svelte';

	let showNewDialog = $state(false);
	let newTitle = $state('');
	let newDescription = $state('');
	let activeStatus = $state<TopicStatus | 'all'>('all');

	const allStatuses: (TopicStatus | 'all')[] = [
		'all',
		'draft',
		'pending_approval',
		'approved',
		'in_production',
		'published',
		'archived'
	];

	const statusLabel = (s: TopicStatus | 'all') =>
		s === 'all' ? '全部' : TOPIC_STATUS_LABELS[s];

	let statusCounts = $derived(() => {
		const counts: Record<string, number> = { all: store.topics.length };
		for (const s of allStatuses) {
			if (s !== 'all') {
				counts[s] = store.topics.filter((t) => t.status === s).length;
			}
		}
		return counts;
	});

	let filteredTopics = $derived(() => {
		const list =
			activeStatus === 'all'
				? [...store.topics]
				: store.topics.filter((t) => t.status === activeStatus);
		return list.sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	function getUserName(id: string) {
		return store.users.find((u) => u.id === id)?.name ?? id;
	}

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	function statusBadgeClasses(status: TopicStatus) {
		const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
		const map: Record<TopicStatus, string> = {
			draft: 'bg-gray-100 text-gray-600',
			pending_approval: 'bg-warning-light text-warning',
			approved: 'bg-copper/10 text-copper',
			in_production: 'bg-blue-50 text-blue-600',
			published: 'bg-success-light text-success',
			archived: 'bg-ink/5 text-ink-lighter'
		};
		return `${base} ${map[status]}`;
	}

	function handleSubmit() {
		if (!newTitle.trim()) return;
		store.addTopic({
			title: newTitle.trim(),
			description: newDescription.trim(),
			status: 'draft',
			createdBy: store.getCurrentUser().id,
			approvedBy: null
		});
		newTitle = '';
		newDescription = '';
		showNewDialog = false;
	}
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-ink">选题管理</h1>
			<button
				onclick={() => (showNewDialog = true)}
				class="inline-flex items-center gap-2 px-4 py-2 bg-copper text-white rounded-lg hover:bg-copper-dark transition-colors text-sm font-medium"
			>
				<Plus size={16} />
				新建选题
			</button>
		</div>

		<div class="mb-6 border-b border-warm-gray-dark">
			<nav class="flex gap-1 -mb-px overflow-x-auto">
				{#each allStatuses as status}
					<button
						onclick={() => (activeStatus = status)}
						class="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors {activeStatus === status
							? 'text-copper border-b-2 border-copper'
							: 'text-ink-lighter hover:text-ink'}"
					>
						{statusLabel(status)}
						<span
							class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs {activeStatus === status
								? 'bg-copper/10 text-copper'
								: 'bg-ink/5 text-ink-lighter'}"
						>
							{statusCounts()[status] ?? 0}
						</span>
					</button>
				{/each}
			</nav>
		</div>

		{#if showNewDialog}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
				onclick={(e) => {
					if (e.target === e.currentTarget) showNewDialog = false;
				}}
			>
				<div class="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
					<div class="flex items-center justify-between mb-5">
						<h2 class="text-lg font-semibold text-ink font-serif">新建选题</h2>
						<button
							onclick={() => (showNewDialog = false)}
							class="p-1 rounded-md text-ink-lighter hover:text-ink hover:bg-warm-gray transition-colors"
						>
							<X size={18} />
						</button>
					</div>
					<div class="space-y-4">
						<div>
							<label for="topic-title" class="block text-sm font-medium text-ink mb-1.5">标题</label>
							<input
								id="topic-title"
								type="text"
								bind:value={newTitle}
								placeholder="输入选题标题"
								class="w-full px-3 py-2 border border-warm-gray-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white"
							/>
						</div>
						<div>
							<label for="topic-desc" class="block text-sm font-medium text-ink mb-1.5">描述</label>
							<textarea
								id="topic-desc"
								bind:value={newDescription}
								placeholder="输入选题描述"
								rows={4}
								class="w-full px-3 py-2 border border-warm-gray-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white resize-none"
							></textarea>
						</div>
					</div>
					<div class="flex justify-end gap-3 mt-6">
						<button
							onclick={() => (showNewDialog = false)}
							class="px-4 py-2 text-sm font-medium text-ink-lighter hover:text-ink rounded-lg hover:bg-warm-gray transition-colors"
						>
							取消
						</button>
						<button
							onclick={handleSubmit}
							disabled={!newTitle.trim()}
							class="px-4 py-2 text-sm font-medium text-white bg-copper rounded-lg hover:bg-copper-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							创建
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="hidden lg:block bg-card rounded-xl shadow-sm overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-warm-gray-dark bg-warm-gray/50">
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">标题</th>
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">状态</th>
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">创建人</th>
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">创建时间</th>
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">关联素材数</th>
						<th class="text-left px-6 py-3.5 text-xs font-semibold text-ink-lighter uppercase tracking-wider">脚本版本</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredTopics() as topic}
						<a href="/topics/{topic.id}" class="contents">
							<tr class="border-b border-warm-gray-dark/50 hover:bg-warm-gray/30 transition-colors cursor-pointer">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<FileText size={16} class="text-ink-lighter shrink-0" />
										<span class="text-sm font-medium text-ink line-clamp-1">{topic.title}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class={statusBadgeClasses(topic.status)}>
										{TOPIC_STATUS_LABELS[topic.status]}
									</span>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-1.5 text-sm text-ink-light">
										<User size={14} />
										{getUserName(topic.createdBy)}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-1.5 text-sm text-ink-light">
										<Calendar size={14} />
										{formatDate(topic.createdAt)}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-1.5 text-sm text-ink-light">
										<Link2 size={14} />
										{topic.materials.length}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-1.5 text-sm text-ink-light">
										<FileCode size={14} />
										v{topic.scripts.length}
									</div>
								</td>
							</tr>
						</a>
					{/each}
				</tbody>
			</table>
			{#if filteredTopics().length === 0}
				<div class="py-12 text-center text-ink-lighter text-sm">暂无选题数据</div>
			{/if}
		</div>

		<div class="lg:hidden space-y-3">
			{#each filteredTopics() as topic}
				<a href="/topics/{topic.id}" class="block">
					<div class="bg-card rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
						<div class="flex items-start justify-between gap-3 mb-3">
							<h3 class="text-sm font-semibold text-ink line-clamp-2">{topic.title}</h3>
							<span class={statusBadgeClasses(topic.status)}>{TOPIC_STATUS_LABELS[topic.status]}</span>
						</div>
						<div class="grid grid-cols-2 gap-2 text-xs text-ink-lighter">
							<div class="flex items-center gap-1">
								<User size={12} />
								{getUserName(topic.createdBy)}
							</div>
							<div class="flex items-center gap-1">
								<Calendar size={12} />
								{formatDate(topic.createdAt)}
							</div>
							<div class="flex items-center gap-1">
								<Link2 size={12} />
								素材 {topic.materials.length}
							</div>
							<div class="flex items-center gap-1">
								<FileCode size={12} />
								脚本 v{topic.scripts.length}
							</div>
						</div>
					</div>
				</a>
			{/each}
			{#if filteredTopics().length === 0}
				<div class="py-12 text-center text-ink-lighter text-sm">暂无选题数据</div>
			{/if}
		</div>
	</div>
</div>
