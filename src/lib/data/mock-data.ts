import type {
  InboundRecord,
  OutboundRecord,
  InventoryAgeRecord,
  ReturnRecord,
  SafetyStockRecord
} from '$lib/types'

const SKU_CATALOG = [
  { id: 'SKU001', name: '有机纯牛奶1L', category: '乳制品' },
  { id: 'SKU002', name: '低脂酸奶500ml', category: '乳制品' },
  { id: 'SKU003', name: '全麦面包400g', category: '烘焙食品' },
  { id: 'SKU004', name: '即食燕麦片750g', category: '谷物食品' },
  { id: 'SKU005', name: '冷压橙汁1L', category: '饮品' },
  { id: 'SKU006', name: '矿泉水550ml×24', category: '饮品' },
  { id: 'SKU007', name: '有机鸡蛋30枚', category: '生鲜' },
  { id: 'SKU008', name: '三文鱼切片200g', category: '生鲜' },
  { id: 'SKU009', name: '意大利面500g', category: '谷物食品' },
  { id: 'SKU010', name: '特级初榨橄榄油500ml', category: '调味品' },
  { id: 'SKU011', name: '日式酱油300ml', category: '调味品' },
  { id: 'SKU012', name: '黑巧克力100g', category: '零食' },
  { id: 'SKU013', name: '混合坚果250g', category: '零食' },
  { id: 'SKU014', name: '速溶咖啡100g', category: '饮品' },
  { id: 'SKU015', name: '绿茶礼盒250g', category: '饮品' },
  { id: 'SKU016', name: '婴儿配方奶粉800g', category: '乳制品' },
  { id: 'SKU017', name: '蜂蜜500g', category: '调味品' },
  { id: 'SKU018', name: '午餐肉罐头340g', category: '罐头食品' },
  { id: 'SKU019', name: '番茄酱300g', category: '调味品' },
  { id: 'SKU020', name: '方便面5连包', category: '速食' },
  { id: 'SKU021', name: 'A4复印纸500张', category: '办公用品' },
  { id: 'SKU022', name: '中性笔蓝色12支', category: '办公用品' },
  { id: 'SKU023', name: 'USB-C数据线1m', category: '电子配件' },
  { id: 'SKU024', name: '蓝牙耳机', category: '电子配件' },
  { id: 'SKU025', name: '洗衣液2kg', category: '日用品' },
  { id: 'SKU026', name: '抽纸3层×10包', category: '日用品' },
  { id: 'SKU027', name: '洗手液500ml', category: '日用品' },
  { id: 'SKU028', name: '牙膏120g×2', category: '日用品' },
  { id: 'SKU029', name: '保鲜膜30cm×60m', category: '日用品' },
  { id: 'SKU030', name: '垃圾袋45cm×30只', category: '日用品' },
  { id: 'SKU031', name: '红酒750ml', category: '酒类' },
  { id: 'SKU032', name: '啤酒500ml×12', category: '酒类' },
  { id: 'SKU033', name: '维生素C片100粒', category: '保健品' },
  { id: 'SKU034', name: '鱼油软胶囊90粒', category: '保健品' },
  { id: 'SKU035', name: '宠物猫粮2kg', category: '宠物用品' },
  { id: 'SKU036', name: '宠物狗粮3kg', category: '宠物用品' },
  { id: 'SKU037', name: '一次性医用口罩50只', category: '医疗防护' },
  { id: 'SKU038', name: '消毒酒精500ml', category: '医疗防护' },
  { id: 'SKU039', name: '速冻水饺500g', category: '速冻食品' },
  { id: 'SKU040', name: '速冻汤圆400g', category: '速冻食品' },
  { id: 'SKU041', name: '咖啡豆250g', category: '饮品' },
  { id: 'SKU042', name: '椰子水330ml', category: '饮品' },
  { id: 'SKU043', name: '火腿肠10支装', category: '零食' },
  { id: 'SKU044', name: '薯片大包装104g', category: '零食' },
  { id: 'SKU045', name: '鲜榨苹果汁1L', category: '饮品' },
  { id: 'SKU046', name: '白米饭即食装300g', category: '速食' },
  { id: 'SKU047', name: '豆腐500g', category: '生鲜' },
  { id: 'SKU048', name: '五花肉500g', category: '生鲜' },
  { id: 'SKU049', name: '有机花菜500g', category: '生鲜' },
  { id: 'SKU050', name: '进口车厘子500g', category: '生鲜' }
] as const

