<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$api/client';

	let form = {
		box_number: '',
		thermometer_id: '',
		route_id: '',
		site_id: '',
		vaccine_type: '',
		vaccine_count: 0,
		expected_arrival: ''
	};

	let boxes = [];
	let routes = [];
	let sites = [];
	let availableSites = [];
	let loading = false;
	let error = '';
	let success = '';

	$: selectedRoute = routes.find(r => r.id === form.route_id);
	$: {
		if (selectedRoute) {
			availableSites = sites.filter(s => selectedRoute.site_ids.includes(s.id));
		} else {
			availableSites = [];
		}
		if (form.site_id && !availableSites.find(s => s.id === form.site_id)) {
			form.site_id = '';
		}
	}

	async function loadData() {
		try {
			[boxes, routes, sites] = await Promise.all([
				api.getBoxes('idle'),
				api.getRoutes(),
				api.getSites()
			]);
		} catch (e) {
			error = e.message;
		}
	}

	$: selectedBox = boxes.find(b => b.box_number === form.box_number);
	$: {
		if (selectedBox && !form.thermometer_id) {
			form.thermometer_id = selectedBox.thermometer_id;
		}
	}

	async function handleSubmit() {
		error = '';
		success = '';

		if (!form.box_number || !form.thermometer_id || !form.route_id || !form.site_id) {
			error = '请填写所有必填项';
			return;
		}

		if (form.vaccine_count <= 0) {
			error = '疫苗数量必须大于0';
			return;
		}

		loading = true;
		try {
			const data = { ...form };
			if (form.expected_arrival) {
				data.expected_arrival = new Date(form.expected_arrival).toISOString();
			}
			await api.createTask(data);
			success = '任务创建成功！';
			setTimeout(() => goto('/tasks'), 1500);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="max-w-3xl mx-auto">
	<div class="flex items-center mb-6">
		<button on:click={() => goto('/tasks')} class="mr-4 text-gray-500 hover:text-gray-700">
			← 返回
		</button>
		<h1 class="text-2xl font-bold text-gray-900">创建配送任务</h1>
	</div>

	<div class="bg-white rounded-xl shadow-sm border p-6">
		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						箱号 <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={form.box_number}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">请选择箱子</option>
						{#each boxes as b}
							<option value={b.box_number}>{b.box_number} (温度计: {b.thermometer_id})</option>
						{/each}
					</select>
					{#if boxes.length === 0}
						<p class="text-sm text-orange-600 mt-1">当前没有空闲的箱子</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						温度计编号 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={form.thermometer_id}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="请输入温度计编号"
						required
					/>
					{#if selectedBox && selectedBox.thermometer_id !== form.thermometer_id}
						<p class="text-sm text-orange-600 mt-1">⚠️ 温度计编号与箱子预设不匹配</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						配送路线 <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={form.route_id}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">请选择路线</option>
						{#each routes as r}
							<option value={r.id}>{r.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						接收站点 <span class="text-red-500">*</span>
					</label>
					<select
						bind:value={form.site_id}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
						disabled={!form.route_id}
					>
						<option value="">请先选择路线</option>
						{#each availableSites as s}
							<option value={s.id}>{s.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						疫苗类型 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						bind:value={form.vaccine_type}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="如：新冠疫苗、流感疫苗等"
						required
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						疫苗数量 <span class="text-red-500">*</span>
					</label>
					<input
						type="number"
						bind:value={form.vaccine_count}
						min="1"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="请输入疫苗数量"
						required
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">预计到达时间</label>
					<input
						type="datetime-local"
						bind:value={form.expected_arrival}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
					{success}
				</div>
			{/if}

			<div class="flex justify-end space-x-4 pt-4 border-t">
				<button
					type="button"
					on:click={() => goto('/tasks')}
					class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					取消
				</button>
				<button
					type="submit"
					disabled={loading || boxes.length === 0}
					class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? '创建中...' : '创建任务'}
				</button>
			</div>
		</form>
	</div>
</div>
