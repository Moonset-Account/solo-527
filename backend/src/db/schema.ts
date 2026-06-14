import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  jsonb,
  uniqueIndex,
  index,
  foreignKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'equipment_supervisor', 'planner']);
export const workOrderStatusEnum = pgEnum('work_order_status', [
  'pending',
  'material_ready',
  'in_progress',
  'completed',
  'delayed',
  'cancelled',
]);
export const processStatusEnum = pgEnum('process_status', [
  'pending',
  'in_progress',
  'completed',
  'rework',
  'cancelled',
]);
export const materialStatusEnum = pgEnum('material_status', [
  'in_stock',
  'insufficient',
  'out_of_stock',
  'pending_arrival',
]);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);
export const timelineEventTypeEnum = pgEnum('timeline_event_type', [
  'work_order_created',
  'work_order_status_changed',
  'process_started',
  'process_completed',
  'process_rework',
  'material_allocated',
  'material_shortage',
  'alternative_material_used',
  'delivery_warning',
  'rework_timeout',
  'manual_note',
]);
export const actionLogTypeEnum = pgEnum('action_log_type', [
  'rework_timeout_approval',
  'rework_timeout_warning',
  'work_order_override',
  'material_override',
  'permission_change',
  'data_export',
]);
export const exportTypeEnum = pgEnum('export_type', [
  'work_orders',
  'materials',
  'timeline',
  'rework_records',
  'full_report',
]);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    realName: varchar('real_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull().default('planner'),
    department: varchar('department', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

export const workOrders = pgTable(
  'work_orders',
  {
    id: serial('id').primaryKey(),
    orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
    productName: varchar('product_name', { length: 200 }).notNull(),
    productCode: varchar('product_code', { length: 50 }),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 20 }).notNull().default('件'),
    status: workOrderStatusEnum('status').notNull().default('pending'),
    priority: integer('priority').notNull().default(5),
    plannedStartDate: timestamp('planned_start_date'),
    plannedEndDate: timestamp('planned_end_date'),
    actualStartDate: timestamp('actual_start_date'),
    actualEndDate: timestamp('actual_end_date'),
    deliveryDate: timestamp('delivery_date'),
    deliveryRisk: riskLevelEnum('delivery_risk').default('low'),
    customer: varchar('customer', { length: 200 }),
    remark: text('remark'),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orderNoIdx: uniqueIndex('work_orders_order_no_idx').on(table.orderNo),
    statusIdx: index('work_orders_status_idx').on(table.status),
    deliveryDateIdx: index('work_orders_delivery_date_idx').on(table.deliveryDate),
    createdByIdx: index('work_orders_created_by_idx').on(table.createdBy),
  })
);

export const processes = pgTable(
  'processes',
  {
    id: serial('id').primaryKey(),
    workOrderId: integer('work_order_id')
      .notNull()
      .references(() => workOrders.id, { onDelete: 'cascade' }),
    processName: varchar('process_name', { length: 200 }).notNull(),
    processCode: varchar('process_code', { length: 50 }),
    sequence: integer('sequence').notNull().default(1),
    status: processStatusEnum('status').notNull().default('pending'),
    plannedDurationHours: decimal('planned_duration_hours', { precision: 10, scale: 2 }),
    actualDurationHours: decimal('actual_duration_hours', { precision: 10, scale: 2 }),
    equipment: varchar('equipment', { length: 200 }),
    operator: varchar('operator', { length: 100 }),
    assignedTo: integer('assigned_to').references(() => users.id),
    plannedStartAt: timestamp('planned_start_at'),
    plannedEndAt: timestamp('planned_end_at'),
    actualStartAt: timestamp('actual_start_at'),
    actualEndAt: timestamp('actual_end_at'),
    reworkCount: integer('rework_count').notNull().default(0),
    maxReworkLimit: integer('max_rework_limit').notNull().default(2),
    reworkTimeoutAt: timestamp('rework_timeout_at'),
    remark: text('remark'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workOrderIdx: index('processes_work_order_idx').on(table.workOrderId),
    statusIdx: index('processes_status_idx').on(table.status),
    sequenceIdx: index('processes_sequence_idx').on(table.sequence),
  })
);

