export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export enum AppointmentStatus {
  Pending = '待确认',
  Confirmed = '已确认',
  InService = '服务中',
  Completed = '已完成',
  Cancelled = '已取消',
  NoShow = '未到店',
}

export enum PaymentStatus {
  Pending = '待支付',
  Paid = '已支付',
  Refunded = '已退款',
  Failed = '支付失败',
}

export enum PaymentMethod {
  WeChat = '微信支付',
  Alipay = '支付宝',
  Cash = '现金',
  Card = '银行卡',
  Balance = '余额支付',
  MemberCard = '会员卡',
}

export enum PaymentType {
  Service = '服务消费',
  Recharge = '会员充值',
  Refund = '退款',
}

export enum OrderStatus {
  Pending = '待支付',
  Paid = '已支付',
  Completed = '已完成',
  Cancelled = '已取消',
  Refunded = '已退款',
}

export enum OrderType {
  Service = '服务单',
  Member = '会员单',
  Retail = '零售单',
}

export enum PartsShortageStatus {
  Open = '待处理',
  InProgress = '处理中',
  Resolved = '已解决',
  Closed = '已关闭',
}

export enum PartsShortagePriority {
  Low = '低',
  Medium = '中',
  High = '高',
  Urgent = '紧急',
}

export enum PartStatus {
  Shortage = '缺货',
  Ordered = '已订货',
  Arrived = '已到货',
  Used = '已使用',
}

export enum AuditLogLevel {
  Info = '信息',
  Warning = '警告',
  Error = '错误',
  Critical = '严重',
}

export enum AuditLogStatus {
  Success = '成功',
  Failed = '失败',
}

export enum TechnicianLevel {
  Junior = '初级技师',
  Intermediate = '中级技师',
  Senior = '高级技师',
  Master = '技术总监',
}

export enum WorkstationStatus {
  Available = '空闲',
  Occupied = '使用中',
  Maintenance = '维护中',
  Disabled = '已停用',
}

export enum WorkstationType {
  Exterior = '外洗工位',
  Interior = '内室工位',
  Full = '全能工位',
  Detailing = '精洗工位',
}

export enum ServiceCategory {
  Wash = '洗车服务',
  Detailing = '精洗服务',
  Interior = '内饰服务',
  Maintenance = '养护服务',
  Coating = '镀晶镀膜',
}

export interface Customer extends BaseEntity {
  name: string;
  phone: string;
  memberPackageId?: string;
  memberPackage?: MemberPackage;
}

export interface Vehicle extends BaseEntity {
  plateNumber: string;
  brand: string;
  model: string;
  color: string;
  vin?: string;
  customerId: string;
  customer?: Customer;
  notes?: string;
  tags?: string;
}

export interface ServicePackage extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  memberPrice: number;
  durationMinutes: number;
  category?: ServiceCategory | string;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  serviceItems?: string;
  isDeleted: boolean;
}

export interface MemberPackage extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  validityDays: number;
  totalTimes: number;
  rechargeAmount: number;
  bonusAmount?: number;
  memberLevel: number;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  benefits?: string;
  isDeleted: boolean;
  servicePackageId?: string;
  servicePackage?: ServicePackage;
}

export interface Technician extends BaseEntity {
  name: string;
  employeeNo: string;
  phone?: string;
  position?: string;
  level: number;
  skills?: string;
  baseSalary: number;
  commissionRate: number;
  isActive: boolean;
  avatarUrl?: string;
  totalServices: number;
  averageRating: number;
  notes?: string;
  isDeleted: boolean;
}

export interface Workstation extends BaseEntity {
  name: string;
  code: string;
  type?: WorkstationType | string;
  capacity: number;
  equipment?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  status?: WorkstationStatus | string;
  notes?: string;
  isDeleted: boolean;
  currentTechnicianId?: string;
  currentTechnician?: Technician;
}

export interface Appointment extends BaseEntity {
  appointmentNo: string;
  customerId: string;
  vehicleId: string;
  servicePackageId: string;
  technicianId?: string;
  workstationId?: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus | string;
  estimatedPrice: number;
  actualPrice?: number;
  remarks?: string;
  arrivalTime?: Date;
  startServiceTime?: Date;
  endServiceTime?: Date;
  isDeleted: boolean;
  customer?: Customer;
  vehicle?: Vehicle;
  servicePackage?: ServicePackage;
  technician?: Technician;
  workstation?: Workstation;
}

