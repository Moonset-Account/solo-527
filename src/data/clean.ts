import type {
  EquipmentRuntimeRaw,
  AlarmRecordRaw,
  MaintenanceOrderRaw,
  ShiftGroupRaw,
  ProductionOutputRaw,
  SparePartConsumptionRaw,
  DowntimeRecord,
  SparePartUsage,
  CleaningLog,
  CleaningPipelineResult,
} from '@/types'

import {
  getEquipmentRuntimeRaw,
  getAlarmRecordsRaw,
  getMaintenanceOrdersRaw,
  getShiftGroupsRaw,
  getProductionOutputRaw,
  getSparePartConsumptionRaw,
} from '@/data/mock'

import { METRIC_CONFIGS } from '@/data/metricConfig'

function deriveEquipmentName(equipmentId: string): string {
  const parts = equipmentId.split('-')
  return parts.length > 1 ? parts.slice(1).join('-') : equipmentId
}

function getShiftForTime(timestamp: string): string {
  const hour = new Date(timestamp).getHours()
  if (hour >= 6 && hour < 14) return '早班'
  if (hour >= 14 && hour < 22) return '中班'
  return '夜班'
}

function makeLog(
  source: string,
  inputCount: number,
  outputCount: number,
  rules: string[]
): CleaningLog {
  return {
    source,
    inputCount,
    outputCount,
    droppedCount: inputCount - outputCount,
    timestamp: new Date().toISOString(),
    rules,
  }
}

interface EnrichedOrder extends MaintenanceOrderRaw {
  productionLine: string
  shift: string
  equipmentName: string
  alarmFaultType: string | null
  alarmDiscrepancy: boolean
  leader: string | null
  spareParts: SparePartUsage[]
  computedDuration: number
}

let cachedResult: CleaningPipelineResult | null = null

