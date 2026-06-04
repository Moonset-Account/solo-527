export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  PRODUCT_MANAGER = 'product_manager',
  SUPERVISOR = 'supervisor',
  FINANCE = 'finance',
  OPERATION = 'operation',
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

export enum RequirementStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum TripType {
  LEISURE = 'leisure',
  BUSINESS = 'business',
  FAMILY = 'family',
  HONEYMOON = 'honeymoon',
  GROUP = 'group',
}

export interface CustomerRequirement {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  tripType: TripType;
  destination: string;
  travelerCount: number;
  adultCount: number;
  childCount: number;
  startDate?: string;
  durationDays: number;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  hotelRequirements?: string;
  transportationNeeds?: string;
  attractions?: string;
  specialRequirements?: string;
  diningPreferences?: string;
  status: RequirementStatus;
  assignedToId?: string;
  assignedTo?: User;
  createdAt: string;
  createdBy: string;
}

export enum QuoteStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT_TO_CUSTOMER = 'sent_to_customer',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  OBSOLETE = 'obsolete',
}

export enum ProfitWarningLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface QuoteItem {
  id?: string;
  name?: string;
  totalCost: number;
  [key: string]: any;
}

export interface Quote {
  id: string;
  requirementId: string;
  requirement?: CustomerRequirement;
  version: number;
  status: QuoteStatus;
  itineraryName: string;
  travelStartDate?: string;
  travelEndDate?: string;
  hotels?: QuoteItem[];
  transportation?: QuoteItem[];
  tickets?: QuoteItem[];
  meals?: QuoteItem[];
  guides?: QuoteItem[];
  otherExpenses?: QuoteItem[];
  totalCost: number;
  serviceFee: number;
  totalPrice: number;
  profit: number;
  profitMargin: number;
  profitWarning: ProfitWarningLevel;
  remarks?: string;
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: string;
  approvalComments?: string;
  createdAt: string;
  createdBy: string;
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
}

export interface Contract {
  id: string;
  contractNumber: string;
  quoteId: string;
  quote?: Quote;
  status: ContractStatus;
  customerName: string;
  paymentTerms?: any[];
  createdAt: string;
}

export enum NotificationType {
  SYSTEM = 'system',
  QUOTE_APPROVAL = 'quote_approval',
  CONTRACT_APPROVAL = 'contract_approval',
  REQUIREMENT_ASSIGNED = 'requirement_assigned',
  STATUS_CHANGE = 'status_change',
  PROFIT_WARNING = 'profit_warning',
  TASK_REMINDER = 'task_reminder',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedData?: any;
  createdAt: string;
}
