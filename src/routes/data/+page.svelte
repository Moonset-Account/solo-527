<script lang="ts">
	import { parseCSV } from '$lib/utils/import'
	import { dataDictionary } from '$lib/data/data-dictionary'
	import { onMount } from 'svelte'
	import type { DataDictionaryEntry, ImportResult, UserRole, InboundRecord, OutboundRecord, InventoryAgeRecord, ReturnRecord, SafetyStockRecord } from '$lib/types'

	let setInboundData: (d: InboundRecord[]) => void = () => {}
	let setOutboundData: (d: OutboundRecord[]) => void = () => {}
	let setInventoryAgeData: (d: InventoryAgeRecord[]) => void = () => {}
	let setReturnData: (d: ReturnRecord[]) => void = () => {}
	let setSafetyStockData: (d: SafetyStockRecord[]) => void = () => {}
	let getUserRole: () => UserRole = () => ({ role_id: 'analyst', role_name: '数据分析师', accessible_warehouses: [], accessible_suppliers: [], accessible_sku_categories: [] })
	let setUserRole: (r: UserRole) => void = () => {}

	onMount(() => {
		import('$lib/stores/index.svelte').then((stores) => {
			setInboundData = stores.setInboundData
			setOutboundData = stores.setOutboundData
			setInventoryAgeData = stores.setInventoryAgeData
			setReturnData = stores.setReturnData
			setSafetyStockData = stores.setSafetyStockData
			getUserRole = stores.getUserRole
			setUserRole = stores.setUserRole
		})
	})

	type TabKey = 'import' | 'dictionary' | 'missing' | 'permission'

	const tabs: Array<{ key: TabKey; label: string }> = [
		{ key: 'import', label: '批量导入' },
		{ key: 'dictionary', label: '数据字典' },
		{ key: 'missing', label: '缺失值处理' },
		{ key: 'permission', label: '权限过滤' }
	]

	let activeTab = $state<TabKey>('import')

	let isDragging = $state(false)
	let uploadProgress = $state(0)
	let isUploading = $state(false)
	let importResult = $state<ImportResult | null>(null)
	let uploadedFileName = $state('')

	let dictSearch = $state('')
	let collapsedTables = $state<Set<string>>(new Set())

	const tableNames = $derived([...new Set(dataDictionary.map((d) => d.table_name))])

	const filteredDictionary = $derived(
		dataDictionary.filter(
			(d) =>
				!dictSearch ||
				d.field_name.toLowerCase().includes(dictSearch.toLowerCase()) ||
				d.description.toLowerCase().includes(dictSearch.toLowerCase()) ||
				d.business_meaning.toLowerCase().includes(dictSearch.toLowerCase())
		)
	)

	const groupedFilteredDictionary = $derived(() => {
		const groups: Record<string, DataDictionaryEntry[]> = {}
		for (const entry of filteredDictionary) {
			if (!groups[entry.table_name]) groups[entry.table_name] = []
			groups[entry.table_name].push(entry)
		}
		return groups
	})

	let missingStrategies = $state<Record<string, DataDictionaryEntry['missing_value_strategy']>>({})
	let savedStrategies = $state<Record<string, DataDictionaryEntry['missing_value_strategy']>>({})

	$effect(() => {
		const initial: Record<string, DataDictionaryEntry['missing_value_strategy']> = {}
		for (const entry of dataDictionary) {
			initial[`${entry.table_name}.${entry.field_name}`] = entry.missing_value_strategy
		}
		missingStrategies = initial
	})

	const affectedRowCounts = $derived(
		Object.fromEntries(
			dataDictionary.map((entry) => [
				`${entry.table_name}.${entry.field_name}`,
				Math.floor(Math.random() * 50) + 5
			])
		)
	)

	const roleConfigs: Array<{
		role_id: UserRole['role_id']
		role_name: string
	}> = [
		{ role_id: 'admin', role_name: '系统管理员' },
		{ role_id: 'manager', role_name: '仓库经理' },
		{ role_id: 'analyst', role_name: '数据分析师' }
	]

	const warehouses = ['A1', 'B2', 'C3']
	const suppliers = Array.from({ length: 10 }, (_, i) => `SUP${String(i + 1).padStart(2, '0')}`)

	let rolePermissions = $state<Record<string, { warehouses: Set<string>; suppliers: Set<string> }>>({})

	$effect(() => {
		const current = getUserRole()
		const perms: Record<string, { warehouses: Set<string>; suppliers: Set<string> }> = {
			admin: { warehouses: new Set(warehouses), suppliers: new Set(suppliers) },
			manager: { warehouses: new Set(['A1', 'B2']), suppliers: new Set(suppliers.slice(0, 5)) },
			analyst: { warehouses: new Set(current.accessible_warehouses), suppliers: new Set(current.accessible_suppliers) }
		}
		rolePermissions = perms
	})

	function toggleTable(tableName: string) {
		const next = new Set(collapsedTables)
		if (next.has(tableName)) {
			next.delete(tableName)
		} else {
			next.add(tableName)
		}
		collapsedTables = next
	}

	async function handleFileDrop(e: DragEvent) {
		e.preventDefault()
		isDragging = false
		const file = e.dataTransfer?.files?.[0]
		if (file) await processFile(file)
	}

	async function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (file) await processFile(file)
	}

	async function processFile(file: File) {
		uploadedFileName = file.name
		isUploading = true
		uploadProgress = 0
		importResult = null

		const interval = setInterval(() => {
			uploadProgress = Math.min(uploadProgress + Math.random() * 20, 90)
		}, 200)

		try {
			const { result, validRows } = await parseCSV(file)
			clearInterval(interval)
			uploadProgress = 100
			importResult = result
			if (result.success_rows > 0 && validRows.length > 0) {
				if (result.table_name === 'inbound_records') setInboundData(validRows as unknown as InboundRecord[])
				else if (result.table_name === 'outbound_records') setOutboundData(validRows as unknown as OutboundRecord[])
				else if (result.table_name === 'inventory_age_records') setInventoryAgeData(validRows as unknown as InventoryAgeRecord[])
				else if (result.table_name === 'return_records') setReturnData(validRows as unknown as ReturnRecord[])
				else if (result.table_name === 'safety_stock_records') setSafetyStockData(validRows as unknown as SafetyStockRecord[])
			}
		} catch {
			clearInterval(interval)
			uploadProgress = 0
		} finally {
			isUploading = false
		}
	}

	function saveMissingStrategies() {
		savedStrategies = { ...missingStrategies }
	}

	function toggleWarehouse(roleId: string, wh: string) {
		const perms = { ...rolePermissions }
		const rolePerm = { ...perms[roleId], warehouses: new Set(perms[roleId].warehouses) }
		if (rolePerm.warehouses.has(wh)) {
			rolePerm.warehouses.delete(wh)
		} else {
			rolePerm.warehouses.add(wh)
		}
		perms[roleId] = rolePerm
		rolePermissions = perms
		syncRoleToStore()
	}

	function toggleSupplier(roleId: string, sup: string) {
		const perms = { ...rolePermissions }
		const rolePerm = { ...perms[roleId], suppliers: new Set(perms[roleId].suppliers) }
		if (rolePerm.suppliers.has(sup)) {
			rolePerm.suppliers.delete(sup)
		} else {
			rolePerm.suppliers.add(sup)
		}
		perms[roleId] = rolePerm
		rolePermissions = perms
		syncRoleToStore()
	}

	function syncRoleToStore() {
		const current = getUserRole()
		const analystPerm = rolePermissions['analyst']
		if (analystPerm) {
			setUserRole({
				...current,
				accessible_warehouses: [...analystPerm.warehouses],
				accessible_suppliers: [...analystPerm.suppliers]
			})
		}
	}

	const strategyOptions: Array<{ value: DataDictionaryEntry['missing_value_strategy']; label: string }> = [
		{ value: 'ignore', label: '忽略 (ignore)' },
		{ value: 'fill_default', label: '填充默认值 (fill_default)' },
		{ value: 'mark_anomaly', label: '标记异常 (mark_anomaly)' }
	]
