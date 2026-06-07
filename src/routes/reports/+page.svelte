<script lang="ts">
	import { computeWeeklyReport, mergePermissionToFilter, type DataSource } from '$lib/utils/analytics'
	import { onMount } from 'svelte'
	import { exportToPDF, exportToImage } from '$lib/utils/export'
	import type { WeeklyReport, FilterState, UserRole } from '$lib/types'

	let getFilter: () => FilterState = () => ({ sku_ids: [], warehouse_positions: [], supplier_ids: [], batch_nos: [], age_buckets: [], date_range: { start: '', end: '' } })
	let getUserRole: () => UserRole = () => ({ role_id: 'analyst', role_name: '数据分析师', accessible_warehouses: [], accessible_suppliers: [], accessible_sku_categories: [] })
	let getAllSkuNames: () => Record<string, string> = () => ({})
	let queryFromDuckDB: ((filters: Partial<FilterState>, wh: string[], sup: string[], sku: string[], names: Record<string, string>) => Promise<DataSource>) | null = null

	onMount(() => {
		import('$lib/stores/index.svelte').then((stores) => {
			getFilter = stores.getFilter
			getUserRole = stores.getUserRole
			getAllSkuNames = stores.getAllSkuNames
		})
		import('$lib/utils/duckdb').then((duckdb) => {
			duckdb.initDuckDB().then(() => {
				queryFromDuckDB = (filters, wh, sup, sku, names) =>
					duckdb.queryDataSourceFromDuckDB(filters, wh, sup, sku, names)
			}).catch(() => {})
		}).catch(() => {})
	})

	let reports = $state<WeeklyReport[]>([])
	let selectedReport = $state<WeeklyReport | null>(null)
	let generating = $state(false)

	const sortedReports = $derived(
		[...reports].sort(
			(a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
		)
	)

	async function handleGenerate() {
		generating = true
		try {
			const filter = getFilter()
			const role = getUserRole()
			const mergedFilters = mergePermissionToFilter(
				filter,
				role.accessible_warehouses,
				role.accessible_suppliers,
				role.accessible_sku_categories
			)
			let ds: DataSource
			if (queryFromDuckDB) {
				try {
					ds = await queryFromDuckDB(
						mergedFilters,
						role.accessible_warehouses,
						role.accessible_suppliers,
						role.accessible_sku_categories,
						getAllSkuNames()
					)
				} catch {
					ds = { inbound: [], outbound: [], inventoryAge: [], returns: [], safetyStock: [], skuNames: getAllSkuNames() }
				}
			} else {
				ds = { inbound: [], outbound: [], inventoryAge: [], returns: [], safetyStock: [], skuNames: getAllSkuNames() }
			}
			const report = computeWeeklyReport(ds, mergedFilters)
			reports = [...reports, report]
			selectedReport = report
		} finally {
			generating = false
		}
	}

	function selectReport(report: WeeklyReport) {
		selectedReport = report
	}

	function handleExportPDF() {
		if (!selectedReport) return
		exportToPDF('report-detail-content', `${selectedReport.report_id}`)
	}

	function handleExportImage() {
		if (!selectedReport) return
		exportToImage('report-detail-content', `${selectedReport.report_id}`)
	}

	function severityColor(severity: 'high' | 'medium' | 'low'): string {
		if (severity === 'high') return 'var(--color-danger)'
		if (severity === 'medium') return 'var(--color-warning)'
		return 'var(--color-success)'
	}

	function severityBg(severity: 'high' | 'medium' | 'low'): string {
		if (severity === 'high') return 'rgba(239,68,68,0.12)'
		if (severity === 'medium') return 'rgba(245,158,11,0.12)'
		return 'rgba(46,205,167,0.12)'
	}

	function severityLabel(severity: 'high' | 'medium' | 'low'): string {
		if (severity === 'high') return '高'
		if (severity === 'medium') return '中'
		return '低'
	}

	function formatChange(pct: number): string {
		if (pct > 0) return `+${pct}%`
		if (pct < 0) return `${pct}%`
		return '0%'
	}

	function changeColor(pct: number): string {
		if (pct > 0) return 'var(--color-danger)'
		if (pct < 0) return 'var(--color-success)'
		return 'var(--color-primary-light)'
	}

	function formatFilterSnapshot(snapshot: WeeklyReport['filter_snapshot']): string[] {
		const parts: string[] = []
		if (snapshot.sku_ids.length) parts.push(`SKU: ${snapshot.sku_ids.join(', ')}`)
		if (snapshot.warehouse_positions.length) parts.push(`仓位: ${snapshot.warehouse_positions.join(', ')}`)
		if (snapshot.supplier_ids.length) parts.push(`供应商: ${snapshot.supplier_ids.join(', ')}`)
		if (snapshot.batch_nos.length) parts.push(`批次: ${snapshot.batch_nos.join(', ')}`)
		if (snapshot.age_buckets.length) parts.push(`库龄区间: ${snapshot.age_buckets.join(', ')}`)
		if (snapshot.date_range.start || snapshot.date_range.end) {
			parts.push(`日期: ${snapshot.date_range.start || '...'} ~ ${snapshot.date_range.end || '...'}`)
		}
		return parts
	}
</script>

<div id="reports-page-content" class="reports-page">
	<div class="reports-toolbar">
		<h2 class="page-heading">周报中心</h2>
		<button class="btn-generate" onclick={handleGenerate} disabled={generating}>
			{#if generating}
				生成中...
			{:else}
				生成周报
			{/if}
		</button>
	</div>

	<div class="reports-layout">
		<div class="report-list-panel">
			<div class="panel-header">历史周报</div>
			{#if sortedReports.length === 0}
				<div class="empty-state">暂无周报，请点击"生成周报"</div>
			{:else}
				<div class="report-list">
					{#each sortedReports as report (report.report_id)}
						<button
							class="report-list-item"
							class:active={selectedReport?.report_id === report.report_id}
							onclick={() => selectReport(report)}
						>
							<div class="item-period">{report.week_start} ~ {report.week_end}</div>
							<div class="item-meta">{report.report_id}</div>
							<div class="item-time">{new Date(report.generated_at).toLocaleString('zh-CN')}</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="report-detail-panel">
			{#if !selectedReport}
				<div class="empty-state">请选择或生成一份周报</div>
			{:else}
				<div id="report-detail-content" class="detail-content">
					<div class="detail-header">
						<div class="detail-title">{selectedReport.report_id}</div>
						<div class="detail-period">
							报告周期：{selectedReport.week_start} ~ {selectedReport.week_end}
						</div>
						<div class="detail-generated">
							生成时间：{new Date(selectedReport.generated_at).toLocaleString('zh-CN')}
						</div>
					</div>

					<div class="detail-section">
						<h4 class="section-title">关键变化</h4>
						<ul class="key-changes-list">
							{#each selectedReport.key_changes as change}
								<li>{change}</li>
							{/each}
						</ul>
					</div>

					<div class="detail-section">
						<h4 class="section-title">环比对比 (MoM)</h4>
						<table class="comparison-table">
							<thead>
								<tr>
									<th>指标</th>
									<th>当期值</th>
									<th>上期值</th>
									<th>变化率</th>
								</tr>
							</thead>
							<tbody>
								{#each Object.entries(selectedReport.mom_comparison) as [metric, data]}
									<tr>
										<td>{metric}</td>
										<td>{data.current.toLocaleString()}</td>
										<td>{data.previous.toLocaleString()}</td>
										<td style="color: {changeColor(data.change_pct)}">{formatChange(data.change_pct)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="detail-section">
						<h4 class="section-title">同比对比 (YoY)</h4>
						<table class="comparison-table">
							<thead>
								<tr>
									<th>指标</th>
									<th>当期值</th>
									<th>去年同期</th>
									<th>变化率</th>
								</tr>
							</thead>
							<tbody>
								{#each Object.entries(selectedReport.yoy_comparison) as [metric, data]}
									<tr>
										<td>{metric}</td>
										<td>{data.current.toLocaleString()}</td>
										<td>{data.previous.toLocaleString()}</td>
										<td style="color: {changeColor(data.change_pct)}">{formatChange(data.change_pct)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="detail-section">
						<h4 class="section-title">异常列表</h4>
						{#if selectedReport.anomalies.length === 0}
							<div class="no-data">无异常</div>
						{:else}
							<div class="anomaly-list">
								{#each selectedReport.anomalies as anomaly}
									<div class="anomaly-item">
										<span
											class="severity-badge"
											style="color: {severityColor(anomaly.severity)}; background-color: {severityBg(anomaly.severity)}"
										>
											{severityLabel(anomaly.severity)}
										</span>
										<span class="anomaly-metric">{anomaly.metric}</span>
										<span class="anomaly-desc">{anomaly.description}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="detail-section">
						<h4 class="section-title">筛选快照</h4>
						{#if formatFilterSnapshot(selectedReport.filter_snapshot).length === 0}
							<div class="no-data">无筛选条件（全局数据）</div>
						{:else}
							<div class="filter-tags">
								{#each formatFilterSnapshot(selectedReport.filter_snapshot) as tag}
									<span class="filter-tag">{tag}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="detail-actions">
					<button class="btn-export" onclick={handleExportPDF}>导出PDF</button>
					<button class="btn-export btn-export-image" onclick={handleExportImage}>导出图片</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.reports-page {
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
	}

	.reports-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.page-heading {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.btn-generate {
		padding: 8px 20px;
		border-radius: 8px;
		border: none;
		background-color: var(--color-accent);
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.btn-generate:hover {
		opacity: 0.9;
	}

	.btn-generate:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reports-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 20px;
		flex: 1;
		min-height: 0;
	}

	.report-list-panel {
		background-color: var(--color-card);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-header {
		padding: 14px 16px;
		font-weight: 600;
		font-size: 14px;
		color: var(--color-primary);
		border-bottom: 1px solid var(--color-surface-dark);
	}

	.report-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.report-list-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 16px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		border-bottom: 1px solid var(--color-surface-dark);
		transition: background-color 0.15s ease;
	}

	.report-list-item:hover {
		background-color: rgba(27, 42, 74, 0.03);
	}

	.report-list-item.active {
		background-color: rgba(255, 107, 53, 0.08);
		border-left: 3px solid var(--color-accent);
	}

	.item-period {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
	}

	.item-meta {
		font-size: 12px;
		color: var(--color-primary-light);
	}

	.item-time {
		font-size: 11px;
		color: var(--color-primary-light);
		opacity: 0.7;
	}

	.report-detail-panel {
		background-color: var(--color-card);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--color-primary-light);
		font-size: 14px;
	}

	.detail-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.detail-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-title {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 700;
		color: var(--color-primary);
	}

	.detail-period {
		font-size: 14px;
		color: var(--color-accent);
		font-weight: 600;
	}

	.detail-generated {
		font-size: 12px;
		color: var(--color-primary-light);
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.section-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--color-surface-dark);
	}

	.key-changes-list {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.key-changes-list li {
		font-size: 14px;
		color: var(--color-primary);
		line-height: 1.5;
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.comparison-table th {
		text-align: left;
		padding: 8px 12px;
		background-color: var(--color-surface-dark);
		color: var(--color-primary-light);
		font-weight: 600;
		font-size: 12px;
	}

	.comparison-table td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--color-surface-dark);
		color: var(--color-primary);
	}

	.comparison-table tbody tr:hover {
		background-color: rgba(27, 42, 74, 0.02);
	}

	.anomaly-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.anomaly-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: 8px;
		background-color: var(--color-surface-dark);
	}

	.severity-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.anomaly-metric {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.anomaly-desc {
		font-size: 13px;
		color: var(--color-primary-light);
	}

	.no-data {
		font-size: 13px;
		color: var(--color-primary-light);
		padding: 8px 0;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.filter-tag {
		font-size: 12px;
		padding: 4px 12px;
		border-radius: 6px;
		background-color: var(--color-surface-dark);
		color: var(--color-primary);
	}

	.detail-actions {
		display: flex;
		gap: 10px;
		padding: 14px 24px;
		border-top: 1px solid var(--color-surface-dark);
	}

	.btn-export {
		padding: 8px 18px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-card);
		color: var(--color-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-export:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.btn-export-image {
		background-color: var(--color-secondary);
		color: #fff;
		border-color: var(--color-secondary);
	}

	.btn-export-image:hover {
		opacity: 0.9;
		border-color: var(--color-secondary);
		color: #fff;
	}

	@media (max-width: 1023px) {
		.reports-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
