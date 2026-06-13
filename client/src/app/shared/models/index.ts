export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  role: 'owner' | 'worker' | 'customer';
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  accessToken: string;
  createdAt: Date;
}

export type ProjectStatus = 'draft' | 'budgeting' | 'confirmed' | 'contracted' | 'constructing' | 'completed';

export interface Project {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  name: string;
  address: string;
  area: number;
  style: string;
  status: ProjectStatus;
  totalBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDetail extends Project {
  budgets: Budget[];
  latestBudget: Budget | null;
  contract: Contract | null;
  feedbacks: Feedback[];
  afterSaleOrders: AfterSaleOrder[];
  photos: ProjectPhoto[];
  attachments: Attachment[];
}

export type BudgetStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'sent_to_client';
export type BudgetItemCategory = 'demolition' | 'plumbing' | 'masonry' | 'carpentry' | 'painting' | 'main_material' | 'other';

export interface Budget {
  id: string;
  projectId: string;
  version: number;
  status: BudgetStatus;
  changeReason: string | null;
  items: BudgetItem[];
  laborCost: number;
  materialCost: number;
  totalCost: number;
  createdBy: string;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  category: BudgetItemCategory;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  materials: MaterialItem[];
}

export interface MaterialItem {
  id: string;
  budgetItemId: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export type ContractStatus = 'draft' | 'sent' | 'signed';

export interface Contract {
  id: string;
  projectId: string;
  budgetId: string;
  content: string;
  status: ContractStatus;
  signedAt: Date | null;
  signedIp: string | null;
  attachments: Attachment[];
  createdAt: Date;
}

export interface Attachment {
  id: string;
  entityType: 'contract' | 'project';
  entityId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  area: string;
  url: string;
  thumbnailUrl: string;
  uploadedBy: string;
  createdAt: Date;
}

export type FeedbackStage = 'design' | 'construction' | 'completion';

export interface Feedback {
  id: string;
  projectId: string;
  customerId: string;
  stage: FeedbackStage;
  rating: number;
  qualityRating?: number;
  serviceRating?: number;
  scheduleRating?: number;
  communicationRating?: number;
  costRating?: number;
  comment: string;
  suggestion?: string;
  wouldRecommend?: boolean;
  createdAt: Date;
  project?: Project;
  customer?: Customer;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface StageDistribution {
  stage: string;
  count: number;
  avgRating: number;
}

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  averageQualityRating: number;
  averageServiceRating: number;
  averageScheduleRating: number;
  averageCommunicationRating: number;
  averageCostRating: number;
  ratingDistribution: RatingDistribution[];
  stageDistribution: StageDistribution[];
  wouldRecommendCount: number;
  wouldRecommendRate: number;
}

export type AfterSaleStatus = 'pending' | 'processing' | 'closed';

export interface AfterSaleOrder {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: AfterSaleStatus;
  assigneeId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
}

export type NotificationType = 'budget_change' | 'contract_signed' | 'feedback_received' | 'after_sale_created';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId: string;
  read: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  activeProjects: number;
  pendingBudgets: number;
  monthlyAfterSaleOrders: number;
  unreadNotifications: number;
}

export interface AfterSaleReport {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  closedOrders: number;
  closureRate: number;
  avgResolutionDays: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface MonthlyBreakdown {
  month: string;
  totalOrders: number;
  closedOrders: number;
  closureRate: number;
  avgResolutionDays: number;
}

export interface BudgetDiffValue {
  oldValue: number;
  newValue: number;
  diff: number;
  diffPercent: number;
  changed: boolean;
}

export interface BudgetDiffSummary {
  laborCost: BudgetDiffValue;
  materialCost: BudgetDiffValue;
  totalCost: BudgetDiffValue;
  itemCount: BudgetDiffValue;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

export interface FieldChange {
  field: string;
  label: string;
  oldValue: number;
  newValue: number;
}

export interface BudgetItemDifference {
  type: 'added' | 'removed' | 'modified';
  category: BudgetItemCategory;
  name: string;
  oldValue: BudgetItem | null;
  newValue: BudgetItem | null;
  fieldChanges?: FieldChange[];
  priceDiff?: number;
}

export interface BudgetComparison {
  budgetA: Budget;
  budgetB: Budget;
  summary: BudgetDiffSummary;
  itemDifferences: BudgetItemDifference[];
}