const SUPPLIERS = [
  { id: 'SUP01', name: '鲜源食品供应链' },
  { id: 'SUP02', name: '绿谷乳业有限公司' },
  { id: 'SUP03', name: '恒达饮品集团' },
  { id: 'SUP04', name: '华腾日用品有限公司' },
  { id: 'SUP05', name: '嘉禾办公用品有限公司' },
  { id: 'SUP06', name: '信达电子科技有限公司' },
  { id: 'SUP07', name: '优品零食工坊' },
  { id: 'SUP08', name: '益康保健品有限公司' },
  { id: 'SUP09', name: '暖心宠物用品有限公司' },
  { id: 'SUP10', name: '安泰医疗防护有限公司' }
] as const

const WAREHOUSE_POSITIONS = ['A1', 'B2', 'C3'] as const

const CATEGORY_SUPPLIER_MAP: Record<string, string[]> = {
  '乳制品': ['SUP02'],
  '烘焙食品': ['SUP01'],
  '谷物食品': ['SUP01', 'SUP07'],
  '饮品': ['SUP03', 'SUP07'],
  '生鲜': ['SUP01'],
  '调味品': ['SUP01', 'SUP07'],
  '零食': ['SUP07'],
  '罐头食品': ['SUP01'],
  '速食': ['SUP01', 'SUP07'],
  '办公用品': ['SUP05'],
  '电子配件': ['SUP06'],
  '日用品': ['SUP04'],
  '酒类': ['SUP03'],
  '保健品': ['SUP08'],
  '宠物用品': ['SUP09'],
  '医疗防护': ['SUP10'],
  '速冻食品': ['SUP01']
}

const EXPIRY_CATEGORIES = [
  '乳制品', '烘焙食品', '生鲜', '饮品', '速冻食品', '速食', '罐头食品'
]

function daysAgo(d: number): string {
  const dt = new Date('2026-06-08')
  dt.setDate(dt.getDate() - d)
  return dt.toISOString().slice(0, 10)
}

function daysFromNow(d: number): string {
  const dt = new Date('2026-06-08')
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}

