export enum UserRole {
  SuperAdmin = 1,
  Finance = 2,
  ConsultantManager = 3,
  Consultant = 4,
  LandlordManager = 5,
  Customer = 6,
}

export enum SpaceStatus {
  Available = 1,
  Reserved = 2,
  Rented = 3,
  Maintenance = 4,
  Offline = 5,
}

export enum SpaceType {
  PrivateOffice = 1,
  HotDesk = 2,
  DedicatedDesk = 3,
  MeetingRoom = 4,
  EventSpace = 5,
}

export enum AppointmentStatus {
  Pending = 1,
  Confirmed = 2,
  Completed = 3,
  Cancelled = 4,
  NoShow = 5,
}

export enum ContractStatus {
  Draft = 1,
  PendingSignature = 2,
  Active = 3,
  Expired = 4,
  Terminated = 5,
}

export enum OrderStatus {
  Pending = 1,
  Paid = 2,
  Fulfilling = 3,
  Completed = 4,
  Refunded = 5,
  Cancelled = 6,
}

export enum BillStatus {
  Unpaid = 1,
  PartialPaid = 2,
  Paid = 3,
  Overdue = 4,
  Void = 5,
}

export enum NoShowHandleResult {
  Pending = 1,
  Blacklisted = 2,
  Warning = 3,
  NoPenalty = 4,
  DepositDeducted = 5,
}

export enum FulfillmentStatus {
  Pending = 1,
  InProgress = 2,
  Delivered = 3,
  Received = 4,
  Exception = 5,
}

export enum PaymentMethod {
  Alipay = 1,
  WeChatPay = 2,
  BankTransfer = 3,
  Cash = 4,
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PagedQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface UserInfo {
  id: string;
  userName: string;
  realName: string;
  email: string;
  role: number;
  department?: string;
  avatar?: string;
}

export interface ConsultantDto {
  id: string;
  userName: string;
  realName: string;
  department?: string;
  role: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface SpacePrice {
  id: string;
  priceType: string;
  unitPrice: number;
  unit: string;
  minimumCharge?: number;
  depositAmount?: number;
  effectiveDate: string;
  expireDate?: string;
  isActive: boolean;
}

export interface Space {
  id: string;
  name: string;
  code: string;
  type: SpaceType;
  status: SpaceStatus;
  address: string;
  building: string;
  floor: string;
  area: number;
  capacity: number;
  description?: string;
  facilities?: string;
  images?: string;
  landlordName?: string;
  landlordPhone?: string;
  prices: SpacePrice[];
  createdAt: string;
}

export interface SpaceQuery extends PagedQuery {
  type?: number;
  status?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

export interface FollowUp {
  id: string;
  consultantId: string;
  consultantName: string;
  followUpType: string;
  content: string;
  followUpTime: string;
  nextFollowUpTime?: string;
  nextStep?: string;
  customerSatisfaction?: number;
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  spaceId: string;
  spaceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  viewingDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  consultantId?: string;
  consultantName?: string;
  remarks?: string;
  sourceChannel?: string;
  personCount?: number;
  requirements?: string;
  hasNoShow: boolean;
  createdAt: string;
  followUps: FollowUp[];
}

export interface NoShowRecord {
  id: string;
  appointmentId: string;
  appointmentNo: string;
  customerName: string;
  customerPhone: string;
  noShowDate: string;
  reason?: string;
  handleResult: NoShowHandleResult;
  handleDetail?: string;
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  isHandled: boolean;
  penaltyDetail?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNo: string;
  contractId: string;
  billType: string;
  amount: number;
  paidAmount: number;
  status: BillStatus;
  billingDate: string;
  dueDate: string;
  paidAt?: string;
  period?: string;
  remarks?: string;
  paymentMethod?: PaymentMethod;
  tenantName?: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  spaceId: string;
  spaceName: string;
  tenantName: string;
  tenantPhone: string;
  tenantCompany?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  paymentMonths: number;
  paymentMethod: PaymentMethod;
  status: ContractStatus;
  signedAt?: string;
  signedByName?: string;
  contractFile?: string;
  terms?: string;
  specialClauses?: string;
  createdAt: string;
  bills: Bill[];
}

export interface Fulfillment {
  id: string;
  orderId: string;
  fulfillmentNo: string;
  status: FulfillmentStatus;
  itemName: string;
  quantity: number;
  amount: number;
  deliveredAt?: string;
  receivedAt?: string;
  handler?: string;
  remarks?: string;
  exceptionReason?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  contractId?: string;
  contractNo?: string;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  remarks?: string;
  relatedAppointmentId?: string;
  createdAt: string;
  fulfillments: Fulfillment[];
}

export interface OperationLog {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  module: string;
  operation: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  ipAddress: string;
  isSuccess: boolean;
  errorMessage?: string;
  operatedAt: string;
}
