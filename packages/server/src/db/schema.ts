import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  species: varchar('species', { length: 50 }).notNull(),
  breed: varchar('breed', { length: 100 }),
  gender: varchar('gender', { length: 10 }),
  birthDate: date('birth_date'),
  weight: integer('weight'),
  ownerName: varchar('owner_name', { length: 100 }),
  ownerPhone: varchar('owner_phone', { length: 20 }),
  vaccineRecord: text('vaccine_record'),
  allergies: text('allergies'),
  specialNeeds: text('special_needs'),
  riskReason: varchar('risk_reason', { length: 200 }),
  riskLevel: varchar('risk_level', { length: 20 }).default('normal'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const fosteringRecords = pgTable('fostering_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: varchar('status', { length: 20 }).default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const healthRecords = pgTable('health_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  fosteringRecordId: uuid('fostering_record_id').references(() => fosteringRecords.id),
  recordType: varchar('record_type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  treatment: text('treatment'),
  temperature: varchar('temperature', { length: 20 }),
  heartRate: integer('heart_rate'),
  respiratoryRate: integer('respiratory_rate'),
  recordedBy: varchar('recorded_by', { length: 100 }),
  recordedAt: timestamp('recorded_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  fosteringRecordId: uuid('fostering_record_id').references(() => fosteringRecords.id),
  photoType: varchar('photo_type', { length: 50 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  thumbnail: varchar('thumbnail', { length: 500 }),
  description: text('description'),
  uploadedBy: varchar('uploaded_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const revisitPlans = pgTable('revisit_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  fosteringRecordId: uuid('fostering_record_id').references(() => fosteringRecords.id),
  planDate: date('plan_date').notNull(),
  planType: varchar('plan_type', { length: 50 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const volunteers = pgTable('volunteers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  skills: varchar('skills', { length: 500 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  volunteerId: uuid('volunteer_id').references(() => volunteers.id).notNull(),
  petId: uuid('pet_id').references(() => pets.id),
  fosteringRecordId: uuid('fostering_record_id').references(() => fosteringRecords.id),
  scheduleDate: date('schedule_date').notNull(),
  shiftType: varchar('shift_type', { length: 50 }),
  taskDescription: text('task_description'),
  riskReason: varchar('risk_reason', { length: 200 }),
  status: varchar('status', { length: 20 }).default('scheduled'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptNo: varchar('receipt_no', { length: 50 }).unique().notNull(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  fosteringRecordId: uuid('fostering_record_id').references(() => fosteringRecords.id),
  receiptType: varchar('receipt_type', { length: 50 }).notNull(),
  amount: integer('amount'),
  status: varchar('status', { length: 20 }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id').references(() => receipts.id).notNull(),
  fileName: varchar('file_name', { length: 200 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: integer('file_size'),
  url: varchar('url', { length: 500 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id').references(() => receipts.id).notNull(),
  content: text('content').notNull(),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const revisionHistory = pgTable('revision_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  changedBy: varchar('changed_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const callbacks = pgTable('callbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id').references(() => receipts.id),
  callbackType: varchar('callback_type', { length: 50 }).notNull(),
  callbackUrl: varchar('callback_url', { length: 500 }).notNull(),
  payload: jsonb('payload'),
  response: jsonb('response'),
  status: varchar('status', { length: 20 }).default('pending'),
  retryCount: integer('retry_count').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vaccineAllergies = pgTable('vaccine_allergies', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  date: date('date'),
  reaction: text('reaction'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const petsRelations = relations(pets, ({ many }) => ({
  fosteringRecords: many(fosteringRecords),
  healthRecords: many(healthRecords),
  photos: many(photos),
  revisitPlans: many(revisitPlans),
  schedules: many(schedules),
  receipts: many(receipts),
  vaccineAllergies: many(vaccineAllergies),
}));

export const fosteringRecordsRelations = relations(fosteringRecords, ({ one, many }) => ({
  pet: one(pets, { fields: [fosteringRecords.petId], references: [pets.id] }),
  healthRecords: many(healthRecords),
  photos: many(photos),
  revisitPlans: many(revisitPlans),
  schedules: many(schedules),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  pet: one(pets, { fields: [receipts.petId], references: [pets.id] }),
  fosteringRecord: one(fosteringRecords, {
    fields: [receipts.fosteringRecordId],
    references: [fosteringRecords.id],
  }),
  attachments: many(attachments),
  notes: many(notes),
  callbacks: many(callbacks),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  volunteer: one(volunteers, { fields: [schedules.volunteerId], references: [volunteers.id] }),
  pet: one(pets, { fields: [schedules.petId], references: [pets.id] }),
  fosteringRecord: one(fosteringRecords, {
    fields: [schedules.fosteringRecordId],
    references: [fosteringRecords.id],
  }),
}));

export const callbacksRelations = relations(callbacks, ({ one }) => ({
  receipt: one(receipts, { fields: [callbacks.receiptId], references: [receipts.id] }),
}));
