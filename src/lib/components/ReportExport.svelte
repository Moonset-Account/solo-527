<script lang="ts">
	import { isInternalAccount, filterStore } from '$lib/store';
	import { generateReport, downloadReport } from '$lib/export';
	import type {
		PathFlowNode,
		PathFlowLink,
		BottleneckData,
		HeatmapData,
		VersionCompareData,
		DiscussionRecord,
		RefundRecord,
		ExportMetadata
	} from '$lib/types';

	let {
		pathNodes = [],
		pathLinks = [],
		bottlenecks = [],
		heatmapData = [],
		versionData = [],
		discussions = [],
		refunds = [],
		sampleSize = 0
	} = $props();

	let isInternal = $derived($isInternalAccount);
	let exporting = $state(false);

	function handleExport() {
		exporting = true;
		try {
			const filter = filterStore.getCurrent();
			const metadata: ExportMetadata = {
				timeWindow: filter.dateRange,
				sampleSize,
				filterCriteria: filter,
				generatedAt: new Date().toISOString()
			};

			const content = generateReport(
				metadata,
				pathNodes,
				pathLinks,
				bottlenecks,
				heatmapData,
				versionData,
				discussions,
				refunds,
				isInternal
			);

			downloadReport(content);
		} finally {
			exporting = false;
		}
	}
</script>

<div class="export-bar">
	<div class="export-info">
		<span class="export-label">导出报告</span>
		<span class="export-hint">包含时间窗口、样本量和当前筛选口径</span>
	</div>
	<div class="export-actions">
		<button class="btn-export" onclick={handleExport} disabled={exporting}>
			{exporting ? '生成中...' : '下载报告'}
		</button>
		<span class="toggle-internal">
			<input type="checkbox" checked={$isInternalAccount} onchange={(e) => {
				isInternalAccount.set((e.target as HTMLInputElement).checked);
			}} />
			<span>内部账号</span>
		</span>
	</div>
</div>

<style>
	.export-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 16px;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
	}

	.export-info {
		display: flex;
		flex-direction: column;
	}

	.export-label {
		font-size: 13px;
		font-weight: 600;
		color: #333;
	}

	.export-hint {
		font-size: 11px;
		color: #999;
	}

	.export-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn-export {
		padding: 6px 16px;
		background: #1890ff;
		color: #fff;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-export:hover:not(:disabled) {
		background: #096dd9;
	}

	.btn-export:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.toggle-internal {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: #666;
		cursor: pointer;
	}

	.toggle-internal input {
		margin: 0;
	}
</style>
