export const COLLECTIONS = {
  USERS: 'users',
  PLOTS: 'plots',
  CLAIMS: 'claims',
  CROPS: 'crops',
  ROTATIONS: 'rotations',
  TOOLS: 'tools',
  TOOL_BORROWS: 'toolBorrows',
  ANNOUNCEMENTS: 'announcements',
  HARVESTS: 'harvests',
  PHOTO_LOGS: 'photoLogs',
  NOTIFICATIONS: 'notifications'
}

export const ROLES = {
  ADMIN: 'admin',
  RESIDENT: 'resident',
  GUEST: 'guest'
}

export const PLOT_STATUS = {
  AVAILABLE: 'available',
  CLAIMED: 'claimed',
  MAINTENANCE: 'maintenance'
}

export const CLAIM_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

export const CROP_STATUS = {
  PLANTED: 'planted',
  GROWING: 'growing',
  HARVESTED: 'harvested',
  FAILED: 'failed'
}

export const ROTATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABSENT: 'absent'
}

export const TOOL_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  DAMAGED: 'damaged'
}

export const BORROW_STATUS = {
  BORROWED: 'borrowed',
  RETURNED: 'returned',
  OVERDUE: 'overdue'
}

export const ANNOUNCEMENT_TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  IMPORTANT: 'important'
}

export const UserSchema = {
  id: String,
  name: String,
  email: String,
  phone: String,
  avatar: String,
  role: String,
  address: String,
  plotIds: Array,
  consecutiveAbsences: Number,
  lastAbsenceCheckDate: Date,
  createdAt: Date,
  updatedAt: Date
}

export const PlotSchema = {
  id: String,
  plotNumber: String,
  name: String,
  area: Number,
  location: {
    row: Number,
    col: Number,
    zone: String
  },
  description: String,
  status: String,
  claimedBy: String,
  claimedAt: Date,
  soilType: String,
  sunlight: String,
  currentCropId: String,
  createdAt: Date,
  updatedAt: Date
}

export const ClaimSchema = {
  id: String,
  plotId: String,
  applicantId: String,
  applicantName: String,
  plotNumber: String,
  reason: String,
  plannedCrops: Array,
  status: String,
  reviewedBy: String,
  reviewedAt: Date,
  reviewComment: String,
  createdAt: Date,
  updatedAt: Date
}

export const CropSchema = {
  id: String,
  plotId: String,
  name: String,
  variety: String,
  category: String,
  plantedDate: Date,
  expectedHarvestDate: Date,
  actualHarvestDate: Date,
  quantity: Number,
  status: String,
  notes: String,
  plantedBy: String,
  photos: Array,
  createdAt: Date,
  updatedAt: Date
}

export const RotationSchema = {
  id: String,
  date: Date,
  type: String,
  description: String,
  startTime: String,
  endTime: String,
  assigneeId: String,
  assigneeName: String,
  plotIds: Array,
  status: String,
  actualStartTime: Date,
  actualEndTime: Date,
  notes: String,
  checkedBy: String,
  createdAt: Date,
  updatedAt: Date
}

export const ToolSchema = {
  id: String,
  name: String,
  category: String,
  description: String,
  totalQuantity: Number,
  availableQuantity: Number,
  status: String,
  location: String,
  lastMaintenanceDate: Date,
  photoUrl: String,
  createdAt: Date,
  updatedAt: Date
}

export const ToolBorrowSchema = {
  id: String,
  toolId: String,
  toolName: String,
  borrowerId: String,
  borrowerName: String,
  quantity: Number,
  borrowTime: Date,
  expectedReturnTime: Date,
  returnTime: Date,
  status: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

export const AnnouncementSchema = {
  id: String,
  title: String,
  content: String,
  type: String,
  publishedBy: String,
  publishedByName: String,
  isPublished: Boolean,
  publishedAt: Date,
  expiresAt: Date,
  targetRoles: Array,
  createdAt: Date,
  updatedAt: Date
}

export const HarvestSchema = {
  id: String,
  plotId: String,
  cropId: String,
  cropName: String,
  quantity: Number,
  unit: String,
  quality: String,
  harvestedBy: String,
  harvestedByName: String,
  harvestDate: Date,
  notes: String,
  photos: Array,
  createdAt: Date,
  updatedAt: Date
}

export const PhotoLogSchema = {
  id: String,
  title: String,
  description: String,
  photoUrl: String,
  plotId: String,
  cropId: String,
  uploadedBy: String,
  uploadedByName: String,
  tags: Array,
  createdAt: Date
}

export const NotificationSchema = {
  id: String,
  userId: String,
  title: String,
  content: String,
  type: String,
  relatedId: String,
  relatedType: String,
  read: Boolean,
  readAt: Date,
  createdAt: Date
}
