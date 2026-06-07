<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { Upload, FileSpreadsheet, Check, AlertCircle, Download, RefreshCw } from 'lucide-svelte';
	import Papa from 'papaparse';
	import { importTemperatureData, type ImportResult } from '$lib/data/importService';

	let loading = false;
	let dragOver = false;
	let importStep = 1;
	let uploadedFile: File | null = null;
	let previewData: any[] = [];
	let columns: string[] = [];
	let fieldMapping: Record<string, string> = {};
	let importProgress = 0;
	let importResult: ImportResult | null = null;

	const requiredFields = [
		{ key: 'shipmentId', label: '运单ID', required: true },
		{ key: 'batchNo', label: '批次号', required: true },
		{ key: 'timestamp', label: '时间戳', required: true },
		{ key: 'temperature', label: '温度', required: true },
		{ key: 'latitude', label: '纬度', required: false },
		{ key: 'longitude', label: '经度', required: false },
		{ key: 'doorStatus', label: '箱门状态', required: false },
		{ key: 'probeId', label: '探头ID', required: false },
		{ key: 'probeCalibrated', label: '探头校准状态', required: false }
	];

	onMount(() => {
		if (!$userStore) {
			goto('/login');
		}
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFileSelect(target.files[0]);
		}
	}

	function handleFileSelect(file: File) {
		if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
			showToast('请上传 CSV 或 Excel 文件', 'error');
			return;
		}

		uploadedFile = file;
		importStep = 2;

		if (file.name.endsWith('.csv')) {
			Papa.parse(file, {
				header: true,
				preview: 10,
				complete: (results) => {
					previewData = results.data as any[];
					if (previewData.length > 0) {
						columns = Object.keys(previewData[0]);
						columns.forEach((col) => {
							const matched = requiredFields.find((f) =>
								col.toLowerCase().includes(f.key.toLowerCase()) ||
								col.toLowerCase().includes(f.label)
							);
							if (matched) {
								fieldMapping[col] = matched.key;
							}
						});
					}
				}
			});
		} else {
			showToast('Excel 文件解析功能开发中，请使用 CSV 格式', 'warning');
		}
	}

	async function handleImport() {
		importStep = 3;
		importProgress = 0;
		loading = true;

		try {
			const result = await importTemperatureData(previewData, fieldMapping, (progress) => {
				importProgress = progress;
			});
			importResult = result;
			showToast('数据导入完成', 'success');
		} catch (e) {
			showToast('导入失败: ' + (e as Error).message, 'error');
		} finally {
			loading = false;
		}
	}

	function resetImport() {
		importStep = 1;
		uploadedFile = null;
		previewData = [];
		columns = [];
		fieldMapping = {};
		importProgress = 0;
		importResult = null;
	}
</script>

