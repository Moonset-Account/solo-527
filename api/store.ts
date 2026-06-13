import { v4 as uuidv4 } from 'uuid'
import type {
  Student,
  PhotoInfo,
  RepairRequest,
  FlowRecord,
  QuotaConfig,
  CheckInRecord,
  StudyRoom,
  Seat,
  SeatAssignment,
  User,
  Notification,
} from './types.js'

class CacheStore {
  private store: Map<string, { value: any; expiresAt: number }> = new Map()

  set(key: string, value: any, ttlMs: number = 60000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  clear(): void {
    this.store.clear()
  }
}

export const cache = new CacheStore()

const now = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString()

const students: Student[] = [
  { id: 'stu-001', studentNumber: '2023001001', name: '张三', building: '1号楼', roomNumber: '301', phone: '13800001001', department: '计算机学院', createdAt: daysAgo(90), updatedAt: daysAgo(90) },
  { id: 'stu-002', studentNumber: '2023001002', name: '李四', building: '1号楼', roomNumber: '302', phone: '13800001002', department: '计算机学院', createdAt: daysAgo(85), updatedAt: daysAgo(85) },
  { id: 'stu-003', studentNumber: '2023002003', name: '王五', building: '3号楼', roomNumber: '201', phone: '13800001003', department: '电子信息学院', createdAt: daysAgo(80), updatedAt: daysAgo(80) },
  { id: 'stu-004', studentNumber: '2023002004', name: '赵六', building: '3号楼', roomNumber: '202', phone: '13800001004', department: '电子信息学院', createdAt: daysAgo(75), updatedAt: daysAgo(75) },
  { id: 'stu-005', studentNumber: '2023003005', name: '钱七', building: '5号楼', roomNumber: '105', phone: '13800001005', department: '机械工程学院', createdAt: daysAgo(70), updatedAt: daysAgo(70) },
  { id: 'stu-006', studentNumber: '2023003006', name: '孙八', building: '5号楼', roomNumber: '106', phone: '13800001006', department: '机械工程学院', createdAt: daysAgo(65), updatedAt: daysAgo(65) },
  { id: 'stu-007', studentNumber: '2023004007', name: '周九', building: '7号楼', roomNumber: '401', phone: '13800001007', department: '数学学院', createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { id: 'stu-008', studentNumber: '2023004008', name: '吴十', building: '7号楼', roomNumber: '402', phone: '13800001008', department: '数学学院', createdAt: daysAgo(55), updatedAt: daysAgo(55) },
  { id: 'stu-009', studentNumber: '2023005009', name: '郑十一', building: '1号楼', roomNumber: '501', phone: '13800001009', department: '物理学院', createdAt: daysAgo(50), updatedAt: daysAgo(50) },
  { id: 'stu-010', studentNumber: '2023005010', name: '陈十二', building: '3号楼', roomNumber: '503', phone: '13800001010', department: '物理学院', createdAt: daysAgo(45), updatedAt: daysAgo(45) },
]

const photos: PhotoInfo[] = [
  { id: 'photo-001', requestId: 'req-001', fileName: 'leak_1.jpg', filePath: 'uploads/leak_1.jpg', fileSize: 204800, uploadedAt: daysAgo(10) },
  { id: 'photo-002', requestId: 'req-001', fileName: 'leak_2.jpg', filePath: 'uploads/leak_2.jpg', fileSize: 307200, uploadedAt: daysAgo(10) },
  { id: 'photo-003', requestId: 'req-002', fileName: 'socket_1.jpg', filePath: 'uploads/socket_1.jpg', fileSize: 153600, uploadedAt: daysAgo(8) },
  { id: 'photo-004', requestId: 'req-005', fileName: 'desk_1.jpg', filePath: 'uploads/desk_1.jpg', fileSize: 256000, uploadedAt: daysAgo(5) },
  { id: 'photo-005', requestId: 'req-008', fileName: 'window_1.jpg', filePath: 'uploads/window_1.jpg', fileSize: 180000, uploadedAt: daysAgo(3) },
  { id: 'photo-006', requestId: 'req-010', fileName: 'wifi_1.jpg', filePath: 'uploads/wifi_1.jpg', fileSize: 120000, uploadedAt: daysAgo(1) },
]

const repairRequests: RepairRequest[] = [
  {
    id: 'req-001', studentId: 'stu-001', studentName: '张三', building: '1号楼', roomNumber: '301',
    repairType: 'plumbing', description: '卫生间水龙头漏水严重，无法正常关闭', urgency: 'high',
    status: 'completed', assignedTo: '维修工-刘师傅', quotaConfigId: 'quota-001',
    photos: [photos[0], photos[1]], createdAt: daysAgo(10), updatedAt: daysAgo(2),
  },
  {
    id: 'req-002', studentId: 'stu-002', studentName: '李四', building: '1号楼', roomNumber: '302',
    repairType: 'electrical', description: '卧室插座松动，存在安全隐患', urgency: 'critical',
    status: 'processing', assignedTo: '电工-王师傅', quotaConfigId: 'quota-001',
    photos: [photos[2]], createdAt: daysAgo(8), updatedAt: hoursAgo(6),
  },
  {
    id: 'req-003', studentId: 'stu-003', studentName: '王五', building: '3号楼', roomNumber: '201',
    repairType: 'furniture', description: '书桌抽屉损坏，无法正常拉出', urgency: 'low',
    status: 'assigned', assignedTo: '木工-赵师傅', quotaConfigId: 'quota-002',
    photos: [], createdAt: daysAgo(7), updatedAt: daysAgo(5),
  },
  {
    id: 'req-004', studentId: 'stu-004', studentName: '赵六', building: '3号楼', roomNumber: '202',
    repairType: 'door_window', description: '窗户把手断裂，窗户无法关严', urgency: 'medium',
    status: 'quota_checking', assignedTo: '', quotaConfigId: 'quota-002',
    photos: [], createdAt: daysAgo(6), updatedAt: daysAgo(6),
  },
  {
    id: 'req-005', studentId: 'stu-005', studentName: '钱七', building: '5号楼', roomNumber: '105',
    repairType: 'furniture', description: '上铺梯子松动，上下不安全', urgency: 'high',
    status: 'identity_verifying', assignedTo: '', quotaConfigId: 'quota-003',
    photos: [photos[3]], createdAt: daysAgo(5), updatedAt: daysAgo(5),
  },
  {
    id: 'req-006', studentId: 'stu-006', studentName: '孙八', building: '5号楼', roomNumber: '106',
    repairType: 'network', description: '房间网络端口无信号，无法上网', urgency: 'medium',
    status: 'pending', assignedTo: '', quotaConfigId: 'quota-003',
    photos: [], createdAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    id: 'req-007', studentId: 'stu-007', studentName: '周九', building: '7号楼', roomNumber: '401',
    repairType: 'plumbing', description: '马桶堵塞，无法正常使用', urgency: 'critical',
    status: 'rejected', assignedTo: '', quotaConfigId: 'quota-004',
    photos: [], createdAt: daysAgo(12), updatedAt: daysAgo(11),
  },
  {
    id: 'req-008', studentId: 'stu-008', studentName: '吴十', building: '7号楼', roomNumber: '402',
    repairType: 'door_window', description: '宿舍门锁损坏，无法反锁', urgency: 'high',
    status: 'processing', assignedTo: '锁匠-孙师傅', quotaConfigId: 'quota-004',
    photos: [photos[4]], createdAt: daysAgo(3), updatedAt: hoursAgo(12),
  },
  {
    id: 'req-009', studentId: 'stu-009', studentName: '郑十一', building: '1号楼', roomNumber: '501',
    repairType: 'electrical', description: '日光灯闪烁不停，影响学习休息', urgency: 'medium',
    status: 'waitlisted', assignedTo: '', quotaConfigId: 'quota-001',
    photos: [], createdAt: daysAgo(2), updatedAt: daysAgo(1),
  },
  {
    id: 'req-010', studentId: 'stu-010', studentName: '陈十二', building: '3号楼', roomNumber: '503',
    repairType: 'network', description: 'WiFi信号极弱，无法在线上课', urgency: 'high',
    status: 'identity_verifying', assignedTo: '', quotaConfigId: 'quota-002',
    photos: [photos[5]], createdAt: daysAgo(1), updatedAt: hoursAgo(8),
  },
  {
    id: 'req-011', studentId: 'stu-001', studentName: '张三', building: '1号楼', roomNumber: '301',
    repairType: 'other', description: '墙壁发霉，需要重新粉刷', urgency: 'low',
    status: 'pending', assignedTo: '', quotaConfigId: 'quota-001',
    photos: [], createdAt: hoursAgo(5), updatedAt: hoursAgo(5),
  },
  {
    id: 'req-012', studentId: 'stu-003', studentName: '王五', building: '3号楼', roomNumber: '201',
    repairType: 'plumbing', description: '洗脸池下水缓慢，经常积水', urgency: 'medium',
    status: 'assigned', assignedTo: '维修工-刘师傅', quotaConfigId: 'quota-002',
    photos: [], createdAt: daysAgo(9), updatedAt: daysAgo(4),
  },
  {
    id: 'req-013', studentId: 'stu-005', studentName: '钱七', building: '5号楼', roomNumber: '105',
    repairType: 'electrical', description: '空调插座打火花', urgency: 'critical',
    status: 'completed', assignedTo: '电工-王师傅', quotaConfigId: 'quota-003',
    photos: [], createdAt: daysAgo(15), updatedAt: daysAgo(7),
  },
  {
    id: 'req-014', studentId: 'stu-007', studentName: '周九', building: '7号楼', roomNumber: '401',
    repairType: 'furniture', description: '衣柜门合页脱落', urgency: 'low',
    status: 'waitlisted', assignedTo: '', quotaConfigId: 'quota-004',
    photos: [], createdAt: daysAgo(3), updatedAt: daysAgo(2),
  },
  {
    id: 'req-015', studentId: 'stu-002', studentName: '李四', building: '1号楼', roomNumber: '302',
    repairType: 'door_window', description: '阳台推拉门脱轨', urgency: 'medium',
    status: 'completed', assignedTo: '维修工-刘师傅', quotaConfigId: 'quota-001',
    photos: [], createdAt: daysAgo(20), updatedAt: daysAgo(12),
  },
  {
    id: 'req-016', studentId: 'stu-004', studentName: '赵六', building: '3号楼', roomNumber: '202',
    repairType: 'plumbing', description: '淋浴花洒喷头断裂', urgency: 'medium',
    status: 'quota_checking', assignedTo: '', quotaConfigId: 'quota-002',
    photos: [], createdAt: hoursAgo(3), updatedAt: hoursAgo(2),
  },
]

const flowRecords: FlowRecord[] = [
  {
    id: 'flow-001', requestId: 'req-001', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(10),
  },
  {
    id: 'flow-002', requestId: 'req-001', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-001', studentName: '张三', building: '1号楼', roomNumber: '301', reviewResult: 'pass', reviewRemark: '身份信息核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(9),
  },
  {
    id: 'flow-003', requestId: 'req-001', stepType: 'quota_check',
    previousValue: { quotaUsed: 2 }, newValue: { quotaUsed: 3 },
    changedFields: ['quotaUsed'], operatorId: 'system', operatorName: '系统', remark: '名额检查通过，当前使用3/10', createdAt: daysAgo(9),
  },
  {
    id: 'flow-004', requestId: 'req-001', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'quota_checking' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '进入名额检查', createdAt: daysAgo(9),
  },
  {
    id: 'flow-005', requestId: 'req-001', stepType: 'status_change',
    previousValue: { status: 'quota_checking' }, newValue: { status: 'assigned' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '分配维修人员', createdAt: daysAgo(8),
  },
  {
    id: 'flow-006', requestId: 'req-001', stepType: 'status_change',
    previousValue: { status: 'assigned' }, newValue: { status: 'processing' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '开始维修', createdAt: daysAgo(7),
  },
  {
    id: 'flow-007', requestId: 'req-001', stepType: 'repair_process',
    previousValue: { status: 'processing', progress: '未开始' }, newValue: { status: 'processing', progress: '维修中' },
    changedFields: ['status', 'progress'], operatorId: 'user-002', operatorName: '宿管老师', remark: '水龙头更换中', createdAt: daysAgo(5),
  },
  {
    id: 'flow-008', requestId: 'req-001', stepType: 'status_change',
    previousValue: { status: 'processing' }, newValue: { status: 'completed' },
    changedFields: ['status'], operatorId: 'user-002', operatorName: '宿管老师', remark: '维修完成', createdAt: daysAgo(2),
  },
  {
    id: 'flow-009', requestId: 'req-002', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(8),
  },
  {
    id: 'flow-010', requestId: 'req-002', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-002', studentName: '李四', building: '1号楼', roomNumber: '302', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(7),
  },
  {
    id: 'flow-011', requestId: 'req-002', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'assigned' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '紧急工单直接分配', createdAt: daysAgo(7),
  },
  {
    id: 'flow-012', requestId: 'req-002', stepType: 'status_change',
    previousValue: { status: 'assigned' }, newValue: { status: 'processing' },
    changedFields: ['status'], operatorId: 'user-002', operatorName: '宿管老师', remark: '电工已上门', createdAt: daysAgo(4),
  },
  {
    id: 'flow-013', requestId: 'req-003', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(7),
  },
  {
    id: 'flow-014', requestId: 'req-003', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-003', studentName: '王五', building: '3号楼', roomNumber: '201', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(6),
  },
  {
    id: 'flow-015', requestId: 'req-003', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'assigned' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '分配木工', createdAt: daysAgo(5),
  },
  {
    id: 'flow-016', requestId: 'req-005', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(5),
  },
  {
    id: 'flow-017', requestId: 'req-007', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(12),
  },
  {
    id: 'flow-018', requestId: 'req-007', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-007', studentName: '周九', building: '7号楼', roomNumber: '401', reviewResult: 'reject', reviewRemark: '该生已提交相同报修3次，疑似重复提交' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核不通过：重复提交', createdAt: daysAgo(11),
  },
  {
    id: 'flow-019', requestId: 'req-007', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'rejected' },
    changedFields: ['status'], operatorId: 'user-002', operatorName: '宿管老师', remark: '审核拒绝，工单关闭', createdAt: daysAgo(11),
  },
  {
    id: 'flow-020', requestId: 'req-008', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(3),
  },
  {
    id: 'flow-021', requestId: 'req-008', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-008', studentName: '吴十', building: '7号楼', roomNumber: '402', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(2),
  },
  {
    id: 'flow-022', requestId: 'req-008', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'processing' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '紧急处理，直接派锁匠', createdAt: daysAgo(2),
  },
  {
    id: 'flow-023', requestId: 'req-010', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(1),
  },
  {
    id: 'flow-024', requestId: 'req-013', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(15),
  },
  {
    id: 'flow-025', requestId: 'req-013', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-005', studentName: '钱七', building: '5号楼', roomNumber: '105', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(14),
  },
  {
    id: 'flow-026', requestId: 'req-013', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'processing' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '紧急工单优先处理', createdAt: daysAgo(13),
  },
  {
    id: 'flow-027', requestId: 'req-013', stepType: 'repair_process',
    previousValue: { status: 'processing', progress: '未开始' }, newValue: { status: 'processing', progress: '已完成' },
    changedFields: ['status', 'progress'], operatorId: 'user-002', operatorName: '宿管老师', remark: '插座更换完成', createdAt: daysAgo(8),
  },
  {
    id: 'flow-028', requestId: 'req-013', stepType: 'status_change',
    previousValue: { status: 'processing' }, newValue: { status: 'completed' },
    changedFields: ['status'], operatorId: 'user-002', operatorName: '宿管老师', remark: '维修完成', createdAt: daysAgo(7),
  },
  {
    id: 'flow-029', requestId: 'req-015', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(20),
  },
  {
    id: 'flow-030', requestId: 'req-015', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-002', studentName: '李四', building: '1号楼', roomNumber: '302', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(19),
  },
  {
    id: 'flow-031', requestId: 'req-015', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'processing' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '分配维修', createdAt: daysAgo(18),
  },
  {
    id: 'flow-032', requestId: 'req-015', stepType: 'status_change',
    previousValue: { status: 'processing' }, newValue: { status: 'completed' },
    changedFields: ['status'], operatorId: 'user-002', operatorName: '宿管老师', remark: '维修完成', createdAt: daysAgo(12),
  },
  {
    id: 'flow-033', requestId: 'req-004', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(6),
  },
  {
    id: 'flow-034', requestId: 'req-004', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-004', studentName: '赵六', building: '3号楼', roomNumber: '202', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(6),
  },
  {
    id: 'flow-035', requestId: 'req-004', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'quota_checking' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '进入名额检查', createdAt: daysAgo(6),
  },
  {
    id: 'flow-036', requestId: 'req-009', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(2),
  },
  {
    id: 'flow-037', requestId: 'req-009', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-009', studentName: '郑十一', building: '1号楼', roomNumber: '501', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(1),
  },
  {
    id: 'flow-038', requestId: 'req-009', stepType: 'quota_check',
    previousValue: { quotaUsed: 9 }, newValue: { quotaUsed: 10 },
    changedFields: ['quotaUsed'], operatorId: 'system', operatorName: '系统', remark: '名额已满，进入候补', createdAt: daysAgo(1),
  },
  {
    id: 'flow-039', requestId: 'req-009', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'waitlisted' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '名额已满，自动进入候补队列', createdAt: daysAgo(1),
  },
  {
    id: 'flow-040', requestId: 'req-014', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(3),
  },
  {
    id: 'flow-041', requestId: 'req-014', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-007', studentName: '周九', building: '7号楼', roomNumber: '401', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(2),
  },
  {
    id: 'flow-042', requestId: 'req-014', stepType: 'quota_check',
    previousValue: { quotaUsed: 4 }, newValue: { quotaUsed: 5 },
    changedFields: ['quotaUsed'], operatorId: 'system', operatorName: '系统', remark: '名额已满，进入候补', createdAt: daysAgo(2),
  },
  {
    id: 'flow-043', requestId: 'req-014', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'waitlisted' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '名额已满，进入候补', createdAt: daysAgo(2),
  },
  {
    id: 'flow-044', requestId: 'req-016', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: hoursAgo(3),
  },
  {
    id: 'flow-045', requestId: 'req-016', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-004', studentName: '赵六', building: '3号楼', roomNumber: '202', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: hoursAgo(2),
  },
  {
    id: 'flow-046', requestId: 'req-016', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'quota_checking' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '进入名额检查', createdAt: hoursAgo(2),
  },
  {
    id: 'flow-047', requestId: 'req-012', stepType: 'status_change',
    previousValue: { status: 'pending' }, newValue: { status: 'identity_verifying' },
    changedFields: ['status'], operatorId: 'system', operatorName: '系统', remark: '自动进入身份审核', createdAt: daysAgo(9),
  },
  {
    id: 'flow-048', requestId: 'req-012', stepType: 'identity_review',
    previousValue: { studentId: '', studentName: '', building: '', roomNumber: '', reviewResult: '', reviewRemark: '' },
    newValue: { studentId: 'stu-003', studentName: '王五', building: '3号楼', roomNumber: '201', reviewResult: 'pass', reviewRemark: '身份核实通过' },
    changedFields: ['studentId', 'studentName', 'building', 'roomNumber', 'reviewResult', 'reviewRemark'],
    operatorId: 'user-002', operatorName: '宿管老师', remark: '身份审核通过', createdAt: daysAgo(8),
  },
  {
    id: 'flow-049', requestId: 'req-012', stepType: 'status_change',
    previousValue: { status: 'identity_verifying' }, newValue: { status: 'assigned' },
    changedFields: ['status'], operatorId: 'user-001', operatorName: '系统管理员', remark: '分配维修工', createdAt: daysAgo(4),
  },
  {
    id: 'flow-050', requestId: 'req-008', stepType: 'seat_change',
    previousValue: { seatId: null, studyRoom: null, seatNumber: null },
    newValue: { seatId: 'seat-005', studyRoom: '自习室A', seatNumber: 'A-05' },
    changedFields: ['seatId', 'studyRoom', 'seatNumber'], operatorId: 'user-002', operatorName: '宿管老师',
    remark: '因门锁维修期间安全隐患，临时安排自习室座位', createdAt: daysAgo(2),
  },
  {
    id: 'flow-051', requestId: 'req-008', stepType: 'seat_change',
    previousValue: { seatId: 'seat-005', studyRoom: '自习室A', seatNumber: 'A-05' },
    newValue: { seatId: null, studyRoom: null, seatNumber: null },
    changedFields: ['seatId', 'studyRoom', 'seatNumber'], operatorId: 'user-002', operatorName: '宿管老师',
    remark: '门锁维修完成，释放临时座位', createdAt: hoursAgo(12),
  },
]

const quotaConfigs: QuotaConfig[] = [
  { id: 'quota-001', building: '1号楼', repairType: 'plumbing', maxQuota: 10, currentUsed: 8, period: 'monthly', updatedAt: daysAgo(1) },
  { id: 'quota-002', building: '3号楼', repairType: 'plumbing', maxQuota: 8, currentUsed: 6, period: 'monthly', updatedAt: daysAgo(2) },
  { id: 'quota-003', building: '5号楼', repairType: 'electrical', maxQuota: 5, currentUsed: 3, period: 'weekly', updatedAt: hoursAgo(12) },
  { id: 'quota-004', building: '7号楼', repairType: 'furniture', maxQuota: 5, currentUsed: 5, period: 'monthly', updatedAt: daysAgo(3) },
]

const checkInRecords: CheckInRecord[] = [
  { id: 'checkin-001', studentId: 'stu-001', studentName: '张三', requestId: 'req-001', checkInTime: daysAgo(9), location: '1号楼301', method: 'qrcode' },
  { id: 'checkin-002', studentId: 'stu-002', studentName: '李四', requestId: 'req-002', checkInTime: daysAgo(7), location: '1号楼302', method: 'qrcode' },
  { id: 'checkin-003', studentId: 'stu-003', studentName: '王五', requestId: 'req-003', checkInTime: daysAgo(6), location: '3号楼201', method: 'manual' },
  { id: 'checkin-004', studentId: 'stu-008', studentName: '吴十', requestId: 'req-008', checkInTime: daysAgo(2), location: '7号楼402', method: 'qrcode' },
  { id: 'checkin-005', studentId: 'stu-005', studentName: '钱七', requestId: 'req-013', checkInTime: daysAgo(14), location: '5号楼105', method: 'manual' },
  { id: 'checkin-006', studentId: 'stu-002', studentName: '李四', requestId: 'req-015', checkInTime: daysAgo(19), location: '1号楼302', method: 'qrcode' },
]

const studyRooms: StudyRoom[] = [
  { id: 'room-001', name: '自习室A', building: '1号楼', totalSeats: 30 },
  { id: 'room-002', name: '自习室B', building: '3号楼', totalSeats: 40 },
  { id: 'room-003', name: '自习室C', building: '5号楼', totalSeats: 25 },
]

const seats: Seat[] = [
  { id: 'seat-001', studyRoomId: 'room-001', seatNumber: 'A-01', status: 'available' },
  { id: 'seat-002', studyRoomId: 'room-001', seatNumber: 'A-02', status: 'occupied' },
  { id: 'seat-003', studyRoomId: 'room-001', seatNumber: 'A-03', status: 'available' },
  { id: 'seat-004', studyRoomId: 'room-001', seatNumber: 'A-04', status: 'maintenance' },
  { id: 'seat-005', studyRoomId: 'room-001', seatNumber: 'A-05', status: 'available' },
  { id: 'seat-006', studyRoomId: 'room-002', seatNumber: 'B-01', status: 'available' },
  { id: 'seat-007', studyRoomId: 'room-002', seatNumber: 'B-02', status: 'occupied' },
  { id: 'seat-008', studyRoomId: 'room-002', seatNumber: 'B-03', status: 'available' },
  { id: 'seat-009', studyRoomId: 'room-002', seatNumber: 'B-04', status: 'occupied' },
  { id: 'seat-010', studyRoomId: 'room-003', seatNumber: 'C-01', status: 'available' },
  { id: 'seat-011', studyRoomId: 'room-003', seatNumber: 'C-02', status: 'occupied' },
  { id: 'seat-012', studyRoomId: 'room-003', seatNumber: 'C-03', status: 'maintenance' },
]

const seatAssignments: SeatAssignment[] = [
  { id: 'assign-001', seatId: 'seat-002', studentId: 'stu-003', requestId: 'req-003', assignedAt: daysAgo(6), releasedAt: null, changeReason: '书桌维修期间临时安排' },
  { id: 'assign-002', seatId: 'seat-007', studentId: 'stu-004', requestId: 'req-004', assignedAt: daysAgo(5), releasedAt: null, changeReason: '窗户维修期间临时安排' },
  { id: 'assign-003', seatId: 'seat-009', studentId: 'stu-009', requestId: 'req-009', assignedAt: daysAgo(1), releasedAt: null, changeReason: '日光灯维修候补期间安排自习' },
  { id: 'assign-004', seatId: 'seat-011', studentId: 'stu-005', requestId: 'req-005', assignedAt: daysAgo(4), releasedAt: null, changeReason: '梯子维修期间临时安排' },
  { id: 'assign-005', seatId: 'seat-005', studentId: 'stu-008', requestId: 'req-008', assignedAt: daysAgo(2), releasedAt: hoursAgo(12), changeReason: '门锁维修期间临时安排，已释放' },
]

const users: User[] = [
  { id: 'user-001', userName: 'admin', passwordHash: 'hashed_admin_password', role: 'admin', displayName: '系统管理员', createdAt: daysAgo(120) },
  { id: 'user-002', userName: 'dorm_manager', passwordHash: 'hashed_manager_password', role: 'dorm_manager', displayName: '宿管老师', createdAt: daysAgo(120) },
]

const notifications: Notification[] = [
  { id: 'notif-001', userId: 'user-002', type: 'status_change', title: '新报修申请待审核', message: '张三提交了水龙头漏水报修，请尽快审核', relatedRequestId: 'req-001', isRead: true, createdAt: daysAgo(10) },
  { id: 'notif-002', userId: 'user-002', type: 'identity_result', title: '身份审核不通过', message: '周九的报修申请身份审核未通过，原因：重复提交', relatedRequestId: 'req-007', isRead: true, createdAt: daysAgo(11) },
  { id: 'notif-003', userId: 'user-001', type: 'quota_alert', title: '名额预警', message: '7号楼家具类维修名额已用完，新申请将进入候补', relatedRequestId: 'req-014', isRead: true, createdAt: daysAgo(3) },
  { id: 'notif-004', userId: 'user-002', type: 'processing_reminder', title: '维修超时提醒', message: '李四的插座维修已处理4天，请关注进度', relatedRequestId: 'req-002', isRead: false, createdAt: hoursAgo(6) },
  { id: 'notif-005', userId: 'user-002', type: 'status_change', title: '新报修申请待审核', message: '赵六提交了淋浴花洒报修，请尽快审核', relatedRequestId: 'req-016', isRead: false, createdAt: hoursAgo(3) },
  { id: 'notif-006', userId: 'user-001', type: 'quota_alert', title: '名额接近上限', message: '1号楼水管类维修名额使用率已达80%', relatedRequestId: '', isRead: false, createdAt: daysAgo(1) },
]

export const store = {
  students: {
    getAll: (): Student[] => [...students],
    getById: (id: string): Student | undefined => students.find(s => s.id === id),
    getByStudentNumber: (num: string): Student | undefined => students.find(s => s.studentNumber === num),
    create: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
      const student: Student = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
      students.push(student)
      return student
    },
    update: (id: string, data: Partial<Student>): Student | undefined => {
      const idx = students.findIndex(s => s.id === id)
      if (idx === -1) return undefined
      students[idx] = { ...students[idx], ...data, updatedAt: now }
      return students[idx]
    },
    delete: (id: string): boolean => {
      const idx = students.findIndex(s => s.id === id)
      if (idx === -1) return false
      students.splice(idx, 1)
      return true
    },
  },

  repairRequests: {
    getAll: (): RepairRequest[] => [...repairRequests],
    getById: (id: string): RepairRequest | undefined => repairRequests.find(r => r.id === id),
    create: (data: Omit<RepairRequest, 'id' | 'createdAt' | 'updatedAt'>): RepairRequest => {
      const req: RepairRequest = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
      repairRequests.push(req)
      return req
    },
    update: (id: string, data: Partial<RepairRequest>): RepairRequest | undefined => {
      const idx = repairRequests.findIndex(r => r.id === id)
      if (idx === -1) return undefined
      repairRequests[idx] = { ...repairRequests[idx], ...data, updatedAt: now }
      return repairRequests[idx]
    },
    delete: (id: string): boolean => {
      const idx = repairRequests.findIndex(r => r.id === id)
      if (idx === -1) return false
      repairRequests.splice(idx, 1)
      return true
    },
  },

  photos: {
    getAll: (): PhotoInfo[] => [...photos],
    getByRequestId: (requestId: string): PhotoInfo[] => photos.filter(p => p.requestId === requestId),
    getById: (id: string): PhotoInfo | undefined => photos.find(p => p.id === id),
    create: (data: Omit<PhotoInfo, 'id' | 'uploadedAt'>): PhotoInfo => {
      const photo: PhotoInfo = { ...data, id: uuidv4(), uploadedAt: now }
      photos.push(photo)
      return photo
    },
    delete: (id: string): boolean => {
      const idx = photos.findIndex(p => p.id === id)
      if (idx === -1) return false
      photos.splice(idx, 1)
      return true
    },
  },

  flowRecords: {
    getAll: (): FlowRecord[] => [...flowRecords],
    getByRequestId: (requestId: string): FlowRecord[] => flowRecords.filter(f => f.requestId === requestId),
    getById: (id: string): FlowRecord | undefined => flowRecords.find(f => f.id === id),
    create: (data: Omit<FlowRecord, 'id' | 'createdAt'>): FlowRecord => {
      const record: FlowRecord = { ...data, id: uuidv4(), createdAt: now }
      flowRecords.push(record)
      return record
    },
  },

  quotaConfigs: {
    getAll: (): QuotaConfig[] => [...quotaConfigs],
    getById: (id: string): QuotaConfig | undefined => quotaConfigs.find(q => q.id === id),
    create: (data: Omit<QuotaConfig, 'id' | 'updatedAt'>): QuotaConfig => {
      const config: QuotaConfig = { ...data, id: uuidv4(), updatedAt: now }
      quotaConfigs.push(config)
      return config
    },
    update: (id: string, data: Partial<QuotaConfig>): QuotaConfig | undefined => {
      const idx = quotaConfigs.findIndex(q => q.id === id)
      if (idx === -1) return undefined
      quotaConfigs[idx] = { ...quotaConfigs[idx], ...data, updatedAt: now }
      return quotaConfigs[idx]
    },
    delete: (id: string): boolean => {
      const idx = quotaConfigs.findIndex(q => q.id === id)
      if (idx === -1) return false
      quotaConfigs.splice(idx, 1)
      return true
    },
    findByBuildingAndType: (building: string, repairType: string): QuotaConfig | undefined =>
      quotaConfigs.find(q => q.building === building && q.repairType === repairType),
  },

  checkInRecords: {
    getAll: (): CheckInRecord[] => [...checkInRecords],
    getByStudentId: (studentId: string): CheckInRecord[] => checkInRecords.filter(c => c.studentId === studentId),
    getByRequestId: (requestId: string): CheckInRecord[] => checkInRecords.filter(c => c.requestId === requestId),
    create: (data: Omit<CheckInRecord, 'id'>): CheckInRecord => {
      const record: CheckInRecord = { ...data, id: uuidv4() }
      checkInRecords.push(record)
      return record
    },
  },

  studyRooms: {
    getAll: (): StudyRoom[] => [...studyRooms],
    getById: (id: string): StudyRoom | undefined => studyRooms.find(r => r.id === id),
    create: (data: Omit<StudyRoom, 'id'>): StudyRoom => {
      const room: StudyRoom = { ...data, id: uuidv4() }
      studyRooms.push(room)
      return room
    },
  },

  seats: {
    getAll: (): Seat[] => [...seats],
    getByStudyRoomId: (studyRoomId: string): Seat[] => seats.filter(s => s.studyRoomId === studyRoomId),
    getById: (id: string): Seat | undefined => seats.find(s => s.id === id),
    create: (data: Omit<Seat, 'id'>): Seat => {
      const seat: Seat = { ...data, id: uuidv4() }
      seats.push(seat)
      return seat
    },
    update: (id: string, data: Partial<Seat>): Seat | undefined => {
      const idx = seats.findIndex(s => s.id === id)
      if (idx === -1) return undefined
      seats[idx] = { ...seats[idx], ...data }
      return seats[idx]
    },
  },

  seatAssignments: {
    getAll: (): SeatAssignment[] => [...seatAssignments],
    getByStudentId: (studentId: string): SeatAssignment[] => seatAssignments.filter(a => a.studentId === studentId),
    getByRequestId: (requestId: string): SeatAssignment[] => seatAssignments.filter(a => a.requestId === requestId),
    getById: (id: string): SeatAssignment | undefined => seatAssignments.find(a => a.id === id),
    create: (data: Omit<SeatAssignment, 'id'>): SeatAssignment => {
      const assignment: SeatAssignment = { ...data, id: uuidv4() }
      seatAssignments.push(assignment)
      return assignment
    },
    update: (id: string, data: Partial<SeatAssignment>): SeatAssignment | undefined => {
      const idx = seatAssignments.findIndex(a => a.id === id)
      if (idx === -1) return undefined
      seatAssignments[idx] = { ...seatAssignments[idx], ...data }
      return seatAssignments[idx]
    },
  },

  users: {
    getAll: (): User[] => [...users],
    getById: (id: string): User | undefined => users.find(u => u.id === id),
    getByUserName: (userName: string): User | undefined => users.find(u => u.userName === userName),
    create: (data: Omit<User, 'id' | 'createdAt'>): User => {
      const user: User = { ...data, id: uuidv4(), createdAt: now }
      users.push(user)
      return user
    },
  },

  notifications: {
    getAll: (): Notification[] => [...notifications],
    getByUserId: (userId: string): Notification[] => notifications.filter(n => n.userId === userId),
    getById: (id: string): Notification | undefined => notifications.find(n => n.id === id),
    create: (data: Omit<Notification, 'id' | 'createdAt'>): Notification => {
      const notif: Notification = { ...data, id: uuidv4(), createdAt: now }
      notifications.push(notif)
      return notif
    },
    update: (id: string, data: Partial<Notification>): Notification | undefined => {
      const idx = notifications.findIndex(n => n.id === id)
      if (idx === -1) return undefined
      notifications[idx] = { ...notifications[idx], ...data }
      return notifications[idx]
    },
  },
}
