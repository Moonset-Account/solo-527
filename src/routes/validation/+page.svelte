<script lang="ts">
	import { computeFunnelData, computeTurnoverRanking, detectAnomalies } from '$lib/utils/analytics'
	import { getFilter } from '$lib/stores/index.svelte'
	import { exportToCSV } from '$lib/utils/export'
	import type { ValidationRule, DrillDownPath } from '$lib/types'

	interface ValidationResult {
		metric: string
		actual: number
		expected_min: number
		expected_max: number
		passed: boolean
	}

	let rules = $state<ValidationRule[]>([
		{
			rule_id: 'rule_turnover',
			metric_name: '周转率',
			formula: 'out_qty / in_qty',
			description: '出库量与入库量的比值，衡量库存周转效率',
			expected_range: { min: 0, max: 2 },
			is_active: true
		},
		{
			rule_id: 'rule_age',
			metric_name: '库龄',
			formula: 'age_days',
			description: '库存平均存放天数',
			expected_range: { min: 0, max: 180 },
			is_active: true
		},
		{
			rule_id: 'rule_safety',
			metric_name: '安全库存覆盖率',
			formula: 'current_qty / safety_stock_qty',
			description: '当前库存与安全库存的比值',
			expected_range: { min: 0.5, max: 3 },
			is_active: true
		},
		{
			rule_id: 'rule_return',
			metric_name: '退货率',
			formula: 'return_qty / out_qty',
			description: '退货量与出库量的比值',
			expected_range: { min: 0, max: 0.15 },
			is_active: true
		}
	])

	let drillPaths = $state<DrillDownPath[]>([
		{
			path_id: 'path_sku_batch_pos',
			name: 'SKU → 批次 → 仓位',
			levels: [
				{ field: 'sku_id', label: 'SKU', order: 1 },
				{ field: 'batch_no', label: '批次', order: 2 },
				{ field: 'warehouse_position', label: '仓位', order: 3 }
			]
		},
		{
			path_id: 'path_supplier_sku_age',
			name: '供应商 → SKU → 库龄区间',
			levels: [
				{ field: 'supplier_id', label: '供应商', order: 1 },
				{ field: 'sku_id', label: 'SKU', order: 2 },
				{ field: 'age_bucket', label: '库龄区间', order: 3 }
			]
		},
		{
			path_id: 'path_age_sku_batch',
			name: '库龄区间 → SKU → 批次',
			levels: [
				{ field: 'age_bucket', label: '库龄区间', order: 1 },
				{ field: 'sku_id', label: 'SKU', order: 2 },
				{ field: 'batch_no', label: '批次', order: 3 }
			]
		}
	])

	let validationResults = $state<ValidationResult[]>([])
	let hasValidated = $state(false)
	let editingRuleId = $state<string | null>(null)
	let editMin = $state(0)
	let editMax = $state(0)

	function toggleRule(ruleId: string) {
		rules = rules.map((r) =>
			r.rule_id === ruleId ? { ...r, is_active: !r.is_active } : r
		)
	}

	function startEdit(rule: ValidationRule) {
		editingRuleId = rule.rule_id
		editMin = rule.expected_range.min
		editMax = rule.expected_range.max
	}

	function saveEdit(ruleId: string) {
		rules = rules.map((r) =>
			r.rule_id === ruleId
				? { ...r, expected_range: { min: editMin, max: editMax } }
				: r
		)
		editingRuleId = null
	}

	function cancelEdit() {
		editingRuleId = null
	}

	function runValidation() {
		const filter = getFilter()
		const funnelData = computeFunnelData(filter)
		const rankingData = computeTurnoverRanking(filter)
		const anomaliesData = detectAnomalies(filter)

		const turnoverRate = funnelData.total_inbound > 0
			? funnelData.effective_turnover
			: 0
		const avgAge = rankingData.length > 0
			? rankingData.reduce((s, r) => s + r.avg_age_days, 0) / rankingData.length
			: 0
		const safetyRatio = rankingData.length > 0
			? rankingData.reduce((s, r) => s + (r.current_qty > 0 ? r.current_qty / 100 : 0), 0) / rankingData.length
			: 0
		const returnAnomalies = anomaliesData.filter((a) => a.metric === '退货率异常')
		const returnRate = returnAnomalies.length > 0
			? returnAnomalies.reduce((s, a) => s + a.value, 0) / returnAnomalies.length
			: 0

		const computedMetrics: Record<string, number> = {
			'周转率': turnoverRate,
			'库龄': avgAge,
			'安全库存覆盖率': safetyRatio,
			'退货率': returnRate
		}

		const activeRules = rules.filter((r) => r.is_active)
		validationResults = activeRules.map((rule) => {
			const actual = computedMetrics[rule.metric_name] ?? 0
			return {
				metric: rule.metric_name,
				actual: Math.round(actual * 10000) / 10000,
				expected_min: rule.expected_range.min,
				expected_max: rule.expected_range.max,
				passed: actual >= rule.expected_range.min && actual <= rule.expected_range.max
			}
		})
		hasValidated = true
	}

	function handleExportCSV() {
		if (!validationResults.length) return
		const data = validationResults.map((r) => ({
			指标: r.metric,
			实际值: r.actual,
			期望最小值: r.expected_min,
			期望最大值: r.expected_max,
			结果: r.passed ? '通过' : '未通过'
		}))
		exportToCSV(data, 'validation-results')
	}
