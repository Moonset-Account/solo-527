import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  date,
  time,
  pgEnum,
  foreignKey,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['audience', 'admin', 'box_office']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'verified', 'cancelled', 'refunded']);
export const ticketStatusEnum = pgEnum('ticket_status', ['available', 'held', 'sold', 'refunded', 'scanned']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const refundStatusEnum = pgEnum('refund_status', ['pending', 'reviewing', 'approved', 'rejected', 'completed', 'abnormal']);
export const seatZoneTypeEnum = pgEnum('seat_zone_type', ['vip', 'premium', 'standard', 'economy', 'standing']);
export const notificationTypeEnum = pgEnum('notification_type', ['refund_abnormal', 'inventory_warning', 'verification_alert', 'order_anomaly']);
export const notificationStatusEnum = pgEnum('notification_status', ['unread', 'read', 'resolved']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  role: roleEnum('role').default('audience').notNull(),
  avatar: text('avatar'),
  realName: varchar('real_name', { length: 100 }),
  idCardNumber: varchar('id_card_number', { length: 30 }),
  gender: genderEnum('gender'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const concerts = pgTable('concerts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  artist: varchar('artist', { length: 200 }).notNull(),
  description: text('description'),
  posterUrl: text('poster_url'),
  genre: varchar('genre', { length: 100 }),
  organizer: varchar('organizer', { length: 200 }),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const venues = pgTable('venues', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  capacity: integer('capacity').notNull(),
  seatingChart: jsonb('seating_chart'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shows = pgTable('shows', {
  id: serial('id').primaryKey(),
  concertId: integer('concert_id').references(() => concerts.id).notNull(),
  venueId: integer('venue_id').references(() => venues.id).notNull(),
  showDate: date('show_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  doorsOpenTime: time('doors_open_time'),
  salesStartAt: timestamp('sales_start_at').notNull(),
  salesEndAt: timestamp('sales_end_at').notNull(),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const seatZones = pgTable('seat_zones', {
  id: serial('id').primaryKey(),
  showId: integer('show_id').references(() => shows.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  zoneType: seatZoneTypeEnum('zone_type').default('standard').notNull(),
  color: varchar('color', { length: 20 }),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  rows: integer('rows').notNull(),
  seatsPerRow: integer('seats_per_row').notNull(),
  totalSeats: integer('total_seats').notNull(),
  soldSeats: integer('sold_seats').default(0).notNull(),
  availableSeats: integer('available_seats').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const seats = pgTable('seats', {
  id: serial('id').primaryKey(),
  showId: integer('show_id').references(() => shows.id).notNull(),
  zoneId: integer('zone_id').references(() => seatZones.id).notNull(),
  rowNumber: integer('row_number').notNull(),
  seatNumber: integer('seat_number').notNull(),
  seatLabel: varchar('seat_label', { length: 20 }).notNull(),
  status: ticketStatusEnum('status').default('available').notNull(),
  lockExpiresAt: timestamp('lock_expires_at'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  orderItemId: integer('order_item_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketTypes = pgTable('ticket_types', {
  id: serial('id').primaryKey(),
  showId: integer('show_id').references(() => shows.id).notNull(),
  zoneId: integer('zone_id').references(() => seatZones.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  originalStock: integer('original_stock').default(0).notNull(),
  remainingStock: integer('remaining_stock').default(0).notNull(),
  heldStock: integer('held_stock').default(0).notNull(),
  soldCount: integer('sold_count').default(0).notNull(),
  refundedCount: integer('refunded_count').default(0).notNull(),
  maxPerOrder: integer('max_per_order').default(4).notNull(),
  requireRealName: boolean('require_real_name').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  salesStartAt: timestamp('sales_start_at'),
  salesEndAt: timestamp('sales_end_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: varchar('order_no', { length: 50 }).unique().notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  showId: integer('show_id').references(() => shows.id).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  payAmount: numeric('pay_amount', { precision: 12, scale: 2 }).notNull(),
  ticketCount: integer('ticket_count').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paidAt: timestamp('paid_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancelledReason: text('cancelled_reason'),
  verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
  verificationNote: text('verification_note'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: integer('verified_by').references(() => users.id),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  ticketTypeId: integer('ticket_type_id').references(() => ticketTypes.id),
  seatId: integer('seat_id').references(() => seats.id),
  ticketHolderName: varchar('ticket_holder_name', { length: 100 }),
  ticketHolderIdCard: varchar('ticket_holder_id_card', { length: 30 }),
  ticketHolderPhone: varchar('ticket_holder_phone', { length: 20 }),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  ticketNo: varchar('ticket_no', { length: 50 }).unique(),
  ticketStatus: ticketStatusEnum('ticket_status').default('sold').notNull(),
  scannedAt: timestamp('scanned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  realName: varchar('real_name', { length: 100 }).notNull(),
  idCardNumber: varchar('id_card_number', { length: 30 }).notNull(),
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 20 }),
  idCardFront: text('id_card_front'),
  idCardBack: text('id_card_back'),
  idCardHolding: text('id_card_holding'),
  status: verificationStatusEnum('status').default('pending').notNull(),
  reason: text('reason'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  refundNo: varchar('refund_no', { length: 50 }).unique().notNull(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  orderItemId: integer('order_item_id').references(() => orderItems.id),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }).notNull(),
  serviceFee: numeric('service_fee', { precision: 10, scale: 2 }).default('0'),
  actualRefundAmount: numeric('actual_refund_amount', { precision: 12, scale: 2 }).notNull(),
  refundReason: text('refund_reason').notNull(),
  refundType: varchar('refund_type', { length: 50 }).default('partial').notNull(),
  status: refundStatusEnum('status').default('pending').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNote: text('review_note'),
  approvedAt: timestamp('approved_at'),
  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
  isAbnormal: boolean('is_abnormal').default(false).notNull(),
  abnormalReason: text('abnormal_reason'),
  paymentRefundId: varchar('payment_refund_id', { length: 100 }),
  bankCard: varchar('bank_card', { length: 50 }),
  accountHolder: varchar('account_holder', { length: 100 }),
  bankName: varchar('bank_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  field: varchar('field', { length: 100 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  changedBy: integer('changed_by').references(() => users.id),
  changedByName: varchar('changed_by_name', { length: 100 }),
  changeNote: text('change_note'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: integer('file_size'),
  fileUrl: text('file_url').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id').notNull(),
  content: text('content').notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdByName: varchar('created_by_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  orderItemId: integer('order_item_id').references(() => orderItems.id).notNull(),
  seatId: integer('seat_id').references(() => seats.id),
  userId: integer('user_id').references(() => users.id),
  showId: integer('show_id').references(() => shows.id).notNull(),
  scanCode: varchar('scan_code', { length: 100 }),
  scanType: varchar('scan_type', { length: 50 }).default('entry').notNull(),
  scannedBy: integer('scanned_by').references(() => users.id),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  hasAttended: boolean('has_attended').default(true).notNull(),
  feedbackScore: integer('feedback_score'),
  feedbackComment: text('feedback_comment'),
  feedbackSubmittedAt: timestamp('feedback_submitted_at'),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  status: notificationStatusEnum('status').default('unread').notNull(),
  priority: integer('priority').default(1),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  readBy: integer('read_by').references(() => users.id),
  readAt: timestamp('read_at'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolutionNote: text('resolution_note'),
});

export const participationStats = pgTable('participation_stats', {
  id: serial('id').primaryKey(),
  showId: integer('show_id').references(() => shows.id).notNull(),
  date: date('date').default(sql`CURRENT_DATE`).notNull(),
  totalTickets: integer('total_tickets').default(0).notNull(),
  soldTickets: integer('sold_tickets').default(0).notNull(),
  scannedTickets: integer('scanned_tickets').default(0).notNull(),
  refundedTickets: integer('refunded_tickets').default(0).notNull(),
  attendanceRate: numeric('attendance_rate', { precision: 5, scale: 2 }),
  revenue: numeric('revenue', { precision: 14, scale: 2 }).default('0').notNull(),
  refundAmount: numeric('refund_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  netRevenue: numeric('net_revenue', { precision: 14, scale: 2 }).default('0').notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const seatRelations = relations(seats, ({ one }) => ({
  show: one(shows, { fields: [seats.showId], references: [shows.id] }),
  zone: one(seatZones, { fields: [seats.zoneId], references: [seatZones.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  show: one(shows, { fields: [orders.showId], references: [shows.id] }),
  items: many(orderItems),
  refunds: many(refunds),
  verifications: many(verifications),
}));

export const showRelations = relations(shows, ({ one, many }) => ({
  concert: one(concerts, { fields: [shows.concertId], references: [concerts.id] }),
  venue: one(venues, { fields: [shows.venueId], references: [venues.id] }),
  zones: many(seatZones),
  seats: many(seats),
  orders: many(orders),
  stats: many(participationStats),
  attendances: many(attendances),
}));

export const refundRelations = relations(refunds, ({ one }) => ({
  order: one(orders, { fields: [refunds.orderId], references: [orders.id] }),
  user: one(users, { fields: [refunds.userId], references: [users.id] }),
}));
