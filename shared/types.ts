export interface Reader {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  readerGroup: string;
  branch: string;
  isChildren: boolean;
}

export interface Book {
  id: string;
  title: string;
  subject: string;
  collection: string;
  branch: string;
}

export interface BorrowRecord {
  id: string;
  readerId: string;
  bookId: string;
  branch: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  renewCount: number;
  isOverdue: boolean;
  overdueDays: number;
  dataHash: string;
}

export interface Reservation {
  id: string;
  readerId: string;
  bookId: string;
  branch: string;
  reserveDate: string;
  availableDate: string | null;
  pickupDate: string | null;
  waitDays: number;
  status: 'pending' | 'available' | 'picked_up' | 'cancelled';
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  branch: string;
}

export interface ActivityParticipation {
  id: string;
  readerId: string;
  activityId: string;
  participatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export type TimeWindow = '7d' | '30d' | '90d' | '1y' | 'all';

export interface FilterParams {
  collections: string[];
  readerGroups: string[];
  subjects: string[];
  branches: string[];
  months: string[];
  timeWindow: TimeWindow;
}

export interface KPIData {
  totalBorrows: number;
  activeReaders: number;
  totalReservations: number;
  overdueRate: number;
  comparedToLastPeriod: number;
  sampleSize: number;
}

export interface SubjectTrend {
  date: string;
  [subject: string]: number | string;
}

export interface BranchComparison {
  branch: string;
  borrows: number;
  reservations: number;
  overdues: number;
}

export interface OverdueHeatmapItem {
  branch: string;
  hour: number;
  count: number;
}

export interface WaitTimeDistribution {
  range: string;
  count: number;
}

export interface ReservationAnalysis {
  averageWaitDays: number;
  totalReservations: number;
  completedRate: number;
  distribution: WaitTimeDistribution[];
  popularBooks: { title: string; reservationCount: number }[];
}

export interface AgeGroupData {
  ageGroup: string;
  readerCount: number;
  totalBorrows: number;
  avgBorrowsPerReader: number;
  isChildrenGroup: boolean;
}

export interface DataQualityStatus {
  lastUpdate: string;
  updateStatus: 'success' | 'failed' | 'partial';
  missingFields: string[];
  recordCount: number;
  errors: string[];
  sampleSize: number;
  dataLineage: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  params: FilterParams;
  createdAt: string;
}

export interface RawRecordWithValidation {
  record: BorrowRecord;
  isValid: boolean;
  validationErrors: string[];
  hashMatch: boolean;
}
