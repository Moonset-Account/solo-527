import { pgTable, uuid, text, timestamp, integer, decimal, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	role: text('role').notNull().default('volunteer'),
	passwordHash: text('password_hash').notNull(),
	avatar: text('avatar'),
	createdAt: timestamp('created_at').defaultNow()
});

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	description: text('description'),
	coverImage: text('cover_image'),
	category: text('category'),
	startDate: timestamp('start_date').notNull(),
	endDate: timestamp('end_date').notNull(),
	status: text('status').notNull().default('draft'),
	managerId: uuid('manager_id').references(() => users.id),
	location: text('location'),
	targetHours: decimal('target_hours', { precision: 8, scale: 2 }),
	createdAt: timestamp('created_at').defaultNow()
});

export const shifts = pgTable('shifts', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id').references(() => projects.id).notNull(),
	name: text('name').notNull(),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	maxParticipants: integer('max_participants').default(50),
	location: text('location'),
	description: text('description'),
	requiresCheckin: boolean('requires_checkin').default(true),
	checkinRadius: integer('checkin_radius').default(100),
	createdAt: timestamp('created_at').defaultNow()
});

export const registrations = pgTable('registrations', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	shiftId: uuid('shift_id').references(() => shifts.id).notNull(),
	status: text('status').notNull().default('registered'),
	registeredAt: timestamp('registered_at').defaultNow(),
	canceledAt: timestamp('canceled_at'),
	notes: text('notes')
});

export const signinRecords = pgTable('signin_records', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	shiftId: uuid('shift_id').references(() => shifts.id).notNull(),
	signinTime: timestamp('signin_time').defaultNow(),
	signoutTime: timestamp('signout_time'),
	durationHours: decimal('duration_hours', { precision: 4, scale: 2 }),
	status: text('status').notNull().default('pending'),
	location: text('location'),
	verifiedBy: uuid('verified_by').references(() => users.id),
	createdAt: timestamp('created_at').defaultNow()
});

export const budgets = pgTable('budgets', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id').references(() => projects.id).notNull(),
	totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
	usedAmount: decimal('used_amount', { precision: 12, scale: 2 }).default('0'),
	currency: text('currency').default('CNY'),
	createdAt: timestamp('created_at').defaultNow()
});

export const budgetItems = pgTable('budget_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
	itemName: text('item_name').notNull(),
	amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
	category: text('category'),
	expenseDate: timestamp('expense_date'),
	recipient: text('recipient'),
	invoiceNo: text('invoice_no'),
	remark: text('remark'),
	createdAt: timestamp('created_at').defaultNow()
});

export const materials = pgTable('materials', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id').references(() => projects.id).notNull(),
	name: text('name').notNull(),
	initialQuantity: integer('initial_quantity').notNull(),
	currentQuantity: integer('current_quantity').notNull(),
	unit: text('unit'),
	category: text('category'),
	unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
	location: text('location'),
	createdAt: timestamp('created_at').defaultNow()
});

export const materialFlows = pgTable('material_flows', {
	id: uuid('id').primaryKey().defaultRandom(),
	materialId: uuid('material_id').references(() => materials.id).notNull(),
	type: text('type').notNull(),
	quantity: integer('quantity').notNull(),
	direction: text('direction').notNull(),
	flowTime: timestamp('flow_time').defaultNow(),
	handler: text('handler'),
	recipient: text('recipient'),
	remark: text('remark'),
	createdAt: timestamp('created_at').defaultNow()
});

export const photos = pgTable('photos', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id').references(() => projects.id).notNull(),
	uploadedBy: uuid('uploaded_by').references(() => users.id),
	url: text('url').notNull(),
	thumbnailUrl: text('thumbnail_url'),
	caption: text('caption'),
	category: text('category'),
	uploadedAt: timestamp('uploaded_at').defaultNow()
});

export const feedbacks = pgTable('feedbacks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	projectId: uuid('project_id').references(() => projects.id).notNull(),
	type: text('type').notNull().default('general'),
	content: text('content').notNull(),
	urgency: text('urgency').default('normal'),
	status: text('status').notNull().default('pending'),
	createdAt: timestamp('created_at').defaultNow()
});

export const feedbackProcessings = pgTable('feedback_processings', {
	id: uuid('id').primaryKey().defaultRandom(),
	feedbackId: uuid('feedback_id').references(() => feedbacks.id).notNull(),
	processorId: uuid('processor_id').references(() => users.id).notNull(),
	affectedParties: text('affected_parties').notNull(),
	responsiblePerson: text('responsible_person').notNull(),
	nextSteps: text('next_steps').notNull(),
	processingResult: text('processing_result'),
	status: text('status').default('processing'),
	processedAt: timestamp('processed_at').defaultNow()
});

export const operationLogs = pgTable('operation_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	action: text('action').notNull(),
	targetType: text('target_type'),
	targetId: uuid('target_id'),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	details: jsonb('details'),
	createdAt: timestamp('created_at').defaultNow()
});

export const exportTasks = pgTable('export_tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id).notNull(),
	exportType: text('export_type').notNull(),
	filters: jsonb('filters'),
	status: text('status').notNull().default('pending'),
	fileUrl: text('file_url'),
	fileName: text('file_name'),
	fileSize: integer('file_size'),
	progress: integer('progress').default(0),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at').defaultNow(),
	completedAt: timestamp('completed_at'),
	expiresAt: timestamp('expires_at')
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type SigninRecord = typeof signinRecords.$inferSelect;
export type NewSigninRecord = typeof signinRecords.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type NewBudgetItem = typeof budgetItems.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
export type MaterialFlow = typeof materialFlows.$inferSelect;
export type NewMaterialFlow = typeof materialFlows.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
export type FeedbackProcessing = typeof feedbackProcessings.$inferSelect;
export type NewFeedbackProcessing = typeof feedbackProcessings.$inferInsert;
export type OperationLog = typeof operationLogs.$inferSelect;
export type NewOperationLog = typeof operationLogs.$inferInsert;
export type ExportTask = typeof exportTasks.$inferSelect;
export type NewExportTask = typeof exportTasks.$inferInsert;
