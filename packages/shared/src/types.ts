export type UserRole = 'project_manager' | 'admin' | 'supplier_coordinator' | 'supplier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialCategory = 
  | 'steel'
  | 'cement'
  | 'wood'
  | 'concrete'
  | 'electrical'
  | 'plumbing'
  | 'insulation'
  | 'other';

export interface MaterialItem {
  id: string;
  name: string;
  code?: string;
  category: MaterialCategory;
  specification: string;
  unit: string;
  quantity: number;
  budgetPrice?: number;
  remark?: string;
}

export type PurchaseStatus = 
  | 'draft'
  | 'submitted'
  | 'quoting'
  | 'comparing'
  | 'approved'
  | 'ordered'
  | 'completed'
  | 'cancelled';

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface PurchaseRequest {
  id: string;
  code: string;
  projectName: string;
  projectCode: string;
  projectManagerId: string;
  projectManagerName: string;
  department: string;
  items: MaterialItem[];
  attachments: Attachment[];
  requiredDate: Date;
  description?: string;
  status: PurchaseStatus;
  currentQuoteCount: number;
  totalAmount?: number;
  selectedQuoteId?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

export interface ContactPerson {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export type SupplierQualificationStatus = 
  | 'qualified'
  | 'warning'
  | 'expired'
  | 'blacklisted'
  | 'pending';

export interface QualificationFile {
  id: string;
  name: string;
  type: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'valid' | 'expiring' | 'expired';
  attachmentId: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: string[];
  businessLicense: string;
  contactPerson: ContactPerson;
  address: string;
  bankAccount?: string;
  qualifications: QualificationFile[];
  qualificationStatus: SupplierQualificationStatus;
  rating: number;
  tags: string[];
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  materialItemId: string;
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveryDate?: Date;
  remark?: string;
}

export type QuoteStatus = 'submitted' | 'reviewing' | 'selected' | 'rejected';

export interface Quote {
  id: string;
  code: string;
  purchaseRequestId: string;
  supplierId: string;
  supplierName: string;
  items: QuoteItem[];
  totalAmount: number;
  taxRate?: number;
  taxAmount?: number;
  totalWithTax?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  warranty?: string;
  attachments: Attachment[];
  remark?: string;
  status: QuoteStatus;
  validityDate: Date;
  submittedBy: string;
  submittedAt: Date;
  reviewedAt?: Date;
  updatedAt: Date;
}

export type AgreementStatus = 'active' | 'expired' | 'terminated';

export interface AgreementItem {
  materialCode?: string;
  name: string;
  specification: string;
  unit: string;
  unitPrice: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface FrameworkAgreement {
  id: string;
  code: string;
  name: string;
  supplierId: string;
  supplierName: string;
  items: AgreementItem[];
  startDate: Date;
  endDate: Date;
  totalAmount?: number;
  status: AgreementStatus;
  attachments: Attachment[];
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertType = 
  | 'price_surge'
  | 'price_drop'
  | 'qualification_expiring'
  | 'qualification_expired'
  | 'quote_deadline'
  | 'agreement_expiring';

export type AlertLevel = 'info' | 'warning' | 'critical';

export type AlertStatus = 'unread' | 'read' | 'processed';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  recipientIds: string[];
  status: AlertStatus;
  processedBy?: string;
  processedAt?: Date;
  data?: Record<string, any>;
  createdAt: Date;
}

export type ChangeEntity = 
  | 'purchase_request'
  | 'quote'
  | 'supplier'
  | 'agreement';

export interface FieldChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  type: 'primitive' | 'array' | 'object';
}

export interface ChangeHistory {
  id: string;
  entityId: string;
  entityType: ChangeEntity;
  entityCode: string;
  changes: FieldChange[];
  changedBy: string;
  changedByName: string;
  changeReason?: string;
  createdAt: Date;
}

export interface PriceHistory {
  id: string;
  materialName: string;
  specification: string;
  category: MaterialCategory;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  unit: string;
  quantity?: number;
  quoteId?: string;
  agreementId?: string;
  effectiveDate: Date;
  createdAt: Date;
}

export interface PriceFluctuation {
  materialName: string;
  specification: string;
  currentPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercent: number;
  supplierName: string;
  currentQuoteId: string;
  previousQuoteId: string;
  date: Date;
}

export type QualificationAlertStatus = 'pending' | 'processing' | 'resolved';

export interface QualificationAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  qualificationName: string;
  issueType: 'expiring' | 'expired' | 'invalid';
  expiryDate: Date;
  daysLeft: number;
  status: QualificationAlertStatus;
  assigneeId?: string;
  assigneeName?: string;
  resolution?: string;
  createdAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  approvalDurationHours?: number;
}

export type DashboardStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalBoardItem {
  id: string;
  alertId: string;
  supplierId: string;
  supplierName: string;
  qualificationName: string;
  issueType: string;
  assigneeId: string;
  assigneeName: string;
  status: DashboardStatus;
  receivedAt: Date;
  processedAt?: Date;
  durationHours: number;
  remark?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
