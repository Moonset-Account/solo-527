<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { generateMockData } from '$lib/data/mockData';
	import type { DataDictionaryItem } from '$lib/types';
	import { Plus, Edit, Trash2, Save, X } from 'lucide-svelte';

	let loading = true;
	let categories: string[] = [];
	let selectedCategory = 'anomaly_type';
	let dictionaryItems: DataDictionaryItem[] = [];
	let filteredItems: DataDictionaryItem[] = [];
	let editingItem: DataDictionaryItem | null = null;
	let isAdding = false;
	let newItem = {
		category: '',
		key: '',
		value: '',
		label: '',
		description: '',
		sortOrder: 0
	};

	onMount(async () => {
		if (!$userStore) {
			goto('/login');
			return;
		}

		const mockData = generateMockData();
		dictionaryItems = mockData.dataDictionary;
		categories = Array.from(new Set(dictionaryItems.map((i) => i.category)));
		selectedCategory = categories[0];
		loading = false;
	});

	$: filteredItems = dictionaryItems.filter((i) => i.category === selectedCategory).sort((a, b) => a.sortOrder - b.sortOrder);

	function startAdd() {
		isAdding = true;
		newItem.category = selectedCategory;
		newItem.key = '';
		newItem.value = '';
		newItem.label = '';
		newItem.description = '';
		newItem.sortOrder = filteredItems.length + 1;
	}

	function cancelAdd() {
		isAdding = false;
	}

	function saveNewItem() {
		if (!newItem.key || !newItem.value) {
			showToast('请填写键名和键值', 'error');
			return;
		}

		dictionaryItems.push({
			id: Math.random().toString(36).slice(2, 10),
			...newItem,
			isActive: true,
			createdAt: new Date()
		});

		isAdding = false;
		showToast('添加成功', 'success');
	}

	function startEdit(item: DataDictionaryItem) {
		editingItem = { ...item };
	}

	function saveEdit() {
		if (!editingItem) return;
		const idx = dictionaryItems.findIndex((i) => i.id === editingItem!.id);
		if (idx >= 0) {
			dictionaryItems[idx] = editingItem;
		}
		editingItem = null;
		showToast('保存成功', 'success');
	}

	function cancelEdit() {
		editingItem = null;
	}

	function deleteItem(item: DataDictionaryItem) {
		if (confirm('确定要删除这条字典项吗？')) {
			dictionaryItems = dictionaryItems.filter((i) => i.id !== item.id);
			showToast('删除成功', 'success');
		}
	}

	const categoryLabels: Record<string, string> = {
		anomaly_type: '异常类型',
		severity: '严重程度',
		responsible_party: '责任方',
		temp_threshold: '温度阈值',
		calibration: '校准参数'
	};
</script>

<AppLayout>
	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<div>
						<h3 class="text-base font-semibold text-slate-800">数据字典</h3>
						<p class="text-sm text-slate-500 mt-1">管理系统枚举值和业务参数配置</p>
					</div>
					<button on:click={startAdd} class="btn btn-primary text-sm flex items-center gap-2">
						<Plus class="w-4 h-4" />
						新增
					</button>
				</div>
				<div class="card-body">
					<div class="flex gap-2 mb-6 flex-wrap">
						{#each categories as cat}
							<button
								on:click={() => (selectedCategory = cat)}
								class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {
									selectedCategory === cat
										? 'bg-primary-500 text-white'
										: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
								}"
							>
								{categoryLabels[cat] || cat}
							</button>
						{/each}
					</div>

					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>排序</th>
									<th>键名 (Key)</th>
									<th>键值 (Value)</th>
									<th>显示标签</th>
									<th>说明</th>
									<th>状态</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								{#if isAdding}
									<tr class="bg-blue-50">
										<td>
											<input type="number" class="input text-sm py-1 w-20" bind:value={newItem.sortOrder} />
										</td>
										<td>
											<input type="text" class="input text-sm py-1" placeholder="键名" bind:value={newItem.key} />
										</td>
										<td>
											<input type="text" class="input text-sm py-1" placeholder="键值" bind:value={newItem.value} />
										</td>
										<td>
											<input type="text" class="input text-sm py-1" placeholder="标签" bind:value={newItem.label} />
										</td>
										<td>
											<input type="text" class="input text-sm py-1" placeholder="说明" bind:value={newItem.description} />
										</td>
										<td>
											<span class="badge bg-green-100 text-green-800">启用</span>
										</td>
										<td>
											<div class="flex items-center gap-2">
												<button on:click={saveNewItem} class="text-green-600 hover:text-green-700">
													<Save class="w-4 h-4" />
												</button>
												<button on:click={cancelAdd} class="text-slate-400 hover:text-slate-600">
													<X class="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								{/if}
								{#each filteredItems as item}
									{#if editingItem && editingItem.id === item.id}
										<tr class="bg-yellow-50">
											<td>
												<input type="number" class="input text-sm py-1 w-20" bind:value={editingItem.sortOrder} />
											</td>
											<td>
												<input type="text" class="input text-sm py-1" bind:value={editingItem.key} />
											</td>
											<td>
												<input type="text" class="input text-sm py-1" bind:value={editingItem.value} />
											</td>
											<td>
												<input type="text" class="input text-sm py-1" bind:value={editingItem.label} />
											</td>
											<td>
												<input type="text" class="input text-sm py-1" bind:value={editingItem.description} />
											</td>
											<td>
												<span class="badge {item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
													{item.isActive ? '启用' : '停用'}
												</span>
											</td>
											<td>
												<div class="flex items-center gap-2">
													<button on:click={saveEdit} class="text-green-600 hover:text-green-700">
														<Save class="w-4 h-4" />
													</button>
													<button on:click={cancelEdit} class="text-slate-400 hover:text-slate-600">
														<X class="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									{:else}
										<tr>
											<td>{item.sortOrder}</td>
											<td class="font-mono text-sm">{item.key}</td>
											<td class="font-mono text-sm">{item.value}</td>
											<td>{item.label}</td>
											<td class="text-slate-500 text-sm">{item.description || '-'}</td>
											<td>
												<span class="badge {item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
													{item.isActive ? '启用' : '停用'}
												</span>
											</td>
											<td>
												<div class="flex items-center gap-2">
													<button on:click={() => startEdit(item)} class="text-primary-600 hover:text-primary-700">
														<Edit class="w-4 h-4" />
													</button>
													<button on:click={() => deleteItem(item)} class="text-red-500 hover:text-red-600">
														<Trash2 class="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
