import User, { UserRole } from '~/server/models/User'
import Point from '~/server/models/Point'
import Task, { TaskType, TaskStatus } from '~/server/models/Task'
import { generateTaskNumber } from '~/server/utils/auth'

const communities = ['阳光社区', '和平社区', '幸福社区', '新华社区']
const propertyCompanies = ['绿源物业', '安居物业', '恒信物业', '家兴物业']

const users = [
  {
    username: 'admin',
    password: '123456',
    name: '张管理员',
    phone: '13800000001',
    role: UserRole.STREET_ADMIN,
    community: '阳光社区'
  },
  {
    username: 'grid1',
    password: '123456',
    name: '李网格员',
    phone: '13800000002',
    role: UserRole.GRID_MEMBER,
    community: '阳光社区',
    gridArea: 'A区'
  },
  {
    username: 'grid2',
    password: '123456',
    name: '王网格员',
    phone: '13800000003',
    role: UserRole.GRID_MEMBER,
    community: '和平社区',
    gridArea: 'B区'
  },
  {
    username: 'property1',
    password: '123456',
    name: '赵物业',
    phone: '13800000004',
    role: UserRole.PROPERTY,
    propertyCompany: '绿源物业'
  },
  {
    username: 'property2',
    password: '123456',
    name: '孙物业',
    phone: '13800000005',
    role: UserRole.PROPERTY,
    propertyCompany: '安居物业'
  },
  {
    username: 'property3',
    password: '123456',
    name: '周物业',
    phone: '13800000006',
    role: UserRole.PROPERTY,
    propertyCompany: '恒信物业'
  }
]

const points = [
  {
    name: '1号垃圾桶点位',
    address: '阳光路1号门口',
    community: '阳光社区',
    location: { type: 'Point', coordinates: [116.4074, 39.9042] },
    binTypes: ['厨余垃圾', '其他垃圾', '可回收物', '有害垃圾'],
    propertyCompany: '绿源物业',
    contactPerson: '赵经理',
    contactPhone: '13800000010'
  },
  {
    name: '2号垃圾桶点位',
    address: '阳光路5号院内',
    community: '阳光社区',
    location: { type: 'Point', coordinates: [116.4084, 39.9052] },
    binTypes: ['厨余垃圾', '其他垃圾'],
    propertyCompany: '绿源物业',
    contactPerson: '赵经理',
    contactPhone: '13800000010'
  },
  {
    name: '3号垃圾桶点位',
    address: '和平街8号楼前',
    community: '和平社区',
    location: { type: 'Point', coordinates: [116.4064, 39.9032] },
    binTypes: ['厨余垃圾', '其他垃圾', '可回收物'],
    propertyCompany: '安居物业',
    contactPerson: '钱经理',
    contactPhone: '13800000011'
  },
  {
    name: '4号垃圾桶点位',
    address: '幸福巷3号',
    community: '幸福社区',
    location: { type: 'Point', coordinates: [116.4094, 39.9062] },
    binTypes: ['厨余垃圾', '其他垃圾', '可回收物', '有害垃圾'],
    propertyCompany: '恒信物业',
    contactPerson: '孙经理',
    contactPhone: '13800000012'
  },
  {
    name: '5号垃圾桶点位',
    address: '新华路12号',
    community: '新华社区',
    location: { type: 'Point', coordinates: [116.4054, 39.9022] },
    binTypes: ['厨余垃圾', '其他垃圾'],
    propertyCompany: '家兴物业',
    contactPerson: '李经理',
    contactPhone: '13800000013'
  }
]

const samplePhotos = [
  { url: 'https://picsum.photos/seed/waste1/600/400', caption: '现场照片1' },
  { url: 'https://picsum.photos/seed/waste2/600/400', caption: '现场照片2' },
  { url: 'https://picsum.photos/seed/waste3/600/400', caption: '整改后照片1' },
  { url: 'https://picsum.photos/seed/waste4/600/400', caption: '整改后照片2' }
]

