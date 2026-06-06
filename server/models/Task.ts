import mongoose, { Schema, Document } from 'mongoose'

export enum TaskType {
  MISSED_SORT = 'missed_sort',
  BIN_FULL = 'bin_full',
  POINT_DAMAGED = 'point_damaged'
}

export enum TaskStatus {
  SUBMITTED = 'submitted',
  CLAIMED = 'claimed',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export interface IPhoto {
  url: string
  uploadedAt: Date
  uploadedBy: mongoose.Types.ObjectId
  caption?: string
}

export interface IReviewRecord {
  reviewerId: mongoose.Types.ObjectId
  reviewerName: string
  result: 'pass' | 'fail'
  reason?: string
  photos: IPhoto[]
  reviewedAt: Date
}

export interface IHistoryRecord {
  status: TaskStatus
  changedBy: mongoose.Types.ObjectId
  changedByName: string
  changedAt: Date
  note?: string
}

export interface ITask extends Document {
  taskNumber: string
  type: TaskType
  pointId: mongoose.Types.ObjectId
  pointName: string
  community: string
  submitterId: mongoose.Types.ObjectId
  submitterName: string
  description: string
  beforePhotos: IPhoto[]
  afterPhotos: IPhoto[]
  status: TaskStatus
  propertyCompany: string
  assigneeId?: mongoose.Types.ObjectId
  assigneeName?: string
  deadline: Date
  isEscalated: boolean
  escalationReason?: string
  escalationTime?: Date
  reviewRecords: IReviewRecord[]
  history: IHistoryRecord[]
  rejectReason?: string
  createdAt: Date
  updatedAt: Date
}

const PhotoSchema: Schema = new Schema({
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  caption: { type: String }
})

const ReviewRecordSchema: Schema = new Schema({
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerName: { type: String, required: true },
  result: { type: String, enum: ['pass', 'fail'], required: true },
  reason: { type: String },
  photos: [PhotoSchema],
  reviewedAt: { type: Date, default: Date.now }
})

const HistoryRecordSchema: Schema = new Schema({
  status: { type: String, enum: Object.values(TaskStatus), required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedByName: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String }
})

const TaskSchema: Schema = new Schema({
  taskNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: Object.values(TaskType), required: true },
  pointId: { type: Schema.Types.ObjectId, ref: 'Point', required: true, index: true },
  pointName: { type: String, required: true },
  community: { type: String, required: true, index: true },
  submitterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submitterName: { type: String, required: true },
  description: { type: String, required: true },
  beforePhotos: [PhotoSchema],
  afterPhotos: [PhotoSchema],
  status: { 
    type: String, 
    enum: Object.values(TaskStatus), 
    default: TaskStatus.SUBMITTED,
    index: true
  },
  propertyCompany: { type: String, required: true, index: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  assigneeName: { type: String },
  deadline: { type: Date, required: true, index: true },
  isEscalated: { type: Boolean, default: false },
  escalationReason: { type: String },
  escalationTime: { type: Date },
  reviewRecords: [ReviewRecordSchema],
  history: [HistoryRecordSchema],
  rejectReason: { type: String }
}, {
  timestamps: true
})

TaskSchema.index({ status: 1, deadline: 1 })
TaskSchema.index({ community: 1, status: 1, createdAt: -1 })
TaskSchema.index({ propertyCompany: 1, status: 1 })

export default mongoose.model<ITask>('Task', TaskSchema)
