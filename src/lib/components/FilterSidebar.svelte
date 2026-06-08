<script lang="ts">
	import { filterStore, selectedVersion } from '$lib/store';
	import { getChapterList, getVersionList, getSampleSize } from '$lib/db';
	import type { FilterState } from '$lib/types';

	let {
		onfilterchange
	}: {
		onfilterchange?: (f: FilterState) => void
	} = $props();

	let dateStart = $state('2025-01-01');
	let dateEnd = $state('2025-06-30');
	let selectedChapters = $state<string[]>([]);
	let selectedVersions = $state<string[]>([]);
	let allChapters = $state<string[]>([]);
	let allVersions = $state<string[]>([]);
	let sampleSize = $state(0);
	let initialized = $state(false);

	$effect(() => {
		allChapters = getChapterList();
		allVersions = getVersionList();
	});

	$effect(() => {
		if (allChapters.length > 0 && !initialized) {
			initialized = true;
			emitFilter();
		}
	});

	function emitFilter(): FilterState {
		const filter: FilterState = {
			dateRange: [dateStart, dateEnd],
			chapters: selectedChapters,
			versions: selectedVersions,
			course: 'all'
		};
		sampleSize = getSampleSize(filter);
		filterStore.set(filter);
		onfilterchange?.(filter);
		return filter;
	}

	function toggleChapter(ch: string) {
		if (selectedChapters.includes(ch)) {
			selectedChapters = selectedChapters.filter((c) => c !== ch);
		} else {
			selectedChapters = [...selectedChapters, ch];
		}
		emitFilter();
	}

	function toggleVersion(v: string) {
		if (selectedVersions.includes(v)) {
			selectedVersions = selectedVersions.filter((x) => x !== v);
		} else {
			selectedVersions = [...selectedVersions, v];
		}
		selectedVersion.set(selectedVersions.length > 0 ? selectedVersions[selectedVersions.length - 1] : 'latest');
		emitFilter();
	}

	function resetFilters() {
		dateStart = '2025-01-01';
		dateEnd = '2025-06-30';
		selectedChapters = [];
		selectedVersions = [];
		filterStore.reset();
		emitFilter();
	}

	function undo() {
		filterStore.undo();
		const f = filterStore.getCurrent();
		dateStart = f.dateRange[0];
		dateEnd = f.dateRange[1];
		selectedChapters = [...f.chapters];
		selectedVersions = [...f.versions];
		sampleSize = getSampleSize(f);
		onfilterchange?.(f);
	}

	function redo() {
		filterStore.redo();
		const f = filterStore.getCurrent();
		dateStart = f.dateRange[0];
		dateEnd = f.dateRange[1];
		selectedChapters = [...f.chapters];
		selectedVersions = [...f.versions];
		sampleSize = getSampleSize(f);
		onfilterchange?.(f);
	}
</script>

<div class="filter-sidebar">
	<div class="filter-header">
		<h3>筛选器</h3>
		<div class="filter-actions">
			<button onclick={undo} title="撤销">↶</button>
			<button onclick={redo} title="重做">↷</button>
			<button onclick={resetFilters} title="重置">⟳</button>
		</div>
	</div>

	<div class="filter-section">
		<span class="section-label">时间窗口</span>
		<div class="date-range">
			<input type="date" bind:value={dateStart} onchange={emitFilter} />
			<span>~</span>
			<input type="date" bind:value={dateEnd} onchange={emitFilter} />
		</div>
	</div>

	<div class="filter-section">
		<span class="section-label">样本量: {sampleSize}</span>
	</div>

	<div class="filter-section">
		<span class="section-label">章节筛选</span>
		<div class="chip-group">
			{#each allChapters as ch}
				<button
					class="chip"
					class:active={selectedChapters.includes(ch)}
					onclick={() => toggleChapter(ch)}
				>
					{ch}
				</button>
			{/each}
		</div>
	</div>

	<div class="filter-section">
		<span class="section-label">版本筛选</span>
		<div class="chip-group">
			{#each allVersions as v}
				<button
					class="chip"
					class:active={selectedVersions.includes(v)}
					onclick={() => toggleVersion(v)}
				>
					v{v}
				</button>
			{/each}
		</div>
	</div>

	<div class="filter-section info">
		<p>⚠ 当天更新章节标记为过渡样本</p>
		<p>🔒 退款反馈已脱敏处理</p>
	</div>
</div>

<style>
	.filter-sidebar {
		padding: 16px;
		background: #fafafa;
		border-right: 1px solid #e8e8e8;
		height: 100%;
		overflow-y: auto;
		min-width: 240px;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.filter-header h3 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}

	.filter-actions {
		display: flex;
		gap: 4px;
	}

	.filter-actions button {
		width: 28px;
		height: 28px;
		border: 1px solid #d9d9d9;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.filter-actions button:hover {
		border-color: #1890ff;
		color: #1890ff;
	}

	.filter-section {
		margin-bottom: 16px;
	}

	.section-label {
		display: block;
		font-size: 12px;
		color: #666;
		margin-bottom: 6px;
		font-weight: 500;
	}

	.date-range {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.date-range input {
		width: 110px;
		padding: 4px 6px;
		border: 1px solid #d9d9d9;
		border-radius: 4px;
		font-size: 11px;
	}

	.date-range span {
		color: #999;
		font-size: 12px;
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.chip {
		padding: 3px 8px;
		border: 1px solid #d9d9d9;
		border-radius: 12px;
		background: #fff;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.chip:hover {
		border-color: #1890ff;
		color: #1890ff;
	}

	.chip.active {
		background: #1890ff;
		border-color: #1890ff;
		color: #fff;
	}

	.info {
		padding: 8px;
		background: #fffbe6;
		border: 1px solid #ffe58f;
		border-radius: 4px;
	}

	.info p {
		margin: 0;
		font-size: 11px;
		color: #ad6800;
		line-height: 1.6;
	}
</style>
