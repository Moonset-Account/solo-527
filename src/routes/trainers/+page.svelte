<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { trainersStore, emailsStore, hitRatesStore, genId } from '$lib/stores';

	let searchQuery = $state('');
	let showAdd = $state(false);
	let editingId: number | null = $state(null);

	let newItem = $state({
		name: '',
		email: '',
		team: ''
	});

	const list = $derived.by(() => {
		let arr = $trainersStore;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			arr = arr.filter(
				(t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.team || '').toLowerCase().includes(q)
			);
		}
		return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	const getStats = (tid: number) => {
		const emails = $emailsStore.filter((e) => e.trainerId === tid);
		const hits = $hitRatesStore.filter((h) => h.trainerId === tid).reduce((s, h) => s + h.count, 0);
		const highRisk = emails.filter((e) => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
		return { total: emails.length, hits, highRisk };
	};

	const openEdit = (t: any) => {
		editingId = t.id;
		newItem = { name: t.name, email: t.email, team: t.team || '' };
		showAdd = true;
	};

	const submit = () => {
		if (!newItem.name.trim() || !newItem.email.trim()) {
			alert('请填写姓名和邮箱');
			return;
		}
		const now = new Date().toISOString();
		if (editingId) {
			trainersStore.update((arr) =>
				arr.map((t) =>
					t.id === editingId
						? { ...t, name: newItem.name.trim(), email: newItem.email.trim(), team: newItem.team || undefined }
						: t
				)
			);
		} else {
			trainersStore.update((arr) => [
				...arr,
				{
					id: genId(),
					name: newItem.name.trim(),
					email: newItem.email.trim(),
					team: newItem.team || undefined,
					createdAt: now
				}
			]);
		}
		resetForm();
	};

	const resetForm = () => {
		newItem = { name: '', email: '', team: '' };
		editingId = null;
		showAdd = false;
	};

	const del = (id: number) => {
		if (!confirm('确认删除该负责人？关联数据不会被删除。')) return;
		trainersStore.update((arr) => arr.filter((t) => t.id !== id));
	};
</script>

<PageHeader title="培训负责人" subtitle="管理销售培训负责人并查看其负责邮件的风险命中情况">
	{#snippet actions()}
		<button class="btn-primary" onclick={() => (showAdd = true)}><span>➕</span> 新增负责人</button>
	{/snippet}
</PageHeader>

<div class="card p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		<input class="input" placeholder="🔍 搜索姓名、邮箱、团队..." bind:value={searchQuery} />
		<div class="text-sm text-slate-500 self-center">共 {list.length} 位负责人</div>
	</div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each list as t}
		{@const stats = getStats(t.id)}
		<div class="card p-5">
			<div class="flex items-start justify-between gap-3 mb-4">
				<div class="flex items-center gap-3 min-w-0">
					<div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
						{t.name.slice(0, 1)}
					</div>
					<div class="min-w-0">
						<h3 class="font-semibold text-slate-900 truncate">{t.name}</h3>
						<p class="text-xs text-slate-500 truncate">{t.email}</p>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3 mb-4">
				<div class="text-center p-2 bg-slate-50 rounded-lg">
					<p class="text-lg font-bold text-slate-900">{stats.total}</p>
					<p class="text-[10px] text-slate-500">负责邮件</p>
				</div>
				<div class="text-center p-2 bg-rose-50 rounded-lg">
					<p class="text-lg font-bold text-rose-600">{stats.hits}</p>
					<p class="text-[10px] text-slate-500">命中次数</p>
				</div>
				<div class="text-center p-2 bg-amber-50 rounded-lg">
					<p class="text-lg font-bold text-amber-600">{stats.highRisk}</p>
					<p class="text-[10px] text-slate-500">高风险</p>
				</div>
			</div>

			{#if t.team}
				<div class="mb-3">
					<span class="chip bg-indigo-50 text-indigo-700">🏢 {t.team}</span>
				</div>
			{/if}

			<p class="text-xs text-slate-400 mb-3">加入时间：{t.createdAt.split('T')[0]}</p>

			<div class="flex items-center gap-1 pt-3 border-t border-slate-100">
				<button class="btn-secondary !py-1 !px-2 text-xs flex-1" onclick={() => openEdit(t)}>编辑</button>
				<button class="btn-ghost !py-1 !px-2 text-xs text-rose-600 hover:bg-rose-50 flex-1" onclick={() => del(t.id)}>删除</button>
			</div>
		</div>
	{/each}
	{#if list.length === 0}
		<div class="col-span-full card p-12 text-center text-slate-400">暂无培训负责人</div>
	{/if}
</div>

{#if showAdd}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onclick={resetForm}>
		<div class="card p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-900 mb-4">{editingId ? '编辑培训负责人' : '新增培训负责人'}</h3>
			<div class="space-y-3">
				<div>
					<label class="label">姓名 *</label>
					<input class="input" bind:value={newItem.name} placeholder="如：张伟" />
				</div>
				<div>
					<label class="label">邮箱 *</label>
					<input class="input" bind:value={newItem.email} placeholder="name@company.com" type="email" />
				</div>
				<div>
					<label class="label">团队 / 区域</label>
					<input class="input" bind:value={newItem.team} placeholder="如：华东区" />
				</div>
			</div>
			<div class="flex justify-end gap-2 mt-5">
				<button class="btn-secondary" onclick={resetForm}>取消</button>
				<button class="btn-primary" onclick={submit}>{editingId ? '保存修改' : '添加负责人'}</button>
			</div>
		</div>
	</div>
{/if}
