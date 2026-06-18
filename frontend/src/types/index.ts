export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  VOLUNTEER = 'volunteer',
  CUSTOMER = 'customer',
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export enum PetStatus {
  ACTIVE = 'active',
  ADOPTED = 'adopted',
  FOSTER = 'foster',
  TREATMENT = 'treatment',
  DECEASED = 'deceased',
}

export enum PetSource {
  RESCUE = 'rescue',
  DONATION = 'donation',
  PURCHASE = 'purchase',
  BORN = 'born',
  OTHER = 'other',
}

export const PetSourceLabels: Record<PetSource, string> = {
  [PetSource.RESCUE]: '救助',
  [PetSource.DONATION]: '捐赠',
  [PetSource.PURCHASE]: '购买',
  [PetSource.BORN]: '自繁',
  [PetSource.OTHER]: '其他',
};

export enum HealthRecordType {
  VACCINATION = 'vaccination',
  DEWORMING = 'deworming',
  CHECKUP = 'checkup',
  TREATMENT = 'treatment',
  SURGERY = 'surgery',
  WEIGHT = 'weight',
  OTHER = 'other',
}

export const HealthRecordTypeLabels: Record<HealthRecordType, string> = {
  [HealthRecordType.VACCINATION]: '疫苗接种',
  [HealthRecordType.DEWORMING]: '驱虫',
  [HealthRecordType.CHECKUP]: '体检',
  [HealthRecordType.TREATMENT]: '治疗',
  [HealthRecordType.SURGERY]: '手术',
  [HealthRecordType.WEIGHT]: '体重记录',
  [HealthRecordType.OTHER]: '其他',
};

export enum FosterStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXTENDED = 'extended',
  CANCELLED = 'cancelled',
}

export const FosterStatusLabels: Record<FosterStatus, string> = {
  [FosterStatus.PENDING]: '待审核',
  [FosterStatus.ACTIVE]: '进行中',
  [FosterStatus.COMPLETED]: '已完成',
  [FosterStatus.EXTENDED]: '已延期',
  [FosterStatus.CANCELLED]: '已取消',
};

export enum AdoptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export const AdoptionStatusLabels: Record<AdoptionStatus, string> = {
  [AdoptionStatus.PENDING]: '待审批',
  [AdoptionStatus.APPROVED]: '已通过',
  [AdoptionStatus.REJECTED]: '已拒绝',
  [AdoptionStatus.COMPLETED]: '已完成',
  [AdoptionStatus.RETURNED]: '已退回',
  [AdoptionStatus.CANCELLED]: '已取消',
};

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  weight?: number;
  color?: string;
  status: PetStatus;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ServiceType {
  GROOMING = 'grooming',
  BATHING = 'bathing',
  NAIL_TRIMMING = 'nail_trimming',
  EAR_CLEANING = 'ear_cleaning',
  DENTAL = 'dental',
  FULL_PACKAGE = 'full_package',
  VIP_PACKAGE = 'vip_package',
  OTHER = 'other',
}

export const ServiceTypeLabels: Record<ServiceType, string> = {
  [ServiceType.GROOMING]: '美容',
  [ServiceType.BATHING]: '洗澡',
  [ServiceType.NAIL_TRIMMING]: '剪指甲',
  [ServiceType.EAR_CLEANING]: '洁耳',
  [ServiceType.DENTAL]: '口腔护理',
  [ServiceType.FULL_PACKAGE]: '全套服务',
  [ServiceType.VIP_PACKAGE]: 'VIP套餐',
  [ServiceType.OTHER]: '其他',
};

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  duration: number;
  price: number;
  originalPrice?: number;
  isActive: boolean;
  sortOrder: number;
  applicableSpecies?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待确认',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.IN_PROGRESS]: '进行中',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.NO_SHOW]: '未到店',
};

export const AppointmentStatusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'gold',
  [AppointmentStatus.CONFIRMED]: 'blue',
  [AppointmentStatus.IN_PROGRESS]: 'cyan',
  [AppointmentStatus.COMPLETED]: 'green',
  [AppointmentStatus.CANCELLED]: 'default',
  [AppointmentStatus.NO_SHOW]: 'red',
};

export enum ReviewRating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export enum BadReviewReason {
  UNHAPPY_WITH_RESULT = 'unhappy_with_result',
  LONG_WAIT = 'long_wait',
  RUDE_STAFF = 'rude_staff',
  HIGH_PRICE = 'high_price',
  PET_UNHAPPY = 'pet_unhappy',
  OTHER = 'other',
}

export const BadReviewReasonLabels: Record<BadReviewReason, string> = {
  [BadReviewReason.UNHAPPY_WITH_RESULT]: '对服务效果不满意',
  [BadReviewReason.LONG_WAIT]: '等待时间过长',
  [BadReviewReason.RUDE_STAFF]: '工作人员态度不好',
  [BadReviewReason.HIGH_PRICE]: '价格偏高',
  [BadReviewReason.PET_UNHAPPY]: '宠物体验不好',
  [BadReviewReason.OTHER]: '其他原因',
};