<AppLayout>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-slate-800">数据导入</h2>
				<p class="text-sm text-slate-500 mt-1">导入冷链物流温控数据，系统将自动清洗和校验</p>
			</div>
			<a
				href="/templates/import_template.csv"
				class="btn btn-secondary flex items-center gap-2"
				download
			>
				<Download class="w-4 h-4" />
				下载模板
			</a>
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="text-base font-semibold text-slate-800">导入流程</h3>
			</div>
			<div class="card-body">
				<div class="flex items-center gap-4 mb-8">
					{#each [1, 2, 3] as step, idx}
						<div class="flex items-center">
							<div class="flex items-center justify-center w-8 h-8 rounded-full {step <= importStep ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'}">
								{#if step < importStep || (step === 3 && importResult)}
									<Check class="w-4 h-4" />
								{:else}
									{step}
								{/if}
							</div>
							<span class="ml-2 text-sm {step <= importStep ? 'text-slate-800 font-medium' : 'text-slate-500'}">
								{step === 1 ? '上传文件' : step === 2 ? '字段映射' : '开始导入'}
							</span>
							{#if idx < 2}
								<div class="w-16 h-0.5 mx-4 {step < importStep ? 'bg-primary-500' : 'bg-slate-200'}"></div>
							{/if}
						</div>
					{/each}
				</div>

				{#if importStep === 1}
					<div
						class="border-2 border-dashed rounded-xl p-12 text-center transition-colors {dragOver ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-300'}"
						on:dragover={handleDragOver}
						on:dragleave={handleDragLeave}
						on:drop={handleDrop}
					>
						<div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Upload class="w-8 h-8 text-slate-400" />
						</div>
						<p class="text-lg font-medium text-slate-800 mb-2">拖拽文件到此处上传</p>
						<p class="text-sm text-slate-500 mb-6">支持 CSV、Excel 格式，单个文件不超过 100MB</p>
						<label class="btn btn-primary inline-flex items-center gap-2 cursor-pointer">
							<FileSpreadsheet class="w-4 h-4" />
							选择文件
							<input type="file" accept=".csv,.xlsx" class="hidden" on:change={handleFileInput} />
						</label>
					</div>

					<div class="mt-6 p-4 bg-blue-50 rounded-lg">
						<h4 class="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
							<AlertCircle class="w-4 h-4" />
							导入说明
						</h4>
						<ul class="text-sm text-blue-700 space-y-1 ml-6 list-disc">
							<li>温度数据建议每 5 分钟一条记录</li>
							<li>时间戳格式支持 YYYY-MM-DD HH:MM:SS</li>
							<li>探头校准状态请填写 true/false</li>
							<li>系统将自动识别异常并进行数据清洗和缺失值填充</li>
						</ul>
					</div>
				{/if}

				{#if importStep === 2}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-4">
							<div>
								<p class="font-medium text-slate-800">文件名: {uploadedFile?.name}</p>
								<p class="text-sm text-slate-500">文件大小: {(((uploadedFile?.size || 0) / 1024 / 1024)).toFixed(2)} MB</p>
							</div>
							<button on:click={resetImport} class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
								<RefreshCw class="w-4 h-4" />
								重新选择
							</button>
						</div>

						<div class="mb-6">
							<h4 class="text-sm font-medium text-slate-700 mb-3">字段映射配置</h4>
							<div class="grid grid-cols-2 gap-4">
								{#each columns as col}
									<div class="flex items-center gap-3">
										<div class="flex-1 p-2 bg-slate-50 rounded text-sm">{col}</div>
										<span class="text-slate-400">→</span>
										<select class="select flex-1 text-sm" bind:value={fieldMapping[col]}>
											<option value="">-- 不导入 --</option>
											{#each requiredFields as field}
												<option value={field.key}>
													{field.label} {field.required ? '*' : ''}
												</option>
											{/each}
										</select>
									</div>
								{/each}
							</div>
						</div>

						<h4 class="text-sm font-medium text-slate-700 mb-3">数据预览 (前 10 行)</h4>
						<div class="overflow-x-auto border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
							<table class="table text-xs">
								<thead>
									<tr>
										{#each columns as col}
											<th class="py-2 px-3">{col}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each previewData.slice(0, 10) as row}
										<tr>
											{#each columns as col}
												<td class="py-2 px-3 font-mono">{row[col]}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="flex justify-end gap-3 mt-6">
							<button class="btn btn-secondary" on:click={resetImport}>上一步</button>
							<button class="btn btn-primary" on:click={handleImport}>开始导入</button>
						</div>
					</div>
				{/if}

				{#if importStep === 3}
					<div class="text-center py-8">
						{#if !importResult}
							<div class="w-24 h-24 mx-auto mb-6 relative">
								<svg class="w-full h-full transform -rotate-90">
									<circle cx="48" cy="48" r="40" stroke="#e2e8f0" stroke-width="8" fill="none" />
									<circle
										cx="48"
										cy="48"
										r="40"
										stroke="#0F4C81"
										stroke-width="8"
										fill="none"
										stroke-dasharray="{2 * Math.PI * 40}"
										stroke-dashoffset="{2 * Math.PI * 40 * (1 - importProgress / 100)}"
										class="transition-all duration-300"
									/>
								</svg>
								<div class="absolute inset-0 flex items-center justify-center">
									<span class="text-2xl font-bold text-slate-800">{Math.round(importProgress)}%</span>
								</div>
							</div>
							<p class="text-lg font-medium text-slate-800 mb-2">正在导入数据...</p>
							<p class="text-sm text-slate-500">正在进行数据清洗和校验</p>
						{:else}
							<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Check class="w-8 h-8 text-green-600" />
							</div>
							<p class="text-lg font-medium text-slate-800 mb-6">导入完成</p>

							<div class="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
								<div class="p-4 bg-green-50 rounded-lg">
									<p class="text-3xl font-bold text-green-600">{importResult.success}</p>
									<p class="text-sm text-green-700">成功导入</p>
								</div>
								<div class="p-4 bg-red-50 rounded-lg">
									<p class="text-3xl font-bold text-red-600">{importResult.failed}</p>
									<p class="text-sm text-red-700">导入失败</p>
								</div>
								<div class="p-4 bg-blue-50 rounded-lg">
									<p class="text-3xl font-bold text-blue-600">{importResult.success + importResult.failed}</p>
									<p class="text-sm text-blue-700">总计</p>
								</div>
							</div>

							{#if importResult.filledMissing > 0}
								<div class="text-left max-w-md mx-auto p-4 bg-yellow-50 rounded-lg mb-4">
									<h4 class="text-sm font-medium text-yellow-800 mb-2">缺失值处理:</h4>
									<p class="text-sm text-yellow-700">已自动填充 {importResult.filledMissing} 条缺失记录</p>
								</div>
							{/if}

							{#if importResult.errors.length > 0}
								<div class="text-left max-w-md mx-auto p-4 bg-red-50 rounded-lg">
									<h4 class="text-sm font-medium text-red-800 mb-2">失败详情:</h4>
									<ul class="text-sm text-red-700 space-y-1">
										{#each importResult.errors.slice(0, 5) as error}
											<li class="flex items-start gap-2">
												<AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
												{error}
											</li>
										{/each}
										{#if importResult.errors.length > 5}
											<li class="text-xs text-red-500">还有 {importResult.errors.length - 5} 条错误未显示</li>
										{/if}
									</ul>
								</div>
							{/if}

							<div class="flex justify-center gap-3 mt-8">
								<button class="btn btn-secondary" on:click={resetImport}>继续导入</button>
								<button class="btn btn-primary" on:click={() => goto('/dashboard')}>返回首页</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</AppLayout>
