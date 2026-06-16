<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import type { MaterialType } from '$lib/types';
	import { MATERIAL_TYPE_LABELS } from '$lib/types';
	import {
		Search,
		Upload,
		Image,
		Video,
		FileText,
		Music,
		LayoutGrid,
		List,
		X,
		Plus
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let typeFilter = $state<string>('all');
	let selectedTagId = $state<string | null>(null);
	let searchQuery = $state('');
	let viewMode = $state<'grid' | 'list'>('grid');
	let showUploadDialog = $state(false);

	let uploadTitle = $state('');
	let uploadType = $state<MaterialType>('image');

	const typeOptions: { value: string; label: string }[] = [
		{ value: 'all', label: '全部' },
		{ value: 'image', label: MATERIAL_TYPE_LABELS.image },
		{ value: 'video', label: MATERIAL_TYPE_LABELS.video },
		{ value: 'document', label: MATERIAL_TYPE_LABELS.document },
		{ value: 'audio', label: MATERIAL_TYPE_LABELS.audio }
	];

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

	let filteredMaterials = $derived.by(() => {
		let result = store.materials;
		if (typeFilter !== 'all') {
			result = result.filter((m) => m.type === typeFilter);
		}
		if (selectedTagId) {
			result = result.filter((m) => m.tags.some((t) => t.id === selectedTagId));
		}
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((m) => m.title.toLowerCase().includes(q));
		}
		return result;
	});

	function formatFileSize(bytes: number): string {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
		if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return bytes + ' B';
	}

	function formatDate(d: Date): string {
		return d.toISOString().slice(0, 10);
	}

	async function handleUpload() {
		if (!uploadTitle.trim()) return;
		const payload = {
			title: uploadTitle.trim(),
			type: uploadType,
			fileUrl: '/files/upload-' + Date.now(),
			fileSize: Math.floor(Math.random() * 50000000) + 1000000,
			uploadedBy: store.getCurrentUser().id
		};
		try {
			const res = await fetch('/api/materials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('上传失败');
			const created = await res.json();
			store.addMaterial({ ...payload, id: created.id, tags: [], createdAt: new Date(created.createdAt) });
			uploadTitle = '';
			uploadType = 'image';
			showUploadDialog = false;
		} catch (e) {
			console.error(e);
			alert('上传素材失败');
		}
	}

	function navigateToMaterial(id: string) {
		goto(`/materials/${id}`);
	}
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="mx-auto max-w-7xl px-6 py-8">
		<header class="mb-6 flex items-center justify-between">
			<h1 class="font-serif text-2xl font-bold text-ink">素材库</h1>
			<button
				onclick={() => (showUploadDialog = true)}
				class="flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-copper-dark"
			>
				<Upload size={16} />
				上传素材
			</button>
		</header>

		<div class="mb-6 rounded-xl bg-card p-4 shadow-sm">
			<div class="flex flex-wrap items-center gap-3">
				<select
					bind:value={typeFilter}
					class="rounded-lg border border-warm-gray-dark bg-white px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
				>
					{#each typeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>

				<div class="flex flex-wrap items-center gap-2">
					{#each store.tags as tag}
						<button
							onclick={() => (selectedTagId = selectedTagId === tag.id ? null : tag.id)}
							class="rounded-full border px-3 py-1 text-xs transition-colors {selectedTagId === tag.id
								? 'border-copper bg-copper text-white'
								: 'border-warm-gray-dark bg-white text-ink hover:border-copper hover:text-copper'}"
						>
							{tag.name}
						</button>
					{/each}
				</div>

				<div class="relative ml-auto">
					<Search size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-lighter" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索素材..."
						class="rounded-lg border border-warm-gray-dark bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-lighter focus:border-copper focus:outline-none"
					/>
				</div>
			</div>
			<p class="mt-3 text-xs text-ink-lighter">共 {filteredMaterials.length} 个素材</p>
		</div>

		<div class="mb-4 flex items-center justify-end gap-2">
			<button
				onclick={() => (viewMode = 'grid')}
				class="rounded-lg p-2 transition-colors {viewMode === 'grid'
					? 'bg-copper text-white'
					: 'bg-card text-ink-lighter hover:text-ink'}"
			>
				<LayoutGrid size={18} />
			</button>
			<button
				onclick={() => (viewMode = 'list')}
				class="rounded-lg p-2 transition-colors {viewMode === 'list'
					? 'bg-copper text-white'
					: 'bg-card text-ink-lighter hover:text-ink'}"
			>
				<List size={18} />
			</button>
		</div>

		{#if filteredMaterials.length === 0}
			<div class="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
				<FileText size={48} class="mb-4 text-warm-gray-dark" />
				<p class="text-sm text-ink-lighter">没有找到匹配的素材</p>
			</div>
		{:else if viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredMaterials as material (material.id)}
					{@const Icon = typeIcons[material.type]}
					<button
						onclick={() => navigateToMaterial(material.id)}
						class="group flex flex-col rounded-xl bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="mb-3 flex h-20 items-center justify-center rounded-lg {material.type === 'image'
								? 'bg-blue-50'
								: material.type === 'video'
									? 'bg-purple-50'
									: material.type === 'document'
										? 'bg-amber-50'
										: 'bg-green-50'}"
						>
							<Icon
								size={28}
								class={material.type === 'image'
									? 'text-blue-400'
									: material.type === 'video'
										? 'text-purple-400'
										: material.type === 'document'
											? 'text-amber-400'
											: 'text-green-400'}
							/>
						</div>
						<h3 class="mb-2 line-clamp-1 text-sm font-medium text-ink">{material.title}</h3>
						<div class="mb-2 flex flex-wrap gap-1">
							{#each material.tags as tag}
								<span class="rounded bg-warm-gray px-2 py-0.5 text-xs text-ink-lighter">{tag.name}</span>
							{/each}
						</div>
						<div class="mt-auto flex items-center justify-between text-xs text-ink-lighter">
							<span>{formatDate(material.createdAt)}</span>
							<span>{formatFileSize(material.fileSize)}</span>
						</div>
						<span
							class="mt-2 inline-flex self-start rounded-full px-2 py-0.5 text-xs font-medium {typeBadgeColors[material.type]}"
						>
							{MATERIAL_TYPE_LABELS[material.type]}
						</span>
					</button>
				{/each}
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl bg-card shadow-sm">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-warm-gray-dark text-left text-xs font-medium text-ink-lighter">
							<th class="px-4 py-3">标题</th>
							<th class="px-4 py-3">类型</th>
							<th class="px-4 py-3">标签</th>
							<th class="px-4 py-3">上传时间</th>
							<th class="px-4 py-3">大小</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredMaterials as material (material.id)}
							<tr
								class="cursor-pointer border-b border-warm-gray-dark/50 transition-colors hover:bg-warm-gray/50"
								onclick={() => navigateToMaterial(material.id)}
							>
								<td class="px-4 py-3 font-medium text-ink">{material.title}</td>
								<td class="px-4 py-3">
									<span
										class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {typeBadgeColors[material.type]}"
									>
										{MATERIAL_TYPE_LABELS[material.type]}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1">
										{#each material.tags as tag}
											<span class="rounded bg-warm-gray px-2 py-0.5 text-xs text-ink-lighter"
												>{tag.name}</span
											>
										{/each}
									</div>
								</td>
								<td class="px-4 py-3 text-ink-lighter">{formatDate(material.createdAt)}</td>
								<td class="px-4 py-3 text-ink-lighter">{formatFileSize(material.fileSize)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if showUploadDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
		onclick={() => (showUploadDialog = false)}
		role="presentation"
	>
		<div class="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-serif text-lg font-bold text-ink">上传素材</h2>
				<button onclick={() => (showUploadDialog = false)} class="text-ink-lighter hover:text-ink">
					<X size={20} />
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium text-ink">标题</label>
					<input
						type="text"
						bind:value={uploadTitle}
						placeholder="输入素材标题"
						class="w-full rounded-lg border border-warm-gray-dark px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-ink">类型</label>
					<select
						bind:value={uploadType}
						class="w-full rounded-lg border border-warm-gray-dark px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
					>
						{#each Object.entries(MATERIAL_TYPE_LABELS) as [key, label]}
							<option value={key}>{label}</option>
						{/each}
					</select>
				</div>
				<div
					class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-warm-gray-dark py-10 text-ink-lighter"
				>
					<Upload size={32} class="mb-2" />
					<p class="text-sm">拖拽文件到此处</p>
				</div>
				<button
					onclick={handleUpload}
					disabled={!uploadTitle.trim()}
					class="w-full rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-50"
				>
					提交
				</button>
			</div>
		</div>
	</div>
{/if}
