import { createClient } from '../supabase/server';
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
  QualityItem,
  AffectedObject,
  WorkOrderStatus,
  ChangeStatus,
  OverallResult,
} from '../types';

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

type SupabaseQueryBuilder = ReturnType<ReturnType<typeof createClient>['from']>;

function applyFilters(
  qb: any,
  opts: ListOptions & { dateField?: string; dateFrom?: string; dateTo?: string } = {},
) {
  let q = qb;
  if (opts.filters) {
    for (const [k, v] of Object.entries(opts.filters)) {
      if (v === undefined || v === null || v === 'all' || v === '') continue;
      q = q.eq(k, v);
    }
  }
  if (opts.search && opts.searchFields && opts.search.trim()) {
    const kw = `%${opts.search.toLowerCase()}%`;
    const orParts = opts.searchFields.map((f) => `${f}.ilike.${kw}`);
    q = q.or(orParts.join(','));
  }
  if (opts.dateField && opts.dateFrom) {
    q = q.gte(opts.dateField, opts.dateFrom);
  }
  if (opts.dateField && opts.dateTo) {
    q = q.lte(opts.dateField, opts.dateTo);
  }
  if (opts.orderBy) {
    q = q.order(opts.orderBy.field, { ascending: opts.orderBy.dir !== 'desc' });
  }
  if (opts.limit) {
    q = q.limit(opts.limit);
  }
  return q;
}

function throwIfError(result: { error: any }) {
  if (result.error) throw result.error;
}

/* =============== USERS/PROFILES =============== */
export async function listUsers(opts: ListOptions = {}): Promise<UserProfile[]> {
  const supabase = createClient();
  let q = supabase.from('profiles').select('*');
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  return (data ?? []) as UserProfile[];
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  throwIfError({ error });
  return (data ?? null) as UserProfile | null;
}

/* =============== VEHICLES =============== */
export async function listVehicles(opts: ListOptions = {}): Promise<Vehicle[]> {
  const supabase = createClient();
  let q = supabase.from('vehicles').select('*');
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  return (data ?? []) as Vehicle[];
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
  throwIfError({ error });
  return (data ?? null) as Vehicle | null;
}

export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'created_at' | 'created_by'> & { created_by?: string },
): Promise<Vehicle> {
  const supabase = createClient();
  const { error: insError } = await supabase.from('vehicles').insert(data);
  throwIfError({ error: insError });
  const { data: created, error: selError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('plate_number', data.plate_number)
    .maybeSingle();
  throwIfError({ error: selError });
  return created as Vehicle;
}

/* =============== PARTS =============== */
export async function listParts(opts: ListOptions = {}): Promise<Part[]> {
  const supabase = createClient();
  let q = supabase.from('parts').select('*');
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  return (data ?? []) as Part[];
}

export async function getPartById(id: string): Promise<Part | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('parts').select('*').eq('id', id).maybeSingle();
  throwIfError({ error });
  return (data ?? null) as Part | null;
}

export async function createPart(data: Omit<Part, 'id' | 'created_at'>): Promise<Part> {
  const supabase = createClient();
  const { error: insError } = await supabase.from('parts').insert(data);
  throwIfError({ error: insError });
  const { data: created, error: selError } = await supabase
    .from('parts')
    .select('*')
    .eq('part_code', data.part_code)
    .maybeSingle();
  throwIfError({ error: selError });
  return created as Part;
}

/* =============== PART TURNOVERS =============== */
export async function listPartTurnovers(
  opts: DateRangeOptions = {},
): Promise<PartTurnover[]> {
  const supabase = createClient();
  let q = supabase.from('part_turnovers').select(
    '*, parts(name), work_orders(title), profiles!operator_id(full_name)',
  );
  q = applyFilters(q, { ...opts, dateField: 'created_at' });
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    id: r.id,
    part_id: r.part_id,
    part_name: r.parts?.name,
    type: r.type,
    quantity: r.quantity,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    operator_id: r.operator_id,
    operator_name: r.profiles?.full_name,
    remark: r.remark,
    created_at: r.created_at,
  })) as PartTurnover[];
}

