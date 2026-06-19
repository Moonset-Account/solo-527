import type {
  Vehicle,
  Part,
  PartTurnover,
  WorkOrder,
  ProductionNode,
  TeamSchedule,
  QualityInspection,
  OrderChange,
  CallbackRecord,
  CompensationRecord,
  UserProfile,
} from '../types';
import {
  mockUsers,
  mockVehicles,
  mockParts,
  mockPartTurnovers,
  mockWorkOrders,
  mockProductionNodes,
  mockTeamSchedules,
  mockQualityInspections,
  mockOrderChanges,
  mockCallbacks,
} from '../mock-data';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !!url &&
    url !== 'https://placeholder.supabase.co' &&
    !!anon &&
    anon !== 'placeholder-anon-key' &&
    anon !== 'placeholder'
  );
}

interface ListOptions {
  filters?: Record<string, any>;
  search?: string;
  searchFields?: string[];
  orderBy?: { field: string; dir?: 'asc' | 'desc' };
  limit?: number;
}

interface DateRangeOptions extends ListOptions {
  dateFrom?: string;
  dateTo?: string;
}

function applyList<T extends Record<string, any>>(
  list: T[],
  opts: ListOptions = {},
): T[] {
  let result = [...list];
  if (opts.filters) {
    for (const [k, v] of Object.entries(opts.filters)) {
      if (v === undefined || v === null || v === 'all' || v === '') continue;
      result = result.filter((item) => item[k] === v);
    }
  }
  if (opts.search && opts.searchFields && opts.search.trim()) {
    const kw = opts.search.toLowerCase();
    result = result.filter((item) =>
      opts.searchFields!.some((f) => {
        const val = item[f];
        return typeof val === 'string' && val.toLowerCase().includes(kw);
      }),
    );
  }
  if (opts.orderBy) {
    const { field, dir = 'asc' } = opts.orderBy;
    result.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null) return 1;
      if (bv == null) return -1;
      return String(av).localeCompare(String(bv)) * (dir === 'asc' ? 1 : -1);
    });
  }
  if (opts.limit) result = result.slice(0, opts.limit);
  return result;
}

/* =============== USERS/PROFILES =============== */
export async function listUsers(opts: ListOptions = {}): Promise<UserProfile[]> {
  return applyList<UserProfile>(mockUsers, opts);
}
export async function getUserById(id: string): Promise<UserProfile | null> {
  return mockUsers.find((u) => u.id === id) ?? null;
}

/* =============== VEHICLES =============== */
let vehiclesData: Vehicle[] = [...mockVehicles];
export async function listVehicles(opts: ListOptions = {}): Promise<Vehicle[]> {
  return applyList<Vehicle>(vehiclesData, opts);
}
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  return vehiclesData.find((v) => v.id === id) ?? null;
}
export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'created_at' | 'created_by'> & { created_by?: string },
): Promise<Vehicle> {
  const v: Vehicle = {
    ...data,
    id: crypto.randomUUID(),
    created_by: data.created_by ?? '',
    created_at: new Date().toISOString(),
  };
  vehiclesData = [v, ...vehiclesData];
  return v;
}

/* =============== PARTS =============== */
let partsData: Part[] = [...mockParts];
export async function listParts(opts: ListOptions = {}): Promise<Part[]> {
  return applyList<Part>(partsData, opts);
}
export async function getPartById(id: string): Promise<Part | null> {
  return partsData.find((p) => p.id === id) ?? null;
}
export async function createPart(
  data: Omit<Part, 'id' | 'created_at'>,
): Promise<Part> {
  const p: Part = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  partsData = [p, ...partsData];
  return p;
}

/* =============== PART TURNOVERS =============== */
let turnoversData: PartTurnover[] = [...mockPartTurnovers];
export async function listPartTurnovers(opts: DateRangeOptions = {}) {
  let res = applyList<PartTurnover>(turnoversData, opts);
  if (opts.dateFrom) res = res.filter((r) => r.created_at >= opts.dateFrom!);
  if (opts.dateTo) res = res.filter((r) => r.created_at <= opts.dateTo!);
  return res;
}
export async function createPartTurnover(
  data: Omit<PartTurnover, 'id' | 'created_at' | 'operator_id' | 'operator_name' | 'part_name' | 'workorder_title'> & {
    operator_id: string;
    operator_name?: string;
  },
): Promise<PartTurnover> {
  const part = partsData.find((p) => p.id === data.part_id);
  const wo = data.workorder_id ? workOrdersData.find((w) => w.id === data.workorder_id) : undefined;
  const t: PartTurnover = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    operator_name: data.operator_name,
    part_name: part?.name,
    workorder_title: wo?.title,
  };
  turnoversData = [t, ...turnoversData];
  // 更新库存
  if (t.type === 'in') {
    partsData = partsData.map((p) => (p.id === t.part_id ? { ...p, stock: p.stock + t.quantity } : p));
  } else if (t.type === 'out') {
    partsData = partsData.map((p) =>
      p.id === t.part_id ? { ...p, stock: Math.max(0, p.stock - t.quantity) } : p,
    );
  }
  return t;
}

