<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, FileText, Database, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-svelte';
	import { dataDictionary, metricDefinitions } from '$lib/dictionary';

	let file: File | null = null;
	let uploading = false;
	let uploadResult: {
		success: number;
		failed: number;
		errors: string[];
		warnings: string[];
	} | null = null;
	let activeTab: 'import' | 'dictionary' | 'anomalies' = 'import';

	function setActiveTab(key: string) {
		activeTab = key as typeof activeTab;
	}
	let dictionary: typeof dataDictionary = [];
	let metrics: typeof metricDefinitions = [];

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			file = target.files[0];
			uploadResult = null;
		}
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			file = e.dataTransfer.files[0];
			uploadResult = null;
		}
	}

	async function handleUpload() {
		if (!file) return;

		uploading = true;
		uploadResult = null;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/import', {
				method: 'POST',
				body: formData
			});

			uploadResult = await res.json();
		} catch (e) {
			console.error('Upload failed:', e);
			uploadResult = {
				success: 0,
				failed: 1,
				errors: ['上传失败，请检查文件格式'],
				warnings: []
			};
		} finally {
			uploading = false;
		}
	}

	async function loadDictionary() {
		try {
			const res = await fetch('/api/dictionary');
			const data = await res.json();
			dictionary = data.dataDictionary;
			metrics = data.metricDefinitions;
		} catch (e) {
			console.error('Failed to load dictionary:', e);
		}
	}

	onMount(() => {
		loadDictionary();
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">数据管理</h1>
		<p class="text-gray-500 mt-1">数据导入、数据字典和异常数据管理</p>
	</div>

	<div class="flex border-b border-gray-200">
		{#each [
			{ key: 'import', label: '数据导入', icon: Upload },
			{ key: 'dictionary', label: '数据字典', icon: FileText },
			{ key: 'anomalies', label: '异常标注', icon: AlertCircle }
		] as tab}
			<button
				class="flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors {activeTab === tab.key
					? 'border-primary-500 text-primary-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => setActiveTab(tab.key)}
			>
				<tab.icon class="w-4 h-4" />
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	{#if activeTab === 'import'}
		<div class="space-y-6">
			<div
				class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 transition-colors"
				on:dragover|preventDefault
				on:drop={handleDrop}
			>
				<Database class="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-700 mb-2">上传门诊数据</h3>
				<p class="text-sm text-gray-500 mb-4">
					支持 CSV 格式，包含挂号、签到、分诊、叫号、缴费、取药时间戳
				</p>
				<label class="btn-primary inline-flex items-center space-x-2 cursor-pointer">
					<Upload class="w-4 h-4" />
					<span>选择文件</span>
					<input
						type="file"
						accept=".csv"
						class="hidden"
						on:change={handleFileSelect}
					/>
				</label>
				{#if file}
					<div class="mt-4 text-sm text-gray-600">
						已选择: <span class="font-medium">{file.name}</span>
						({(file.size / 1024).toFixed(1)} KB)
					</div>
					<button
						class="btn-primary mt-4"
						on:click={handleUpload}
						disabled={uploading}
					>
						{#if uploading}
							<span class="flex items-center space-x-2">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
								<span>导入中...</span>
							</span>
						{:else}
							开始导入
						{/if}
					</button>
				{/if}
			</div>

			{#if uploadResult}
				<div
					class="rounded-xl p-4 {uploadResult.failed > 0
						? 'bg-orange-50 border border-orange-200'
						: 'bg-green-50 border border-green-200'}"
				>
					<div class="flex items-center space-x-3 mb-3">
						{#if uploadResult.failed > 0}
							<AlertCircle class="w-5 h-5 text-orange-500" />
						{:else}
							<CheckCircle class="w-5 h-5 text-green-500" />
						{/if}
						<span class="font-medium">
							导入完成: 成功 {uploadResult.success} 条，失败 {uploadResult.failed} 条
						</span>
					</div>
					{#if uploadResult.warnings.length > 0}
						<div class="text-sm text-orange-700">
							<p class="font-medium mb-1">警告:</p>
							<ul class="list-disc list-inside space-y-1">
								{#each uploadResult.warnings as w}
									<li>{w}</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if uploadResult.errors.length > 0}
						<div class="text-sm text-red-700 mt-3">
							<p class="font-medium mb-1">错误详情:</p>
							<ul class="list-disc list-inside space-y-1">
								{#each uploadResult.errors.slice(0, 5) as e}
									<li>{e}</li>
								{/each}
								{#if uploadResult.errors.length > 5}
									<li>...还有 {uploadResult.errors.length - 5} 条错误</li>
								{/if}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<div class="card">
				<h3 class="font-medium text-gray-800 mb-3">导入模板说明</h3>
				<div class="text-sm text-gray-600 space-y-2">
					<p>CSV 文件需包含以下字段（支持中英文列名）：</p>
					<div class="overflow-x-auto">
						<table class="w-full border border-gray-200 rounded">
							<thead>
								<tr class="bg-gray-50">
									<th class="text-left p-2 border-b">字段名</th>
									<th class="text-left p-2 border-b">类型</th>
									<th class="text-left p-2 border-b">说明</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="p-2 border-b font-mono text-xs">visitId / 就诊ID</td>
									<td class="p-2 border-b">字符串</td>
									<td class="p-2 border-b">就诊唯一标识</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">department / 科室</td>
									<td class="p-2 border-b">字符串</td>
									<td class="p-2 border-b">就诊科室名称</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">registerTime / 挂号时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">YYYY-MM-DD HH:mm:ss 格式</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">checkInTime / 签到时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">同上</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">triageTime / 分诊时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">同上</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">callTime / 叫号时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">同上</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">paymentTime / 缴费时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">同上</td>
								</tr>
								<tr>
									<td class="p-2 border-b font-mono text-xs">pickupTime / 取药时间</td>
									<td class="p-2 border-b">时间戳</td>
									<td class="p-2 border-b">同上</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'dictionary'}
		<div class="space-y-6">
			<div class="card">
				<h3 class="font-semibold text-gray-800 mb-4">字段数据字典</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="text-left py-3 px-4 font-medium text-gray-600">字段名</th>
								<th class="text-left py-3 px-4 font-medium text-gray-600">类型</th>
								<th class="text-left py-3 px-4 font-medium text-gray-600">描述</th>
								<th class="text-left py-3 px-4 font-medium text-gray-600">示例</th>
							</tr>
						</thead>
						<tbody>
							{#each dictionary as item}
								<tr class="border-b border-gray-100">
									<td class="py-3 px-4 font-mono text-xs text-primary-600">{item.key}</td>
									<td class="py-3 px-4">
										<span class="px-2 py-0.5 bg-gray-100 rounded text-xs">
											{item.type}
										</span>
									</td>
									<td class="py-3 px-4 text-gray-600">{item.description}</td>
									<td class="py-3 px-4 text-gray-500 text-xs">{item.example || '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="card">
				<h3 class="font-semibold text-gray-800 mb-4">指标口径说明</h3>
				<div class="space-y-4">
					{#each metrics as metric}
						<div class="p-4 bg-gray-50 rounded-lg">
							<div class="flex items-center space-x-2 mb-2">
								<Info class="w-4 h-4 text-primary-500" />
								<h4 class="font-medium text-gray-800">{metric.name}</h4>
							</div>
							<p class="text-sm text-gray-600 mb-2">
								<span class="text-gray-500">定义：</span>{metric.definition}
							</p>
							<p class="text-sm text-gray-600 mb-2">
								<span class="text-gray-500">计算：</span>{metric.calculation}
							</p>
							<p class="text-sm text-gray-500">
								<span class="text-gray-500">限制：</span>
								{metric.limitations.join('；')}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if activeTab === 'anomalies'}
		<div class="card">
			<div class="flex items-center justify-center py-16 text-gray-500">
				<div class="text-center">
					<XCircle class="w-12 h-12 mx-auto mb-3 text-gray-300" />
					<p>异常标注功能开发中...</p>
					<p class="text-sm text-gray-400 mt-1">
						将支持标记和说明异常数据点（如系统故障、节假日等）
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
