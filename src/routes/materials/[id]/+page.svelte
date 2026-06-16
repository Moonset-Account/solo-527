<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import type { MaterialType, Tag } from '$lib/types';
	import { MATERIAL_TYPE_LABELS, TOPIC_STATUS_LABELS } from '$lib/types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		Image,
		Video,
		FileText,
		Music,
		X,
		Plus,
		Calendar,
		HardDrive,
		Link2,
		Clock
	} from 'lucide-svelte';

	let id = $derived($page.params.id);
	let material = $derived(store.materials.find((m) => m.id === id));
	let uploader = $derived(material ? store.users.find((u) => u.id === material.uploadedBy) : null);
	let reuseRecords = $derived(material ? store.getMaterialReuseRecords(material.id) : []);
	let linkedTopics = $derived(
		material
			? store.topics.filter((t) => t.materials.some((m) => m.id === material.id))
			: []
	);

	let isEditingTitle = $state(false);
	let editTitleValue = $state('');
	let showTagDropdown = $state(false);
	let selectedTagId = $state<string | null>(null);

	const typeBadgeColors: Record<MaterialType, string> = {
		image: 'bg-blue-100 text-blue-700',
		video: 'bg-purple-100 text-purple-700',
		document: 'bg-amber-100 text-amber-700',
		audio: 'bg-green-100 text-green-700'
	};

	const typeIcons: Record<MaterialType, typeof Image> = {
		image: Image,
		video: Video,
		document: FileText,
		audio: Music
	};

	const targetTypeLabels: Record<string, string> = {
		topic: '选题',
		task: '任务',
		schedule: '排期'
	};

	const topicStatusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		pending_approval: 'bg-yellow-100 text-yellow-700',
		approved: 'bg-blue-100 text-blue-700',
		in_production: 'bg-purple-100 text-purple-700',
		published: 'bg-green-100 text-green-700',
		archived: 'bg-gray-100 text-gray-500'
	};

	let availableTagsToAdd = $derived(
		material
			? store.tags.filter((t) => !material.tags.some((mt) => mt.id === t.id))
			: []
	);

	function formatFileSize(bytes: number): string {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
		if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return bytes + ' B';
	}

	function formatDate(d: Date): string {
		return d.toISOString().slice(0, 10);
	}

	function startEditTitle() {
		if (!material) return;
		editTitleValue = material.title;
		isEditingTitle = true;
	}

	function saveTitle() {
		if (!material || !editTitleValue.trim()) return;
		store.updateMaterial(material.id, { title: editTitleValue.trim() });
		isEditingTitle = false;
	}

	function cancelEditTitle() {
		isEditingTitle = false;
	}

	async function handleAddTag() {
		if (!material || !selectedTagId) return;
		const tag = store.tags.find((t) => t.id === selectedTagId);
		if (!tag) return;
		try {
			const res = await fetch(`/api/materials/${material.id}/tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tagId: selectedTagId })
			});
			if (!res.ok) throw new Error('添加标签失败');
			store.addTagToMaterial(material.id, tag);
			selectedTagId = null;
			showTagDropdown = false;
		} catch (e) {
			console.error(e);
			alert('添加标签失败');
		}
	}

	async function handleRemoveTag(tagId: string) {
		if (!material) return;
		try {
			const res = await fetch(`/api/materials/${material.id}/tags`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tagId })
			});
			if (!res.ok) throw new Error('移除标签失败');
			store.removeTagFromMaterial(material.id, tagId);
		} catch (e) {
			console.error(e);
			alert('移除标签失败');
		}
	}

	function getTargetLabel(record: { targetType: string; targetId: string }): string {
		if (record.targetType === 'topic') {
			const topic = store.topics.find((t) => t.id === record.targetId);
			return topic ? topic.title : record.targetId;
		}
		if (record.targetType === 'task') {
			const task = store.tasks.find((t) => t.id === record.targetId);
			return task ? task.title : record.targetId;
		}
		if (record.targetType === 'schedule') {
			const schedule = store.schedules.find((s) => s.id === record.targetId);
			return schedule ? `${schedule.platform} - ${schedule.accountName}` : record.targetId;
		}
		return record.targetId;
	}

	function getUsedByName(userId: string): string {
		const user = store.users.find((u) => u.id === userId);
		return user ? user.name : userId;
	}
</script>

{#if material}
	{@const Icon = typeIcons[material.type]}

	<div class="min-h-screen bg-warm-gray">
		<div class="mx-auto max-w-4xl px-6 py-8">
			<button
				onclick={() => goto('/materials')}
				class="mb-6 flex items-center gap-1 text-sm text-ink-lighter transition-colors hover:text-ink"
			>
				<ArrowLeft size={16} />
				返回素材库
			</button>

			<div class="rounded-xl bg-card p-6 shadow-sm">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex-1">
						{#if isEditingTitle}
							<div class="flex items-center gap-2">
								<input
									type="text"
									bind:value={editTitleValue}
									class="flex-1 rounded-lg border border-copper px-3 py-1.5 text-xl font-bold text-ink focus:outline-none"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveTitle();
										if (e.key === 'Escape') cancelEditTitle();
									}}
								/>
								<button
									onclick={saveTitle}
									class="rounded-lg bg-copper px-3 py-1.5 text-sm text-white hover:bg-copper-dark"
									>保存</button
								>
								<button
									onclick={cancelEditTitle}
									class="rounded-lg border border-warm-gray-dark px-3 py-1.5 text-sm text-ink hover:bg-warm-gray"
									>取消</button
								>
							</div>
						{:else}
							<h1
								class="cursor-pointer font-serif text-xl font-bold text-ink hover:text-copper"
								onclick={startEditTitle}
							>
								{material.title}
							</h1>
						{/if}
					</div>
					<span
						class="ml-4 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium {typeBadgeColors[material.type]}"
					>
						<Icon size={12} />
						{MATERIAL_TYPE_LABELS[material.type]}
					</span>
				</div>

				<div class="space-y-2 text-sm text-ink-lighter">
					<div class="flex items-center gap-2">
						<Link2 size={14} />
						<span>文件地址：{material.fileUrl}</span>
					</div>
					<div class="flex items-center gap-2">
						<HardDrive size={14} />
						<span>文件大小：{formatFileSize(material.fileSize)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Calendar size={14} />
						<span>上传时间：{formatDate(material.createdAt)}</span>
					</div>
					<div class="flex items-center gap-2">
						<span>上传者：{uploader?.name ?? '未知'}</span>
					</div>
				</div>
			</div>

			<div class="mt-6 rounded-xl bg-card p-6 shadow-sm">
				<h2 class="mb-3 font-serif text-base font-bold text-ink">标签</h2>
				<div class="mb-3 flex flex-wrap gap-2">
					{#each material.tags as tag (tag.id)}
						<span
							class="inline-flex items-center gap-1 rounded-full border border-warm-gray-dark bg-warm-gray px-3 py-1 text-xs text-ink"
						>
							{tag.name}
							<button
								onclick={() => handleRemoveTag(tag.id)}
								class="ml-0.5 text-ink-lighter hover:text-danger"
							>
								<X size={12} />
							</button>
						</span>
					{/each}
					{#if material.tags.length === 0}
						<span class="text-xs text-ink-lighter">暂无标签</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if showTagDropdown}
						<select
							bind:value={selectedTagId}
							class="rounded-lg border border-warm-gray-dark px-3 py-1.5 text-sm text-ink focus:border-copper focus:outline-none"
						>
							<option value={null}>选择标签</option>
							{#each availableTagsToAdd as tag}
								<option value={tag.id}>{tag.name}</option>
							{/each}
						</select>
						<button
							onclick={handleAddTag}
							disabled={!selectedTagId}
							class="rounded-lg bg-copper px-3 py-1.5 text-sm text-white hover:bg-copper-dark disabled:opacity-50"
							>添加</button
						>
						<button
							onclick={() => (showTagDropdown = false)}
							class="rounded-lg border border-warm-gray-dark px-3 py-1.5 text-sm text-ink hover:bg-warm-gray"
							>取消</button
						>
					{:else}
						<button
							onclick={() => (showTagDropdown = true)}
							class="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-lighter px-3 py-1 text-xs text-ink-lighter hover:border-copper hover:text-copper"
						>
							<Plus size={12} />
							添加标签
						</button>
					{/if}
				</div>
			</div>

			<div class="mt-6 rounded-xl bg-card p-6 shadow-sm">
				<h2 class="mb-3 font-serif text-base font-bold text-ink">复用记录</h2>
				{#if reuseRecords.length === 0}
					<p class="text-sm text-ink-lighter">暂无复用记录</p>
				{:else}
					<div class="relative pl-6">
						<div class="absolute left-2 top-1 bottom-1 w-px bg-warm-gray-dark"></div>
						{#each reuseRecords as record (record.id)}
							<div class="relative mb-4 last:mb-0">
								<div
									class="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-copper bg-card"
								></div>
								<div class="rounded-lg bg-warm-gray/60 p-3">
									<div class="flex items-center gap-2 text-sm">
										<span class="font-medium text-ink">{targetTypeLabels[record.targetType] ?? record.targetType}</span>
										<span class="text-ink-lighter">·</span>
										<span class="text-ink">{getTargetLabel(record)}</span>
									</div>
									<div class="mt-1 flex items-center gap-3 text-xs text-ink-lighter">
										<span>使用人：{getUsedByName(record.usedBy)}</span>
										<span class="flex items-center gap-1">
											<Clock size={10} />
											{formatDate(record.usedAt)}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-6 rounded-xl bg-card p-6 shadow-sm">
				<h2 class="mb-3 font-serif text-base font-bold text-ink">关联选题</h2>
				{#if linkedTopics.length === 0}
					<p class="text-sm text-ink-lighter">暂无关联选题</p>
				{:else}
					<div class="space-y-2">
						{#each linkedTopics as topic (topic.id)}
							<button
								onclick={() => goto(`/topics/${topic.id}`)}
								class="flex w-full items-center justify-between rounded-lg border border-warm-gray-dark p-3 text-left transition-colors hover:border-copper hover:bg-warm-gray/30"
							>
								<span class="text-sm font-medium text-ink">{topic.title}</span>
								<span
									class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {topicStatusColors[topic.status] ?? 'bg-gray-100 text-gray-700'}"
								>
									{TOPIC_STATUS_LABELS[topic.status]}
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-warm-gray">
		<div class="text-center">
			<FileText size={48} class="mx-auto mb-4 text-warm-gray-dark" />
			<p class="text-sm text-ink-lighter">未找到该素材</p>
			<button
				onclick={() => goto('/materials')}
				class="mt-4 text-sm text-copper hover:text-copper-dark"
				>返回素材库</button
			>
		</div>
	</div>
{/if}
