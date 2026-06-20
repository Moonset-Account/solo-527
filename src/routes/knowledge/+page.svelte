<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { knowledgeStore, referenceSourcesStore, genId, hitRatesStore } from '$lib/stores';

	let filterCategory = $state('all');
	let searchQuery = $state('');
	let showAdd = $state(false);

	let newItem = $state({
		category: '',
		title: '',
		content: '',
		referenceSourceId: '' as string,
		tags: '',
		active: true
	});

	let editingId: number | null = $state(null);

	const list = $derived.by(() => {
		let arr = $knowledgeStore;
		if (filterCategory !== 'all') arr = arr.filter((k) => k.category === filterCategory);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			arr = arr.filter((k) => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q) || (k.tags || '').toLowerCase().includes(q));
		}
		return arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	});

	const categories = $derived(Array.from(new Set($knowledgeStore.map((k) => k.category))));

	const getHitCount = (kid: number) => $hitRatesStore.filter((h) => h.knowledgeId === kid).reduce((s, h) => s + h.count, 0);

	const toggleActive = (id: number) => {
		knowledgeStore.update((arr) => arr.map((k) => (k.id === id ? { ...k, active: !k.active, updatedAt: new Date().toISOString() } : k)));
	};

	const openEdit = (k: any) => {
		editingId = k.id;
		newItem = {
			category: k.category,
			title: k.title,
			content: k.content,
			referenceSourceId: k.referenceSourceId ? String(k.referenceSourceId) : '',
			tags: k.tags || '',
			active: k.active
		};
		showAdd = true;
	};

	const submit = () => {
		if (!newItem.category || !newItem.title || !newItem.content) {
			alert('请填写分类、标题和内容');
			return;
		}
		const now = new Date().toISOString();
		if (editingId) {
			knowledgeStore.update((arr) =>
				arr.map((k) =>
					k.id === editingId
						? {
								...k,
								category: newItem.category,
								title: newItem.title,
								content: newItem.content,
								referenceSourceId: newItem.referenceSourceId ? Number(newItem.referenceSourceId) : undefined,
								tags: newItem.tags || undefined,
								active: newItem.active,
								updatedAt: now
							}
						: k
				)
			);
		} else {
			knowledgeStore.update((arr) => [
				...arr,
				{
					id: genId(),
					category: newItem.category,
					title: newItem.title,
					content: newItem.content,
					referenceSourceId: newItem.referenceSourceId ? Number(newItem.referenceSourceId) : undefined,
					tags: newItem.tags || undefined,
					active: newItem.active,
					createdAt: now,
					updatedAt: now
				}
			]);
		}
		resetForm();
	};

	const resetForm = () => {
		newItem = { category: '', title: '', content: '', referenceSourceId: '', tags: '', active: true };
		editingId = null;
		showAdd = false;
	};

	const del = (id: number) => {
		if (!confirm('确认删除该知识库条目？')) return;
		knowledgeStore.update((arr) => arr.filter((k) => k.id !== id));
	};

	const formatDate = (iso: string) => new Date(iso).toLocaleDateString('zh-CN');
</script>

<PageHeader title="知识库" subtitle="维护合规话术、法规要求等知识条目，关联引用来源并跟踪命中率">
	{#snippet actions()}
		<button class="btn-primary" onclick={() => (showAdd = true)}><span>➕</span> 新增条目</button>
	{/snippet}
</PageHeader>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<div class="md:col-span-2">
			<input class="input" placeholder="🔍 搜索标题、内容、标签..." bind:value={searchQuery} />
		</div>
		<select class="select" bind:value={filterCategory}>
			<option value="all">全部分类</option>
			{#each categories as c}
				<option value={c}>{c}</option>
			{/each}
		</select>
	</div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	{#each list as k}
		<div class="card p-5 {k.active ? '' : 'opacity-60'}">
			<div class="flex items-start justify-between gap-2 mb-2">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 flex-wrap">
						<h3 class="font-semibold text-slate-900">{k.title}</h3>
						<span class="chip bg-indigo-50 text-indigo-700">{k.category}</span>
						{#if !k.active}
							<span class="chip bg-slate-100 text-slate-500">已停用</span>
						{/if}
					</div>
					<p class="text-xs text-slate-500 mt-1">更新于 {formatDate(k.updatedAt)} · 命中 {getHitCount(k.id)} 次</p>
				</div>
			</div>
			<p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded p-3 max-h-40 overflow-y-auto">{k.content}</p>
			<div class="flex items-center gap-2 mt-3 flex-wrap">
				{#if k.tags}
					{#each k.tags.split(',').map((t: string) => t.trim()).filter(Boolean) as t}
						<span class="chip bg-slate-100 text-slate-600">#{t}</span>
					{/each}
				{/if}
				{#if k.referenceSourceId}
					<span class="text-xs text-blue-600">📖 {$referenceSourcesStore.find((r) => r.id === k.referenceSourceId)?.title || ''}</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
				<button class="btn-secondary !py-1 !px-2 text-xs" onclick={() => openEdit(k)}>编辑</button>
				<button class="btn-ghost !py-1 !px-2 text-xs" onclick={() => toggleActive(k.id)}>
					{k.active ? '停用' : '启用'}
				</button>
				<button class="btn-ghost !py-1 !px-2 text-xs text-rose-600 hover:bg-rose-50" onclick={() => del(k.id)}>删除</button>
			</div>
		</div>
	{/each}
	{#if list.length === 0}
		<div class="col-span-2 card p-12 text-center text-slate-400">暂无知识库条目</div>
	{/if}
</div>

{#if showAdd}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={resetForm}>
		<div class="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-900 mb-4">{editingId ? '编辑知识库条目' : '新增知识库条目'}</h3>
			<div class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="label">分类 *</label>
						<input class="input" bind:value={newItem.category} placeholder="如：合规要求、话术模板" />
					</div>
					<div>
						<label class="label">引用来源</label>
						<select class="select" bind:value={newItem.referenceSourceId}>
							<option value="">无</option>
							{#each $referenceSourcesStore as r}
								<option value={r.id}>{r.title}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label class="label">标题 *</label>
					<input class="input" bind:value={newItem.title} />
				</div>
				<div>
					<label class="label">内容 *</label>
					<textarea class="textarea !min-h-[200px]" bind:value={newItem.content} />
				</div>
				<div>
					<label class="label">标签（逗号分隔）</label>
					<input class="input" bind:value={newItem.tags} placeholder="如：合规,广告法,收益率" />
				</div>
				<label class="inline-flex items-center gap-2 cursor-pointer">
					<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600" bind:checked={newItem.active} />
					<span class="text-sm text-slate-700">启用</span>
				</label>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button class="btn-secondary" onclick={resetForm}>取消</button>
				<button class="btn-primary" onclick={submit}>{editingId ? '保存修改' : '创建条目'}</button>
			</div>
		</div>
	</div>
{/if}
