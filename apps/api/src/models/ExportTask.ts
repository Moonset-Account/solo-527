import mongoose, { Schema, Document } from 'mongoose';
import type { ExportTask, ExportTaskStatus } from '@seat-platform/shared';

export type IExportTaskDocument = Document<unknown, unknown, Omit<ExportTask, 'id'>> &
  Omit<ExportTask, 'id'> & { _id: string };

const ExportTaskSchema = new Schema<IExportTaskDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['seats', 'usage', 'reminders', 'payments', 'audit_logs', 'operations'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'] as const satisfies readonly ExportTaskStatus[],
      required: true,
      default: 'pending',
      index: true,
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    totalRows: { type: Number, required: true, default: 0 },
    exportedRows: { type: Number, required: true, default: 0 },
    filePath: { type: String },
    fileSize: { type: Number },
    errorMessage: { type: String },
    createdBy: { type: String, required: true, index: true },
    createdAt: { type: String, required: true },
    startedAt: { type: String },
    completedAt: { type: String },
    expiredAt: { type: String, required: true, index: true },
  },
  {
    collection: 'export_tasks',
    toJSON: {
      transform: (_doc, ret) => {
        const r = ret as Record<string, unknown>;
        r.id = r._id;
        delete r._id;
        delete r.__v;
      },
    },
  }
);

ExportTaskSchema.index({ createdBy: 1, createdAt: -1 });
ExportTaskSchema.index({ status: 1, createdAt: -1 });
ExportTaskSchema.index({ createdAt: -1 });

export const ExportTaskModel = mongoose.model<IExportTaskDocument>('ExportTask', ExportTaskSchema);
