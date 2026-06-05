
export const Role = {
  OWNER: 'OWNER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DESIGNER: 'DESIGNER',
  FINANCE: 'FINANCE'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ChangeStatus = {
  DRAFT: 'DRAFT',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  PURCHASED: 'PURCHASED'
} as const;

export type ChangeStatus = (typeof ChangeStatus)[keyof typeof ChangeStatus];

export const ConfirmationType = {
  CONFIRM: 'CONFIRM',
  REJECT: 'REJECT',
  WITHDRAW: 'WITHDRAW'
} as const;

export type ConfirmationType = (typeof ConfirmationType)[keyof typeof ConfirmationType];

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  password: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  address: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  version: number;
  title: string;
  description: string | null;
  status: ChangeStatus;
  createdById: string;
  projectManagerId: string | null;
  originalPlan: string;
  newMaterial: string;
  priceDifference: { toNumber(): number; toString(): string };
  scheduleImpact: number;
  sitePhotoUrl: string | null;
  drawingNote: string | null;
  managerNote: string | null;
  financeNote: string | null;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
}

export interface ChangeVersion {
  id: string;
  changeRequestId: string;
  version: number;
  originalPlan: string;
  newMaterial: string;
  priceDifference: { toNumber(): number; toString(): string };
  scheduleImpact: number;
  sitePhotoUrl: string | null;
  drawingNote: string | null;
  managerNote: string | null;
  createdAt: Date;
  createdById: string;
}

export interface ConfirmationRecord {
  id: string;
  changeRequestId: string;
  confirmedById: string;
  type: ConfirmationType;
  comment: string | null;
  signatureHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface Schedule {
  id: string;
  projectId: string;
  changeRequestId: string | null;
  startDate: Date;
  endDate: Date;
  isLocked: boolean;
  lockedById: string | null;
  taskName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  changeRequestId: string;
  orderNumber: string;
  totalAmount: { toNumber(): number; toString(): string };
  status: string;
  createdById: string;
  createdAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseOrderId: string;
  name: string;
  quantity: number;
  unitPrice: { toNumber(): number; toString(): string };
  totalPrice: { toNumber(): number; toString(): string };
}

export interface Attachment {
  id: string;
  changeRequestId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: Date;
}