export const materials = pgTable(
  'materials',
  {
    id: serial('id').primaryKey(),
    materialCode: varchar('material_code', { length: 50 }).notNull().unique(),
    materialName: varchar('material_name', { length: 200 }).notNull(),
    specification: varchar('specification', { length: 500 }),
    unit: varchar('unit', { length: 20 }).notNull().default('件'),
    currentStock: integer('current_stock').notNull().default(0),
    reservedStock: integer('reserved_stock').notNull().default(0),
    safetyStock: integer('safety_stock').notNull().default(0),
    status: materialStatusEnum('status').notNull().default('in_stock'),
    supplier: varchar('supplier', { length: 200 }),
    leadTimeDays: integer('lead_time_days').default(7),
    latestDeliveryDate: timestamp('latest_delivery_date'),
    remark: text('remark'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex('materials_code_idx').on(table.materialCode),
    statusIdx: index('materials_status_idx').on(table.status),
  })
);

export const workOrderMaterials = pgTable(
  'work_order_materials',
  {
    id: serial('id').primaryKey(),
    workOrderId: integer('work_order_id')
      .notNull()
      .references(() => workOrders.id, { onDelete: 'cascade' }),
    materialId: integer('material_id')
      .notNull()
      .references(() => materials.id),
    requiredQuantity: integer('required_quantity').notNull(),
    allocatedQuantity: integer('allocated_quantity').notNull().default(0),
    usedAlternativeId: integer('used_alternative_id'),
    isKitted: boolean('is_kitted').notNull().default(false),
    shortageNote: text('shortage_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workOrderIdx: index('wo_materials_wo_idx').on(table.workOrderId),
    materialIdx: index('wo_materials_material_idx').on(table.materialId),
  })
);

export const alternativeMaterials = pgTable(
  'alternative_materials',
  {
    id: serial('id').primaryKey(),
    originalMaterialId: integer('original_material_id')
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),
    alternativeMaterialId: integer('alternative_material_id')
      .notNull()
      .references(() => materials.id),
    conversionRatio: decimal('conversion_ratio', { precision: 10, scale: 4 }).notNull().default('1.0000'),
    priority: integer('priority').notNull().default(1),
    isApproved: boolean('is_approved').notNull().default(true),
    approvedBy: integer('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    remark: text('remark'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    originalIdx: index('alt_materials_original_idx').on(table.originalMaterialId),
    alternativeIdx: index('alt_materials_alternative_idx').on(table.alternativeMaterialId),
  })
);

export const reworkRecords = pgTable(
  'rework_records',
  {
    id: serial('id').primaryKey(),
    processId: integer('process_id')
      .notNull()
      .references(() => processes.id, { onDelete: 'cascade' }),
    workOrderId: integer('work_order_id')
      .notNull()
      .references(() => workOrders.id, { onDelete: 'cascade' }),
    reworkReason: text('rework_reason').notNull(),
    reworkType: varchar('rework_type', { length: 100 }),
    reworkCount: integer('rework_count').notNull().default(1),
    reportedBy: integer('reported_by')
      .notNull()
      .references(() => users.id),
    reportedAt: timestamp('reported_at').notNull().defaultNow(),
    assignedTo: integer('assigned_to').references(() => users.id),
    deadlineAt: timestamp('deadline_at'),
    isTimeout: boolean('is_timeout').notNull().default(false),
    timeoutApprovedBy: integer('timeout_approved_by').references(() => users.id),
    timeoutApprovedAt: timestamp('timeout_approved_at'),
    timeoutApprovalNote: text('timeout_approval_note'),
    resolvedAt: timestamp('resolved_at'),
    resolvedBy: integer('resolved_by').references(() => users.id),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    processIdx: index('rework_process_idx').on(table.processId),
    workOrderIdx: index('rework_wo_idx').on(table.workOrderId),
    isTimeoutIdx: index('rework_is_timeout_idx').on(table.isTimeout),
  })
);

