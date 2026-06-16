<script lang="ts">
	import { page } from '$app/stores';
	import { store } from '$lib/stores/mock-data.svelte';
	import type { TopicStatus, Script, Material } from '$lib/types';
	import {
		TOPIC_STATUS_LABELS,
		TASK_STATUS_LABELS,
		TASK_TYPE_LABELS,
		SCHEDULE_STATUS_LABELS,
		MATERIAL_TYPE_LABELS
	} from '$lib/types';
	import {
		ArrowLeft,
		Check,
		X,
		Save,
		Plus,
		ChevronDown,
		ChevronUp,
		Pencil,
		User,
		Calendar,
		Trash2,
		Tag,
		FileCode,
		Link2,
		ClipboardList,
		CalendarClock,
		BookOpen
	} from 'lucide-svelte';

	let topicId = $derived($page.params.id);
	let topic = $derived(store.topics.find((t) => t.id === topicId));

	let editingDescription = $state(false);
	let descriptionDraft = $state('');
	let expandedScripts = $state<Set<string>>(new Set());
	let showScriptEditor = $state(false);
	let scriptContent = $state('');
	let showMaterialPicker = $state(false);
	let editingSourceNotes = $state(false);
	let sourceNotesDraft = $state('');

	let relatedTasks = $derived(store.tasks.filter((t) => t.topicId === topicId));
	let relatedSchedules = $derived(store.schedules.filter((s) => s.topicId === topicId));
	let sourceRecord = $derived(store.getTopicSourceRecord(topicId));

	let availableMaterials = $derived(
		store.materials.filter(
			(m) => !topic?.materials.some((tm) => tm.id === m.id)
		)
	);

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

	function taskStatusColor(status: string) {
		const map: Record<string, string> = {
			assigned: 'bg-gray-100 text-gray-600',
			in_progress: 'bg-blue-50 text-blue-600',
			submitted: 'bg-copper/10 text-copper',
			reviewing: 'bg-warning-light text-warning',
			completed: 'bg-success-light text-success'
		};
		return map[status] ?? 'bg-gray-100 text-gray-600';
	}

	function scheduleStatusColor(status: string) {
		const map: Record<string, string> = {
			scheduled: 'bg-blue-50 text-blue-600',
			published: 'bg-success-light text-success',
			cancelled: 'bg-danger-light text-danger'
		};
		return map[status] ?? 'bg-gray-100 text-gray-600';
	}

	function handleStatusAction(status: TopicStatus) {
		if (!topic) return;
		store.updateTopicStatus(topic.id, status);
	}

	function startEditDescription() {
		if (!topic) return;
		descriptionDraft = topic.description;
		editingDescription = true;
	}

	function saveDescription() {
		if (!topic) return;
		store.updateTopic(topic.id, { description: descriptionDraft });
		editingDescription = false;
	}

	function toggleScriptExpand(scriptId: string) {
		const next = new Set(expandedScripts);
		if (next.has(scriptId)) {
			next.delete(scriptId);
		} else {
			next.add(scriptId);
		}
		expandedScripts = next;
	}

	function handleAddScript() {
		if (!topic || !scriptContent.trim()) return;
		store.addScriptToTopic(topic.id, {
			content: scriptContent.trim(),
			version: 0,
			createdBy: store.getCurrentUser().id
		});
		scriptContent = '';
		showScriptEditor = false;
	}

	function handleAddMaterial(material: Material) {
		if (!topic) return;
		store.addMaterialToTopic(topic.id, material);
	}

	function startEditSourceNotes() {
		if (!sourceRecord) return;
		sourceNotesDraft = sourceRecord.supplementaryNotes;
		editingSourceNotes = true;
	}

	function saveSourceNotes() {
		if (!sourceRecord) return;
		const idx = store.sourceRecords.findIndex((sr) => sr.id === sourceRecord.id);
		if (idx !== -1) {
			store.sourceRecords[idx].supplementaryNotes = sourceNotesDraft;
		}
		editingSourceNotes = false;
	}
</script>

