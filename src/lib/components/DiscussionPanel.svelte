<script lang="ts">
	import type { DiscussionRecord } from '$lib/types';
	import { isInternalAccount } from '$lib/store';
	import { maskDiscussionContent } from '$lib/privacy';

	let { discussions = [] } = $props();

	let isInternal = $derived($isInternalAccount);
	let showContent = $state(false);

	let displayDiscussions = $derived(
		discussions.map((d) => maskDiscussionContent(d, isInternal))
	);
</script>

<div class="discussion-panel">
	<div class="panel-header">
		<span class="panel-title">讨论区</span>
		{#if isInternal}
			<label class="toggle">
				<input type="checkbox" bind:checked={showContent} />
				<span>显示原文</span>
			</label>
		{/if}
		{#if !isInternal}
			<span class="badge-internal">🔒 仅内部可见</span>
		{/if}
	</div>
	<div class="discussion-list">
		{#each displayDiscussions.slice(0, 15) as d}
			<div class="discussion-item">
				<div class="discussion-meta">
					<span class="chapter">{d.chapter_id}</span>
					<span class="date">{d.date}</span>
				</div>
				<div class="discussion-topic">{d.topic_summary}</div>
				{#if isInternal && showContent}
					<div class="discussion-content">{d.content}</div>
				{:else if isInternal}
					<div class="discussion-content masked">[点击"显示原文"查看]</div>
				{:else}
					<div class="discussion-content masked">[内容仅内部可见]</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.discussion-panel {
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

	.toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: #666;
		cursor: pointer;
	}

	.toggle input {
		margin: 0;
	}

	.badge-internal {
		font-size: 11px;
		color: #999;
	}

	.discussion-list {
		max-height: 280px;
		overflow-y: auto;
		padding: 8px;
	}

	.discussion-item {
		padding: 8px 12px;
		border-bottom: 1px solid #f5f5f5;
	}

	.discussion-item:last-child {
		border-bottom: none;
	}

	.discussion-meta {
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

	.discussion-topic {
		font-size: 12px;
		color: #333;
		margin-bottom: 2px;
	}

	.discussion-content {
		font-size: 11px;
		color: #666;
		line-height: 1.5;
	}

	.discussion-content.masked {
		color: #bbb;
		font-style: italic;
	}
</style>