export async function createPartTurnover(
  data: Omit<
    PartTurnover,
    'id' | 'created_at' | 'operator_id' | 'operator_name' | 'part_name' | 'workorder_title'
  > & {
    operator_id: string;
    operator_name?: string;
  },
): Promise<PartTurnover> {
  const supabase = createClient();
  const insertData: any = {
    part_id: data.part_id,
    type: data.type,
    quantity: data.quantity,
    workorder_id: data.workorder_id ?? null,
    operator_id: data.operator_id,
    remark: data.remark ?? null,
  };
  const { data: inserted, error: insError } = await supabase
    .from('part_turnovers')
    .insert(insertData)
    .select()
    .maybeSingle();
  throwIfError({ error: insError });
  const { data: full, error: selError } = await supabase
    .from('part_turnovers')
    .select('*, parts(name), work_orders(title), profiles!operator_id(full_name)')
    .eq('id', inserted.id)
    .maybeSingle();
  throwIfError({ error: selError });
  const r = full as any;
  return {
    id: r.id,
    part_id: r.part_id,
    part_name: r.parts?.name,
    type: r.type,
    quantity: r.quantity,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    operator_id: r.operator_id,
    operator_name: r.profiles?.full_name,
    remark: r.remark,
    created_at: r.created_at,
  } as PartTurnover;
}

/* =============== WORK ORDERS =============== */
function mapWorkOrder(r: any): WorkOrder {
  return {
    id: r.id,
    vehicle_id: r.vehicle_id,
    vehicle_plate: r.vehicles?.plate_number,
    vehicle_brand: r.vehicles?.brand,
    vehicle_model: r.vehicles?.model,
    title: r.title,
    description: r.description,
    status: r.status,
    team_id: r.team_id,
    team_name: r.team_profiles?.full_name,
    assignee_id: r.assignee_id,
    assignee_name: r.assignee_profiles?.full_name,
    created_at: r.created_at,
    completed_at: r.completed_at,
  } as WorkOrder;
}

export async function listWorkOrders(opts: ListOptions = {}): Promise<WorkOrder[]> {
  const supabase = createClient();
  let q = supabase.from('work_orders').select(
    '*, vehicles(plate_number, brand, model), team_profiles:profiles!work_orders_team_id_fkey(full_name), assignee_profiles:profiles!work_orders_assignee_id_fkey(full_name)',
  );
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapWorkOrder);
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('work_orders')
    .select(
      '*, vehicles(plate_number, brand, model), team_profiles:profiles!work_orders_team_id_fkey(full_name), assignee_profiles:profiles!work_orders_assignee_id_fkey(full_name)',
    )
    .eq('id', id)
    .maybeSingle();
  throwIfError({ error });
  return data ? mapWorkOrder(data) : null;
}

export async function createWorkOrder(
  data: Omit<WorkOrder, 'id' | 'created_at' | 'status'> & { status?: WorkOrderStatus },
): Promise<WorkOrder> {
  const supabase = createClient();
  const insertData: any = {
    vehicle_id: data.vehicle_id,
    title: data.title,
    description: data.description,
    status: data.status ?? 'pending',
    team_id: data.team_id ?? null,
    assignee_id: data.assignee_id ?? null,
  };
  const { data: inserted, error: insError } = await supabase
    .from('work_orders')
    .insert(insertData)
    .select()
    .maybeSingle();
  throwIfError({ error: insError });
  return getWorkOrderById(inserted.id) as Promise<WorkOrder>;
}

export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrderStatus,
): Promise<void> {
  const supabase = createClient();
  const patch: any = { status };
  if (status === 'completed') {
    patch.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('work_orders').update(patch).eq('id', id);
  throwIfError({ error });
}

/* =============== PRODUCTION NODES =============== */
function mapProductionNode(r: any): ProductionNode {
  return {
    id: r.id,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    node_name: r.node_name,
    sequence: r.sequence,
    status: r.status,
    started_at: r.started_at,
    completed_at: r.completed_at,
    operator_id: r.operator_id,
    operator_name: r.profiles?.full_name,
  } as ProductionNode;
}

export async function listProductionNodes(
  opts: ListOptions = {},
): Promise<ProductionNode[]> {
  const supabase = createClient();
  let q = supabase.from('production_nodes').select(
    '*, work_orders(title), profiles!operator_id(full_name)',
  );
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapProductionNode);
}

