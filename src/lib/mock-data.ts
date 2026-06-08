import {
  Workshop,
  WorkOrder,
  ProcessStep,
  RushOrder,
  PriorityAdjustment,
  CrossShopTransfer,
  CapacityBucket,
  MaterialShortage,
} from './types';

export const workshops: Workshop[] = [
  { id: 'ws-1', name: '冲压车间', lng: 121.4737, lat: 31.2304, capacity: 480, currentLoad: 420 },
  { id: 'ws-2', name: '焊接车间', lng: 121.4837, lat: 31.2354, capacity: 360, currentLoad: 340 },
  { id: 'ws-3', name: '涂装车间', lng: 121.4637, lat: 31.2254, capacity: 320, currentLoad: 290 },
  { id: 'ws-4', name: '总装车间', lng: 121.4787, lat: 31.2184, capacity: 400, currentLoad: 380 },
  { id: 'ws-5', name: '检测车间', lng: 121.4587, lat: 31.2404, capacity: 240, currentLoad: 180 },
];

function createProcessSteps(workOrderId: string, workshopIds: string[]): ProcessStep[] {
  const stepNames = ['下料', '冲压成型', '焊接组装', '表面处理', '涂装喷漆', '总装调试', '质检入库'];
  const causes: Array<'capacity' | 'material' | 'equipment' | 'rush_order' | 'cross_shop_transfer'> = ['capacity', 'material', 'equipment', 'rush_order', 'cross_shop_transfer'];
  const shortages: MaterialShortage[] = [
    { materialCode: 'M-1001', materialName: '高强度钢板', shortQty: 200, eta: '2026-06-12', severity: 'critical' },
    { materialCode: 'M-1002', materialName: '铝合金型材', shortQty: 50, eta: '2026-06-10', severity: 'warning' },
    { materialCode: 'M-1003', materialName: '密封胶条', shortQty: 300, eta: '2026-06-09', severity: 'normal' },
    { materialCode: 'M-2001', materialName: '电子控制单元', shortQty: 15, eta: '2026-06-15', severity: 'critical' },
    { materialCode: 'M-2002', materialName: '液压管路', shortQty: 80, eta: '2026-06-11', severity: 'warning' },
  ];

  return stepNames.slice(0, workshopIds.length + 2).map((name, i) => {
    const delayHours = Math.random() > 0.5 ? Math.floor(Math.random() * 48) : 0;
    const delayCauses = delayHours > 0 ? [causes[Math.floor(Math.random() * causes.length)]] : [];
    const matShortages = i === 1 || i === 3 ? [shortages[Math.floor(Math.random() * shortages.length)]] : [];
    const equipDown = Math.random() > 0.7 ? Math.floor(Math.random() * 24) : 0;
    const rushImpact = Math.random() > 0.8 ? Math.floor(Math.random() * 16) : 0;

    return {
      id: `${workOrderId}-step-${i}`,
      workOrderId,
      stepIndex: i,
      name,
      workshopId: workshopIds[i % workshopIds.length],
      plannedStart: `2026-06-${String(8 + i).padStart(2, '0')}T08:00:00`,
      plannedEnd: `2026-06-${String(9 + i).padStart(2, '0')}T18:00:00`,
      status: i < 2 ? 'completed' as const : i === 2 ? 'in_progress' as const : delayHours > 0 ? 'delayed' as const : 'pending' as const,
      delayHours,
      delayCauses,
      materialShortages: matShortages,
      equipmentDowntime: equipDown,
      rushOrderImpact: rushImpact,
    };
  });
}

