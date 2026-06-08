<script lang="ts">
	import type { RefundRecord } from '$lib/types';
	import { maskRefundFeedback } from '$lib/privacy';

	let { refunds = [] } = $props();

	let maskedRefunds = $derived(refunds.map((r) => maskRefundFeedback(r)));
</script>

<div class="refund-panel">
	<div class="panel-header">
		<span class="panel-title">退款反馈 🔒</span>
		<span class="privacy-note">已脱敏</span>
	</div>
	<div class="refund-list">
		{#each maskedRefunds.slice(0, 10) as r}
			<div class="refund-item">
				<div class="refund-meta">
					<span class="chapter">{r.chapter_id}</span>
					<span class="date">{r.date}</span>
				</div>
				<div class="refund-reason">{r.reason}</div>
				<div class="refund-feedback">{r.feedback}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.refund-panel {
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 16px;
		border-bottom: 1px solid #f0f0f0;
	}

	.panel-title {
		font-size: 13px;
		font-weight: 600;
		color: #333;
	}

	.privacy-note {
		font-size: 11px;
		color: #52c41a;
		background: #f6ffed;
		border: 1px solid #b7eb8f;
		padding: 1px 6px;
		border-radius: 3px;
	}

	.refund-list {
		max-height: 240px;
		overflow-y: auto;
		padding: 8px;
	}

	.refund-item {
		padding: 8px 12px;
		border-bottom: 1px solid #f5f5f5;
	}

	.refund-item:last-child {
		border-bottom: none;
	}

	.refund-meta {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.chapter {
		font-size: 11px;
		color: #1890ff;
		font-weight: 500;
	}

	.date {
		font-size: 10px;
		color: #999;
	}

	.refund-reason {
		font-size: 12px;
		color: #ee6666;
		margin-bottom: 2px;
	}

	.refund-feedback {
		font-size: 11px;
		color: #666;
		line-height: 1.5;
	}
</style>
