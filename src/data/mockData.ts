import {
  SKU,
  Supplier,
  WarehouseLocation,
  Batch,
  InventoryItem,
  InboundRecord,
  OutboundRecord,
  ReturnRecord,
  TurnoverMetric,
  ReplenishmentSuggestion,
  FunnelData,
  AgeDistribution,
  SampleInfo
} from '../types';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

export const mockSKUs: SKU[] = [
  { id: 'sku001', name: '益生菌配方奶粉 900g', category: '婴幼儿食品', unit: '罐', safetyStock: 50, shelfLifeDays: 540 },
  { id: 'sku002', name: '有机婴幼儿米粉 225g', category: '婴幼儿食品', unit: '盒', safetyStock: 80, shelfLifeDays: 540 },
  { id: 'sku003', name: '维生素D滴剂 400IU', category: '营养补充', unit: '瓶', safetyStock: 100, shelfLifeDays: 730 },
  { id: 'sku004', name: '钙铁锌口服液 10ml*12', category: '营养补充', unit: '盒', safetyStock: 60, shelfLifeDays: 730 },
  { id: 'sku005', name: '婴幼儿洗衣液 1L', category: '母婴用品', unit: '瓶', safetyStock: 40, shelfLifeDays: 1095 },
  { id: 'sku006', name: '婴儿纸尿裤 M码 64片', category: '母婴用品', unit: '包', safetyStock: 120, shelfLifeDays: 1095 },
  { id: 'sku007', name: '婴幼儿手口湿巾 80抽', category: '母婴用品', unit: '包', safetyStock: 200, shelfLifeDays: 730 },
  { id: 'sku008', name: '宝宝润肤乳 200ml', category: '母婴用品', unit: '瓶', safetyStock: 70, shelfLifeDays: 1095 },
  { id: 'sku009', name: '婴幼儿辅食肉泥 113g*6', category: '婴幼儿食品', unit: '盒', safetyStock: 45, shelfLifeDays: 540 },
  { id: 'sku010', name: '儿童鱼肝油 30粒', category: '营养补充', unit: '盒', safetyStock: 55, shelfLifeDays: 730 },
  { id: 'sku011', name: '婴儿恒温调奶器 1.2L', category: '母婴电器', unit: '台', safetyStock: 15, shelfLifeDays: 1825 },
  { id: 'sku012', name: '宝宝理发器 静音款', category: '母婴电器', unit: '台', safetyStock: 20, shelfLifeDays: 1825 },
];

export const mockSuppliers: Supplier[] = [
  { id: 'sup001', name: '上海母婴优品供应链', contact: '张经理 138****1234' },
  { id: 'sup002', name: '广州健康食品有限公司', contact: '李经理 139****5678' },
  { id: 'sup003', name: '深圳贝亲母婴代理', contact: '王经理 137****9012' },
  { id: 'sup004', name: '杭州好孩子商贸', contact: '赵经理 136****3456' },
];

export const mockLocations: WarehouseLocation[] = [
  { id: 'loc001', code: 'A-01-01', zone: 'A区-常温', aisle: '01' },
  { id: 'loc002', code: 'A-01-02', zone: 'A区-常温', aisle: '01' },
  { id: 'loc003', code: 'A-02-01', zone: 'A区-常温', aisle: '02' },
  { id: 'loc004', code: 'B-01-01', zone: 'B区-冷藏', aisle: '01' },
  { id: 'loc005', code: 'B-01-02', zone: 'B区-冷藏', aisle: '01' },
  { id: 'loc006', code: 'C-01-01', zone: 'C区-恒温', aisle: '01' },
  { id: 'loc007', code: 'C-02-01', zone: 'C区-恒温', aisle: '02' },
  { id: 'loc008', code: 'D-01-01', zone: 'D区-大件', aisle: '01' },
];

const batchDates = [
  { prod: addDays(today, -400), exp: addDays(today, 140), rec: addDays(today, -380) },
  { prod: addDays(today, -300), exp: addDays(today, 240), rec: addDays(today, -280) },
  { prod: addDays(today, -200), exp: addDays(today, 340), rec: addDays(today, -180) },
  { prod: addDays(today, -100), exp: addDays(today, 440), rec: addDays(today, -90) },
  { prod: addDays(today, -60), exp: addDays(today, 480), rec: addDays(today, -50) },
  { prod: addDays(today, -30), exp: addDays(today, 510), rec: addDays(today, -25) },
  { prod: addDays(today, -10), exp: addDays(today, 530), rec: addDays(today, -7) },
  { prod: addDays(today, -5), exp: addDays(today, 535), rec: addDays(today, -3) },
];

