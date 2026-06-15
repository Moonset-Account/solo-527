<script lang="ts">
	type WorkItem = {
		work: {
			id: string;
			technicianId: string;
			title: string;
			images: string[];
			description: string | null;
			tags: string[] | null;
			isPublished: boolean;
			publishedAt: string | null;
			createdAt: string;
		};
		technician: {
			id: string;
			name: string;
			avatar: string | null;
		} | null;
	};

	type Technician = {
		id: string;
		name: string;
		avatar: string | null;
		specialty: string | null;
		level: string | null;
		isActive: boolean;
	};

	let works = $state<WorkItem[]>([]);
	let technicians = $state<Technician[]>([]);
	let loading = $state(true);

	let techFilter = $state('');
	let statusFilter = $state('');
	let searchQuery = $state('');

	let showModal = $state(false);
	let editingWork = $state<WorkItem | null>(null);
	let submitting = $state(false);

	let formTechId = $state('');
	let formTitle = $state('');
	let formDesc = $state('');
	let formTagsStr = $state('');
	let uploadedUrls = $state<string[]>([]);
	let uploadFiles = $state<File[]>([]);
	let uploadPreview = $state<string[]>([]);

	const statusTabs = [
		{ key: '', label: '全部' },
		{ key: 'published', label: '已发布' },
		{ key: 'unpublished', label: '未发布' }
	];

	let filteredWorks = $derived(
		works.filter((item) => {
			if (techFilter && item.work.technicianId !== techFilter) return false;
			if (statusFilter === 'published' && !item.work.isPublished) return false;
			if (statusFilter === 'unpublished' && item.work.isPublished) return false;
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				if (!item.work.title.toLowerCase().includes(q)) return false;
			}
			return true;
		})
	);

	let stats = $derived({
		total: works.length,
		published: works.filter((w) => w.work.isPublished).length,
		hasImages: works.filter((w) => w.work.images && w.work.images.length > 0).length
	});

	async function loadData() {
		loading = true;
		try {
			const [worksRes, techRes] = await Promise.all([
				fetch('/api/works').then((r) => r.json()),
				fetch('/api/technicians').then((r) => r.json())
			]);
			works = worksRes;
			technicians = techRes;
		} catch (e) {
			console.error('Failed to load data', e);
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingWork = null;
		formTechId = technicians.find((t) => t.isActive)?.id ?? '';
		formTitle = '';
		formDesc = '';
		formTagsStr = '';
		uploadedUrls = [];
		uploadFiles = [];
		uploadPreview = [];
		showModal = true;
	}

	function openEdit(item: WorkItem) {
		editingWork = item;
		formTechId = item.work.technicianId;
		formTitle = item.work.title;
		formDesc = item.work.description ?? '';
		formTagsStr = (item.work.tags ?? []).join(', ');
		uploadedUrls = [...(item.work.images ?? [])];
		uploadFiles = [];
		uploadPreview = [];
		showModal = true;
	}

	function onFilesSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;
		const files = Array.from(input.files);
		uploadFiles = [...uploadFiles, ...files];
		for (const f of files) {
			uploadPreview.push(URL.createObjectURL(f));
		}
	}

	function removeUploaded(idx: number) {
		uploadedUrls = uploadedUrls.filter((_, i) => i !== idx);
	}

	function removePreview(idx: number) {
		URL.revokeObjectURL(uploadPreview[idx]);
		uploadPreview = uploadPreview.filter((_, i) => i !== idx);
		uploadFiles = uploadFiles.filter((_, i) => i !== idx);
	}

	async function handleSubmit() {
		if (!formTechId || !formTitle.trim()) return;
		submitting = true;
		try {
			const formData = new FormData();
			formData.set('technicianId', formTechId);
			formData.set('title', formTitle.trim());
			if (formDesc.trim()) formData.set('description', formDesc.trim());
			const tags = formTagsStr
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			if (tags.length > 0) formData.set('tags', JSON.stringify(tags));
			if (editingWork) {
				formData.set('id', editingWork.work.id);
				formData.set('existingImages', JSON.stringify(uploadedUrls));
			}
			for (const f of uploadFiles) {
				formData.append('images', f);
			}

			if (editingWork) {
				await fetch('/api/works', {
					method: 'PUT',
					body: formData
				});
			} else {
				await fetch('/api/works', {
					method: 'POST',
					body: formData
				});
			}
			showModal = false;
			await loadData();
		} catch (e) {
			console.error(e);
		} finally {
			submitting = false;
		}
	}

	async function togglePublish(item: WorkItem) {
		try {
			await fetch('/api/works', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: item.work.id, isPublished: !item.work.isPublished })
			});
			await loadData();
		} catch (e) {
			console.error(e);
		}
	}

	function getWorkImage(item: WorkItem, idx = 0): string {
		if (item.work.images && item.work.images.length > idx && item.work.images[idx]) {
			return item.work.images[idx];
		}
		const prompt = encodeURIComponent(`${item.work.title} nail art design pink elegant salon`);
		return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
	}

	function formatDate(d: string | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('zh-CN');
	}

	$effect(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">作品管理</h2>
			<p class="mt-1 text-sm text-gray-500">上传、编辑和发布美甲作品</p>
		</div>
		<button
			onclick={openCreate}
			class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			上传新作品
		</button>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">总作品数</p>
			<p class="mt-1 text-2xl font-bold text-gray-800">{stats.total}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">已发布</p>
			<p class="mt-1 text-2xl font-bold text-primary">{stats.published}</p>
		</div>
		<div class="rounded-xl bg-white p-4 shadow-sm">
			<p class="text-xs text-gray-500">含图作品</p>
			<p class="mt-1 text-2xl font-bold text-amber-500">{stats.hasImages}</p>
		</div>
	</div>

	<div class="rounded-xl bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="flex flex-wrap gap-1">
				{#each statusTabs as tab}
					<button
						onclick={() => (statusFilter = tab.key)}
						class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors {statusFilter === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>{tab.label}</button>
				{/each}
			</div>
			<div class="flex-1" />
			<select
				bind:value={techFilter}
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
			>
				<option value="">全部技师</option>
				{#each technicians as t}
					<option value={t.id}>{t.name}</option>
				{/each}
			</select>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索标题..."
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-40"
			/>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
		</div>
	{:else if filteredWorks.length === 0}
		<div class="rounded-xl bg-white p-16 text-center shadow-sm">
			<span class="text-6xl mb-4 block">💅</span>
			<p class="text-gray-400">暂无作品数据，点击右上角上传新作品</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredWorks as item (item.work.id)}
				<div class="group rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
					<div class="relative aspect-square overflow-hidden bg-gray-100">
						<img
							src={getWorkImage(item)}
							alt={item.work.title}
							class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
							loading="lazy"
						/>
						{#if item.work.images && item.work.images.length > 1}
							<span class="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white flex items-center gap-1">
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
								{item.work.images.length}
							</span>
						{/if}
						<span
							class="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium {item.work.isPublished ? 'bg-green-500 text-white' : 'bg-gray-500/80 text-white'}"
						>
							{item.work.isPublished ? '已发布' : '未发布'}
						</span>
					</div>
					<div class="p-4">
						<h3 class="font-semibold text-gray-800 mb-2 truncate" title={item.work.title}>{item.work.title}</h3>
						<div class="flex items-center gap-2 mb-3">
							{#if item.technician?.avatar}
								<img src={item.technician.avatar} alt="" class="w-5 h-5 rounded-full object-cover"/>
							{:else if item.technician?.name}
								<div class="w-5 h-5 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-[10px] font-bold">
									{item.technician.name[0]}
								</div>
							{/if}
							<span class="text-xs text-gray-500">{item.technician?.name ?? '未知'}</span>
						</div>
						{#if item.work.tags && item.work.tags.length > 0}
							<div class="flex flex-wrap gap-1 mb-3">
								{#each item.work.tags.slice(0, 3) as tag}
									<span class="rounded-full bg-pink-50 px-2 py-0.5 text-xs text-primary">{tag}</span>
								{/each}
								{#if item.work.tags.length > 3}
									<span class="text-xs text-gray-400">+{item.work.tags.length - 3}</span>
								{/if}
							</div>
						{/if}
						<div class="flex items-center justify-between text-xs text-gray-400 mb-4">
							<span>{formatDate(item.work.publishedAt ?? item.work.createdAt)}</span>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={() => openEdit(item)}
								class="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
							>
								编辑
							</button>
							<button
								onclick={() => togglePublish(item)}
								class="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors {item.work.isPublished ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary text-white hover:bg-primary-dark'}"
							>
								{item.work.isPublished ? '下架' : '发布'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-6 pb-6 px-4 overflow-y-auto" onclick={() => (showModal = false)}>
		<div class="w-full max-w-2xl rounded-2xl bg-white shadow-xl mb-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between border-b px-6 py-4">
				<h3 class="text-lg font-semibold text-gray-800">{editingWork ? '编辑作品' : '上传新作品'}</h3>
				<button onclick={() => (showModal = false)} class="text-gray-400 hover:text-gray-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="space-y-5 px-6 py-5">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">技师 <span class="text-red-400">*</span></label>
					<select
						bind:value={formTechId}
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					>
						<option value="">选择技师</option>
						{#each technicians.filter((t) => t.isActive) as t}
							<option value={t.id}>{t.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">作品标题 <span class="text-red-400">*</span></label>
					<input
						type="text"
						bind:value={formTitle}
						placeholder="如：法式渐变美甲"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">作品描述</label>
					<textarea
						bind:value={formDesc}
						rows="3"
						placeholder="描述作品风格、用料、特点等..."
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
					></textarea>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">标签（用逗号分隔）</label>
					<input
						type="text"
						bind:value={formTagsStr}
						placeholder="如：法式, 渐变, 婚甲"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">作品图片</label>
					<div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
						{#each uploadedUrls as url, idx}
							<div class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
								<img src={url} alt="" class="w-full h-full object-cover" />
								<button
									onclick={() => removeUploaded(idx)}
									class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									aria-label="删除图片"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
								</button>
							</div>
						{/each}
						{#each uploadPreview as url, idx}
							<div class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
								<img src={url} alt="" class="w-full h-full object-cover" />
								<button
									onclick={() => removePreview(idx)}
									class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									aria-label="删除图片"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
								</button>
							</div>
						{/each}
						<label class="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-primary">
							<svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
							<span class="text-xs">添加图片</span>
							<input type="file" accept="image/*" multiple class="hidden" onchange={onFilesSelected} />
						</label>
					</div>
					<p class="text-xs text-gray-400">支持 JPG、PNG 格式，可多选</p>
				</div>
			</div>

			<div class="flex justify-end gap-3 border-t px-6 py-4">
				<button
					onclick={() => (showModal = false)}
					class="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
				>取消</button>
				<button
					onclick={handleSubmit}
					disabled={submitting || !formTechId || !formTitle.trim()}
					class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>{submitting ? '提交中...' : editingWork ? '保存修改' : '创建作品'}</button>
			</div>
		</div>
	</div>
{/if}