export function cleanDowntimeData(): CleaningPipelineResult {
  if (cachedResult) return cachedResult

  const logs: CleaningLog[] = []

  const rawOrders = getMaintenanceOrdersRaw()
  const rawRuntime = getEquipmentRuntimeRaw()
  const rawAlarms = getAlarmRecordsRaw()
  const rawShiftGroups = getShiftGroupsRaw()
  const rawProduction = getProductionOutputRaw()
  const rawSpareParts = getSparePartConsumptionRaw()

  const validProductionLines: Set<ProductionOutputRaw['productionLine']> = new Set(rawProduction.map((p) => p.productionLine))

  const stepA_validated = rawOrders.filter(
    (o) => o.equipmentId && o.faultType && o.repairDuration > 0
  )
  const seenIds = new Set<string>()
  const stepA_deduped: MaintenanceOrderRaw[] = []
  for (const order of stepA_validated) {
    if (!seenIds.has(order.id)) {
      seenIds.add(order.id)
      stepA_deduped.push(order)
    }
  }
  logs.push(
    makeLog('validate_maintenance_orders', rawOrders.length, stepA_deduped.length, [
      'drop_missing_equipmentId',
      'drop_missing_faultType',
      'drop_zero_or_negative_repairDuration',
      'deduplicate_by_id',
    ])
  )

  const runtimeByEquip = new Map<string, EquipmentRuntimeRaw[]>()
  for (const r of rawRuntime) {
    const list = runtimeByEquip.get(r.equipmentId) || []
    list.push(r)
    runtimeByEquip.set(r.equipmentId, list)
  }

  const stepB_enriched: EnrichedOrder[] = stepA_deduped.map((order) => {
    let productionLine = ''
    let shift = ''

    const runtimeRecords = runtimeByEquip.get(order.equipmentId) || []
    if (runtimeRecords.length > 0) {
      const orderStartMs = new Date(order.startTime).getTime()
      let closest = runtimeRecords[0]
      let minDiff = Math.abs(new Date(runtimeRecords[0].timestamp).getTime() - orderStartMs)
      for (let i = 1; i < runtimeRecords.length; i++) {
        const diff = Math.abs(new Date(runtimeRecords[i].timestamp).getTime() - orderStartMs)
        if (diff < minDiff) {
          minDiff = diff
          closest = runtimeRecords[i]
        }
      }
      productionLine = closest.productionLine
      shift = closest.shift
    }

    if (!productionLine) {
      const match = order.equipmentId.match(/^([A-D]线)/)
      if (match) productionLine = match[1]
    }
    if (productionLine && !validProductionLines.has(productionLine)) {
      productionLine = ''
    }
    if (!shift) {
      shift = getShiftForTime(order.startTime)
    }

    return {
      ...order,
      productionLine,
      shift,
      equipmentName: deriveEquipmentName(order.equipmentId),
      alarmFaultType: null,
      alarmDiscrepancy: false,
      leader: null,
      spareParts: [],
      computedDuration: 0,
    }
  })
  logs.push(
    makeLog('enrich_equipment_runtime', stepA_deduped.length, stepB_enriched.length, [
      'match_by_equipmentId_time_proximity',
      'fill_productionLine_from_runtime',
      'fill_shift_from_runtime_or_time',
      'derive_equipmentName_from_id',
    ])
  )

  const alarmsByEquip = new Map<string, AlarmRecordRaw[]>()
  for (const a of rawAlarms) {
    const list = alarmsByEquip.get(a.equipmentId) || []
    list.push(a)
    alarmsByEquip.set(a.equipmentId, list)
  }

  const PROXIMITY_WINDOW_MS = 60 * 60 * 1000

  for (const order of stepB_enriched) {
    const equipAlarms = alarmsByEquip.get(order.equipmentId)
    if (!equipAlarms) continue

    const orderStartMs = new Date(order.startTime).getTime()
    let bestAlarm: AlarmRecordRaw | null = null
    let bestDiff = Infinity

    for (const alarm of equipAlarms) {
      const alarmMs = new Date(alarm.alarmTime).getTime()
      const diff = orderStartMs - alarmMs
      if (diff >= 0 && diff <= PROXIMITY_WINDOW_MS && diff < bestDiff) {
        bestDiff = diff
        bestAlarm = alarm
      }
    }

    if (bestAlarm) {
      order.alarmFaultType = bestAlarm.faultType
      order.alarmDiscrepancy = bestAlarm.faultType !== order.faultType
    }
  }
  logs.push(
    makeLog('enrich_alarm_records', stepB_enriched.length, stepB_enriched.length, [
      'match_by_equipmentId_alarm_before_order_within_60min',
      'prefer_maintenance_order_faultType',
      'log_alarm_faultType_discrepancy',
    ])
  )

  const shiftGroupByDateShift = new Map<string, ShiftGroupRaw>()
  for (const sg of rawShiftGroups) {
    const key = `${sg.scheduleDate}_${sg.shiftName}`
    if (!shiftGroupByDateShift.has(key)) {
      shiftGroupByDateShift.set(key, sg)
    }
  }

  for (const order of stepB_enriched) {
    const dateStr = order.startTime.split('T')[0]
    const key = `${dateStr}_${order.shift}`
    const group = shiftGroupByDateShift.get(key)
    if (group) {
      order.leader = group.leader
    }
  }
  logs.push(
    makeLog('enrich_shift_groups', stepB_enriched.length, stepB_enriched.length, [
      'match_by_date_and_shiftName',
      'attach_leader_info',
    ])
  )

  const sparePartsByWorkOrder = new Map<string, SparePartConsumptionRaw[]>()
  for (const sp of rawSpareParts) {
    const list = sparePartsByWorkOrder.get(sp.workOrderId) || []
    list.push(sp)
    sparePartsByWorkOrder.set(sp.workOrderId, list)
  }

  const validOrderIds = new Set(stepB_enriched.map((o) => o.id))
  let sparePartsDropped = 0
  let sparePartsAttached = 0

  for (const order of stepB_enriched) {
    const parts = sparePartsByWorkOrder.get(order.id)
    if (parts && parts.length > 0) {
      order.spareParts = parts.map((p) => ({
        partId: p.id,
        partName: p.partName,
        quantity: p.quantity,
        unitCost: p.unitCost,
      }))
      sparePartsAttached += parts.length
    }
  }

  for (const [workOrderId, parts] of sparePartsByWorkOrder) {
    if (!validOrderIds.has(workOrderId)) {
      sparePartsDropped += parts.length
    }
  }
  logs.push(
    makeLog('attach_spare_parts', rawSpareParts.length, sparePartsAttached, [
      'group_by_workOrderId',
      'attach_to_matching_maintenance_order',
      'drop_spare_parts_referencing_nonexistent_workOrders',
      `dropped_orphan_spare_part_records:${sparePartsDropped}`,
    ])
  )

  for (const order of stepB_enriched) {
    const startMs = new Date(order.startTime).getTime()
    const endMs = new Date(order.endTime).getTime()
    order.computedDuration = Math.round((endMs - startMs) / (60 * 1000))

    if (order.computedDuration <= 0) {
      order.computedDuration = order.repairDuration
    }

    if (order.downtimeType !== 'planned' && order.downtimeType !== 'unplanned') {
      (order as { downtimeType: 'unplanned' }).downtimeType = 'unplanned'
    }
  }
  logs.push(
    makeLog('compute_derived_fields', stepB_enriched.length, stepB_enriched.length, [
      'calculate_duration_from_startTime_endTime',
      'fallback_to_repairDuration_if_zero',
      'validate_downtimeType_classification',
    ])
  )

  const metricKeys = new Set(METRIC_CONFIGS.map((c) => c.key))
  void metricKeys
  const finalRecords: DowntimeRecord[] = []
  let finalDropped = 0

  for (const order of stepB_enriched) {
    if (
      !order.id ||
      !order.equipmentId ||
      !order.equipmentName ||
      !order.productionLine ||
      !order.shift ||
      !order.faultType ||
      !order.downtimeType ||
      !order.startTime ||
      !order.endTime ||
      order.computedDuration <= 0 ||
      !order.maintenancePerson
    ) {
      finalDropped++
      continue
    }

    finalRecords.push({
      id: order.id,
      equipmentId: order.equipmentId,
      equipmentName: order.equipmentName,
      productionLine: order.productionLine,
      shift: order.shift,
      faultType: order.faultType,
      downtimeType: order.downtimeType,
      startTime: order.startTime,
      endTime: order.endTime,
      duration: order.computedDuration,
      maintenancePerson: order.maintenancePerson,
      maintenanceDuration: order.repairDuration,
      spareParts: order.spareParts,
    })
  }

  finalRecords.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  logs.push(
    makeLog('final_validation', stepB_enriched.length, finalRecords.length, [
      'ensure_all_required_fields_present',
      'drop_records_with_missing_required_fields',
      `dropped_invalid_records:${finalDropped}`,
    ])
  )

  const result: CleaningPipelineResult = {
    records: finalRecords,
    logs,
    completedAt: new Date().toISOString(),
  }

  cachedResult = result
  return result
}

export function getCleaningLogs(): CleaningLog[] {
  return cleanDowntimeData().logs
}