export const mockBatches: Batch[] = [
  { id: 'bat001', skuId: 'sku001', batchNo: 'MF2025031501', productionDate: formatDate(batchDates[0].prod), expiryDate: formatDate(batchDates[0].exp), receivedDate: formatDate(batchDates[0].rec), quantity: 200, locationId: 'loc001', supplierId: 'sup001' },
  { id: 'bat002', skuId: 'sku001', batchNo: 'MF2025062002', productionDate: formatDate(batchDates[2].prod), expiryDate: formatDate(batchDates[2].exp), receivedDate: formatDate(batchDates[2].rec), quantity: 150, locationId: 'loc001', supplierId: 'sup001' },
  { id: 'bat003', skuId: 'sku001', batchNo: 'MF2025091003', productionDate: formatDate(batchDates[4].prod), expiryDate: formatDate(batchDates[4].exp), receivedDate: formatDate(batchDates[4].rec), quantity: 180, locationId: 'loc002', supplierId: 'sup001' },
  { id: 'bat004', skuId: 'sku002', batchNo: 'RC2025040101', productionDate: formatDate(batchDates[1].prod), expiryDate: formatDate(batchDates[1].exp), receivedDate: formatDate(batchDates[1].rec), quantity: 300, locationId: 'loc002', supplierId: 'sup002' },
  { id: 'bat005', skuId: 'sku002', batchNo: 'RC2025081502', productionDate: formatDate(batchDates[3].prod), expiryDate: formatDate(batchDates[3].exp), receivedDate: formatDate(batchDates[3].rec), quantity: 250, locationId: 'loc003', supplierId: 'sup002' },
  { id: 'bat006', skuId: 'sku003', batchNo: 'VD2025022001', productionDate: formatDate(batchDates[0].prod), expiryDate: formatDate(addDays(batchDates[0].exp, 190)), receivedDate: formatDate(batchDates[0].rec), quantity: 500, locationId: 'loc006', supplierId: 'sup003' },
  { id: 'bat007', skuId: 'sku003', batchNo: 'VD2025071002', productionDate: formatDate(batchDates[3].prod), expiryDate: formatDate(addDays(batchDates[3].exp, 190)), receivedDate: formatDate(batchDates[3].rec), quantity: 400, locationId: 'loc006', supplierId: 'sup003' },
  { id: 'bat008', skuId: 'sku004', batchNo: 'CT2025051001', productionDate: formatDate(batchDates[2].prod), expiryDate: formatDate(addDays(batchDates[2].exp, 190)), receivedDate: formatDate(batchDates[2].rec), quantity: 180, locationId: 'loc006', supplierId: 'sup003' },
  { id: 'bat009', skuId: 'sku005', batchNo: 'XY2025011501', productionDate: formatDate(batchDates[0].prod), expiryDate: formatDate(addDays(batchDates[0].exp, 555)), receivedDate: formatDate(batchDates[0].rec), quantity: 120, locationId: 'loc003', supplierId: 'sup004' },
  { id: 'bat010', skuId: 'sku006', batchNo: 'NK2025080101', productionDate: formatDate(batchDates[3].prod), expiryDate: formatDate(addDays(batchDates[3].exp, 555)), receivedDate: formatDate(batchDates[3].rec), quantity: 400, locationId: 'loc008', supplierId: 'sup004' },
  { id: 'bat011', skuId: 'sku006', batchNo: 'NK2025100502', productionDate: formatDate(batchDates[5].prod), expiryDate: formatDate(addDays(batchDates[5].exp, 555)), receivedDate: formatDate(batchDates[5].rec), quantity: 350, locationId: 'loc008', supplierId: 'sup004' },
  { id: 'bat012', skuId: 'sku007', batchNo: 'SJ2025060101', productionDate: formatDate(batchDates[2].prod), expiryDate: formatDate(addDays(batchDates[2].exp, 190)), receivedDate: formatDate(batchDates[2].rec), quantity: 600, locationId: 'loc007', supplierId: 'sup004' },
  { id: 'bat013', skuId: 'sku007', batchNo: 'SJ2025092002', productionDate: formatDate(batchDates[4].prod), expiryDate: formatDate(addDays(batchDates[4].exp, 190)), receivedDate: formatDate(batchDates[4].rec), quantity: 500, locationId: 'loc007', supplierId: 'sup004' },
  { id: 'bat014', skuId: 'sku008', batchNo: 'RF2025030101', productionDate: formatDate(batchDates[1].prod), expiryDate: formatDate(addDays(batchDates[1].exp, 555)), receivedDate: formatDate(batchDates[1].rec), quantity: 150, locationId: 'loc007', supplierId: 'sup003' },
  { id: 'bat015', skuId: 'sku009', batchNo: 'MN2025041501', productionDate: formatDate(batchDates[1].prod), expiryDate: formatDate(batchDates[1].exp), receivedDate: formatDate(batchDates[1].rec), quantity: 100, locationId: 'loc004', supplierId: 'sup002' },
  { id: 'bat016', skuId: 'sku009', batchNo: 'MN2025082002', productionDate: formatDate(batchDates[3].prod), expiryDate: formatDate(batchDates[3].exp), receivedDate: formatDate(batchDates[3].rec), quantity: 120, locationId: 'loc004', supplierId: 'sup002' },
  { id: 'bat017', skuId: 'sku010', batchNo: 'YG2025021001', productionDate: formatDate(batchDates[0].prod), expiryDate: formatDate(addDays(batchDates[0].exp, 190)), receivedDate: formatDate(batchDates[0].rec), quantity: 200, locationId: 'loc006', supplierId: 'sup003' },
  { id: 'bat018', skuId: 'sku011', batchNo: 'TN2025050101', productionDate: formatDate(batchDates[2].prod), expiryDate: formatDate(addDays(batchDates[2].exp, 1285)), receivedDate: formatDate(batchDates[2].rec), quantity: 30, locationId: 'loc008', supplierId: 'sup001' },
  { id: 'bat019', skuId: 'sku012', batchNo: 'LF2025061501', productionDate: formatDate(batchDates[2].prod), expiryDate: formatDate(addDays(batchDates[2].exp, 1285)), receivedDate: formatDate(batchDates[2].rec), quantity: 45, locationId: 'loc008', supplierId: 'sup001' },
  { id: 'bat020', skuId: 'sku005', batchNo: 'XY2025100102', productionDate: formatDate(batchDates[5].prod), expiryDate: formatDate(addDays(batchDates[5].exp, 555)), receivedDate: formatDate(batchDates[5].rec), quantity: 90, locationId: 'loc003', supplierId: 'sup004' },
];

