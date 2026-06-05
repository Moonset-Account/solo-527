import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
    passwordHash: text('password_hash'),
    role: text('role', { enum: ['admin', 'client'] }).notNull().default('admin'),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      emailUniqueIdx: uniqueIndex('idx_users_email').on(table.email),
    };
  }
);

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  address: text('address'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    })
      .notNull()
      .default('draft'),
    totalAmount: real('total_amount').notNull().default(0),
    internalCost: real('internal_cost').default(0),
    startDate: integer('start_date', { mode: 'timestamp_ms' }),
    endDate: integer('end_date', { mode: 'timestamp_ms' }),
    privateNotes: text('private_notes'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      clientNameUniqueIdx: uniqueIndex('idx_projects_client_name').on(
        table.clientId,
        table.name
      ),
      statusIdx: index('idx_projects_status').on(table.status),
    };
  }
);

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
    .notNull()
    .default('todo'),
  hourlyRate: real('hourly_rate').default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const timeEntries = sqliteTable(
  'time_entries',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
    endTime: integer('end_time', { mode: 'timestamp_ms' }),
    durationMinutes: integer('duration_minutes').notNull().default(0),
    description: text('description'),
    isBillable: integer('is_billable', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      projectIdx: index('idx_time_entries_project').on(table.projectId),
      userIdx: index('idx_time_entries_user').on(table.userId),
      dateIdx: index('idx_time_entries_start_time').on(table.startTime),
    };
  }
);

export const quotes = sqliteTable(
  'quotes',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    quoteNumber: text('quote_number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    totalAmount: real('total_amount').notNull().default(0),
    status: text('status', {
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    })
      .notNull()
      .default('draft'),
    version: integer('version').notNull().default(1),
    validUntil: integer('valid_until', { mode: 'timestamp_ms' }),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    acceptedAt: integer('accepted_at', { mode: 'timestamp_ms' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      quoteNumberUniqueIdx: uniqueIndex('idx_quotes_quote_number').on(
        table.quoteNumber
      ),
    };
  }
);

export const quoteItems = sqliteTable('quote_items', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  quoteId: text('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    quoteId: text('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    invoiceNumber: text('invoice_number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    totalAmount: real('total_amount').notNull().default(0),
    paidAmount: real('paid_amount').notNull().default(0),
    status: text('status', {
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    })
      .notNull()
      .default('draft'),
    dueDate: integer('due_date', { mode: 'timestamp_ms' }),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    paidAt: integer('paid_at', { mode: 'timestamp_ms' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      invoiceNumberUniqueIdx: uniqueIndex('idx_invoices_invoice_number').on(
        table.invoiceNumber
      ),
      dueDateIdx: index('idx_invoices_due_date').on(table.dueDate),
    };
  }
);

export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    paymentMethod: text('payment_method', {
      enum: ['cash', 'bank_transfer', 'credit_card', 'paypal', 'other'],
    }).notNull(),
    transactionId: text('transaction_id'),
    paymentDate: integer('payment_date', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    notes: text('notes'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      transactionIdUniqueIdx: uniqueIndex('idx_payments_transaction_id').on(
        table.transactionId
      ),
    };
  }
);

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'quote_sent',
        'quote_accepted',
        'quote_rejected',
        'invoice_sent',
        'payment_due',
        'payment_received',
        'project_status',
        'task_assigned',
        'import_completed',
        'export_completed',
        'system',
      ],
    }).notNull(),
    title: text('title').notNull(),
    content: text('content'),
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),
    status: text('status', {
      enum: ['pending', 'retrying', 'sent', 'failed', 'read'],
    })
      .notNull()
      .default('pending'),
    idempotencyKey: text('idempotency_key'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    nextRetryAt: integer('next_retry_at', { mode: 'timestamp_ms' }),
    sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
    errorMessage: text('error_message'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      idempotencyKeyUniqueIdx: uniqueIndex(
        'idx_notifications_idempotency_key'
      ).on(table.idempotencyKey),
      userIdx: index('idx_notifications_user').on(table.userId),
      statusIdx: index('idx_notifications_status').on(table.status),
    };
  }
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    action: text('action', {
      enum: ['create', 'update', 'delete', 'login', 'logout', 'download'],
    }).notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    changes: text('changes', { mode: 'json' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      entityIdx: index('idx_audit_logs_entity').on(table.entityType, table.entityId),
      userIdx: index('idx_audit_logs_user').on(table.userId),
    };
  }
);

export const importExportTasks = sqliteTable('import_export_tasks', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  type: text('type', { enum: ['import', 'export'] }).notNull(),
  entity: text('entity').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
  filePath: text('file_path'),
  fileFormat: text('file_format').notNull().default('csv'),
  resultSummary: text('result_summary', { mode: 'json' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
});

export const accounts = sqliteTable('accounts', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = sqliteTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  projects: many(projects, { relationName: 'createdBy' }),
  timeEntries: many(timeEntries),
  attachments: many(attachments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  quotes: many(quotes),
  invoices: many(invoices),
  attachments: many(attachments),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id],
  }),
  items: many(quoteItems),
  invoice: one(invoices, {
    fields: [quotes.id],
    references: [invoices.quoteId],
  }),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  quote: one(quotes, {
    fields: [invoices.quoteId],
    references: [quotes.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  project: one(projects, {
    fields: [attachments.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
