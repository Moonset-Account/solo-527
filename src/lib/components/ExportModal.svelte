<script lang="ts">
	import { filters } from '$lib/stores/filters';
	import { fetchExport, downloadCSV } from '$lib/api/client';
	import type { ExportRequest } from '$lib/types';

	export let isOpen = false;
	export let onClose: () => void;

	let loading = false;
	let error = '';
	let exportType: 'aggregated' | 'detailed' = 'aggregated';
	let format: 'csv' | 'xlsx' = 'csv';
	let previewData: any = null;
	let currentRole: 'operator' | 'admin' = 'operator';

	$: isAdmin = currentRole === 'admin';

	async function handlePreview() {
		loading = true;
		error = '';
		try {
			const request: ExportRequest = {
				...$filters,
				exportType,
				format,
				includeDetails: exportType === 'detailed',
				userRole: currentRole
			};
			previewData = await fetchExport(request);
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function handleDownload() {
		if (!previewData) {
			await handlePreview();
		}
		if (previewData?.csvContent) {
			const filename = `活动分析_${$filters.startDate}_${$filters.endDate}.csv`;
			downloadCSV(previewData.csvContent, filename);
		}
	}

	function close() {
		previewData = null;
		error = '';
		onClose();
	}

	function handleRoleChange(e: Event) {
		currentRole = (e.target as HTMLSelectElement).value as 'operator' | 'admin';
		if (!isAdmin) {
			exportType = 'aggregated';
		}
		previewData = null;
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800">数据导出</h3>
				<button on:click={close} class="text-gray-400 hover:text-gray-600" aria-label="关闭导出弹窗">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-5 space-y-4">
				<div>
					<label for="user-role" class="block text-sm font-medium text-gray-700 mb-2">当前角色（模拟测试）</label>
					<select
						id="user-role"
						value={currentRole}
						on:change={handleRoleChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="operator">运营人员（仅聚合导出）</option>
						<option value="admin">管理员（可导出明细）</option>
					</select>
					<p class="text-xs text-gray-500 mt-1">
						{isAdmin ? '✅ 管理员权限：可导出报名明细，未成年人数据自动聚合' : '🔒 运营权限：仅可导出聚合数据'}
					</p>
				</div>

				<div>
					<span id="export-type-label" class="block text-sm font-medium text-gray-700 mb-2">导出类型</span>
					<div class="flex gap-4" role="radiogroup" aria-labelledby="export-type-label">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								bind:group={exportType}
								value="aggregated"
								class="text-primary-600 focus:ring-primary-500"
							/>
							<span class="text-sm">聚合数据（推荐）</span>
						</label>
						<label class={`flex items-center gap-2 cursor-pointer ${!isAdmin ? 'opacity-50' : ''}`}>
							<input
								type="radio"
								bind:group={exportType}
								value="detailed"
								class="text-primary-600 focus:ring-primary-500"
								disabled={!isAdmin}
							/>
							<span class={`text-sm ${!isAdmin ? 'text-gray-400' : ''}`}>
								明细数据（需管理员权限）
							</span>
						</label>
					</div>
				</div>

				<div>
					<label for="export-format" class="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
					<select
						id="export-format"
						bind:value={format}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="csv">CSV</option>
						<option value="xlsx" disabled>Excel (暂未支持)</option>
					</select>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
				{/if}

				{#if previewData}
					<div class="border border-gray-200 rounded-lg p-4 space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">数据行数</span>
							<span class="font-mono font-medium">{previewData.sampleSize}</span>
						</div>
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">导出类型</span>
							<span class="font-medium">{previewData.isAggregated ? '聚合数据' : '明细数据'}</span>
						</div>
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">包含未成年人数据</span>
							<span class={previewData.hasMinorData ? 'text-yellow-600' : 'text-green-600'}>
								{previewData.hasMinorData ? '⚠️ 是（已自动聚合）' : '否'}
							</span>
						</div>
						{#if previewData.sampleSize < 30}
							<div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
								⚠️ 样本量较小，统计结果可能不具备代表性，请谨慎使用。
							</div>
						{/if}
						{#if previewData.hasMinorData}
							<div class="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
								🔒 根据隐私保护规定，未成年人数据已自动聚合，不包含个人可识别信息。
							</div>
						{/if}
						{#if !previewData.isAggregated && previewData.minorDataAggregated}
							<div class="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-2 rounded text-sm">
								👤 成年人明细已完整导出，未成年人数据已按年龄段聚合展示。
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
				<button on:click={close} class="btn btn-secondary">取消</button>
				<button
					on:click={handlePreview}
					class="btn btn-secondary"
					disabled={loading}
				>
					{loading ? '加载中...' : '预览'}
				</button>
				<button
					on:click={handleDownload}
					class="btn btn-primary"
					disabled={loading || !previewData}
				>
					下载
				</button>
			</div>
		</div>
	</div>
{/if}