function calculateAgeDays(receivedDate: string): number {
  const rec = new Date(receivedDate);
  return Math.floor((today.getTime() - rec.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateDaysToExpiry(expiryDate: string): number {
  const exp = new Date(expiryDate);
  return Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const inventoryQuantities: Record<string, { available: number; reserved: number }> = {
  'bat001': { available: 25, reserved: 5 },
  'bat002': { available: 95, reserved: 10 },
  'bat003': { available: 150, reserved: 20 },
  'bat004': { available: 60, reserved: 8 },
  'bat005': { available: 180, reserved: 15 },
  'bat006': { available: 320, reserved: 30 },
  'bat007': { available: 350, reserved: 25 },
  'bat008': { available: 95, reserved: 10 },
  'bat009': { available: 15, reserved: 3 },
  'bat010': { available: 220, reserved: 25 },
  'bat011': { available: 300, reserved: 30 },
  'bat012': { available: 280, reserved: 35 },
  'bat013': { available: 420, reserved: 40 },
  'bat014': { available: 45, reserved: 5 },
  'bat015': { available: 8, reserved: 2 },
  'bat016': { available: 65, reserved: 8 },
  'bat017': { available: 45, reserved: 8 },
  'bat018': { available: 12, reserved: 2 },
  'bat019': { available: 28, reserved: 3 },
  'bat020': { available: 75, reserved: 8 },
};

export const mockInventory: InventoryItem[] = mockBatches.map(batch => {
  const sku = mockSKUs.find(s => s.id === batch.skuId)!;
  const location = mockLocations.find(l => l.id === batch.locationId)!;
  const supplier = mockSuppliers.find(s => s.id === batch.supplierId)!;
  const qty = inventoryQuantities[batch.id] || { available: 0, reserved: 0 };
  const unitCost = Math.floor(Math.random() * 200) + 20;
  return {
    id: `inv-${batch.id}`,
    skuId: batch.skuId,
    skuName: sku.name,
    batchId: batch.id,
    batchNo: batch.batchNo,
    locationId: batch.locationId,
    locationCode: location.code,
    supplierId: batch.supplierId,
    supplierName: supplier.name,
    quantity: qty.available + qty.reserved,
    availableQty: qty.available,
    reservedQty: qty.reserved,
    ageDays: calculateAgeDays(batch.receivedDate),
    productionDate: batch.productionDate,
    expiryDate: batch.expiryDate,
    daysToExpiry: calculateDaysToExpiry(batch.expiryDate),
    receivedDate: batch.receivedDate,
    unitCost,
    totalValue: unitCost * (qty.available + qty.reserved)
  };
});

export const mockInbound: InboundRecord[] = mockBatches.map((batch, idx) => {
  const sku = mockSKUs.find(s => s.id === batch.skuId)!;
  const supplier = mockSuppliers.find(s => s.id === batch.supplierId)!;
  return {
    id: `in-${idx + 1}`,
    skuId: batch.skuId,
    skuName: sku.name,
    batchId: batch.id,
    quantity: batch.quantity,
    receivedDate: batch.receivedDate,
    supplierId: batch.supplierId,
    supplierName: supplier.name
  };
});

function generateOutbound(): OutboundRecord[] {
  const outbound: OutboundRecord[] = [];
  let id = 1;
  mockBatches.forEach(batch => {
    const sku = mockSKUs.find(s => s.id === batch.skuId)!;
    const soldQty = batch.quantity - (inventoryQuantities[batch.id]?.available || 0) - (inventoryQuantities[batch.id]?.reserved || 0);
    if (soldQty > 0) {
      const shipments = Math.ceil(soldQty / 50);
      let remaining = soldQty;
      for (let i = 0; i < shipments; i++) {
        const qty = Math.min(remaining, Math.floor(Math.random() * 40) + 20);
        const shipDate = addDays(new Date(batch.receivedDate), Math.floor(Math.random() * 60) + 10);
        outbound.push({
          id: `out-${id++}`,
          skuId: batch.skuId,
          skuName: sku.name,
          batchId: batch.id,
          quantity: qty,
          shippedDate: formatDate(shipDate),
          destination: ['华东仓', '华南仓', '华北仓', '西南仓'][Math.floor(Math.random() * 4)]
        });
        remaining -= qty;
        if (remaining <= 0) break;
      }
    }
  });
  return outbound;
}

export const mockOutbound: OutboundRecord[] = generateOutbound();

export const mockReturns: ReturnRecord[] = [
  { id: 'ret001', skuId: 'sku001', skuName: '益生菌配方奶粉 900g', batchId: 'bat001', quantity: 3, returnDate: formatDate(addDays(today, -15)), reason: '包装破损' },
  { id: 'ret002', skuId: 'sku005', skuName: '婴幼儿洗衣液 1L', batchId: 'bat009', quantity: 2, returnDate: formatDate(addDays(today, -8)), reason: '客户误购' },
  { id: 'ret003', skuId: 'sku006', skuName: '婴儿纸尿裤 M码 64片', batchId: 'bat010', quantity: 5, returnDate: formatDate(addDays(today, -5)), reason: '尺码不合适' },
  { id: 'ret004', skuId: 'sku007', skuName: '婴幼儿手口湿巾 80抽', batchId: 'bat012', quantity: 8, returnDate: formatDate(addDays(today, -3)), reason: '临近效期' },
];

export const mockTurnover: TurnoverMetric[] = mockSKUs.map((sku, idx) => {
  const skuBatches = mockBatches.filter(b => b.skuId === sku.id);
  const totalInbound = skuBatches.reduce((sum, b) => sum + b.quantity, 0);
  const skuInventory = mockInventory.filter(i => i.skuId === sku.id);
  const currentStock = skuInventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalOutbound = totalInbound - currentStock;
  const avgInventory = (totalInbound + currentStock) / 2;
  const turnoverRate = avgInventory > 0 ? totalOutbound / avgInventory : 0;
  const turnoverDays = turnoverRate > 0 ? Math.floor(90 / turnoverRate) : 999;
  return {
    skuId: sku.id,
    skuName: sku.name,
    category: sku.category,
    totalInbound,
    totalOutbound,
    avgInventory: Math.floor(avgInventory),
    turnoverRate: Number(turnoverRate.toFixed(2)),
    turnoverDays,
    ranking: idx + 1
  };
}).sort((a, b) => a.turnoverDays - b.turnoverDays).map((item, idx) => ({ ...item, ranking: idx + 1 }));

export const mockReplenishment: ReplenishmentSuggestion[] = ([
  { skuId: 'sku001', skuName: '益生菌配方奶粉 900g', category: '婴幼儿食品', currentStock: 305, safetyStock: 50, avgDailyDemand: 8, daysOfSupply: 38, suggestedQty: 150, priority: 'low', supplierId: 'sup001', supplierName: '上海母婴优品供应链' },
  { skuId: 'sku002', skuName: '有机婴幼儿米粉 225g', category: '婴幼儿食品', currentStock: 263, safetyStock: 80, avgDailyDemand: 12, daysOfSupply: 22, suggestedQty: 200, priority: 'medium', supplierId: 'sup002', supplierName: '广州健康食品有限公司' },
  { skuId: 'sku005', skuName: '婴幼儿洗衣液 1L', category: '母婴用品', currentStock: 101, safetyStock: 40, avgDailyDemand: 3, daysOfSupply: 34, suggestedQty: 60, priority: 'low', supplierId: 'sup004', supplierName: '杭州好孩子商贸' },
  { skuId: 'sku009', skuName: '婴幼儿辅食肉泥 113g*6', category: '婴幼儿食品', currentStock: 83, safetyStock: 45, avgDailyDemand: 5, daysOfSupply: 17, suggestedQty: 100, priority: 'medium', supplierId: 'sup002', supplierName: '广州健康食品有限公司' },
  { skuId: 'sku010', skuName: '儿童鱼肝油 30粒', category: '营养补充', currentStock: 53, safetyStock: 55, avgDailyDemand: 4, daysOfSupply: 13, suggestedQty: 120, priority: 'high', supplierId: 'sup003', supplierName: '深圳贝亲母婴代理' },
  { skuId: 'sku011', skuName: '婴儿恒温调奶器 1.2L', category: '母婴电器', currentStock: 14, safetyStock: 15, avgDailyDemand: 1, daysOfSupply: 14, suggestedQty: 30, priority: 'high', supplierId: 'sup001', supplierName: '上海母婴优品供应链' },
  { skuId: 'sku008', skuName: '宝宝润肤乳 200ml', category: '母婴用品', currentStock: 50, safetyStock: 70, avgDailyDemand: 2, daysOfSupply: 25, suggestedQty: 80, priority: 'medium', supplierId: 'sup003', supplierName: '深圳贝亲母婴代理' },
] as ReplenishmentSuggestion[]).sort((a, b) => {
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
});

export const mockFunnelData: FunnelData[] = [
  { stage: '总入库量', value: 5340, description: '统计周期内所有入库商品总量' },
  { stage: '在库库存', value: 3183, description: '当前仓库中实际存放的商品总量' },
  { stage: '可售库存', value: 2959, description: '扣除预留和锁定后的可销售库存' },
  { stage: '近效期库存', value: 316, description: '距效期90天内的库存，需优先处理' },
  { stage: '滞销库存', value: 158, description: '库龄超过180天且无出库记录的库存' },
];

export const mockAgeDistribution: AgeDistribution[] = [
  { range: '0-30天', minDays: 0, maxDays: 30, count: 5, quantity: 893, value: 89300 },
  { range: '31-60天', minDays: 31, maxDays: 60, count: 4, quantity: 675, value: 67500 },
  { range: '61-90天', minDays: 61, maxDays: 90, count: 3, quantity: 540, value: 54000 },
  { range: '91-180天', minDays: 91, maxDays: 180, count: 4, quantity: 580, value: 58000 },
  { range: '181-365天', minDays: 181, maxDays: 365, count: 3, quantity: 365, value: 36500 },
  { range: '365天以上', minDays: 365, maxDays: 9999, count: 1, quantity: 130, value: 13000, isNearExpiry: false },
  { range: '距效期<90天', minDays: 0, maxDays: 90, count: 2, quantity: 316, value: 31600, isNearExpiry: true },
];

export const mockSampleInfo: SampleInfo = {
  totalRecords: 5340,
  filteredRecords: 3183,
  cacheTime: '5分钟前',
  dataFreshness: formatDate(today) + ' 08:00:00'
};

export const categories = [...new Set(mockSKUs.map(s => s.category))];
export const zones = [...new Set(mockLocations.map(l => l.zone))];