{#if topic}
	<div class="min-h-screen bg-warm-gray">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<a
				href="/topics"
				class="inline-flex items-center gap-1.5 text-sm text-ink-lighter hover:text-ink transition-colors mb-6"
			>
				<ArrowLeft size={16} />
				返回选题列表
			</a>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl font-bold text-ink font-serif mb-2">{topic.title}</h1>
						<span class={statusBadgeClasses(topic.status)}>
							{TOPIC_STATUS_LABELS[topic.status]}
						</span>
					</div>
					<div class="flex flex-wrap gap-2 shrink-0">
						{#if topic.status === 'draft'}
							<button
								onclick={() => handleStatusAction('pending_approval')}
								class="px-4 py-2 text-sm font-medium text-white bg-copper rounded-lg hover:bg-copper-dark transition-colors"
							>
								提交审批
							</button>
						{:else if topic.status === 'pending_approval'}
							<button
								onclick={() => handleStatusAction('approved')}
								class="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 transition-colors"
							>
								通过
							</button>
							<button
								onclick={() => handleStatusAction('draft')}
								class="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors"
							>
								驳回
							</button>
						{:else if topic.status === 'approved'}
							<button
								onclick={() => handleStatusAction('in_production')}
								class="px-4 py-2 text-sm font-medium text-white bg-copper rounded-lg hover:bg-copper-dark transition-colors"
							>
								进入制作
							</button>
						{:else if topic.status === 'in_production'}
							<button
								onclick={() => handleStatusAction('published')}
								class="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 transition-colors"
							>
								标记发布
							</button>
						{/if}
					</div>
				</div>
				<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-lighter">
					<span class="flex items-center gap-1.5">
						<User size={14} />
						创建人: {getUserName(topic.createdBy)}
					</span>
					{#if topic.approvedBy}
						<span class="flex items-center gap-1.5">
							<Check size={14} />
							审批人: {getUserName(topic.approvedBy)}
						</span>
					{/if}
					<span class="flex items-center gap-1.5">
						<Calendar size={14} />
						创建: {formatDate(topic.createdAt)}
					</span>
					<span class="flex items-center gap-1.5">
						<Calendar size={14} />
						更新: {formatDate(topic.updatedAt)}
					</span>
				</div>
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-ink font-serif">描述</h2>
					{#if !editingDescription}
						<button
							onclick={startEditDescription}
							class="p-1.5 rounded-md text-ink-lighter hover:text-ink hover:bg-warm-gray transition-colors"
						>
							<Pencil size={15} />
						</button>
					{/if}
				</div>
				{#if editingDescription}
					<textarea
						bind:value={descriptionDraft}
						rows={4}
						class="w-full px-3 py-2 border border-warm-gray-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white resize-none mb-3"
					></textarea>
					<div class="flex justify-end gap-2">
						<button
							onclick={() => (editingDescription = false)}
							class="px-3 py-1.5 text-sm text-ink-lighter hover:text-ink rounded-md hover:bg-warm-gray transition-colors"
						>
							取消
						</button>
						<button
							onclick={saveDescription}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-copper rounded-md hover:bg-copper-dark transition-colors"
						>
							<Save size={14} />
							保存
						</button>
					</div>
				{:else}
					<p class="text-sm text-ink-light leading-relaxed whitespace-pre-wrap">
						{topic.description || '暂无描述'}
					</p>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-ink font-serif flex items-center gap-2">
						<FileCode size={18} />
						脚本
					</h2>
					<button
						onclick={() => (showScriptEditor = true)}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-copper hover:bg-copper/5 rounded-md transition-colors"
					>
						<Plus size={14} />
						新建脚本版本
					</button>
				</div>

				{#if showScriptEditor}
					<div class="border border-warm-gray-dark rounded-lg p-4 mb-4 bg-warm-gray/30">
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-ink">新建脚本 v{topic.scripts.length + 1}</span>
							<button
								onclick={() => {
									showScriptEditor = false;
									scriptContent = '';
								}}
								class="p-1 rounded text-ink-lighter hover:text-ink hover:bg-warm-gray transition-colors"
							>
								<X size={16} />
							</button>
						</div>
						<textarea
							bind:value={scriptContent}
							rows={8}
							placeholder="输入脚本内容..."
							class="w-full px-3 py-2 border border-warm-gray-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white resize-none mb-3"
						></textarea>
						<div class="flex justify-end gap-2">
							<button
								onclick={() => {
									showScriptEditor = false;
									scriptContent = '';
								}}
								class="px-3 py-1.5 text-sm text-ink-lighter hover:text-ink rounded-md hover:bg-warm-gray transition-colors"
							>
								取消
							</button>
							<button
								onclick={handleAddScript}
								disabled={!scriptContent.trim()}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-copper rounded-md hover:bg-copper-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Save size={14} />
								保存
							</button>
						</div>
					</div>
				{/if}

				{#if topic.scripts.length === 0}
					<p class="text-sm text-ink-lighter">暂无脚本</p>
				{:else}
					<div class="space-y-2">
						{#each [...topic.scripts].sort((a, b) => b.version - a.version) as script}
							{@const isExpanded = expandedScripts.has(script.id)}
							<div class="border border-warm-gray-dark rounded-lg overflow-hidden">
								<button
									onclick={() => toggleScriptExpand(script.id)}
									class="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-gray/50 transition-colors text-left"
								>
									<div class="flex items-center gap-3">
										<span class="text-sm font-semibold text-copper">v{script.version}</span>
										<span class="text-xs text-ink-lighter">
											{getUserName(script.createdBy)} · {formatDate(script.createdAt)}
										</span>
									</div>
									{#if isExpanded}
										<ChevronUp size={16} class="text-ink-lighter" />
									{:else}
										<ChevronDown size={16} class="text-ink-lighter" />
									{/if}
								</button>
								{#if isExpanded}
									<div class="px-4 pb-4 border-t border-warm-gray-dark/50">
										<p class="text-sm text-ink-light leading-relaxed whitespace-pre-wrap mt-3">
											{script.content}
										</p>
									</div>
								{:else}
									<div class="px-4 pb-3">
										<p class="text-xs text-ink-lighter line-clamp-1">{script.content}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-ink font-serif flex items-center gap-2">
						<Link2 size={18} />
						关联素材
					</h2>
					<button
						onclick={() => (showMaterialPicker = true)}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-copper hover:bg-copper/5 rounded-md transition-colors"
					>
						<Plus size={14} />
						添加素材
					</button>
				</div>

				{#if showMaterialPicker}
					<div class="border border-warm-gray-dark rounded-lg p-4 mb-4 bg-warm-gray/30">
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-ink">选择素材</span>
							<button
								onclick={() => (showMaterialPicker = false)}
								class="p-1 rounded text-ink-lighter hover:text-ink hover:bg-warm-gray transition-colors"
							>
								<X size={16} />
							</button>
						</div>
						{#if availableMaterials.length === 0}
							<p class="text-sm text-ink-lighter">没有可添加的素材</p>
						{:else}
							<div class="space-y-2 max-h-60 overflow-y-auto">
								{#each availableMaterials as material}
									<button
										onclick={() => {
											handleAddMaterial(material);
										}}
										class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-warm-gray-dark hover:border-copper/40 hover:bg-copper/5 transition-colors text-left"
									>
										<div>
											<div class="text-sm font-medium text-ink">{material.title}</div>
											<div class="text-xs text-ink-lighter mt-0.5">
												{MATERIAL_TYPE_LABELS[material.type]} · {formatDate(material.createdAt)}
											</div>
										</div>
										<Plus size={16} class="text-copper shrink-0" />
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if topic.materials.length === 0}
					<p class="text-sm text-ink-lighter">暂无关联素材</p>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each topic.materials as material}
							<div class="border border-warm-gray-dark rounded-lg p-4 flex items-start justify-between gap-3 hover:bg-warm-gray/30 transition-colors">
								<div class="min-w-0 flex-1">
									<div class="text-sm font-medium text-ink mb-1 truncate">{material.title}</div>
									<div class="text-xs text-ink-lighter mb-2">
										{MATERIAL_TYPE_LABELS[material.type]}
									</div>
									{#if material.tags.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each material.tags as tag}
												<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-warm-gray text-ink-lighter">
													<Tag size={8} />
													{tag.name}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<h2 class="text-lg font-semibold text-ink font-serif flex items-center gap-2 mb-4">
					<BookOpen size={18} />
					来源记录
				</h2>
				{#if sourceRecord}
					<div class="mb-4">
						<div class="text-xs text-ink-lighter mb-2">
							记录人: {getUserName(sourceRecord.createdBy)} · {formatDate(sourceRecord.createdAt)}
						</div>
						{#if editingSourceNotes}
							<textarea
								bind:value={sourceNotesDraft}
								rows={3}
								class="w-full px-3 py-2 border border-warm-gray-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper bg-white resize-none mb-3"
							></textarea>
							<div class="flex justify-end gap-2">
								<button
									onclick={() => (editingSourceNotes = false)}
									class="px-3 py-1.5 text-sm text-ink-lighter hover:text-ink rounded-md hover:bg-warm-gray transition-colors"
								>
									取消
								</button>
								<button
									onclick={saveSourceNotes}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-copper rounded-md hover:bg-copper-dark transition-colors"
								>
									<Save size={14} />
									保存
								</button>
							</div>
						{:else}
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm text-ink-light leading-relaxed whitespace-pre-wrap flex-1">
									{sourceRecord.supplementaryNotes || '暂无补充说明'}
								</p>
								<button
									onclick={startEditSourceNotes}
									class="p-1.5 rounded-md text-ink-lighter hover:text-ink hover:bg-warm-gray transition-colors shrink-0"
								>
									<Pencil size={15} />
								</button>
							</div>
						{/if}
					</div>
					{#if sourceRecord.references.length > 0}
						<div class="border-t border-warm-gray-dark pt-4">
							<h3 class="text-sm font-medium text-ink mb-3">引用记录</h3>
							<div class="space-y-1.5">
								{#each sourceRecord.references as ref}
									<div class="flex items-center gap-2 text-sm">
										<span
											class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium {ref.refType === 'material'
												? 'bg-copper/10 text-copper'
												: ref.refType === 'task'
													? 'bg-blue-50 text-blue-600'
													: 'bg-success-light text-success'}"
										>
											{ref.refType === 'material' ? '素材' : ref.refType === 'task' ? '任务' : '排期'}
										</span>
										<span class="text-ink-light">{ref.refLabel}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<p class="text-sm text-ink-lighter">暂无来源记录</p>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<h2 class="text-lg font-semibold text-ink font-serif flex items-center gap-2 mb-4">
					<ClipboardList size={18} />
					关联任务
				</h2>
				{#if relatedTasks.length === 0}
					<p class="text-sm text-ink-lighter">暂无关联任务</p>
				{:else}
					<div class="space-y-3">
						{#each relatedTasks as task}
							<div class="border border-warm-gray-dark rounded-lg p-4 hover:bg-warm-gray/30 transition-colors">
								<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-copper/10 text-copper">
											{TASK_TYPE_LABELS[task.type]}
										</span>
										<span class="text-sm font-medium text-ink">{task.title}</span>
									</div>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {taskStatusColor(task.status)}">
										{TASK_STATUS_LABELS[task.status]}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-lighter">
									<span class="flex items-center gap-1">
										<User size={12} />
										{getUserName(task.assigneeId)}
									</span>
									<span class="flex items-center gap-1">
										<CalendarClock size={12} />
										截止: {task.deadline}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-card rounded-xl shadow-sm p-6 mb-6">
				<h2 class="text-lg font-semibold text-ink font-serif flex items-center gap-2 mb-4">
					<CalendarClock size={18} />
					关联排期
				</h2>
				{#if relatedSchedules.length === 0}
					<p class="text-sm text-ink-lighter">暂无关联排期</p>
				{:else}
					<div class="space-y-3">
						{#each relatedSchedules as schedule}
							<div class="border border-warm-gray-dark rounded-lg p-4 hover:bg-warm-gray/30 transition-colors">
								<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-copper/10 text-copper">
											{schedule.platform}
										</span>
										<span class="text-sm font-medium text-ink">{schedule.accountName}</span>
									</div>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {scheduleStatusColor(schedule.status)}">
										{SCHEDULE_STATUS_LABELS[schedule.status]}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-lighter">
									<span class="flex items-center gap-1">
										<Calendar size={12} />
										{schedule.publishDate} {schedule.publishTime}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-warm-gray flex items-center justify-center">
		<p class="text-ink-lighter">未找到该选题</p>
	</div>
{/if}