export const timelineEvents = pgTable(
  'timeline_events',
  {
    id: serial('id').primaryKey(),
    workOrderId: integer('work_order_id')
      .notNull()
      .references(() => workOrders.id, { onDelete: 'cascade' }),
    processId: integer('process_id').references(() => processes.id, { onDelete: 'cascade' }),
    reworkRecordId: integer('rework_record_id').references(() => reworkRecords.id),
    eventType: timelineEventTypeEnum('event_type').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata'),
    triggeredBy: integer('triggered_by').references(() => users.id),
    triggeredByName: varchar('triggered_by_name', { length: 100 }),
    eventAt: timestamp('event_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workOrderIdx: index('timeline_wo_idx').on(table.workOrderId),
    processIdx: index('timeline_process_idx').on(table.processId),
    eventAtIdx: index('timeline_event_at_idx').on(table.eventAt),
    eventTypeIdx: index('timeline_event_type_idx').on(table.eventType),
  })
);

export const actionLogs = pgTable(
  'action_logs',
  {
    id: serial('id').primaryKey(),
    logType: actionLogTypeEnum('log_type').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    detail: text('detail'),
    relatedWorkOrderId: integer('related_work_order_id').references(() => workOrders.id),
    relatedProcessId: integer('related_process_id').references(() => processes.id),
    relatedReworkId: integer('related_rework_id').references(() => reworkRecords.id),
    operatorId: integer('operator_id').references(() => users.id),
    operatorName: varchar('operator_name', { length: 100 }),
    ipAddress: varchar('ip_address', { length: 50 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    logTypeIdx: index('action_logs_type_idx').on(table.logType),
    operatorIdx: index('action_logs_operator_idx').on(table.operatorId),
    createdAtIdx: index('action_logs_created_at_idx').on(table.createdAt),
  })
);

export const exportRecords = pgTable(
  'export_records',
  {
    id: serial('id').primaryKey(),
    exportType: exportTypeEnum('export_type').notNull(),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileSize: integer('file_size'),
    fileUrl: varchar('file_url', { length: 1000 }),
    filterConditions: jsonb('filter_conditions'),
    recordCount: integer('record_count'),
    requestedBy: integer('requested_by')
      .notNull()
      .references(() => users.id),
    requestedByName: varchar('requested_by_name', { length: 100 }),
    requestedAt: timestamp('requested_at').notNull().defaultNow(),
    status: varchar('status', { length: 50 }).notNull().default('processing'),
    completedAt: timestamp('completed_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    exportTypeIdx: index('export_records_type_idx').on(table.exportType),
    requestedByIdx: index('export_records_requested_by_idx').on(table.requestedBy),
    createdAtIdx: index('export_records_created_at_idx').on(table.createdAt),
    statusIdx: index('export_records_status_idx').on(table.status),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  createdWorkOrders: many(workOrders, { relationName: 'createdByUser' }),
  assignedProcesses: many(processes),
  approvedAlternatives: many(alternativeMaterials),
  reportedReworks: many(reworkRecords, { relationName: 'reportedBy' }),
  assignedReworks: many(reworkRecords, { relationName: 'assignedTo' }),
  resolvedReworks: many(reworkRecords, { relationName: 'resolvedBy' }),
  timeoutApprovedReworks: many(reworkRecords, { relationName: 'timeoutApprovedBy' }),
  triggeredEvents: many(timelineEvents),
  actionLogs: many(actionLogs),
  exportRecords: many(exportRecords),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  createdByUser: one(users, { fields: [workOrders.createdBy], references: [users.id], relationName: 'createdByUser' }),
  processes: many(processes),
  workOrderMaterials: many(workOrderMaterials),
  reworkRecords: many(reworkRecords),
  timelineEvents: many(timelineEvents),
  actionLogs: many(actionLogs, { relationName: 'workOrderActionLogs' }),
}));

export const processesRelations = relations(processes, ({ one, many }) => ({
  workOrder: one(workOrders, { fields: [processes.workOrderId], references: [workOrders.id] }),
  assignedUser: one(users, { fields: [processes.assignedTo], references: [users.id] }),
  reworkRecords: many(reworkRecords),
  timelineEvents: many(timelineEvents),
  actionLogs: many(actionLogs, { relationName: 'processActionLogs' }),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  workOrderMaterials: many(workOrderMaterials),
  originalAlternatives: many(alternativeMaterials, { relationName: 'original' }),
  alternativeFor: many(alternativeMaterials, { relationName: 'alternative' }),
}));

export const workOrderMaterialsRelations = relations(workOrderMaterials, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderMaterials.workOrderId], references: [workOrders.id] }),
  material: one(materials, { fields: [workOrderMaterials.materialId], references: [materials.id] }),
}));