function pickSupplier(category: string): { id: string; name: string } {
  const pool = CATEGORY_SUPPLIER_MAP[category] || ['SUP01']
  const s = pool[Math.abs(hashStr(category)) % pool.length]
  return SUPPLIERS.find((x) => x.id === s)!
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function assignWarehouse(idx: number): string {
  return WAREHOUSE_POSITIONS[idx % 3]
}

const PERISHABLE_SKU_IDS: Set<string> = new Set(
  SKU_CATALOG.filter((s) => EXPIRY_CATEGORIES.includes(s.category)).map((s) => s.id)
)

function hasExpiry(skuId: string): boolean {
  return PERISHABLE_SKU_IDS.has(skuId)
}

export const inboundRecords: InboundRecord[] = (() => {
  const records: InboundRecord[] = []
  SKU_CATALOG.forEach((sku, idx) => {
    const batchCount = 2 + (idx % 3)
    const supplier = pickSupplier(sku.category)
    const wh = assignWarehouse(idx)
    for (let b = 0; b < batchCount; b++) {
      const inboundDay = Math.floor(seededRand(idx * 100 + b * 7) * 170) + 5
      const qty = Math.floor(seededRand(idx * 50 + b * 13) * 400) + 50
      const cost = Math.round((seededRand(idx * 30 + b * 11) * 80 + 5) * 100) / 100
      const batchNo = `B${sku.id}-${String(b + 1).padStart(3, '0')}`
      const withExpiry = hasExpiry(sku.id) && seededRand(idx * 20 + b * 3) > 0.2
      const expiryDays = withExpiry
        ? Math.floor(seededRand(idx * 40 + b * 17) * 200) + 10
        : null
      records.push({
        sku_id: sku.id,
        sku_name: sku.name,
        batch_no: batchNo,
        warehouse_position: wh,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        inbound_date: daysAgo(inboundDay),
        quantity: qty,
        unit_cost: cost,
        expiry_date: expiryDays !== null ? daysFromNow(expiryDays - inboundDay) : null
      })
    }
  })
  return records
})()

export const outboundRecords: OutboundRecord[] = (() => {
  const records: OutboundRecord[] = []
  const types: OutboundRecord['outbound_type'][] = ['sale', 'sale', 'sale', 'transfer', 'return_out']
  SKU_CATALOG.forEach((sku, idx) => {
    const batchCount = 2 + (idx % 3)
    for (let b = 0; b < batchCount; b++) {
      const batchNo = `B${sku.id}-${String(b + 1).padStart(3, '0')}`
      const outCount = 1 + Math.floor(seededRand(idx * 60 + b * 9) * 3)
      for (let o = 0; o < outCount; o++) {
        const outDay = Math.floor(seededRand(idx * 70 + b * 19 + o * 5) * 160) + 3
        const qty = Math.floor(seededRand(idx * 80 + b * 23 + o * 3) * 200) + 10
        const typeIdx = Math.floor(seededRand(idx * 90 + b * 29 + o * 7) * types.length)
        records.push({
          sku_id: sku.id,
          batch_no: batchNo,
          outbound_date: daysAgo(outDay),
          quantity: qty,
          outbound_type: types[typeIdx]
        })
      }
    }
  })
  return records
})()

export const inventoryAgeRecords: InventoryAgeRecord[] = (() => {
  const records: InventoryAgeRecord[] = []
  const buckets: InventoryAgeRecord['age_bucket'][] = ['0-30', '30-60', '60-90', '90-180', '180+']
  SKU_CATALOG.forEach((sku, idx) => {
    const batchCount = 2 + (idx % 3)
    const wh = assignWarehouse(idx)
    for (let b = 0; b < batchCount; b++) {
      const ageDays = Math.floor(seededRand(idx * 100 + b * 7) * 200) + 5
      const currentQty = Math.floor(seededRand(idx * 110 + b * 13) * 300) + 10
      let bucket: InventoryAgeRecord['age_bucket']
      if (ageDays <= 30) bucket = '0-30'
      else if (ageDays <= 60) bucket = '30-60'
      else if (ageDays <= 90) bucket = '60-90'
      else if (ageDays <= 180) bucket = '90-180'
      else bucket = '180+'
      const withExpiry = hasExpiry(sku.id)
      const expiryOffset = withExpiry
        ? Math.floor(seededRand(idx * 40 + b * 17) * 200) - 30
        : null
      const daysToExpiry = expiryOffset !== null ? expiryOffset : null
      const isNearExpiry = daysToExpiry !== null && daysToExpiry <= 30
      records.push({
        sku_id: sku.id,
        batch_no: `B${sku.id}-${String(b + 1).padStart(3, '0')}`,
        warehouse_position: wh,
        current_quantity: currentQty,
        age_days: ageDays,
        age_bucket: bucket,
        expiry_date: withExpiry ? daysFromNow(expiryOffset ?? 90) : null,
        days_to_expiry: daysToExpiry,
        is_near_expiry: isNearExpiry
      })
    }
  })
  return records
})()

export const returnRecords: ReturnRecord[] = (() => {
  const records: ReturnRecord[] = []
  const reasons = ['质量问题', '包装破损', '临近保质期', '客户退货', '数量不符', '规格错误']
  SKU_CATALOG.forEach((sku, idx) => {
    if (seededRand(idx * 200) > 0.6) return
    const batchCount = 2 + (idx % 3)
    const b = Math.floor(seededRand(idx * 210) * batchCount)
    const returnDay = Math.floor(seededRand(idx * 220) * 150) + 5
    const qty = Math.floor(seededRand(idx * 230) * 50) + 5
    const reasonIdx = Math.floor(seededRand(idx * 240) * reasons.length)
    records.push({
      sku_id: sku.id,
      batch_no: `B${sku.id}-${String(b + 1).padStart(3, '0')}`,
      return_date: daysAgo(returnDay),
      quantity: qty,
      return_reason: reasons[reasonIdx]
    })
  })
  return records
})()

export const safetyStockRecords: SafetyStockRecord[] = SKU_CATALOG.map((sku, idx) => {
  const wh = assignWarehouse(idx)
  const safetyQty = Math.floor(seededRand(idx * 300) * 80) + 20
  const leadTime = Math.floor(seededRand(idx * 310) * 14) + 3
  return {
    sku_id: sku.id,
    warehouse_position: wh,
    safety_stock_qty: safetyQty,
    reorder_point: Math.floor(safetyQty * 1.5),
    lead_time_days: leadTime
  }
})

export const allSkuIds = SKU_CATALOG.map((s) => s.id)
export const allSkuNames = Object.fromEntries(SKU_CATALOG.map((s) => [s.id, s.name]))
export const allSupplierIds = SUPPLIERS.map((s) => s.id)
export const allWarehousePositions = [...WAREHOUSE_POSITIONS]
export const allBatchNos = inboundRecords.map((r) => r.batch_no)