export default defineEventHandler(async () => {
  await User.deleteMany({})
  await Point.deleteMany({})
  await Task.deleteMany({})
  
  const createdUsers = await User.create(users)
  const createdPoints = await Point.create(points)
  
  const gridMember = createdUsers.find(u => u.username === 'grid1')!
  const gridMember2 = createdUsers.find(u => u.username === 'grid2')!
  const property1 = createdUsers.find(u => u.username === 'property1')!
  const property2 = createdUsers.find(u => u.username === 'property2')!
  const admin = createdUsers.find(u => u.username === 'admin')!
  
  const point1 = createdPoints[0]
  const point2 = createdPoints[1]
  const point3 = createdPoints[2]
  const point4 = createdPoints[3]
  
  const now = new Date()
  const deadlineHours = 24
  
  const tasks = []
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point1._id,
    pointName: point1.name,
    community: point1.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: '发现厨余垃圾桶中有大量塑料瓶和纸巾，居民未正确分类',
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: now, caption: samplePhotos[0].caption }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), caption: samplePhotos[2].caption }
    ],
    status: TaskStatus.CLOSED,
    propertyCompany: point1.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: 'pass',
      reason: '整改到位，分类正确',
      photos: [],
      reviewedAt: new Date(now.getTime() + 4 * 60 * 60 * 1000)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: now, note: '任务提交' },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 30 * 60 * 1000), note: '物业认领任务' },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), note: '提交整改完成' },
      { status: TaskStatus.CLOSED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() + 4 * 60 * 60 * 1000), note: '复查通过，任务关闭' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.BIN_FULL,
    pointId: point1._id,
    pointName: point1.name,
    community: point1.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: '其他垃圾桶已满，垃圾溢出到地面',
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), caption: samplePhotos[1].caption }
    ],
    afterPhotos: [
      { url: samplePhotos[3].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() + 30 * 60 * 1000), caption: samplePhotos[3].caption }
    ],
    status: TaskStatus.PENDING_REVIEW,
    propertyCompany: point1.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), note: '任务提交' },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 30 * 60 * 1000), note: '物业认领任务' },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() + 30 * 60 * 1000), note: '提交整改完成' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.POINT_DAMAGED,
    pointId: point2._id,
    pointName: point2.name,
    community: point2.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: '垃圾桶柜门损坏，无法正常关闭',
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), caption: '柜门损坏照片' }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property1._id, uploadedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), caption: '临时修复照片' }
    ],
    status: TaskStatus.REJECTED,
    propertyCompany: point2.propertyCompany,
    assigneeId: property1._id,
    assigneeName: property1.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    rejectReason: '只是用铁丝临时固定，需要更换新的柜门',
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: 'fail',
      reason: '只是用铁丝临时固定，需要更换新的柜门',
      photos: [
        { url: samplePhotos[1].url, uploadedBy: admin._id, uploadedAt: new Date(now.getTime() - 30 * 60 * 1000), caption: '复查照片' }
      ],
      reviewedAt: new Date(now.getTime() - 30 * 60 * 1000)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), note: '任务提交' },
      { status: TaskStatus.CLAIMED, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), note: '物业认领任务' },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property1._id, changedByName: property1.name, changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), note: '提交整改完成' },
      { status: TaskStatus.REJECTED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 30 * 60 * 1000), note: '复查不通过：只是用铁丝临时固定，需要更换新的柜门' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point3._id,
    pointName: point3.name,
    community: point3.community,
    submitterId: gridMember2._id,
    submitterName: gridMember2.name,
    description: '可回收物桶中有餐厨垃圾，需要加强宣传',
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember2._id, uploadedAt: new Date(now.getTime() - 30 * 60 * 1000), caption: '误投照片' }
    ],
    afterPhotos: [],
    status: TaskStatus.SUBMITTED,
    propertyCompany: point3.propertyCompany,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember2._id, changedByName: gridMember2.name, changedAt: new Date(now.getTime() - 30 * 60 * 1000), note: '任务提交' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.BIN_FULL,
    pointId: point4._id,
    pointName: point4.name,
    community: point4.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: '所有垃圾桶均已满，长时间未清运',
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), caption: '垃圾桶满溢照片' }
    ],
    afterPhotos: [],
    status: TaskStatus.ESCALATED,
    propertyCompany: point4.propertyCompany,
    deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    isEscalated: true,
    escalationReason: '逾期未处理',
    escalationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), note: '任务提交' },
      { status: TaskStatus.ESCALATED, changedBy: gridMember._id, changedByName: '系统', changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), note: '系统自动升级：任务逾期未处理' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.MISSED_SORT,
    pointId: point2._id,
    pointName: point2.name,
    community: point2.community,
    submitterId: gridMember._id,
    submitterName: gridMember.name,
    description: '发现有害垃圾和其他垃圾混投',
    beforePhotos: [
      { url: samplePhotos[1].url, uploadedBy: gridMember._id, uploadedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), caption: '混投照片' }
    ],
    afterPhotos: [],
    status: TaskStatus.CANCELLED,
    propertyCompany: point2.propertyCompany,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    reviewRecords: [],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), note: '任务提交' },
      { status: TaskStatus.CANCELLED, changedBy: gridMember._id, changedByName: gridMember.name, changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), note: '任务撤回：居民已自行整改' }
    ]
  })
  
  tasks.push({
    taskNumber: generateTaskNumber(),
    type: TaskType.POINT_DAMAGED,
    pointId: point3._id,
    pointName: point3.name,
    community: point3.community,
    submitterId: gridMember2._id,
    submitterName: gridMember2.name,
    description: '分类标识牌脱落，需要重新安装',
    beforePhotos: [
      { url: samplePhotos[0].url, uploadedBy: gridMember2._id, uploadedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), caption: '标识牌脱落' }
    ],
    afterPhotos: [
      { url: samplePhotos[2].url, uploadedBy: property2._id, uploadedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), caption: '第一次整改' }
    ],
    status: TaskStatus.CLAIMED,
    propertyCompany: point3.propertyCompany,
    assigneeId: property2._id,
    assigneeName: property2.name,
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    isEscalated: false,
    rejectReason: '标识牌安装不牢固',
    reviewRecords: [{
      reviewerId: admin._id,
      reviewerName: admin.name,
      result: 'fail',
      reason: '标识牌安装不牢固，有脱落风险',
      photos: [],
      reviewedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
    }],
    history: [
      { status: TaskStatus.SUBMITTED, changedBy: gridMember2._id, changedByName: gridMember2.name, changedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), note: '任务提交' },
      { status: TaskStatus.CLAIMED, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 4.5 * 60 * 60 * 1000), note: '物业认领任务' },
      { status: TaskStatus.PENDING_REVIEW, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), note: '提交整改完成' },
      { status: TaskStatus.REJECTED, changedBy: admin._id, changedByName: admin.name, changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), note: '复查不通过：标识牌安装不牢固' },
      { status: TaskStatus.CLAIMED, changedBy: property2._id, changedByName: property2.name, changedAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000), note: '重新认领，继续整改' }
    ]
  })
  
  await Task.create(tasks)
  
  return {
    success: true,
    message: '演示数据初始化完成',
    data: {
      users: createdUsers.length,
      points: createdPoints.length,
      tasks: tasks.length
    },
    accounts: [
      { username: 'admin', password: '123456', role: '街道管理员' },
      { username: 'grid1', password: '123456', role: '网格员（阳光社区）' },
      { username: 'grid2', password: '123456', role: '网格员（和平社区）' },
      { username: 'property1', password: '123456', role: '物业（绿源物业）' },
      { username: 'property2', password: '123456', role: '物业（安居物业）' },
      { username: 'property3', password: '123456', role: '物业（恒信物业）' }
    ]
  }
})