</script>

<div id="validation-page-content" class="validation-page">
	<div class="section-card">
		<div class="card-header">
			<h3 class="card-title">校验口径</h3>
		</div>
		<div class="card-body">
			<div class="rules-list">
				{#each rules as rule (rule.rule_id)}
					<div class="rule-card" class:inactive={!rule.is_active}>
						<div class="rule-main">
							<div class="rule-header">
								<span class="rule-name">{rule.metric_name}</span>
								<div class="rule-actions">
									<button
										class="toggle-btn"
										class:on={rule.is_active}
										onclick={() => toggleRule(rule.rule_id)}
									>
										{rule.is_active ? '启用' : '停用'}
									</button>
									{#if editingRuleId !== rule.rule_id}
										<button class="edit-btn" onclick={() => startEdit(rule)}>编辑</button>
									{/if}
								</div>
							</div>
							<div class="rule-formula">{rule.formula}</div>
							<div class="rule-desc">{rule.description}</div>
							{#if editingRuleId === rule.rule_id}
								<div class="edit-form">
									<label class="edit-label">
										最小值
										<input type="number" class="edit-input" bind:value={editMin} step="0.01" />
									</label>
									<label class="edit-label">
										最大值
										<input type="number" class="edit-input" bind:value={editMax} step="0.01" />
									</label>
									<button class="save-btn" onclick={() => saveEdit(rule.rule_id)}>保存</button>
									<button class="cancel-btn" onclick={cancelEdit}>取消</button>
								</div>
							{:else}
								<div class="rule-range">
									期望范围：[{rule.expected_range.min}, {rule.expected_range.max}]
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="section-card">
		<div class="card-header">
			<h3 class="card-title">下钻路径</h3>
		</div>
		<div class="card-body">
			<div class="drill-paths">
				{#each drillPaths as path (path.path_id)}
					<div class="drill-path-row">
						{#each path.levels as level, i}
							<div class="drill-node">
								<span class="node-label">{level.label}</span>
							</div>
							{#if i < path.levels.length - 1}
								<div class="drill-arrow">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
										<path d="M5 12h14M12 5l7 7-7 7" />
									</svg>
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="section-card">
		<div class="card-header">
			<h3 class="card-title">校验结果</h3>
			<div class="header-actions">
				<button class="run-btn" onclick={runValidation}>执行校验</button>
				{#if hasValidated && validationResults.length > 0}
					<button class="csv-btn" onclick={handleExportCSV}>导出CSV</button>
				{/if}
			</div>
		</div>
		<div class="card-body">
			{#if !hasValidated}
				<div class="empty-state">请点击"执行校验"开始校验</div>
			{:else if validationResults.length === 0}
				<div class="empty-state">无启用的校验规则</div>
			{:else}
				<table class="result-table">
					<thead>
						<tr>
							<th>指标</th>
							<th>实际值</th>
							<th>期望范围</th>
							<th>结果</th>
						</tr>
					</thead>
					<tbody>
						{#each validationResults as result}
							<tr>
								<td>{result.metric}</td>
								<td>{result.actual}</td>
								<td>[{result.expected_min}, {result.expected_max}]</td>
								<td>
									<span class="status-badge" class:pass={result.passed} class:fail={!result.passed}>
										{result.passed ? '通过' : '未通过'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>

<style>
	.validation-page {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section-card {
		background-color: var(--color-card);
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 20px;
		border-bottom: 1px solid var(--color-surface-dark);
	}

	.card-title {
		font-family: var(--font-heading);
		font-size: 15px;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.card-body {
		padding: 20px;
	}

	.rules-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.rule-card {
		padding: 14px 18px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		transition: opacity 0.15s ease;
	}

	.rule-card.inactive {
		opacity: 0.5;
	}

	.rule-main {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.rule-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.rule-name {
		font-size: 15px;
		font-weight: 700;
		color: var(--color-primary);
	}

	.rule-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.toggle-btn {
		font-size: 12px;
		padding: 3px 12px;
		border-radius: 999px;
		border: 1px solid var(--color-surface-dark);
		background: none;
		cursor: pointer;
		color: var(--color-primary-light);
		transition: all 0.15s ease;
	}

	.toggle-btn.on {
		background-color: rgba(46, 205, 167, 0.12);
		border-color: var(--color-secondary);
		color: var(--color-secondary);
	}

	.edit-btn {
		font-size: 12px;
		padding: 3px 12px;
		border-radius: 6px;
		border: 1px solid var(--color-surface-dark);
		background: none;
		cursor: pointer;
		color: var(--color-primary);
		transition: all 0.15s ease;
	}

	.edit-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.rule-formula {
		font-size: 13px;
		color: var(--color-accent);
		font-family: monospace;
	}

	.rule-desc {
		font-size: 12px;
		color: var(--color-primary-light);
	}

	.rule-range {
		font-size: 12px;
		color: var(--color-primary-light);
	}

	.edit-form {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 6px;
		padding-top: 8px;
		border-top: 1px dashed var(--color-surface-dark);
	}

	.edit-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: var(--color-primary);
	}

	.edit-input {
		width: 80px;
		padding: 4px 8px;
		border: 1px solid var(--color-surface-dark);
		border-radius: 4px;
		font-size: 13px;
		outline: none;
		background: var(--color-card);
		color: var(--color-primary);
	}

	.edit-input:focus {
		border-color: var(--color-accent);
	}

	.save-btn {
		padding: 4px 14px;
		border-radius: 4px;
		border: none;
		background-color: var(--color-accent);
		color: #fff;
		font-size: 12px;
		cursor: pointer;
	}

	.cancel-btn {
		padding: 4px 14px;
		border-radius: 4px;
		border: 1px solid var(--color-surface-dark);
		background: none;
		color: var(--color-primary-light);
		font-size: 12px;
		cursor: pointer;
	}

	.drill-paths {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.drill-path-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
	}

	.drill-node {
		padding: 6px 16px;
		border-radius: 6px;
		background-color: rgba(27, 42, 74, 0.06);
		border: 1px solid var(--color-surface-dark);
	}

	.node-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
	}

	.drill-arrow {
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.run-btn {
		padding: 6px 18px;
		border-radius: 8px;
		border: none;
		background-color: var(--color-accent);
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.run-btn:hover {
		opacity: 0.9;
	}

	.csv-btn {
		padding: 6px 18px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-card);
		color: var(--color-primary);
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.csv-btn:hover {
		border-color: var(--color-secondary);
		color: var(--color-secondary);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
		color: var(--color-primary-light);
		font-size: 14px;
	}

	.result-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.result-table th {
		text-align: left;
		padding: 8px 12px;
		background-color: var(--color-surface-dark);
		color: var(--color-primary-light);
		font-weight: 600;
		font-size: 12px;
	}

	.result-table td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--color-surface-dark);
		color: var(--color-primary);
	}

	.result-table tbody tr:hover {
		background-color: rgba(27, 42, 74, 0.02);
	}

	.status-badge {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 12px;
		border-radius: 999px;
	}

	.status-badge.pass {
		background-color: rgba(46, 205, 167, 0.12);
		color: var(--color-success);
	}

	.status-badge.fail {
		background-color: rgba(239, 68, 68, 0.12);
		color: var(--color-danger);
	}
</style>
