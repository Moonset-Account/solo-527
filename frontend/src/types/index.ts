export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'audience' | 'admin' | 'box_office';
  phone?: string;
  avatar?: string;
  realName?: string;
  idCardNumber?: string;
  gender?: 'male' | 'female' | 'other';
  isVerified: boolean;
  createdAt?: string;
}

export interface Concert {
  id: number;
  title: string;
  artist: string;
  description?: string;
  posterUrl?: string;
  genre?: string;
  organizer?: string;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
  shows?: Show[];
}

export interface Show {
  id: number;
  concertId: number;
  venueId: number;
  showDate: string;
  startTime: string;
  endTime: string;
  doorsOpenTime?: string;
  status: string;
  salesStartAt: string;
  salesEndAt: string;
  concertTitle?: string;
  artist?: string;
  posterUrl?: string;
  venueName?: string;
  venueCity?: string;
  venueAddress?: string;
  venueCapacity?: number;
  description?: string;
  genre?: string;
  organizer?: string;
  zones?: SeatZone[];
  ticketTypes?: TicketType[];
}

export interface SeatZone {
  id: number;
  showId: number;
  name: string;
  zoneType: 'vip' | 'premium' | 'standard' | 'economy' | 'standing';
  color?: string;
  basePrice: string;
  rows: number;
  seatsPerRow: number;
  totalSeats: number;
  soldSeats: number;
  availableSeats: number;
}

export interface Seat {
  id: number;
  showId: number;
  zoneId: number;
  rowNumber: number;
  seatNumber: number;
  seatLabel: string;
  status: 'available' | 'held' | 'sold' | 'refunded' | 'scanned';
  lockExpiresAt?: string;
  price: string;
  orderItemId?: number;
}

export interface TicketType {
  id: number;
  showId: number;
  zoneId?: number;
  name: string;
  description?: string;
  price: string;
  originalStock: number;
  remainingStock: number;
  heldStock: number;
  soldCount: number;
  refundedCount: number;
  maxPerOrder: number;
  requireRealName: boolean;
  isActive: boolean;
  salesStartAt?: string;
  salesEndAt?: string;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  showId: number;
  totalAmount: string;
  discountAmount: string;
  payAmount: string;
  ticketCount: number;
  status: 'pending' | 'paid' | 'verified' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNote?: string;
  verifiedAt?: string;
  verifiedBy?: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userRealName?: string;
  userIsVerified?: boolean;
  items?: OrderItem[];
  verifications?: Verification[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  ticketTypeId?: number;
  seatId?: number;
  ticketHolderName?: string;
  ticketHolderIdCard?: string;
  ticketHolderPhone?: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  ticketNo?: string;
  ticketStatus: 'available' | 'held' | 'sold' | 'refunded' | 'scanned';
  scannedAt?: string;
  rowNumber?: number;
  seatNumber?: number;
  seatLabel?: string;
  zoneName?: string;
  zoneType?: string;
}

export interface Verification {
  id: number;
  orderId: number;
  userId: number;
  realName: string;
  idCardNumber: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  idCardFront?: string;
  idCardBack?: string;
  idCardHolding?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface Refund {
  id: number;
  refundNo: string;
  orderId: number;
  userId: number;
  orderItemId?: number;
  refundAmount: string;
  serviceFee: string;
  actualRefundAmount: string;
  refundReason: string;
  refundType: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'abnormal';
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  isAbnormal: boolean;
  abnormalReason?: string;
  paymentRefundId?: string;
  bankCard?: string;
  accountHolder?: string;
  bankName?: string;
  orderNo?: string;
  orderStatus?: string;
  showId?: number;
  payAmount?: string;
  userName?: string;
  userPhone?: string;
  reviewerName?: string;
  items?: OrderItem[];
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  changedBy?: number;
  changedByName?: string;
  changeNote?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Attachment {
  id: number;
  entityType: string;
  entityId: number;
  fileName: string;
  originalName: string;
  fileType?: string;
  fileSize?: number;
  fileUrl: string;
  uploadedBy?: number;
  uploadedByName?: string;
  createdAt: string;
}

export interface Note {
  id: number;
  entityType: string;
  entityId: number;
  content: string;
  isPrivate: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  orderItemId: number;
  seatId?: number;
  userId?: number;
  showId: number;
  scanCode?: string;
  scanType: string;
  scannedBy?: number;
  scannedAt: string;
  hasAttended: boolean;
  feedbackScore?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
  userName?: string;
  scannedByName?: string;
}

export interface Notification {
  id: number;
  type: 'refund_abnormal' | 'inventory_warning' | 'verification_alert' | 'order_anomaly';
  title: string;
  content?: string;
  entityType?: string;
  entityId?: number;
  status: 'unread' | 'read' | 'resolved';
  priority: number;
  triggeredAt: string;
  readBy?: number;
  readAt?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  resolutionNote?: string;
  resolverName?: string;
  readerName?: string;
}

export interface ShowStats {
  id: number;
  showId: number;
  date: string;
  totalTickets: number;
  soldTickets: number;
  scannedTickets: number;
  refundedTickets: number;
  attendanceRate: string;
  revenue: string;
  refundAmount: string;
  netRevenue: string;
  lastSyncedAt: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
