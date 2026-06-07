import { Router, type Request, type Response } from 'express'
import Papa from 'papaparse'
import { caliberConfigs, dataUpdateLogs } from '../mock-data.js'
import type { CaliberConfig } from '../mock-data.js'

const router = Router()

const mutableCaliberConfigs = [...caliberConfigs]

interface FieldDefinition {
  field: string
  label: string
  type: string
  description: string
  caliber: string
  example: string
}

const dataDictionary: FieldDefinition[] = [
  { field: 'orderId', label: '退货单号', type: 'string', description: '退货订单唯一标识', caliber: '系统自动生成', example: 'RET000001' },
  { field: 'userHashId', label: '用户哈希ID', type: 'string', description: '脱敏后的用户标识', caliber: 'SHA256加密', example: 'user-repeat-001' },
  { field: 'productId', label: '商品ID', type: 'string', description: '退货商品标识', caliber: '关联商品主数据', example: 'prod-001' },
  { field: 'shopId', label: '店铺ID', type: 'string', description: '所属店铺标识', caliber: '关联店铺主数据', example: 'shop-001' },
  { field: 'reasonId', label: '退货原因ID', type: 'string', description: '退货原因三级标识', caliber: '关联退货原因树', example: 'reason-01-01-01' },
  { field: 'warehouseId', label: '仓库ID', type: 'string', description: '退货入库仓库', caliber: '关联仓库主数据', example: 'wh-001' },
  { field: 'logisticsId', label: '物流商ID', type: 'string', description: '退货物流承运商', caliber: '关联物流商主数据', example: 'log-001' },
  { field: 'csStaffId', label: '客服ID', type: 'string', description: '处理客服标识', caliber: '关联客服人员数据', example: 'cs-001' },
  { field: 'applyAt', label: '申请时间', type: 'datetime', description: '用户提交退货申请时间', caliber: 'ISO 8601格式', example: '2026-03-15T10:30:00.000Z' },
  { field: 'qualityCheckAt', label: '质检时间', type: 'datetime', description: '仓库完成质检时间', caliber: '仓库签收后质检完成', example: '2026-03-17T14:00:00.000Z' },
  { field: 'approveAt', label: '审批时间', type: 'datetime', description: '退款审批通过时间', caliber: '质检通过后审批', example: '2026-03-18T09:00:00.000Z' },
  { field: 'refundAt', label: '退款时间', type: 'datetime', description: '退款到账时间', caliber: '审批通过后打款', example: '2026-03-19T16:00:00.000Z' },
  { field: 'refundAmount', label: '退款金额', type: 'number', description: '实际退款金额', caliber: '扣除优惠券、运费后实际到账', example: '259.00' },
  { field: 'status', label: '退货状态', type: 'enum', description: '当前退货流程状态', caliber: 'pending/quality_checking/approved/refunded/rejected', example: 'refunded' },
  { field: 'csNote', label: '客服备注', type: 'string', description: '客服处理备注信息', caliber: '客服手动填写', example: '正常退货流程' },
  { field: 'geoPoint', label: '地理坐标', type: 'object', description: '退货发出地坐标', caliber: '根据收货地址解析', example: '{"lng":121.47,"lat":31.23}' },
  { field: 'isAnomaly', label: '异常标记', type: 'boolean', description: '是否被标记为异常订单', caliber: '规则引擎自动判定', example: 'false' },
]

router.get('/data-dictionary', (_req: Request, res: Response): void => {
  res.json({ success: true, data: dataDictionary })
})

router.get('/caliber-config', (_req: Request, res: Response): void => {
  res.json({ success: true, data: mutableCaliberConfigs })
})

router.put('/caliber-config/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const idx = mutableCaliberConfigs.findIndex((c) => c.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Caliber config not found' })
    return
  }

  const existing = mutableCaliberConfigs[idx]
  const updated: CaliberConfig = {
    id: existing.id,
    field: req.body.field ?? existing.field,
    caliber: req.body.caliber ?? existing.caliber,
    description: req.body.description ?? existing.description,
    isActive: req.body.isActive ?? existing.isActive,
  }
  mutableCaliberConfigs[idx] = updated

  res.json({ success: true, data: updated })
})

router.post('/import', (req: Request, res: Response): void => {
  const csvContent = req.body.csv as string | undefined
  if (!csvContent) {
    res.status(400).json({ success: false, error: 'csv content is required in request body' })
    return
  }

  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })

  if (result.errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'CSV parse errors',
      details: result.errors.map((e) => ({
        row: e.row,
        message: e.message,
      })),
    })
    return
  }

  const importedRows = result.data as Record<string, unknown>[]
  const importResult = {
    totalRows: importedRows.length,
    parsedFields: result.meta.fields ?? [],
    sampleRows: importedRows.slice(0, 5),
  }

  res.status(201).json({ success: true, data: importResult })
})

router.get('/meta/update-time', (_req: Request, res: Response): void => {
  const successLogs = dataUpdateLogs.filter((l) => l.status === 'success')
  const latestTime = successLogs.length > 0
    ? successLogs.reduce((latest, l) =>
        new Date(l.updateTime) > new Date(latest) ? l.updateTime : latest,
        successLogs[0].updateTime,
      )
    : null

  res.json({
    success: true,
    data: {
      lastUpdateTime: latestTime,
      sources: dataUpdateLogs.map((l) => ({
        source: l.source,
        updateTime: l.updateTime,
        recordCount: l.recordCount,
        status: l.status,
      })),
    },
  })
})

export default router