export async function createProductionNodes(
  items: Omit<ProductionNode, 'id' | 'workorder_title' | 'operator_name'>[],
): Promise<ProductionNode[]> {
  const supabase = createClient();
  const insertData = items.map((n) => ({
    workorder_id: n.workorder_id,
    node_name: n.node_name,
    sequence: n.sequence,
    status: n.status ?? 'pending',
    started_at: n.started_at ?? null,
    completed_at: n.completed_at ?? null,
    operator_id: n.operator_id ?? null,
  }));
  const { data: inserted, error: insError } = await supabase
    .from('production_nodes')
    .insert(insertData)
    .select();
  throwIfError({ error: insError });
  const ids = (inserted ?? []).map((r: any) => r.id);
  const { data: full, error: selError } = await supabase
    .from('production_nodes')
    .select('*, work_orders(title), profiles!operator_id(full_name)')
    .in('id', ids);
  throwIfError({ error: selError });
  return (full ?? []).map(mapProductionNode);
}

export async function updateProductionNode(
  id: string,
  patch: Partial<ProductionNode>,
): Promise<void> {
  const supabase = createClient();
  const updateData: any = {};
  if ('workorder_id' in patch) updateData.workorder_id = patch.workorder_id;
  if ('node_name' in patch) updateData.node_name = patch.node_name;
  if ('sequence' in patch) updateData.sequence = patch.sequence;
  if ('status' in patch) updateData.status = patch.status;
  if ('started_at' in patch) updateData.started_at = patch.started_at ?? null;
  if ('completed_at' in patch) updateData.completed_at = patch.completed_at ?? null;
  if ('operator_id' in patch) updateData.operator_id = patch.operator_id ?? null;
  const { error } = await supabase.from('production_nodes').update(updateData).eq('id', id);
  throwIfError({ error });
}

export async function bulkUpdateProductionNodes(
  ids: string[],
  patch: Partial<ProductionNode>,
): Promise<void> {
  const supabase = createClient();
  const updateData: any = {};
  if ('workorder_id' in patch) updateData.workorder_id = patch.workorder_id;
  if ('node_name' in patch) updateData.node_name = patch.node_name;
  if ('sequence' in patch) updateData.sequence = patch.sequence;
  if ('status' in patch) updateData.status = patch.status;
  if ('started_at' in patch) updateData.started_at = patch.started_at ?? null;
  if ('completed_at' in patch) updateData.completed_at = patch.completed_at ?? null;
  if ('operator_id' in patch) updateData.operator_id = patch.operator_id ?? null;
  const { error } = await supabase.from('production_nodes').update(updateData).in('id', ids);
  throwIfError({ error });
}

/* =============== TEAM SCHEDULES =============== */
function mapTeamSchedule(r: any): TeamSchedule {
  return {
    id: r.id,
    team_id: r.team_id,
    team_name: r.team_profile?.full_name,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    start_time: r.start_time,
    end_time: r.end_time,
    assignee_ids: r.assignee_ids ?? [],
    assignee_names: r.assignee_profiles?.map((p: any) => p.full_name) ?? [],
    created_at: r.created_at,
  } as TeamSchedule;
}

export async function listTeamSchedules(
  opts: DateRangeOptions = {},
): Promise<TeamSchedule[]> {
  const supabase = createClient();
  let q = supabase.from('team_schedules').select(
    '*, team_profile:profiles!team_schedules_team_id_fkey(full_name), work_orders(title), assignee_profiles:profiles(full_name)',
  );
  q = applyFilters(q, { ...opts, dateField: 'start_time' });
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapTeamSchedule);
}

