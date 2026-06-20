<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RiskBadge from '$lib/components/RiskBadge.svelte';
	import { forbiddenWordsStore, hitRatesStore, genId } from '$lib/stores';

	let searchQuery = $state('');
	let filterSeverity = $state('all');
	let filterCategory = $state('all');
	let showActive = $state<'all' | 'active' | 'inactive'>('all');
	let showAdd = $state(false);
	let editingId: number | null = $state(null);

	let newItem = $state({
		word: '',
		category: '',
		severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
		description: '',
		active: true
	});

	const list = $derived.by(() => {
		let arr = $forbiddenWordsStore;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			arr = arr.filter(
				(w) => w.word.toLowerCase().includes(q) || (w.description || '').toLowerCase().includes(q)
			);
		}
		if (filterSeverity !== 'all') arr = arr.filter((w) => w.severity === filterSeverity);
		if (filterCategory !== 'all') arr = arr.filter((w) => w.category === filterCategory);
		if (showActive !== 'all') arr = arr.filter((w) => (showActive === 'active' ? w.active : !w.active));
		return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	const categories = $derived(Array.from(new Set($forbiddenWordsStore.map((w) => w.category || '未分类'))));
	const getHitCount = (wid: number) => $hitRatesStore.filter((h) => h.forbiddenWordId === wid).reduce((s, h) => s + h.count, 0);

	const toggleActive = (id: number) => {
		forbiddenWordsStore.update((arr) => arr.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
	};

	const openEdit = (w: any) => {
		editingId = w.id;
		newItem = {
			word: w.word,
			category: w.category || '',
			severity: w.severity,
			description: w.description || '',
			active: w.active
		};
		showAdd = true;
	};

	const submit = () => {
		if (!newItem.word.trim()) return;
		if (editingId) {
			forbiddenWordsStore.update((arr) =>
				arr.map((w) =>
					w.id === editingId
						? {
								...w,
								word: newItem.word.trim(),
								category: newItem.category || undefined,
								severity: newItem.severity,
								description: newItem.description || undefined,
								active: newItem.active
							}
						: w
				)
			);
		} else {
			forbiddenWordsStore.update((arr) => [
				...arr,
				{
					id: genId(),
					word: newItem.word.trim(),
					category: newItem.category || undefined,
					severity: newItem.severity,
					description: newItem.description || undefined,
					active: newItem.active,
					createdAt: new Date().toISOString()
				}
			]);
		}
		resetForm();
	};

	const resetForm = () => {
		newItem = { word: '', category: '', severity: 'medium', description: '', active: true };
		editingId = null;
		showAdd = false;
	};

	const del = (id: number) => {
		if (!confirm('确认删除该禁用词？')) return;
		forbiddenWordsStore.update((arr) => arr.filter((w) => w.id !== id));
	};
</script>

<PageHeader title="禁用词库" subtitle="维护合规禁用词列表，系统将自动扫描邮件中的禁用词并关联命中率">
	{#snippet actions()}
		<button class="btn-primary" onclick={() => (showAdd = true)}><span>➕</span> 新增禁用词</button>
	{/snippet}
</PageHeader>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
	<div class="card p-4"><p class="text-xs text-slate-500">总词数</p><p class="text-2xl font-bold text-slate-900 mt-1">{$forbiddenWordsStore.length}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">监控中</p><p class="text-2xl font-bold text-indigo-600 mt-1">{$forbiddenWordsStore.filter((w) => w.active).length}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">高/严重</p><p class="text-2xl font-bold text-rose-600 mt-1">{$forbiddenWordsStore.filter((w) => w.active && (w.severity === 'high' || w.severity === 'critical')).length}</p></div>
	<div class="card p-4"><p class="text-xs text-slate-500">累计命中</p><p class="text-2xl font-bold text-amber-600 mt-1">{$hitRatesStore.filter((h) => h.forbiddenWordId).reduce((s, h) => s + h.count, 0)}</p></div>
</div>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
		<div class="md:col-span-2">
			<input class="input" placeholder="🔍 搜索词汇或描述..." bind:value={searchQuery} />
		</div>
		<select class="select" bind:value={filterSeverity}>
			<option value="all">全部严重程度</option>
			<option value="low">低</option>
			<option value="medium">中</option>
			<option value="high">高</option>
			<option value="critical">严重</option>
		</select>
		<select class="select" bind:value={filterCategory}>
			<option value="all">全部分类</option>
			{#each categories as c}
				<option value={c}>{c || '未分类'}</option>
			{/each}
		</select>
	</div>
	<div class="mt-3 flex items-center gap-4 text-sm">
		{#each (['all', 'active', 'inactive'] as const) as opt}
			<label class="inline-flex items-center gap-1.5 cursor-pointer">
				<input
					type="radio"
					class="w-4 h-4 text-indigo-600"
					name="active_filter"
					checked={showActive === opt}
					onchange={() => (showActive = opt)}
				/>
				<span class="text-slate-600">{opt === 'all' ? '全部' : opt === 'active' ? '仅监控中' : '仅已停用'}</span>
			</label>
		{/each}
	</div>
</div>

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>禁用词</th>
					<th>分类</th>
					<th>严重程度</th>
					<th>描述</th>
					<th>命中次数</th>
					<th>状态</th>
					<th class="text-right">操作</th>
				</tr>
			</thead>
			<tbody>
				{#if list.length === 0}
					<tr><td colspan="7" class="py-12 text-center text-slate-400">暂无禁用词</td></tr>
				{/if}
				{#each list as w}
					<tr class={w.active ? '' : 'opacity-60'}>
						<td>
							<code class="font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded text-sm font-semibold">
								{w.word}
							</code>
						</td>
						<td>
							{w.category
								? `<span class="chip bg-slate-100 text-slate-700">${w.category}</span>`
								: `<span class="text-slate-400 text-sm">-</span>`}
						</td>
						<td><RiskBadge level={w.severity} /></td>
						<td class="text-sm text-slate-600 max-w-xs truncate">{w.description || '-'}</td>
						<td>
							<span class="chip bg-amber-50 text-amber-700">{getHitCount(w.id)} 次</span>
						</td>
						<td>
							{w.active
								? `<span class="chip bg-emerald-100 text-emerald-700">监控中</span>`
								: `<span class="chip bg-slate-100 text-slate-500">已停用</span>`}
						</td>
						<td class="text-right">
							<div class="inline-flex gap-1">
								<button class="btn-ghost !py-1 !px-2 text-xs" onclick={() => openEdit(w)}>编辑</button>
								<button class="btn-ghost !py-1 !px-2 text-xs" onclick={() => toggleActive(w.id)}>
									{w.active ? '停用' : '启用'}
								</button>
								<button class="btn-ghost !py-1 !px-2 text-xs text-rose-600 hover:bg-rose-50" onclick={() => del(w.id)}>删除</button>
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
		<div class="card p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-900 mb-4">{editingId ? '编辑禁用词' : '新增禁用词'}</h3>
			<div class="space-y-3">
				<div>
					<label class="label">禁用词 *</label>
					<input class="input" bind:value={newItem.word} placeholder="如：最低价、保证收益" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="label">分类</label>
						<input class="input" bind:value={newItem.category} placeholder="如：绝对化用语" />
					</div>
					<div>
						<label class="label">严重程度</label>
						<select class="select" bind:value={newItem.severity}>
							<option value="low">低</option>
							<option value="medium">中</option>
							<option value="high">高</option>
							<option value="critical">严重</option>
						</select>
					</div>
				</div>
				<div>
					<label class="label">说明描述</label>
					<textarea class="textarea" bind:value={newItem.description} placeholder="说明该词为何禁用..." />
				</div>
				<label class="inline-flex items-center gap-2 cursor-pointer">
					<input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600" bind:checked={newItem.active} />
					<span class="text-sm text-slate-700">启用监控</span>
				</label>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button class="btn-secondary" onclick={resetForm}>取消</button>
				<button class="btn-primary" onclick={submit}>{editingId ? '保存修改' : '添加禁用词'}</button>
			</div>
		</div>
	</div>
{/if}
