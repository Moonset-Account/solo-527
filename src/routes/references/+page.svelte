<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { referenceSourcesStore, knowledgeStore, genId } from '$lib/stores';

	let searchQuery = $state('');
	let filterCategory = $state('all');
	let showAdd = $state(false);
	let editingId: number | null = $state(null);

	let newItem = $state({
		title: '',
		category: '',
		url: '',
		source: '',
		publishedAt: ''
	});

	const list = $derived.by(() => {
		let arr = $referenceSourcesStore;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			arr = arr.filter(
				(r) => r.title.toLowerCase().includes(q) || (r.source || '').toLowerCase().includes(q)
			);
		}
		if (filterCategory !== 'all') arr = arr.filter((r) => r.category === filterCategory);
		return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	const categories = $derived(Array.from(new Set($referenceSourcesStore.map((r) => r.category || '未分类'))));

	const getRefCount = (rid: number) => $knowledgeStore.filter((k) => k.referenceSourceId === rid).length;

	const openEdit = (r: any) => {
		editingId = r.id;
		newItem = {
			title: r.title,
			category: r.category || '',
			url: r.url || '',
			source: r.source || '',
			publishedAt: r.publishedAt || ''
		};
		showAdd = true;
	};

	const submit = () => {
		if (!newItem.title) return;
		const now = new Date().toISOString();
		if (editingId) {
			referenceSourcesStore.update((arr) =>
				arr.map((r) =>
					r.id === editingId
						? {
								...r,
								title: newItem.title,
								category: newItem.category || undefined,
								url: newItem.url || undefined,
								source: newItem.source || undefined,
								publishedAt: newItem.publishedAt || undefined
							}
						: r
				)
			);
		} else {
			referenceSourcesStore.update((arr) => [
				...arr,
				{
					id: genId(),
					title: newItem.title,
					category: newItem.category || undefined,
					url: newItem.url || undefined,
					source: newItem.source || undefined,
					publishedAt: newItem.publishedAt || undefined,
					createdAt: now
				}
			]);
		}
		resetForm();
	};

	const resetForm = () => {
		newItem = { title: '', category: '', url: '', source: '', publishedAt: '' };
		editingId = null;
		showAdd = false;
	};

	const del = (id: number) => {
		if (!confirm('确认删除该引用来源？')) return;
		referenceSourcesStore.update((arr) => arr.filter((r) => r.id !== id));
	};
</script>

<PageHeader title="引用来源" subtitle="维护法律法规、内部规范等权威引用来源">
	{#snippet actions()}
		<button class="btn-primary" onclick={() => (showAdd = true)}><span>➕</span> 新增来源</button>
	{/snippet}
</PageHeader>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		<input class="input" placeholder="🔍 搜索标题、来源..." bind:value={searchQuery} />
		<select class="select" bind:value={filterCategory}>
			<option value="all">全部分类</option>
			{#each categories as c}
				<option value={c}>{c || '未分类'}</option>
			{/each}
		</select>
	</div>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>标题</th>
					<th>分类</th>
					<th>发布机构</th>
					<th>发布日期</th>
					<th>关联条目</th>
					<th>创建时间</th>
					<th class="text-right">操作</th>
				</tr>
			</thead>
			<tbody>
				{#if list.length === 0}
					<tr><td colspan="7" class="py-12 text-center text-slate-400">暂无引用来源</td></tr>
				{/if}
				{#each list as r}
					<tr>
						<td>
							<div class="font-medium text-slate-900">{r.title}</div>
							{#if r.url}
								<a href={r.url} target="_blank" class="text-xs text-indigo-600 hover:underline truncate block max-w-xs">
									🔗 {r.url}
								</a>
							{/if}
						</td>
						<td>
							{r.category
								? `<span class="chip bg-slate-100 text-slate-700">${r.category}</span>`
								: `<span class="text-slate-400 text-sm">-</span>`}
						</td>
						<td class="text-slate-600">{r.source || '-'}</td>
						<td class="text-slate-600">{r.publishedAt || '-'}</td>
						<td>
							<span class="chip bg-indigo-50 text-indigo-700">{getRefCount(r.id)} 条知识</span>
						</td>
						<td class="text-slate-500 text-xs">{r.createdAt.split('T')[0]}</td>
						<td class="text-right">
							<div class="inline-flex gap-1">
								<button class="btn-ghost !py-1 !px-2 text-xs" onclick={() => openEdit(r)}>编辑</button>
								<button class="btn-ghost !py-1 !px-2 text-xs text-rose-600 hover:bg-rose-50" onclick={() => del(r.id)}>删除</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showAdd}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={resetForm}>
		<div class="card p-6 w-full max-w-lg" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-900 mb-4">{editingId ? '编辑引用来源' : '新增引用来源'}</h3>
			<div class="space-y-3">
				<div>
					<label class="label">标题 *</label>
					<input class="input" bind:value={newItem.title} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="label">分类</label>
						<input class="input" bind:value={newItem.category} placeholder="如：法律法规、内部规范" />
					</div>
					<div>
						<label class="label">发布机构</label>
						<input class="input" bind:value={newItem.source} placeholder="如：合规部" />
					</div>
				</div>
				<div>
					<label class="label">链接 URL</label>
					<input class="input" bind:value={newItem.url} placeholder="https://..." />
				</div>
				<div>
					<label class="label">发布日期</label>
					<input type="date" class="input" bind:value={newItem.publishedAt} />
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button class="btn-secondary" onclick={resetForm}>取消</button>
				<button class="btn-primary" onclick={submit}>{editingId ? '保存修改' : '创建来源'}</button>
			</div>
		</div>
	</div>
{/if}