</script>

<div id="data-page-content" class="flex flex-col gap-5">
	<div class="flex gap-2">
		{#each tabs as tab}
			<button
				class="tab-btn"
				class:tab-active={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if activeTab === 'import'}
		<div class="bg-[var(--color-card)] rounded-xl shadow-[0_1px_3px_rgba(27,42,74,0.06)] overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-dark)]">
				<h3 class="font-[var(--font-heading)] text-[15px] font-semibold text-[var(--color-primary)] m-0">批量导入</h3>
			</div>
			<div class="p-5">
				<div
					class="drop-zone"
					class:drop-active={isDragging}
					ondragover={(e) => { e.preventDefault(); isDragging = true; }}
					ondragleave={() => { isDragging = false; }}
					ondrop={handleFileDrop}
				>
					<svg class="mx-auto mb-3 text-[var(--color-primary-light)]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
					<p class="text-sm text-[var(--color-primary-light)] mb-2">
						{isDragging ? '释放文件以上传' : '拖拽CSV文件到此处上传'}
					</p>
					<p class="text-xs text-[var(--color-primary-light)] opacity-60 mb-4">或点击下方按钮选择文件</p>
					<label class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						选择文件
						<input type="file" accept=".csv" class="hidden" onchange={handleFileInput} />
					</label>
				</div>

				{#if isUploading || uploadProgress === 100}
					<div class="mt-5">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-[var(--color-primary)]">{uploadedFileName}</span>
							<span class="text-sm text-[var(--color-primary-light)]">{Math.round(uploadProgress)}%</span>
						</div>
						<div class="w-full h-2 bg-[var(--color-surface-dark)] rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-300 progress-bar"
								class:progress-complete={uploadProgress === 100}
								style="width: {uploadProgress}%"
							></div>
						</div>
					</div>
				{/if}

				{#if importResult}
					<div class="mt-5 bg-[var(--color-surface)] rounded-lg p-5">
						<h4 class="text-sm font-semibold text-[var(--color-primary)] mb-3">导入结果</h4>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
							<div class="flex flex-col gap-1">
								<span class="text-xs text-[var(--color-primary-light)]">数据表</span>
								<span class="text-sm font-semibold text-[var(--color-primary)]">{importResult.table_name || '未知'}</span>
							</div>
							<div class="flex flex-col gap-1">
								<span class="text-xs text-[var(--color-primary-light)]">总行数</span>
								<span class="text-sm font-semibold text-[var(--color-primary)]">{importResult.total_rows}</span>
							</div>
							<div class="flex flex-col gap-1">
								<span class="text-xs text-[var(--color-primary-light)]">成功行数</span>
								<span class="text-sm font-semibold text-[var(--color-success)]">{importResult.success_rows}</span>
							</div>
							<div class="flex flex-col gap-1">
								<span class="text-xs text-[var(--color-primary-light)]">错误行数</span>
								<span class="text-sm font-semibold text-[var(--color-danger)]">{importResult.error_rows}</span>
							</div>
						</div>

						{#if importResult.errors.length > 0}
							<div class="mt-3">
								<h5 class="text-xs font-semibold text-[var(--color-danger)] mb-2">错误详情</h5>
								<div class="overflow-x-auto">
									<table class="w-full text-xs">
										<thead>
											<tr class="border-b border-[var(--color-surface-dark)]">
												<th class="text-left py-2 px-3 text-[var(--color-primary-light)] font-medium">行号</th>
												<th class="text-left py-2 px-3 text-[var(--color-primary-light)] font-medium">字段</th>
												<th class="text-left py-2 px-3 text-[var(--color-primary-light)] font-medium">错误信息</th>
											</tr>
										</thead>
										<tbody>
											{#each importResult.errors as err}
												<tr class="border-b border-[var(--color-surface-dark)]">
													<td class="py-2 px-3 text-[var(--color-primary)]">{err.row}</td>
													<td class="py-2 px-3 text-[var(--color-primary)]">{err.field}</td>
													<td class="py-2 px-3 text-[var(--color-danger)]">{err.message}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'dictionary'}
		<div class="bg-[var(--color-card)] rounded-xl shadow-[0_1px_3px_rgba(27,42,74,0.06)] overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-dark)]">
				<h3 class="font-[var(--font-heading)] text-[15px] font-semibold text-[var(--color-primary)] m-0">数据字典</h3>
				<div class="relative">
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary-light)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						placeholder="搜索字段名或说明..."
						bind:value={dictSearch}
						class="pl-9 pr-4 py-2 text-sm border border-[var(--color-surface-dark)] rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] outline-none focus:border-[var(--color-accent)] transition-colors w-64"
					/>
				</div>
			</div>
			<div class="p-5">
				{#each tableNames as tableName}
					{@const entries = groupedFilteredDictionary()[tableName] || []}
					{#if entries.length > 0}
						<div class="mb-4 last:mb-0">
							<button
								class="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-dark)] transition-colors cursor-pointer"
								onclick={() => toggleTable(tableName)}
							>
								<svg
									class="text-[var(--color-accent)] transition-transform duration-200"
									style="transform: rotate({!collapsedTables.has(tableName) ? '90deg' : '0deg'})"
									width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								>
									<polyline points="9 18 15 12 9 6" />
								</svg>
								<span class="text-sm font-semibold text-[var(--color-primary)]">{tableName}</span>
								<span class="text-xs text-[var(--color-primary-light)] ml-1">({entries.length} 个字段)</span>
							</button>

							{#if !collapsedTables.has(tableName)}
								<div class="mt-2 overflow-x-auto">
									<table class="w-full text-xs">
										<thead>
											<tr class="border-b-2 border-[var(--color-surface-dark)]">
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">字段名</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">类型</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">说明</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">取值范围</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">业务含义</th>
												<th class="text-center py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">是否必填</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">缺失值策略</th>
												<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">默认值</th>
											</tr>
										</thead>
										<tbody>
											{#each entries as entry}
												<tr class="border-b border-[var(--color-surface-dark)] hover:bg-[var(--color-surface)] transition-colors">
													<td class="py-2.5 px-3 text-[var(--color-primary)] font-medium whitespace-nowrap">{entry.field_name}</td>
													<td class="py-2.5 px-3">
														<span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(46,205,167,0.1)] text-[var(--color-secondary)]">
															{entry.field_type}
														</span>
													</td>
													<td class="py-2.5 px-3 text-[var(--color-primary)] whitespace-nowrap">{entry.description}</td>
													<td class="py-2.5 px-3 text-[var(--color-primary-light)] whitespace-nowrap">{entry.value_range}</td>
													<td class="py-2.5 px-3 text-[var(--color-primary-light)] max-w-[200px] truncate">{entry.business_meaning}</td>
													<td class="py-2.5 px-3 text-center">
														{#if entry.is_required}
															<span class="inline-block w-5 h-5 leading-5 rounded bg-[var(--color-accent)] text-white text-[10px] font-bold">必</span>
														{:else}
															<span class="inline-block w-5 h-5 leading-5 rounded bg-[var(--color-surface-dark)] text-[var(--color-primary-light)] text-[10px]">选</span>
														{/if}
													</td>
													<td class="py-2.5 px-3">
														<span class="strategy-badge strategy-{entry.missing_value_strategy}">
															{entry.missing_value_strategy}
														</span>
													</td>
													<td class="py-2.5 px-3 text-[var(--color-primary-light)] whitespace-nowrap">{entry.default_value ?? '-'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{:else if activeTab === 'missing'}
		<div class="bg-[var(--color-card)] rounded-xl shadow-[0_1px_3px_rgba(27,42,74,0.06)] overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-dark)]">
				<h3 class="font-[var(--font-heading)] text-[15px] font-semibold text-[var(--color-primary)] m-0">缺失值处理</h3>
				<button
					class="px-5 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
					onclick={saveMissingStrategies}
				>
					保存策略
				</button>
			</div>
			<div class="p-5">
				{#each tableNames as tableName}
					{@const entries = dataDictionary.filter((d) => d.table_name === tableName)}
					<div class="mb-6 last:mb-0">
						<h4 class="text-sm font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
							<span class="w-1 h-4 rounded bg-[var(--color-accent)] inline-block"></span>
							{tableName}
						</h4>
						<div class="overflow-x-auto">
							<table class="w-full text-xs">
								<thead>
									<tr class="border-b-2 border-[var(--color-surface-dark)]">
										<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">字段名</th>
										<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">说明</th>
										<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">当前策略</th>
										<th class="text-left py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">修改策略</th>
										<th class="text-right py-2.5 px-3 text-[var(--color-primary-light)] font-semibold whitespace-nowrap">预估影响行数</th>
									</tr>
								</thead>
								<tbody>
									{#each entries as entry}
										{@const key = `${entry.table_name}.${entry.field_name}`}
										{@const currentStrategy = missingStrategies[key] ?? entry.missing_value_strategy}
										<tr class="border-b border-[var(--color-surface-dark)] hover:bg-[var(--color-surface)] transition-colors">
											<td class="py-2.5 px-3 text-[var(--color-primary)] font-medium whitespace-nowrap">{entry.field_name}</td>
											<td class="py-2.5 px-3 text-[var(--color-primary-light)] whitespace-nowrap">{entry.description}</td>
											<td class="py-2.5 px-3">
												<span class="strategy-badge strategy-{entry.missing_value_strategy}">
													{entry.missing_value_strategy}
												</span>
											</td>
											<td class="py-2.5 px-3">
												<select
													class="px-2 py-1.5 text-xs border border-[var(--color-surface-dark)] rounded-md bg-[var(--color-surface)] text-[var(--color-primary)] outline-none focus:border-[var(--color-accent)] cursor-pointer"
													value={currentStrategy}
													onchange={(e) => {
														const val = (e.target as HTMLSelectElement).value as DataDictionaryEntry['missing_value_strategy']
														missingStrategies = { ...missingStrategies, [key]: val }
													}}
												>
													{#each strategyOptions as opt}
														<option value={opt.value}>{opt.label}</option>
													{/each}
												</select>
											</td>
											<td class="py-2.5 px-3 text-right">
												<span class="text-[var(--color-warning)] font-medium">{affectedRowCounts[key] ?? 0}</span>
												<span class="text-[var(--color-primary-light)] ml-1">行</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if activeTab === 'permission'}
		<div class="bg-[var(--color-card)] rounded-xl shadow-[0_1px_3px_rgba(27,42,74,0.06)] overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-dark)]">
				<h3 class="font-[var(--font-heading)] text-[15px] font-semibold text-[var(--color-primary)] m-0">权限过滤</h3>
			</div>
			<div class="p-5">
				{#each roleConfigs as role}
					{@const perms = rolePermissions[role.role_id]}
					<div class="mb-6 last:mb-0 bg-[var(--color-surface)] rounded-lg p-5">
						<h4 class="text-sm font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2">
							<span class="w-1 h-4 rounded bg-[var(--color-secondary)] inline-block"></span>
							{role.role_name}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white font-medium ml-1">{role.role_id}</span>
						</h4>

						<div class="mb-4">
							<h5 class="text-xs font-semibold text-[var(--color-primary-light)] mb-2 uppercase tracking-wide">可访问仓库</h5>
							<div class="flex flex-wrap gap-3">
								{#each warehouses as wh}
									{@const checked = perms?.warehouses.has(wh) ?? false}
									<label class="flex items-center gap-2 cursor-pointer select-none group">
										<div
											class="toggle-switch"
											class:toggle-on={checked}
											onclick={() => toggleWarehouse(role.role_id, wh)}
										>
											<div class="toggle-knob"></div>
										</div>
										<span class="text-xs text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">{wh}</span>
									</label>
								{/each}
							</div>
						</div>

						<div>
							<h5 class="text-xs font-semibold text-[var(--color-primary-light)] mb-2 uppercase tracking-wide">可访问供应商</h5>
							<div class="flex flex-wrap gap-3">
								{#each suppliers as sup}
									{@const checked = perms?.suppliers.has(sup) ?? false}
									<label class="flex items-center gap-2 cursor-pointer select-none group">
										<div
											class="toggle-switch"
											class:toggle-on={checked}
											onclick={() => toggleSupplier(role.role_id, sup)}
										>
											<div class="toggle-knob"></div>
										</div>
										<span class="text-xs text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">{sup}</span>
									</label>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.tab-btn {
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
		font-family: var(--font-body);
		background-color: var(--color-surface-dark);
		color: var(--color-primary);
	}
	.tab-btn:hover:not(.tab-active) {
		background-color: var(--color-accent);
		color: #ffffff;
	}
	.tab-active {
		background-color: var(--color-primary) !important;
		color: #ffffff !important;
	}
	.drop-zone {
		border: 2px dashed var(--color-surface-dark);
		border-radius: 12px;
		padding: 40px;
		text-align: center;
		transition: all 0.2s ease;
	}
	.drop-zone:hover {
		border-color: var(--color-accent);
	}
	.drop-active {
		border-color: var(--color-accent) !important;
		background-color: rgba(255, 107, 53, 0.05);
	}
	.progress-bar {
		background-color: var(--color-accent);
	}
	.progress-complete {
		background-color: var(--color-success) !important;
	}
	.strategy-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 500;
	}
	.strategy-mark_anomaly {
		background-color: rgba(255, 107, 53, 0.1);
		color: var(--color-accent);
	}
	.strategy-fill_default {
		background-color: rgba(46, 205, 167, 0.1);
		color: var(--color-secondary);
	}
	.strategy-ignore {
		background-color: var(--color-surface-dark);
		color: var(--color-primary-light);
	}
	.toggle-switch {
		width: 32px;
		height: 18px;
		border-radius: 999px;
		background-color: var(--color-surface-dark);
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	.toggle-on {
		background-color: var(--color-secondary) !important;
	}
	.toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background-color: #ffffff;
		box-shadow: 0 1px 3px rgba(0,0,0,0.15);
		transition: left 0.2s ease;
	}
	.toggle-on .toggle-knob {
		left: 16px;
	}
</style>