export interface Payment extends BaseEntity {
  paymentNo: string;
  customerId: string;
  orderId?: string;
  memberPackageId?: string;
  amount: number;
  discountAmount?: number;
  actualAmount: number;
  paymentMethod: PaymentMethod | string;
  paymentType: PaymentType | string;
  status?: PaymentStatus | string;
  paymentTime: Date;
  transactionId?: string;
  thirdPartyNo?: string;
  balanceUsed?: number;
  rechargeAmount?: number;
  bonusAmount?: number;
  memberDaysAdded?: number;
  remarks?: string;
  cashierId?: string;
  cashierName?: string;
  isDeleted: boolean;
  customer?: Customer;
  memberPackage?: MemberPackage;
  cashierOrder?: CashierOrder;
}

export interface CashierOrderItem extends BaseEntity {
  orderId: string;
  servicePackageId: string;
  itemName: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  actualAmount: number;
  isMemberPrice: boolean;
  itemType?: string;
  sortOrder: number;
  remarks?: string;
  isDeleted: boolean;
  order?: CashierOrder;
  servicePackage?: ServicePackage;
}

export interface CashierOrder extends BaseEntity {
  orderNo: string;
  customerId: string;
  appointmentId?: string;
  vehicleId?: string;
  totalAmount: number;
  discountAmount: number;
  actualAmount: number;
  paidAmount: number;
  refundAmount: number;
  status: OrderStatus | string;
  orderType?: OrderType | string;
  source?: string;
  isMemberPrice: boolean;
  balanceUsed?: number;
  remarks?: string;
  cashierId?: string;
  cashierName?: string;
  paidTime?: Date;
  completedTime?: Date;
  isDeleted: boolean;
  customer?: Customer;
  appointment?: Appointment;
  vehicle?: Vehicle;
  orderItems: CashierOrderItem[];
  payments: Payment[];
}

export interface PartsShortageNode extends BaseEntity {
  partsShortageId: string;
  partName: string;
  partCode?: string;
  partType?: string;
  specification?: string;
  brand?: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: PartStatus | string;
  expectedArrivalDate?: Date;
  arrivedAt?: Date;
  supplier?: string;
  remarks?: string;
  sortOrder: number;
  isDeleted: boolean;
  partsShortage?: PartsShortage;
}

export interface PartsShortage extends BaseEntity {
  shortageNo: string;
  title: string;
  description?: string;
  status: PartsShortageStatus | string;
  priority?: PartsShortagePriority | string;
  vehicleServiceRecordId?: string;
  vehicleId?: string;
  customerId?: string;
  reporterId?: string;
  reporterName?: string;
  handlerId?: string;
  handlerName?: string;
  expectedResolveDate?: Date;
  resolvedAt?: Date;
  resolution?: string;
  remarks?: string;
  isDeleted: boolean;
  vehicle?: Vehicle;
  customer?: Customer;
  nodes: PartsShortageNode[];
}

export interface AuditLog {
  id: string;
  traceId: string;
  operation: string;
  operationType?: string;
  entityName?: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  moduleName?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  changedFields?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  httpMethod?: string;
  statusCode?: number;
  durationMs?: number;
  level?: AuditLogLevel | string;
  errorMessage?: string;
  stackTrace?: string;
  remarks?: string;
  status?: AuditLogStatus | string;
  createdAt: Date;
  createdBy?: string;
}

export interface DashboardSummary {
  todayAppointments: number;
  arrivedCount: number;
  inServiceCount: number;
  completedCount: number;
  todayRevenue: number;
  availableTechnicians: number;
  availableWorkstations: number;
  activePartsShortages: number;
}

export interface ConversionReport {
  period: string;
  totalAppointments: number;
  arrivedCount: number;
  arrivalRate: number;
  completedCount: number;
  completionRate: number;
  avgRevenue: number;
}

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  serviceCount: number;
  revenue: number;
  rating: number;
}

export interface ReportQueryRequest {
  startDate: Date;
  endDate: Date;
  periodType?: string;
}