export const alternativeMaterialsRelations = relations(alternativeMaterials, ({ one }) => ({
  originalMaterial: one(materials, { fields: [alternativeMaterials.originalMaterialId], references: [materials.id], relationName: 'original' }),
  alternativeMaterial: one(materials, { fields: [alternativeMaterials.alternativeMaterialId], references: [materials.id], relationName: 'alternative' }),
  approvedByUser: one(users, { fields: [alternativeMaterials.approvedBy], references: [users.id] }),
}));

export const reworkRecordsRelations = relations(reworkRecords, ({ one }) => ({
  process: one(processes, { fields: [reworkRecords.processId], references: [processes.id] }),
  workOrder: one(workOrders, { fields: [reworkRecords.workOrderId], references: [workOrders.id] }),
  reportedByUser: one(users, { fields: [reworkRecords.reportedBy], references: [users.id], relationName: 'reportedBy' }),
  assignedToUser: one(users, { fields: [reworkRecords.assignedTo], references: [users.id], relationName: 'assignedTo' }),
  resolvedByUser: one(users, { fields: [reworkRecords.resolvedBy], references: [users.id], relationName: 'resolvedBy' }),
  timeoutApprovedByUser: one(users, { fields: [reworkRecords.timeoutApprovedBy], references: [users.id], relationName: 'timeoutApprovedBy' }),
  timelineEvents: one(timelineEvents, { fields: [reworkRecords.id], references: [timelineEvents.reworkRecordId] }),
  actionLogs: one(actionLogs, { fields: [reworkRecords.id], references: [actionLogs.relatedReworkId] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  workOrder: one(workOrders, { fields: [timelineEvents.workOrderId], references: [workOrders.id] }),
  process: one(processes, { fields: [timelineEvents.processId], references: [processes.id] }),
  reworkRecord: one(reworkRecords, { fields: [timelineEvents.reworkRecordId], references: [reworkRecords.id] }),
  triggeredByUser: one(users, { fields: [timelineEvents.triggeredBy], references: [users.id] }),
}));

export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  workOrder: one(workOrders, { fields: [actionLogs.relatedWorkOrderId], references: [workOrders.id], relationName: 'workOrderActionLogs' }),
  process: one(processes, { fields: [actionLogs.relatedProcessId], references: [processes.id], relationName: 'processActionLogs' }),
  rework: one(reworkRecords, { fields: [actionLogs.relatedReworkId], references: [reworkRecords.id] }),
  operator: one(users, { fields: [actionLogs.operatorId], references: [users.id] }),
}));

export const exportRecordsRelations = relations(exportRecords, ({ one }) => ({
  requestedByUser: one(users, { fields: [exportRecords.requestedBy], references: [users.id] }),
}));