const rushOrderMap: Record<string, RushOrder> = {
  'WO-20260601': { id: 'rush-WO-20260601', workOrderId: 'WO-20260601', insertedAt: '2026-06-07T14:30:00', approvedBy: '张总监', approvalNote: '客户为VIP-A级，交期不可更改，优先排产。需协调冲压和焊接车间加班产能。', impactScope: ['冲压车间-班次B', '焊接车间-班次A', '涂装车间-全线'], priorityBoost: 3, originalDeliveryDate: '2026-06-25', newDeliveryDate: '2026-06-18' },
  'WO-20260603': { id: 'rush-WO-20260603', workOrderId: 'WO-20260603', insertedAt: '2026-06-06T09:15:00', approvedBy: '王副总监', approvalNote: '蔚来紧急提车需求，原计划涂装后总装需压缩3天，调配夜班产能。', impactScope: ['涂装车间-全线', '总装车间-班次B'], priorityBoost: 2, originalDeliveryDate: '2026-06-22', newDeliveryDate: '2026-06-18' },
  'WO-20260608': { id: 'rush-WO-20260608', workOrderId: 'WO-20260608', insertedAt: '2026-06-05T16:45:00', approvedBy: '张总监', approvalNote: '理想汽车产线停线风险，需在48h内交付首批，优先安排冲压和焊接。', impactScope: ['冲压车间-班次A', '焊接车间-班次A', '检测车间-加急通道'], priorityBoost: 3, originalDeliveryDate: '2026-06-24', newDeliveryDate: '2026-06-17' },
  'WO-20260611': { id: 'rush-WO-20260611', workOrderId: 'WO-20260611', insertedAt: '2026-06-06T11:00:00', approvedBy: '李经理', approvalNote: '吉利库存告急，已无安全库存，需提前一周交付。', impactScope: ['冲压车间-班次B', '焊接车间-全线'], priorityBoost: 2, originalDeliveryDate: '2026-06-23', newDeliveryDate: '2026-06-16' },
};

function createRushOrders(workOrderId: string): RushOrder[] {
  return rushOrderMap[workOrderId] ? [rushOrderMap[workOrderId]] : [];
}

const adjustmentMap: Record<string, PriorityAdjustment> = {
  'WO-20260601': { id: 'adj-WO-20260601', workOrderId: 'WO-20260601', adjustedAt: '2026-06-07T10:15:00', adjustedBy: '李计划员', oldPriority: 5, newPriority: 1, reason: '客户升级投诉，需提前交付以维护合作关系', affectedDownstreamSteps: ['WO-20260601-step-3', 'WO-20260601-step-4', 'WO-20260601-step-5'], beforeDelayRisk: 78, afterDelayRisk: 32 },
  'WO-20260603': { id: 'adj-WO-20260603', workOrderId: 'WO-20260603', adjustedAt: '2026-06-06T08:30:00', adjustedBy: '李计划员', oldPriority: 4, newPriority: 1, reason: '蔚来提车需求紧急，原排产顺序延后将造成产线停等', affectedDownstreamSteps: ['WO-20260603-step-2', 'WO-20260603-step-3', 'WO-20260603-step-4'], beforeDelayRisk: 85, afterDelayRisk: 40 },
  'WO-20260605': { id: 'adj-WO-20260605', workOrderId: 'WO-20260605', adjustedAt: '2026-06-07T09:00:00', adjustedBy: '王计划员', oldPriority: 3, newPriority: 2, reason: '长城汽车缺料问题已部分解决，重新提升优先级', affectedDownstreamSteps: ['WO-20260605-step-3', 'WO-20260605-step-4'], beforeDelayRisk: 55, afterDelayRisk: 38 },
  'WO-20260608': { id: 'adj-WO-20260608', workOrderId: 'WO-20260608', adjustedAt: '2026-06-05T14:00:00', adjustedBy: '李计划员', oldPriority: 5, newPriority: 1, reason: '理想汽车产线停线风险，最高优先级排产', affectedDownstreamSteps: ['WO-20260608-step-2', 'WO-20260608-step-3', 'WO-20260608-step-4', 'WO-20260608-step-5'], beforeDelayRisk: 92, afterDelayRisk: 45 },
  'WO-20260611': { id: 'adj-WO-20260611', workOrderId: 'WO-20260611', adjustedAt: '2026-06-06T10:30:00', adjustedBy: '王计划员', oldPriority: 4, newPriority: 1, reason: '吉利库存告急，安全库存已耗尽', affectedDownstreamSteps: ['WO-20260611-step-3', 'WO-20260611-step-4', 'WO-20260611-step-5'], beforeDelayRisk: 72, afterDelayRisk: 35 },
};

function createAdjustments(workOrderId: string): PriorityAdjustment[] {
  return adjustmentMap[workOrderId] ? [adjustmentMap[workOrderId]] : [];
}