export interface Appointment {
  id: string;
  customerId: string;
  petId: string;
  serviceId: string;
  staffId?: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: AppointmentStatus;
  notes?: string;
  reviewRating?: ReviewRating;
  reviewComment?: string;
  badReviewReason?: BadReviewReason;
  completedAt?: string;
  pet?: Pet;
  customer?: User;
  staff?: User;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
  EXPORT = 'export',
  OTHER = 'other',
}

export const OperationTypeLabels: Record<OperationType, string> = {
  [OperationType.CREATE]: '创建',
  [OperationType.UPDATE]: '更新',
  [OperationType.DELETE]: '删除',
  [OperationType.LOGIN]: '登录',
  [OperationType.LOGOUT]: '退出',
  [OperationType.APPROVE]: '审批通过',
  [OperationType.REJECT]: '审批拒绝',
  [OperationType.CANCEL]: '取消',
  [OperationType.COMPLETE]: '完成',
  [OperationType.EXPORT]: '导出',
  [OperationType.OTHER]: '其他',
};

export interface OperationLog {
  id: string;
  operatorId?: string;
  operator?: User;
  module: string;
  operationType: OperationType;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export enum ReportType {
  SERVICE_REPURCHASE = 'service_repurchase',
  FOSTER_SAFETY = 'foster_safety',
  ADOPTION_STATISTICS = 'adoption_statistics',
  HEALTH_STATISTICS = 'health_statistics',
  TRAINING_STATISTICS = 'training_statistics',
  APPOINTMENT_SUMMARY = 'appointment_summary',
  CUSTOM = 'custom',
}

export const ReportTypeLabels: Record<ReportType, string> = {
  [ReportType.SERVICE_REPURCHASE]: '服务复购统计',
  [ReportType.FOSTER_SAFETY]: '寄养安全报表',
  [ReportType.ADOPTION_STATISTICS]: '领养统计报表',
  [ReportType.HEALTH_STATISTICS]: '健康统计报表',
  [ReportType.TRAINING_STATISTICS]: '训练统计报表',
  [ReportType.APPOINTMENT_SUMMARY]: '预约汇总报表',
  [ReportType.CUSTOM]: '自定义报表',
};

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export const ReportFormatLabels: Record<ReportFormat, string> = {
  [ReportFormat.PDF]: 'PDF',
  [ReportFormat.EXCEL]: 'Excel',
  [ReportFormat.CSV]: 'CSV',
  [ReportFormat.JSON]: 'JSON',
};

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  initiatorId: string;
  initiator?: User;
  dataScope: string;
  statisticalCaliber: string;
  startTime: string;
  endTime: string;
  filters?: Record<string, any>;
  summaryData?: Record<string, any>;
  filePath?: string;
  downloadCount: number;
  notes?: string;
  createdAt: string;
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.MANAGER]: '店长',
  [UserRole.STAFF]: '洗护师',
  [UserRole.VOLUNTEER]: '志愿者',
  [UserRole.CUSTOMER]: '顾客',
};

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrainingRecord {
  id: string;
  petId: string;
  pet?: Pet;
  trainerId: string;
  trainer?: User;
  trainingDate: string;
  trainingType: string;
  duration: number;
  content: string;
  progress: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdoptionRecord {
  id: string;
  petId: string;
  pet?: Pet;
  adopterId: string;
  adopter?: User;
  approverId?: string;
  approver?: User;
  applicationDate: string;
  approvalDate?: string;
  adoptionDate?: string;
  status: AdoptionStatus;
  adopterAddress?: string;
  adopterExperience?: string;
  homeEnvironment?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  pet?: Pet;
  veterinarianId?: string;
  veterinarian?: User;
  recordDate: string;
  type: HealthRecordType;
  title: string;
  description?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  weight?: number;
  temperature?: number;
  nextVisitDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FosterRecord {
  id: string;
  petId: string;
  pet?: Pet;
  volunteerId: string;
  volunteer?: User;
  startDate: string;
  endDate?: string;
  originalEndDate?: string;
  status: FosterStatus;
  volunteerHome?: string;
  dailyChecklist?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRepurchaseData {
  serviceType: string;
  purchaseCount: number;
  repurchaseCount: number;
  repurchaseRate: number;
}

export interface FosterSafetyData {
  volunteerStats: {
    volunteerId: string;
    volunteerName: string;
    fosterCount: number;
  }[];
  negativeReviews: {
    reason: string;
    count: number;
  }[];
}

export interface AppointmentOverviewData {
  todayAppointments: number;
  trainingPets: number;
  pendingAdoptions: number;
  activeFosters: number;
  monthlyRevenue: number;
}

