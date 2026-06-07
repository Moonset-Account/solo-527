declare module '$stores' {
	export function getFilter(): import('$lib/types').FilterState
	export function setFilter(val: import('$lib/types').FilterState): void
	export function resetFilter(): void
	export function getUserRole(): import('$lib/types').UserRole
	export function setUserRole(val: import('$lib/types').UserRole): void
	export function getInboundData(): import('$lib/types').InboundRecord[]
	export function setInboundData(val: import('$lib/types').InboundRecord[]): void
	export function getOutboundData(): import('$lib/types').OutboundRecord[]
	export function setOutboundData(val: import('$lib/types').OutboundRecord[]): void
	export function getInventoryAgeData(): import('$lib/types').InventoryAgeRecord[]
	export function setInventoryAgeData(val: import('$lib/types').InventoryAgeRecord[]): void
	export function getReturnData(): import('$lib/types').ReturnRecord[]
	export function setReturnData(val: import('$lib/types').ReturnRecord[]): void
	export function getSafetyStockData(): import('$lib/types').SafetyStockRecord[]
	export function setSafetyStockData(val: import('$lib/types').SafetyStockRecord[]): void
	export function getReportData(): import('$lib/types').WeeklyReport[]
	export function setReportData(val: import('$lib/types').WeeklyReport[]): void
	export function getValidationRules(): import('$lib/types').ValidationRule[]
	export function setValidationRules(val: import('$lib/types').ValidationRule[]): void
	export function getDrillDownPaths(): import('$lib/types').DrillDownPath[]
	export function setDrillDownPaths(val: import('$lib/types').DrillDownPath[]): void
}

declare module '$utils/analytics' {
	export function computeFunnelData(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').FunnelData
	export function computeAgeDistribution(filters?: Partial<import('$lib/types').FilterState>): Array<{ age_bucket: string; batch_no: string; quantity: number }>
	export function computeTurnoverRanking(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').TurnoverRanking[]
	export function computeReplenishment(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').ReplenishmentSuggestion[]
	export function computeNearExpiryAlerts(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').NearExpiryAlert[]
	export function detectAnomalies(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').AnomalyPoint[]
	export function computeWeeklyReport(filters?: Partial<import('$lib/types').FilterState>): import('$lib/types').WeeklyReport
}

declare module '$utils/export' {
	export function exportToPDF(elementId: string, filename: string): Promise<void>
	export function exportToImage(elementId: string, filename: string): Promise<void>
	export function exportToCSV(data: Record<string, unknown>[], filename: string): void
	export function exportWeeklyReportPDF(report: import('$lib/types').WeeklyReport, elementId: string): Promise<void>
}

declare module '$utils/import' {
	export function parseCSV(file: File): Promise<import('$lib/types').ImportResult>
	export function validateImportData(tableName: string, data: Record<string, unknown>[]): import('$lib/types').ImportResult
	export function assignToTable(data: Record<string, unknown>[], headers: string[]): string
}

declare module '$utils/duckdb' {
	export function initDuckDB(): Promise<void>
	export function query<T>(sql: string): Promise<T[]>
	export function loadData(data: {
		inbound?: import('$lib/types').InboundRecord[]
		outbound?: import('$lib/types').OutboundRecord[]
		inventory_age?: import('$lib/types').InventoryAgeRecord[]
		returns?: import('$lib/types').ReturnRecord[]
		safety_stock?: import('$lib/types').SafetyStockRecord[]
	}): Promise<void>
	export function getFilterOptions(): Promise<{
		sku_ids: string[]
		warehouse_positions: string[]
		supplier_ids: string[]
		batch_nos: string[]
		age_buckets: string[]
	}>
	export function buildWhereClause(filters: Partial<import('$lib/types').FilterState>): string
}