const transferMap: Record<string, CrossShopTransfer> = {
  'WO-20260601': { id: 'xfr-WO-20260601', workOrderId: 'WO-20260601', fromWorkshopId: 'ws-1', toWorkshopId: 'ws-2', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260601-step-2' },
  'WO-20260603': { id: 'xfr-WO-20260603', workOrderId: 'WO-20260603', fromWorkshopId: 'ws-1', toWorkshopId: 'ws-3', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260603-step-3' },
  'WO-20260605': { id: 'xfr-WO-20260605', workOrderId: 'WO-20260605', fromWorkshopId: 'ws-2', toWorkshopId: 'ws-4', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260605-step-4' },
  'WO-20260606': { id: 'xfr-WO-20260606', workOrderId: 'WO-20260606', fromWorkshopId: 'ws-3', toWorkshopId: 'ws-4', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260606-step-3' },
  'WO-20260608': { id: 'xfr-WO-20260608', workOrderId: 'WO-20260608', fromWorkshopId: 'ws-1', toWorkshopId: 'ws-2', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260608-step-2' },
  'WO-20260611': { id: 'xfr-WO-20260611', workOrderId: 'WO-20260611', fromWorkshopId: 'ws-5', toWorkshopId: 'ws-3', distanceKm: 0, waitTimeHours: 0, processStepId: 'WO-20260611-step-5' },
};

function createTransfers(workOrderId: string): CrossShopTransfer[] {
  const t = transferMap[workOrderId];
  if (!t) return [];
  const from = getWorkshopById(t.fromWorkshopId);
  const to = getWorkshopById(t.toWorkshopId);
  if (!from || !to) return [];
  const dist = calculateDistance(from, to);
  const wait = computeWaitTime(dist, from.currentLoad, from.capacity);
  return [{ ...t, distanceKm: dist, waitTimeHours: wait }];
}

function computeWaitTime(distanceKm: number, fromLoad: number, fromCapacity: number): number {
  const loadRatio = fromLoad / fromCapacity;
  const loadDelay = loadRatio > 0.85 ? (loadRatio - 0.85) * 40 : 0;
  return +(1.5 + distanceKm / 8 + loadDelay * 0.08).toFixed(1);
}

export const workOrders: WorkOrder[] = [
  {
    id: 'WO-20260601', orderNo: 'ORD-240601', customer: '上汽集团', product: 'SUV前围板总成', quantity: 5000,
    deliveryDate: '2026-06-20', priority: 1, status: 'delayed', totalDelayHours: 36,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260602', orderNo: 'ORD-240602', customer: '比亚迪', product: '电池托盘焊接件', quantity: 8000,
    deliveryDate: '2026-06-22', priority: 2, status: 'in_progress', totalDelayHours: 12,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260603', orderNo: 'ORD-240603', customer: '蔚来汽车', product: '车身侧围冲压件', quantity: 3000,
    deliveryDate: '2026-06-18', priority: 1, status: 'delayed', totalDelayHours: 48,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260604', orderNo: 'ORD-240604', customer: '吉利汽车', product: '底盘横梁总成', quantity: 6000,
    deliveryDate: '2026-06-25', priority: 3, status: 'planned', totalDelayHours: 0,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260605', orderNo: 'ORD-240605', customer: '长城汽车', product: '车门内板冲压件', quantity: 4000,
    deliveryDate: '2026-06-19', priority: 2, status: 'delayed', totalDelayHours: 24,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260606', orderNo: 'ORD-240606', customer: '上汽集团', product: '后地板焊接总成', quantity: 5500,
    deliveryDate: '2026-06-21', priority: 2, status: 'in_progress', totalDelayHours: 8,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260607', orderNo: 'ORD-240607', customer: '小鹏汽车', product: '前舱盖冲压件', quantity: 2500,
    deliveryDate: '2026-06-23', priority: 4, status: 'planned', totalDelayHours: 0,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260608', orderNo: 'ORD-240608', customer: '理想汽车', product: 'B柱加强板焊接', quantity: 7000,
    deliveryDate: '2026-06-17', priority: 1, status: 'delayed', totalDelayHours: 56,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260609', orderNo: 'ORD-240609', customer: '比亚迪', product: '前端框架总成', quantity: 4500,
    deliveryDate: '2026-06-24', priority: 3, status: 'in_progress', totalDelayHours: 4,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260610', orderNo: 'ORD-240610', customer: '蔚来汽车', product: '顶盖横梁冲压', quantity: 3500,
    deliveryDate: '2026-06-26', priority: 5, status: 'planned', totalDelayHours: 0,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260611', orderNo: 'ORD-240611', customer: '吉利汽车', product: '后排座椅横梁', quantity: 9000,
    deliveryDate: '2026-06-16', priority: 1, status: 'delayed', totalDelayHours: 40,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
  {
    id: 'WO-20260612', orderNo: 'ORD-240612', customer: '长安汽车', product: '翼子板冲压件', quantity: 6000,
    deliveryDate: '2026-06-28', priority: 4, status: 'planned', totalDelayHours: 0,
    processSteps: [], rushOrders: [], priorityAdjustments: [], crossShopTransfers: [],
  },
];

workOrders.forEach((wo) => {
  const workshopIds = workshops.map((w) => w.id);
  const stepCount = Math.floor(Math.random() * 3) + 4;
  const usedWorkshops = workshopIds.slice(0, stepCount);
  wo.processSteps = createProcessSteps(wo.id, usedWorkshops);
  wo.rushOrders = createRushOrders(wo.id);
  wo.priorityAdjustments = createAdjustments(wo.id);
  wo.crossShopTransfers = createTransfers(wo.id);
});

export function getCapacityBuckets(): CapacityBucket[] {
  const buckets: CapacityBucket[] = [];
  const dates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14'];
  workshops.forEach((ws) => {
    dates.forEach((date) => {
      const used = Math.floor(Math.random() * ws.capacity * 0.4 + ws.capacity * 0.5);
      const rush = Math.floor(Math.random() * ws.capacity * 0.15);
      buckets.push({
        workshopId: ws.id,
        workshopName: ws.name,
        date,
        totalCapacity: ws.capacity,
        usedCapacity: used,
        rushOrderCapacity: rush,
        availableCapacity: ws.capacity - used - rush,
      });
    });
  });
  return buckets;
}

export function getWaterfallData(orderId: string) {
  const wo = workOrders.find((w) => w.id === orderId);
  if (!wo) return [];

  const _baseDelivery = new Date(wo.deliveryDate).getTime() / (1000 * 60 * 60);
  void _baseDelivery;
  const processDelay = wo.processSteps.reduce((s, p) => s + p.delayHours, 0);
  const capacityDelay = wo.processSteps.filter((p) => p.delayCauses.includes('capacity')).reduce((s, p) => s + p.delayHours, 0);
  const materialDelay = wo.processSteps.filter((p) => p.delayCauses.includes('material')).reduce((s, p) => s + p.delayHours, 0);
  const equipDelay = wo.processSteps.reduce((s, p) => s + (p.equipmentDowntime || 0), 0);
  const rushDelay = wo.processSteps.reduce((s, p) => s + (p.rushOrderImpact || 0), 0);
  const transferDelay = wo.crossShopTransfers.reduce((s, t) => s + t.waitTimeHours, 0);

  return [
    { name: '交期基准', value: 0, fill: '#6366f1', category: 'delivery' as const },
    { name: '工序延期', value: processDelay, fill: '#f59e0b', category: 'process' as const },
    { name: '产能不足', value: capacityDelay, fill: '#ef4444', category: 'capacity' as const },
    { name: '缺料等待', value: materialDelay, fill: '#f97316', category: 'material' as const },
    { name: '设备停机', value: equipDelay, fill: '#8b5cf6', category: 'equipment' as const },
    { name: '插单影响', value: rushDelay, fill: '#ec4899', category: 'rush_order' as const },
    { name: '跨车间转单', value: transferDelay, fill: '#14b8a6', category: 'cross_shop' as const },
  ];
}

export function getCustomers(): string[] {
  return [...new Set(workOrders.map((wo) => wo.customer))];
}

export function getWorkshopById(id: string): Workshop | undefined {
  return workshops.find((w) => w.id === id);
}

export function calculateDistance(ws1: Workshop, ws2: Workshop): number {
  const R = 6371;
  const dLat = ((ws2.lat - ws1.lat) * Math.PI) / 180;
  const dLon = ((ws2.lng - ws1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((ws1.lat * Math.PI) / 180) * Math.cos((ws2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}