export async function createTeamSchedule(
  data: Omit<
    TeamSchedule,
    'id' | 'created_at' | 'team_name' | 'workorder_title' | 'assignee_names'
  >,
): Promise<TeamSchedule> {
  const supabase = createClient();
  const insertData: any = {
    team_id: data.team_id,
    workorder_id: data.workorder_id,
    start_time: data.start_time,
    end_time: data.end_time,
    assignee_ids: data.assignee_ids ?? [],
  };
  const { data: inserted, error: insError } = await supabase
    .from('team_schedules')
    .insert(insertData)
    .select()
    .maybeSingle();
  throwIfError({ error: insError });
  const { data: full, error: selError } = await supabase
    .from('team_schedules')
    .select(
      '*, team_profile:profiles!team_schedules_team_id_fkey(full_name), work_orders(title), assignee_profiles:profiles(full_name)',
    )
    .eq('id', inserted.id)
    .maybeSingle();
  throwIfError({ error: selError });
  return mapTeamSchedule(full);
}

/* =============== QUALITY =============== */
function mapQualityInspection(r: any): QualityInspection {
  return {
    id: r.id,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    inspector_id: r.inspector_id,
    inspector_name: r.profiles?.full_name,
    items: r.items as QualityItem[],
    overall_result: r.overall_result as OverallResult,
    remark: r.remark,
    created_at: r.created_at,
  } as QualityInspection;
}

export async function listQualityInspections(
  opts: ListOptions = {},
): Promise<QualityInspection[]> {
  const supabase = createClient();
  let q = supabase.from('quality_inspections').select(
    '*, work_orders(title), profiles!inspector_id(full_name)',
  );
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapQualityInspection);
}

export async function createQualityInspection(
  data: Omit<
    QualityInspection,
    'id' | 'created_at' | 'inspector_name' | 'workorder_title'
  >,
): Promise<QualityInspection> {
  const supabase = createClient();
  const insertData: any = {
    workorder_id: data.workorder_id,
    inspector_id: data.inspector_id,
    items: data.items,
    overall_result: data.overall_result,
    remark: data.remark ?? null,
  };
  const { data: inserted, error: insError } = await supabase
    .from('quality_inspections')
    .insert(insertData)
    .select()
    .maybeSingle();
  throwIfError({ error: insError });
  if (data.overall_result === 'pass') {
    await updateWorkOrderStatus(data.workorder_id, 'completed');
  } else {
    await updateWorkOrderStatus(data.workorder_id, 'in_progress');
  }
  const { data: full, error: selError } = await supabase
    .from('quality_inspections')
    .select('*, work_orders(title), profiles!inspector_id(full_name)')
    .eq('id', inserted.id)
    .maybeSingle();
  throwIfError({ error: selError });
  return mapQualityInspection(full);
}

/* =============== ORDER CHANGES =============== */
function mapOrderChange(r: any): OrderChange {
  return {
    id: r.id,
    workorder_id: r.workorder_id,
    workorder_title: r.work_orders?.title,
    change_type: r.change_type,
    content: r.content,
    affected_objects: r.affected_objects as AffectedObject[],
    responsible_id: r.responsible_id,
    responsible_name: r.responsible_profile?.full_name,
    status: r.status as ChangeStatus,
    close_note: r.close_note,
    closed_at: r.closed_at,
    created_by: r.created_by,
    created_by_name: r.creator_profile?.full_name,
    created_at: r.created_at,
  } as OrderChange;
}

export async function listOrderChanges(opts: ListOptions = {}): Promise<OrderChange[]> {
  const supabase = createClient();
  let q = supabase.from('order_changes').select(
    '*, work_orders(title), responsible_profile:profiles!order_changes_responsible_id_fkey(full_name), creator_profile:profiles!order_changes_created_by_fkey(full_name)',
  );
  q = applyFilters(q, opts);
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapOrderChange);
}

