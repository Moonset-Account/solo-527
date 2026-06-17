export interface TourRoute {
  id: number
  routeCode: string
  routeName: string
  description: string
  city: string
  durationDays: number
  basePrice: number
  maxCapacity: number
  status: string
  version: number
  coverImage: string
  createdAt: string
  updatedAt: string
}

export interface RoomInventory {
  id: number
  routeId: number
  hotelCode: string
  hotelName: string
  roomType: string
  inventoryDate: string
  totalQuantity: number
  bookedQuantity: number
  blockedQuantity: number
  availableQuantity: number
  roomStatus: string
  version: number
}

export interface InventoryDetail {
  id: number
  roomInventoryId: number
  routeId: number
  hotelCode: string
  roomType: string
  inventoryDate: string
  roomNumber: string
  orderNo: string
  guestName: string
  checkInTime: string
  checkOutTime: string
  roomStatus: string
  cleanStatus: string
  sourceType: string
  remark: string
}

export interface CleaningTask {
  id: number
  taskNo: string
  hotelCode: string
  hotelName: string
  roomNumber: string
  roomType: string
  taskDate: string
  taskType: string
  taskStatus: string
  priority: string
  assignee: string
  startTime: string
  endTime: string
  remark: string
}

export interface TourOrder {
  id: number
  orderNo: string
  routeId: number
  routeName: string
  customerName: string
  customerPhone: string
  travelDate: string
  guestCount: number
  roomCount: number
  totalAmount: number
  paidAmount: number
  orderStatus: string
  paymentStatus: string
  refundStatus: string
  refundAmount: number
  hotelCode: string
  roomType: string
  version: number
  remark: string
}

export interface RefundRecord {
  id: number
  refundNo: string
  orderNo: string
  routeId: number
  refundAmount: number
  refundReason: string
  refundType: string
  refundStatus: string
  approver: string
  approveTime: string
  refundTime: string
  remark: string
}

export interface ConfigVersion {
  id: number
  configType: string
  configKey: string
  configName: string
  versionNo: number
  configValue: string
  status: string
  effectStartTime: string
  effectEndTime: string
  remark: string
}

export interface ReminderRule {
  id: number
  ruleCode: string
  ruleName: string
  ruleType: string
  triggerCondition: string
  reminderLevel: string
  reminderWay: string
  reminderTemplate: string
  upgradeCondition: string
  upgradeRuleCode: string
  enabled: boolean
  version: number
  remark: string
}

export interface ExportLog {
  id: number
  exportNo: string
  exportType: string
  exportName: string
  exportBy: string
  exportTime: string
  queryCriteria: string
  fileName: string
  filePath: string
  recordCount: number
  fileSize: number
  status: string
  remark: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface Result<T> {
  code: number
  message: string
  data: T
}
