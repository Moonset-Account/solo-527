import type {
  FilterState,
  UserRole,
  InboundRecord,
  OutboundRecord,
  InventoryAgeRecord,
  ReturnRecord,
  SafetyStockRecord,
  WeeklyReport,
  ValidationRule,
  DrillDownPath
} from '$lib/types'
import {
  inboundRecords,
  outboundRecords,
  inventoryAgeRecords,
  returnRecords,
  safetyStockRecords,
  allSkuIds,
  allSkuNames,
  allSkuCategories,
  allSupplierIds,
  allWarehousePositions
} from '$lib/data/mock-data'

const defaultFilter: FilterState = {
  sku_ids: [],
  warehouse_positions: [],
  supplier_ids: [],
  batch_nos: [],
  age_buckets: [],
  date_range: { start: '', end: '' }
}

const defaultUserRole: UserRole = {
  role_id: 'analyst',
  role_name: '数据分析师',
  accessible_warehouses: [...allWarehousePositions],
  accessible_suppliers: [...allSupplierIds],
  accessible_sku_categories: [...allSkuIds]
}

let filterState = $state<FilterState>(structuredClone(defaultFilter))
let userRoleState = $state<UserRole>(structuredClone(defaultUserRole))
let inboundData = $state<InboundRecord[]>(inboundRecords)
let outboundData = $state<OutboundRecord[]>(outboundRecords)
let inventoryAgeData = $state<InventoryAgeRecord[]>(inventoryAgeRecords)
let returnData = $state<ReturnRecord[]>(returnRecords)
let safetyStockData = $state<SafetyStockRecord[]>(safetyStockRecords)
let reportData = $state<WeeklyReport[]>([])
let validationRules = $state<ValidationRule[]>([])
let drillDownPaths = $state<DrillDownPath[]>([])
let dataVersion = $state(0)

export function getFilter(): FilterState {
  return filterState
}

export function setFilter(val: FilterState): void {
  filterState = val
}

export function resetFilter(): void {
  filterState = structuredClone(defaultFilter)
}

export function getUserRole(): UserRole {
  return userRoleState
}

export function setUserRole(val: UserRole): void {
  userRoleState = val
}

export function getInboundData(): InboundRecord[] {
  return inboundData
}

export function setInboundData(val: InboundRecord[]): void {
  inboundData = val
  bumpVersion()
}

export function getOutboundData(): OutboundRecord[] {
  return outboundData
}

export function setOutboundData(val: OutboundRecord[]): void {
  outboundData = val
  bumpVersion()
}

export function getInventoryAgeData(): InventoryAgeRecord[] {
  return inventoryAgeData
}

export function setInventoryAgeData(val: InventoryAgeRecord[]): void {
  inventoryAgeData = val
  bumpVersion()
}

export function getReturnData(): ReturnRecord[] {
  return returnData
}

export function setReturnData(val: ReturnRecord[]): void {
  returnData = val
  bumpVersion()
}

export function getSafetyStockData(): SafetyStockRecord[] {
  return safetyStockData
}

export function setSafetyStockData(val: SafetyStockRecord[]): void {
  safetyStockData = val
  bumpVersion()
}

export function getReportData(): WeeklyReport[] {
  return reportData
}

export function setReportData(val: WeeklyReport[]): void {
  reportData = val
}

export function getValidationRules(): ValidationRule[] {
  return validationRules
}

export function setValidationRules(val: ValidationRule[]): void {
  validationRules = val
}

export function getDrillDownPaths(): DrillDownPath[] {
  return drillDownPaths
}

export function setDrillDownPaths(val: DrillDownPath[]): void {
  drillDownPaths = val
}

export function getAllSkuNames(): Record<string, string> {
  return allSkuNames
}

export function getSkuCategories(): string[] {
  return allSkuCategories
}

export function getDataVersion(): number {
  return dataVersion
}

function bumpVersion(): void {
  dataVersion++
}