export async function createOrderChange(
  data: Omit<
    OrderChange,
    'id' | 'created_at' | 'created_by' | 'created_by_name' | 'responsible_name' | 'workorder_title' | 'status'
  > & {
    created_by: string;
    status?: ChangeStatus;
  },
): Promise<OrderChange> {
  const supabase = createClient();
  const insertData: any = {
    workorder_id: data.workorder_id ?? null,
    change_type: data.change_type,
    content: data.content,
    affected_objects: data.affected_objects,
    responsible_id: data.responsible_id,
    status: data.status ?? 'open',
    created_by: data.created_by,
  };
  const { data: inserted, error: insError } = await supabase
    .from('order_changes')
    .insert(insertData)
    .select()
    .maybeSingle();
  throwIfError({ error: insError });
  const { data: full, error: selError } = await supabase
    .from('order_changes')
    .select(
      '*, work_orders(title), responsible_profile:profiles!order_changes_responsible_id_fkey(full_name), creator_profile:profiles!order_changes_created_by_fkey(full_name)',
    )
    .eq('id', inserted.id)
    .maybeSingle();
  throwIfError({ error: selError });
  return mapOrderChange(full);
}

export async function updateOrderChangeStatus(
  id: string,
  status: ChangeStatus,
  close_note?: string,
): Promise<void> {
  const supabase = createClient();
  const patch: any = { status };
  if (close_note !== undefined) {
    patch.close_note = close_note;
  }
  if (status === 'closed') {
    patch.closed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('order_changes').update(patch).eq('id', id);
  throwIfError({ error });
}

/* =============== CALLBACKS =============== */
function mapCompensationRecord(r: any): CompensationRecord {
  return {
    id: r.id,
    callback_record_id: r.callback_record_id,
    action: r.action,
    executed_by: r.executed_by,
    executed_by_name: r.profiles?.full_name,
    executed_at: r.executed_at,
    result: r.result,
    remark: r.remark,
  } as CompensationRecord;
}

function mapCallbackRecord(r: any): CallbackRecord {
  return {
    id: r.id,
    source: r.source,
    event_type: r.event_type,
    payload: r.payload as Record<string, unknown>,
    status: r.status,
    failure_reason: r.failure_reason,
    retry_count: r.retry_count,
    compensation_records: (r.compensation_records ?? []).map(mapCompensationRecord),
    created_at: r.created_at,
    processed_at: r.processed_at,
  } as CallbackRecord;
}

export async function listCallbacks(
  opts: DateRangeOptions = {},
): Promise<CallbackRecord[]> {
  const supabase = createClient();
  let q = supabase.from('callback_records').select(
    '*, compensation_records(*, profiles(full_name))',
  );
  q = applyFilters(q, { ...opts, dateField: 'created_at' });
  const { data, error } = await q;
  throwIfError({ error });
  const rows = (data ?? []) as any[];
  return rows.map(mapCallbackRecord);
}

export async function retryCallback(id: string, success: boolean): Promise<void> {
  const supabase = createClient();
  const { data: existing, error: selError } = await supabase
    .from('callback_records')
    .select('retry_count, failure_reason, processed_at')
    .eq('id', id)
    .maybeSingle();
  throwIfError({ error: selError });
  const patch: any = {
    status: success ? 'success' : 'failed',
    retry_count: (existing?.retry_count ?? 0) + 1,
  };
  if (success) {
    patch.processed_at = new Date().toISOString();
  } else {
    patch.failure_reason = existing?.failure_reason ?? '重试仍然失败';
  }
  const { error } = await supabase.from('callback_records').update(patch).eq('id', id);
  throwIfError({ error });
}

export async function addCompensation(
  callbackId: string,
  data: Omit<
    CompensationRecord,
    'id' | 'callback_record_id' | 'executed_at' | 'executed_by_name'
  > & {
    executed_by_name?: string;
  },
): Promise<void> {
  const supabase = createClient();
  const insertData: any = {
    callback_record_id: callbackId,
    action: data.action,
    executed_by: data.executed_by,
    result: data.result,
    remark: data.remark ?? null,
  };
  const { error } = await supabase.from('compensation_records').insert(insertData);
  throwIfError({ error });
}