/* =============== WORK ORDERS =============== */
let workOrdersData: WorkOrder[] = [...mockWorkOrders];
export async function listWorkOrders(opts: ListOptions = {}): Promise<WorkOrder[]> {
  return applyList<WorkOrder>(workOrdersData, opts);
}
export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  return workOrdersData.find((w) => w.id === id) ?? null;
}
export async function createWorkOrder(
  data: Omit<WorkOrder, 'id' | 'created_at' | 'status'> & { status?: WorkOrder['status'] },
): Promise<WorkOrder> {
  const vehicle = vehiclesData.find((v) => v.id === data.vehicle_id);
  const team = data.team_id ? mockUsers.find((u) => u.id === data.team_id) : undefined;
  const assignee = data.assignee_id ? mockUsers.find((u) => u.id === data.assignee_id) : undefined;
  const w: WorkOrder = {
    ...data,
    id: crypto.randomUUID(),
    status: data.status ?? 'pending',
    vehicle_plate: vehicle?.plate_number,
    vehicle_brand: vehicle?.brand,
    vehicle_model: vehicle?.model,
    team_name: team?.full_name,
    assignee_name: assignee?.full_name,
    created_at: new Date().toISOString(),
  };
  workOrdersData = [w, ...workOrdersData];
  return w;
}
export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrder['status'],
): Promise<void> {
  workOrdersData = workOrdersData.map((w) =>
    w.id === id
      ? {
          ...w,
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : w.completed_at,
        }
      : w,
  );
}

/* =============== PRODUCTION NODES =============== */
let nodesData: ProductionNode[] = [...mockProductionNodes];
export async function listProductionNodes(opts: ListOptions = {}): Promise<ProductionNode[]> {
  return applyList<ProductionNode>(nodesData, opts);
}
export async function createProductionNodes(
  items: Omit<ProductionNode, 'id' | 'workorder_title' | 'operator_name'>[],
): Promise<ProductionNode[]> {
  const created: ProductionNode[] = items.map((n, idx) => ({
    ...n,
    id: crypto.randomUUID(),
    workorder_title: workOrdersData.find((w) => w.id === n.workorder_id)?.title,
    operator_name: n.operator_id ? mockUsers.find((u) => u.id === n.operator_id)?.full_name : undefined,
    sequence: n.sequence ?? idx + 1,
    status: n.status ?? 'pending',
  }));
  nodesData = [...created, ...nodesData];
  return created;
}
export async function updateProductionNode(
  id: string,
  patch: Partial<ProductionNode>,
): Promise<void> {
  nodesData = nodesData.map((n) =>
    n.id === id
      ? {
          ...n,
          ...patch,
          operator_name:
            patch.operator_id
              ? mockUsers.find((u) => u.id === patch.operator_id)?.full_name
              : n.operator_name,
        }
      : n,
  );
}
export async function bulkUpdateProductionNodes(
  ids: string[],
  patch: Partial<ProductionNode>,
): Promise<void> {
  await Promise.all(ids.map((id) => updateProductionNode(id, patch)));
}

/* =============== TEAM SCHEDULES =============== */
let schedulesData: TeamSchedule[] = [...mockTeamSchedules];
export async function listTeamSchedules(opts: DateRangeOptions = {}) {
  let res = applyList<TeamSchedule>(schedulesData, opts);
  if (opts.dateFrom) res = res.filter((r) => r.start_time >= opts.dateFrom!);
  if (opts.dateTo) res = res.filter((r) => r.end_time <= opts.dateTo!);
  return res;
}
export async function createTeamSchedule(
  data: Omit<TeamSchedule, 'id' | 'created_at' | 'team_name' | 'workorder_title' | 'assignee_names'>,
): Promise<TeamSchedule> {
  const team = mockUsers.find((u) => u.id === data.team_id);
  const wo = workOrdersData.find((w) => w.id === data.workorder_id);
  const assignee_names: string[] = data.assignee_ids
    .map((id) => mockUsers.find((u) => u.id === id)?.full_name)
    .filter(Boolean) as string[];
  const s: TeamSchedule = {
    ...data,
    id: crypto.randomUUID(),
    team_name: team?.full_name,
    workorder_title: wo?.title,
    assignee_names,
    created_at: new Date().toISOString(),
  };
  schedulesData = [s, ...schedulesData];
  return s;
}

