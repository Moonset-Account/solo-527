export interface Workshop {
  id: string;
  name: string;
  lng: number;
  lat: number;
  capacity: number;
  currentLoad: number;
}

export interface MaterialShortage {
  materialCode: string;
  materialName: string;
  shortQty: number;
  eta: string;
  severity: 'critical' | 'warning' | 'normal';
}

export interface ProcessStep {
  id: string;
  workOrderId: string;
  stepIndex: number;
  name: string;
  workshopId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  delayHours: number;
  delayCauses: DelayCause[];
  materialShortages: MaterialShortage[];
  equipmentDowntime?: number;
  rushOrderImpact?: number;
}

export type DelayCause = 'capacity' | 'material' | 'equipment' | 'rush_order' | 'cross_shop_transfer';

export interface RushOrder {
  id: string;
  workOrderId: string;
  insertedAt: string;
  approvedBy: string;
  approvalNote: string;
  impactScope: string[];
  priorityBoost: number;
  originalDeliveryDate: string;
  newDeliveryDate: string;
}

export interface PriorityAdjustment {
  id: string;
  workOrderId: string;
  adjustedAt: string;
  adjustedBy: string;
  oldPriority: number;
  newPriority: number;
  reason: string;
  affectedDownstreamSteps: string[];
  beforeDelayRisk: number;
  afterDelayRisk: number;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  customer: string;
  product: string;
  quantity: number;
  deliveryDate: string;
  priority: number;
  status: 'planned' | 'in_progress' | 'delayed' | 'completed';
  processSteps: ProcessStep[];
  rushOrders: RushOrder[];
  priorityAdjustments: PriorityAdjustment[];
  totalDelayHours: number;
  crossShopTransfers: CrossShopTransfer[];
}

export interface CrossShopTransfer {
  id: string;
  workOrderId: string;
  fromWorkshopId: string;
  toWorkshopId: string;
  distanceKm: number;
  waitTimeHours: number;
  processStepId: string;
}

export interface CapacityBucket {
  workshopId: string;
  workshopName: string;
  date: string;
  totalCapacity: number;
  usedCapacity: number;
  rushOrderCapacity: number;
  availableCapacity: number;
}

export interface WaterfallItem {
  name: string;
  value: number;
  fill: string;
  category: 'delivery' | 'process' | 'capacity' | 'material' | 'equipment' | 'rush_order' | 'cross_shop';
}