/* =============== QUALITY =============== */
let qiData: QualityInspection[] = [...mockQualityInspections];
export async function listQualityInspections(opts: ListOptions = {}): Promise<QualityInspection[]> {
  return applyList<QualityInspection>(qiData, opts);
}
export async function createQualityInspection(
  data: Omit<QualityInspection, 'id' | 'created_at' | 'inspector_name' | 'workorder_title'>,
): Promise<QualityInspection> {
  const inspector = mockUsers.find((u) => u.id === data.inspector_id);
  const wo = workOrdersData.find((w) => w.id === data.workorder_id);
  const q: QualityInspection = {
    ...data,
    id: crypto.randomUUID(),
    inspector_name: inspector?.full_name,
    workorder_title: wo?.title,
    created_at: new Date().toISOString(),
  };
  qiData = [q, ...qiData];
  // 自动流转工单状态
  if (q.overall_result === 'pass') {
    await updateWorkOrderStatus(q.workorder_id, 'completed');
  } else {
    await updateWorkOrderStatus(q.workorder_id, 'in_progress');
  }
  return q;
}

/* =============== ORDER CHANGES =============== */
let ocData: OrderChange[] = [...mockOrderChanges];
export async function listOrderChanges(opts: ListOptions = {}): Promise<OrderChange[]> {
  return applyList<OrderChange>(ocData, opts);
}
export async function createOrderChange(
  data: Omit<OrderChange, 'id' | 'created_at' | 'created_by' | 'created_by_name' | 'responsible_name' | 'workorder_title' | 'status'> & {
    created_by: string;
    status?: OrderChange['status'];
  },
): Promise<OrderChange> {
  const responsible = mockUsers.find((u) => u.id === data.responsible_id);
  const creator = mockUsers.find((u) => u.id === data.created_by);
  const wo = data.workorder_id ? workOrdersData.find((w) => w.id === data.workorder_id) : undefined;
  const oc: OrderChange = {
    ...data,
    id: crypto.randomUUID(),
    status: data.status ?? 'open',
    responsible_name: responsible?.full_name,
    created_by_name: creator?.full_name,
    workorder_title: wo?.title,
    created_at: new Date().toISOString(),
  };
  ocData = [oc, ...ocData];
  return oc;
}
export async function updateOrderChangeStatus(
  id: string,
  status: OrderChange['status'],
  close_note?: string,
): Promise<void> {
  ocData = ocData.map((oc) =>
    oc.id === id
      ? {
          ...oc,
          status,
          close_note: close_note ?? oc.close_note,
          closed_at: status === 'closed' ? new Date().toISOString() : oc.closed_at,
        }
      : oc,
  );
}

/* =============== CALLBACKS =============== */
let cbData: CallbackRecord[] = [...mockCallbacks];
export async function listCallbacks(opts: DateRangeOptions = {}) {
  let res = applyList<CallbackRecord>(cbData, opts);
  if (opts.dateFrom) res = res.filter((r) => r.created_at >= opts.dateFrom!);
  if (opts.dateTo) res = res.filter((r) => r.created_at <= opts.dateTo!);
  return res;
}
export async function retryCallback(id: string, success: boolean): Promise<void> {
  cbData = cbData.map((c) =>
    c.id === id
      ? {
          ...c,
          status: success ? 'success' : 'failed',
          retry_count: c.retry_count + 1,
          processed_at: success ? new Date().toISOString() : c.processed_at,
          failure_reason: success ? undefined : c.failure_reason ?? '重试仍然失败',
        }
      : c,
  );
}
export async function addCompensation(
  callbackId: string,
  data: Omit<CompensationRecord, 'id' | 'callback_record_id' | 'executed_at' | 'executed_by_name'> & {
    executed_by_name?: string;
  },
): Promise<void> {
  const comp: CompensationRecord = {
    ...data,
    id: crypto.randomUUID(),
    callback_record_id: callbackId,
    executed_at: new Date().toISOString(),
  };
  cbData = cbData.map((c) =>
    c.id === callbackId
      ? { ...c, compensation_records: [comp, ...c.compensation_records] }
      : c,
  );
}
