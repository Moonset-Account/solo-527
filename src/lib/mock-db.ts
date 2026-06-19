import { UserRole, ContractStatus, RiskLevel, ReminderType, OperationType, MaterialStatus, ReminderChannel } from '@prisma/client';

let data = {
  users: [
    {
      id: 'user-1',
      email: 'legal@example.com',
      name: '张法务',
      role: UserRole.LEGAL_MANAGER,
      avatarUrl: null,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'user-2',
      email: 'probono@example.com',
      name: '李公益',
      role: UserRole.PRO_BONO_LAWYER,
      avatarUrl: null,
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
    {
      id: 'user-3',
      email: 'reviewer@example.com',
      name: '王审阅',
      role: UserRole.REVIEWER,
      avatarUrl: null,
      createdAt: new Date('2024-01-03').toISOString(),
      updatedAt: new Date('2024-01-03').toISOString(),
    },
    {
      id: 'user-4',
      email: 'admin@example.com',
      name: '系统管理员',
      role: UserRole.ADMIN,
      avatarUrl: null,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
  ],
  rolePermissions: [
    {
      id: 'rp-1',
      role: UserRole.LEGAL_MANAGER,
      canUpload: true,
      canReview: true,
      canApprove: true,
      canManageRules: true,
      canManageUsers: true,
      canViewDashboard: true,
      canDownload: true,
      canStamp: true,
      canViewLogs: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rp-2',
      role: UserRole.PRO_BONO_LAWYER,
      canUpload: true,
      canReview: true,
      canApprove: false,
      canManageRules: false,
      canManageUsers: false,
      canViewDashboard: true,
      canDownload: true,
      canStamp: false,
      canViewLogs: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rp-3',
      role: UserRole.REVIEWER,
      canUpload: false,
      canReview: true,
      canApprove: false,
      canManageRules: false,
      canManageUsers: false,
      canViewDashboard: false,
      canDownload: true,
      canStamp: false,
      canViewLogs: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rp-4',
      role: UserRole.ADMIN,
      canUpload: true,
      canReview: true,
      canApprove: true,
      canManageRules: true,
      canManageUsers: true,
      canViewDashboard: true,
      canDownload: true,
      canStamp: true,
      canViewLogs: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  contracts: [
    {
      id: 'contract-1',
      title: '公益法律服务合作框架协议',
      contractNumber: 'GY-2024-001',
      description: '关于社区公益法律服务的框架合作协议，涉及多方权益保障',
      fileUrl: '/uploads/contract1.pdf',
      fileName: '公益法律服务合作框架协议.pdf',
      fileSize: 245678,
      version: 1,
      status: ContractStatus.UNDER_REVIEW,
      riskLevel: RiskLevel.MEDIUM,
      riskDescription: '存在违约责任条款不明确的风险',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      materialComplete: false,
      uploaderId: 'user-1',
      assigneeId: 'user-2',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'contract-2',
      title: '企业劳动合同模板修订版',
      contractNumber: 'LD-2024-015',
      description: '标准劳动合同模板，2024年度修订版本',
      fileUrl: '/uploads/contract2.pdf',
      fileName: '企业劳动合同模板.pdf',
      fileSize: 189023,
      version: 2,
      status: ContractStatus.PENDING_REVIEW,
      riskLevel: RiskLevel.LOW,
      riskDescription: null,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      materialComplete: true,
      uploaderId: 'user-1',
      assigneeId: 'user-3',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'contract-3',
      title: '房屋租赁合同-公益用途',
      contractNumber: 'ZF-2024-008',
      description: '社区服务中心办公场地租赁协议，公益性质',
      fileUrl: '/uploads/contract3.pdf',
      fileName: '房屋租赁合同.pdf',
      fileSize: 312456,
      version: 1,
      status: ContractStatus.REVISE_REQUESTED,
      riskLevel: RiskLevel.HIGH,
      riskDescription: '租金调整条款存在重大漏洞，需重新评估',
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      materialComplete: false,
      uploaderId: 'user-2',
      assigneeId: 'user-1',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'contract-4',
      title: '捐赠协议-慈善基金会',
      contractNumber: 'JZ-2024-023',
      description: '某慈善基金会定向捐赠协议',
      fileUrl: '/uploads/contract4.pdf',
      fileName: '捐赠协议.pdf',
      fileSize: 156789,
      version: 1,
      status: ContractStatus.APPROVED,
      riskLevel: RiskLevel.LOW,
      riskDescription: null,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      materialComplete: true,
      uploaderId: 'user-1',
      assigneeId: 'user-2',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'contract-5',
      title: '知识产权许可协议',
      contractNumber: 'ZS-2024-005',
      description: '软件著作权许可使用协议，涉及公益项目',
      fileUrl: '/uploads/contract5.pdf',
      fileName: '知识产权许可协议.pdf',
      fileSize: 278901,
      version: 1,
      status: ContractStatus.DRAFT,
      riskLevel: null,
      riskDescription: null,
      deadline: null,
      materialComplete: false,
      uploaderId: 'user-2',
      assigneeId: null,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'contract-6',
      title: '志愿服务协议范本',
      contractNumber: 'ZY-2024-012',
      description: '标准化志愿服务协议模板',
      fileUrl: '/uploads/contract6.pdf',
      fileName: '志愿服务协议.pdf',
      fileSize: 134567,
      version: 3,
      status: ContractStatus.STAMPED,
      riskLevel: RiskLevel.LOW,
      riskDescription: null,
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      materialComplete: true,
      uploaderId: 'user-1',
      assigneeId: 'user-2',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  contractReviews: [
    {
      id: 'review-1',
      contractId: 'contract-1',
      reviewerId: 'user-2',
      comment: '合同框架基本合理，但需补充服务质量评估标准条款。',
      suggestions: '建议增加第4.2条服务质量考核指标',
      riskLevel: RiskLevel.MEDIUM,
      isApproved: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'review-2',
      contractId: 'contract-3',
      reviewerId: 'user-1',
      comment: '租金条款存在重大风险，建议重新谈判后再提交。',
      suggestions: '第3.1条年租金涨幅不得超过5%的条款需要修改',
      riskLevel: RiskLevel.HIGH,
      isApproved: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'review-3',
      contractId: 'contract-4',
      reviewerId: 'user-1',
      comment: '捐赠协议合规，条款完整。',
      suggestions: null,
      riskLevel: RiskLevel.LOW,
      isApproved: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'review-4',
      contractId: 'contract-1',
      reviewerId: 'user-3',
      comment: '建议补充争议解决方式条款。',
      suggestions: '增加仲裁条款，约定由北京仲裁委员会管辖',
      riskLevel: RiskLevel.LOW,
      isApproved: null,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  reminderRules: [
    {
      id: 'rule-1',
      name: '审阅截止前24小时提醒',
      type: ReminderType.REVIEW_DEADLINE,
      description: '在合同审阅截止日期前24小时发送系统提醒',
      isEnabled: true,
      beforeHours: 24,
      channel: ReminderChannel.SYSTEM,
      template: '您有待审阅合同即将到期，请及时处理',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule-2',
      name: '材料不完整提醒',
      type: ReminderType.MATERIAL_INCOMPLETE,
      description: '当合同证据材料不完整时发送提醒',
      isEnabled: true,
      beforeHours: 0,
      channel: ReminderChannel.SYSTEM,
      template: '合同材料不完整，请补充相关证据材料',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule-3',
      name: '高风险合同预警',
      type: ReminderType.RISK_ALERT,
      description: '当合同被标记为高风险或严重风险时立即提醒',
      isEnabled: true,
      beforeHours: 0,
      channel: ReminderChannel.SYSTEM,
      template: '合同被标记为高风险，请重点关注',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule-4',
      name: '盖章节点提醒',
      type: ReminderType.STAMP_DEADLINE,
      description: '盖章节点前12小时提醒相关人员',
      isEnabled: true,
      beforeHours: 12,
      channel: ReminderChannel.EMAIL,
      template: '盖章节点即将到达，请准备相关材料',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule-5',
      name: '审阅效率提醒',
      type: ReminderType.EFFICIENCY_REMINDER,
      description: '当审阅时长超过平均水平时提醒',
      isEnabled: false,
      beforeHours: 0,
      channel: ReminderChannel.SYSTEM,
      template: '您有待处理的审阅任务已超过平均处理时间',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  reminders: [
    {
      id: 'reminder-1',
      ruleId: 'rule-1',
      type: ReminderType.REVIEW_DEADLINE,
      userId: 'user-2',
      contractId: 'contract-1',
      title: '审阅即将到期',
      message: '《公益法律服务合作框架协议》还有2天到期，请尽快处理',
      isRead: false,
      isSent: true,
      scheduledAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-2',
      ruleId: 'rule-2',
      type: ReminderType.MATERIAL_INCOMPLETE,
      userId: 'user-1',
      contractId: 'contract-3',
      title: '材料不完整提醒',
      message: '《房屋租赁合同-公益用途》证据材料不完整，请补充相关材料',
      isRead: false,
      isSent: true,
      scheduledAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-3',
      ruleId: 'rule-3',
      type: ReminderType.RISK_ALERT,
      userId: 'user-1',
      contractId: 'contract-3',
      title: '高风险预警',
      message: '《房屋租赁合同-公益用途》被标记为高风险，请重点关注',
      isRead: false,
      isSent: true,
      scheduledAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-4',
      ruleId: 'rule-1',
      type: ReminderType.REVIEW_DEADLINE,
      userId: 'user-1',
      contractId: 'contract-3',
      title: '审阅即将到期',
      message: '《房屋租赁合同-公益用途》还有1天到期，请尽快处理修改意见',
      isRead: true,
      isSent: true,
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-5',
      ruleId: 'rule-2',
      type: ReminderType.MATERIAL_INCOMPLETE,
      userId: 'user-2',
      contractId: 'contract-5',
      title: '材料不完整提醒',
      message: '《知识产权许可协议》证据材料待上传',
      isRead: true,
      isSent: true,
      scheduledAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
  evidenceMaterials: [
    {
      id: 'material-1',
      contractId: 'contract-1',
      name: '合作方资质证明',
      fileUrl: '/uploads/material1.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.VERIFIED,
      description: '合作方法人营业执照复印件',
      uploaderId: 'user-1',
      verifierId: 'user-1',
      verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'material-2',
      contractId: 'contract-1',
      name: '项目立项批文',
      fileUrl: '/uploads/material2.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.UPLOADED,
      description: '上级主管部门项目立项批复',
      uploaderId: 'user-2',
      verifierId: null,
      verifiedAt: null,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'material-3',
      contractId: 'contract-1',
      name: '双方会谈纪要',
      fileUrl: '/uploads/material3.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.PENDING,
      description: '合作谈判过程中的会议记录',
      uploaderId: 'user-1',
      verifierId: null,
      verifiedAt: null,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'material-4',
      contractId: 'contract-3',
      name: '房产证复印件',
      fileUrl: '/uploads/material4.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.PENDING,
      description: '出租方房屋产权证明',
      uploaderId: 'user-2',
      verifierId: null,
      verifiedAt: null,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'material-5',
      contractId: 'contract-3',
      name: '租赁用途证明',
      fileUrl: '/uploads/material5.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.REJECTED,
      description: '公益用途相关证明材料',
      uploaderId: 'user-2',
      verifierId: 'user-1',
      verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'material-6',
      contractId: 'contract-4',
      name: '捐赠方资质文件',
      fileUrl: '/uploads/material6.pdf',
      fileType: 'application/pdf',
      status: MaterialStatus.VERIFIED,
      description: '慈善基金会法人登记证书',
      uploaderId: 'user-1',
      verifierId: 'user-1',
      verifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  stampNodes: [
    {
      id: 'stamp-1',
      contractId: 'contract-1',
      nodeName: '部门初审章',
      orderIndex: 1,
      isCompleted: true,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      stampUserId: 'user-1',
      remark: '初审通过，材料基本齐全',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stamp-2',
      contractId: 'contract-1',
      nodeName: '法务审核章',
      orderIndex: 2,
      isCompleted: false,
      completedAt: null,
      stampUserId: null,
      remark: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stamp-3',
      contractId: 'contract-1',
      nodeName: '公章',
      orderIndex: 3,
      isCompleted: false,
      completedAt: null,
      stampUserId: null,
      remark: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stamp-4',
      contractId: 'contract-6',
      nodeName: '部门初审章',
      orderIndex: 1,
      isCompleted: true,
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      stampUserId: 'user-1',
      remark: '通过',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stamp-5',
      contractId: 'contract-6',
      nodeName: '法务审核章',
      orderIndex: 2,
      isCompleted: true,
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      stampUserId: 'user-1',
      remark: '法务审核通过',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stamp-6',
      contractId: 'contract-6',
      nodeName: '公章',
      orderIndex: 3,
      isCompleted: true,
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      stampUserId: 'user-4',
      remark: '盖章完成',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  downloadRecords: [
    {
      id: 'dl-1',
      contractId: 'contract-1',
      userId: 'user-2',
      fileName: '公益法律服务合作框架协议.pdf',
      downloadAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.100',
    },
    {
      id: 'dl-2',
      contractId: 'contract-1',
      userId: 'user-1',
      fileName: '公益法律服务合作框架协议.pdf',
      downloadAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.101',
    },
    {
      id: 'dl-3',
      contractId: 'contract-3',
      userId: 'user-1',
      fileName: '房屋租赁合同.pdf',
      downloadAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.101',
    },
    {
      id: 'dl-4',
      contractId: 'contract-4',
      userId: 'user-2',
      fileName: '捐赠协议.pdf',
      downloadAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.102',
    },
    {
      id: 'dl-5',
      contractId: 'contract-2',
      userId: 'user-3',
      fileName: '企业劳动合同模板.pdf',
      downloadAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.103',
    },
  ],
  operationLogs: [
    {
      id: 'log-1',
      operationType: OperationType.UPLOAD,
      userId: 'user-1',
      contractId: 'contract-1',
      description: '上传合同《公益法律服务合作框架协议》',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-2',
      operationType: OperationType.VIEW,
      userId: 'user-2',
      contractId: 'contract-1',
      description: '查看合同《公益法律服务合作框架协议》',
      ipAddress: '192.168.1.100',
      userAgent: 'Firefox/121.0',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-3',
      operationType: OperationType.REVIEW,
      userId: 'user-2',
      contractId: 'contract-1',
      description: '提交审阅意见：补充服务质量评估标准',
      ipAddress: '192.168.1.100',
      userAgent: 'Firefox/121.0',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-4',
      operationType: OperationType.DOWNLOAD,
      userId: 'user-2',
      contractId: 'contract-1',
      description: '下载合同文件',
      ipAddress: '192.168.1.100',
      userAgent: 'Firefox/121.0',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-5',
      operationType: OperationType.REVIEW,
      userId: 'user-1',
      contractId: 'contract-3',
      description: '标记高风险并驳回：租金条款存在重大漏洞',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-6',
      operationType: OperationType.RISK_FLAG,
      userId: 'user-1',
      contractId: 'contract-3',
      description: '将合同风险等级标记为高风险',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-7',
      operationType: OperationType.APPROVE,
      userId: 'user-1',
      contractId: 'contract-4',
      description: '审批通过《捐赠协议-慈善基金会》',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-8',
      operationType: OperationType.STAMP,
      userId: 'user-1',
      contractId: 'contract-6',
      description: '完成部门初审盖章',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-9',
      operationType: OperationType.STAMP,
      userId: 'user-1',
      contractId: 'contract-6',
      description: '完成法务审核盖章',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-10',
      operationType: OperationType.STAMP,
      userId: 'user-4',
      contractId: 'contract-6',
      description: '完成公章盖章',
      ipAddress: '192.168.1.200',
      userAgent: 'Safari/17.0',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-11',
      operationType: OperationType.UPDATE_RULE,
      userId: 'user-1',
      contractId: null,
      description: '更新提醒规则：审阅截止前24小时提醒',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-12',
      operationType: OperationType.UPDATE_PERMISSION,
      userId: 'user-4',
      contractId: null,
      description: '更新公益律师角色权限',
      ipAddress: '192.168.1.200',
      userAgent: 'Safari/17.0',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  efficiencyStats: [
    {
      id: 'stat-1',
      userId: 'user-1',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewCount: 3,
      avgReviewTime: 45,
      uploadCount: 2,
      stampCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'stat-2',
      userId: 'user-1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewCount: 2,
      avgReviewTime: 60,
      uploadCount: 1,
      stampCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'stat-3',
      userId: 'user-2',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewCount: 1,
      avgReviewTime: 90,
      uploadCount: 1,
      stampCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'stat-4',
      userId: 'user-3',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewCount: 2,
      avgReviewTime: 30,
      uploadCount: 0,
      stampCount: 0,
      createdAt: new Date().toISOString(),
    },
  ],
};

let nextIdCounter = 100;

function generateId(prefix: string) {
  nextIdCounter++;
  return `${prefix}-${nextIdCounter}`;
}

export const db = {
  users: {
    findMany: (params?: any) => {
      let result = [...data.users];
      if (params?.where) {
        if (params.where.role) {
          result = result.filter(u => u.role === params.where.role);
        }
        if (params.where.id) {
          result = result.filter(u => u.id === params.where.id);
        }
      }
      return result;
    },
    findUnique: (params: { where: { id?: string; email?: string } }) => {
      if (params.where.id) {
        return data.users.find(u => u.id === params.where.id) || null;
      }
      if (params.where.email) {
        return data.users.find(u => u.email === params.where.email) || null;
      }
      return null;
    },
  },
  contracts: {
    findMany: (params?: any) => {
      let result = [...data.contracts];
      if (params?.where) {
        if (params.where.status) {
          result = result.filter(c => c.status === params.where.status);
        }
        if (params.where.assigneeId) {
          result = result.filter(c => c.assigneeId === params.where.assigneeId);
        }
        if (params.where.uploaderId) {
          result = result.filter(c => c.uploaderId === params.where.uploaderId);
        }
        if (params.where.materialComplete !== undefined) {
          result = result.filter(c => c.materialComplete === params.where.materialComplete);
        }
        if (params.where.riskLevel) {
          result = result.filter(c => c.riskLevel === params.where.riskLevel);
        }
      }
      if (params?.orderBy) {
        const key = Object.keys(params.orderBy)[0];
        const dir = params.orderBy[key];
        result.sort((a: any, b: any) => {
          if (dir === 'desc') {
            return new Date(b[key]).getTime() - new Date(a[key]).getTime();
          }
          return new Date(a[key]).getTime() - new Date(b[key]).getTime();
        });
      }
      if (params?.take) {
        result = result.slice(0, params.take);
      }
      return result;
    },
    findUnique: (params: { where: { id: string } }) => {
      return data.contracts.find(c => c.id === params.where.id) || null;
    },
    create: (params: { data: any }) => {
      const newContract = {
        id: generateId('contract'),
        ...params.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.contracts.unshift(newContract);
      return newContract;
    },
    update: (params: { where: { id: string }; data: any }) => {
      const index = data.contracts.findIndex(c => c.id === params.where.id);
      if (index !== -1) {
        data.contracts[index] = { ...data.contracts[index], ...params.data, updatedAt: new Date().toISOString() };
        return data.contracts[index];
      }
      return null;
    },
    count: (params?: any) => {
      let result = [...data.contracts];
      if (params?.where) {
        if (params.where.status) {
          result = result.filter(c => c.status === params.where.status);
        }
        if (params.where.assigneeId) {
          result = result.filter(c => c.assigneeId === params.where.assigneeId);
        }
        if (params.where.materialComplete !== undefined) {
          result = result.filter(c => c.materialComplete === params.where.materialComplete);
        }
      }
      return result.length;
    },
  },
  contractReviews: {
    findMany: (params?: any) => {
      let result = [...data.contractReviews];
      if (params?.where?.contractId) {
        result = result.filter(r => r.contractId === params.where.contractId);
      }
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return result;
    },
    create: (params: { data: any }) => {
      const newReview = {
        id: generateId('review'),
        ...params.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.contractReviews.unshift(newReview);
      return newReview;
    },
  },
  reminderRules: {
    findMany: (params?: any) => {
      let result = [...data.reminderRules];
      if (params?.where?.isEnabled !== undefined) {
        result = result.filter(r => r.isEnabled === params.where.isEnabled);
      }
      if (params?.where?.type) {
        result = result.filter(r => r.type === params.where.type);
      }
      return result;
    },
    findUnique: (params: { where: { id: string } }) => {
      return data.reminderRules.find(r => r.id === params.where.id) || null;
    },
    create: (params: { data: any }) => {
      const newRule = {
        id: generateId('rule'),
        ...params.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.reminderRules.push(newRule);
      return newRule;
    },
    update: (params: { where: { id: string }; data: any }) => {
      const index = data.reminderRules.findIndex(r => r.id === params.where.id);
      if (index !== -1) {
        data.reminderRules[index] = { ...data.reminderRules[index], ...params.data, updatedAt: new Date().toISOString() };
        return data.reminderRules[index];
      }
      return null;
    },
  },
  reminders: {
    findMany: (params?: any) => {
      let result = [...data.reminders];
      if (params?.where?.userId) {
        result = result.filter(r => r.userId === params.where.userId);
      }
      if (params?.where?.isRead !== undefined) {
        result = result.filter(r => r.isRead === params.where.isRead);
      }
      if (params?.where?.contractId) {
        result = result.filter(r => r.contractId === params.where.contractId);
      }
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (params?.take) {
        result = result.slice(0, params.take);
      }
      return result;
    },
    findUnique: (params: { where: { id: string } }) => {
      return data.reminders.find(r => r.id === params.where.id) || null;
    },
    create: (params: { data: any }) => {
      const newReminder = {
        id: generateId('reminder'),
        ...params.data,
        createdAt: new Date().toISOString(),
      };
      data.reminders.unshift(newReminder);
      return newReminder;
    },
    update: (params: { where: { id: string }; data: any }) => {
      const index = data.reminders.findIndex(r => r.id === params.where.id);
      if (index !== -1) {
        data.reminders[index] = { ...data.reminders[index], ...params.data };
        return data.reminders[index];
      }
      return null;
    },
    count: (params?: any) => {
      let result = [...data.reminders];
      if (params?.where?.userId) {
        result = result.filter(r => r.userId === params.where.userId);
      }
      if (params?.where?.isRead !== undefined) {
        result = result.filter(r => r.isRead === params.where.isRead);
      }
      return result.length;
    },
  },
  evidenceMaterials: {
    findMany: (params?: any) => {
      let result = [...data.evidenceMaterials];
      if (params?.where?.contractId) {
        result = result.filter(m => m.contractId === params.where.contractId);
      }
      if (params?.where?.status) {
        result = result.filter(m => m.status === params.where.status);
      }
      return result;
    },
    create: (params: { data: any }) => {
      const newMaterial = {
        id: generateId('material'),
        ...params.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.evidenceMaterials.push(newMaterial);
      return newMaterial;
    },
    update: (params: { where: { id: string }; data: any }) => {
      const index = data.evidenceMaterials.findIndex(m => m.id === params.where.id);
      if (index !== -1) {
        data.evidenceMaterials[index] = { ...data.evidenceMaterials[index], ...params.data, updatedAt: new Date().toISOString() };
        return data.evidenceMaterials[index];
      }
      return null;
    },
    count: (params?: any) => {
      let result = [...data.evidenceMaterials];
      if (params?.where?.contractId) {
        result = result.filter(m => m.contractId === params.where.contractId);
      }
      if (params?.where?.status) {
        result = result.filter(m => m.status === params.where.status);
      }
      return result.length;
    },
  },
  stampNodes: {
    findMany: (params?: any) => {
      let result = [...data.stampNodes];
      if (params?.where?.contractId) {
        result = result.filter(s => s.contractId === params.where.contractId);
      }
      result.sort((a, b) => a.orderIndex - b.orderIndex);
      return result;
    },
    update: (params: { where: { id: string }; data: any }) => {
      const index = data.stampNodes.findIndex(s => s.id === params.where.id);
      if (index !== -1) {
        data.stampNodes[index] = { ...data.stampNodes[index], ...params.data, updatedAt: new Date().toISOString() };
        return data.stampNodes[index];
      }
      return null;
    },
    create: (params: { data: any }) => {
      const newNode = {
        id: generateId('stamp'),
        ...params.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.stampNodes.push(newNode);
      return newNode;
    },
  },
  downloadRecords: {
    findMany: (params?: any) => {
      let result = [...data.downloadRecords];
      if (params?.where?.contractId) {
        result = result.filter(d => d.contractId === params.where.contractId);
      }
      if (params?.where?.userId) {
        result = result.filter(d => d.userId === params.where.userId);
      }
      result.sort((a, b) => new Date(b.downloadAt).getTime() - new Date(a.downloadAt).getTime());
      return result;
    },
    create: (params: { data: any }) => {
      const newRecord = {
        id: generateId('dl'),
        ...params.data,
        downloadAt: new Date().toISOString(),
      };
      data.downloadRecords.unshift(newRecord);
      return newRecord;
    },
    count: (params?: any) => {
      let result = [...data.downloadRecords];
      if (params?.where?.contractId) {
        result = result.filter(d => d.contractId === params.where.contractId);
      }
      return result.length;
    },
  },
  operationLogs: {
    findMany: (params?: any) => {
      let result = [...data.operationLogs];
      if (params?.where?.userId) {
        result = result.filter(l => l.userId === params.where.userId);
      }
      if (params?.where?.contractId) {
        result = result.filter(l => l.contractId === params.where.contractId);
      }
      if (params?.where?.operationType) {
        result = result.filter(l => l.operationType === params.where.operationType);
      }
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (params?.take) {
        result = result.slice(0, params.take);
      }
      return result;
    },
    create: (params: { data: any }) => {
      const newLog = {
        id: generateId('log'),
        ...params.data,
        createdAt: new Date().toISOString(),
      };
      data.operationLogs.unshift(newLog);
      return newLog;
    },
  },
  rolePermissions: {
    findMany: () => {
      return [...data.rolePermissions];
    },
    findUnique: (params: { where: { role: UserRole } }) => {
      return data.rolePermissions.find(rp => rp.role === params.where.role) || null;
    },
    update: (params: { where: { role: UserRole }; data: any }) => {
      const index = data.rolePermissions.findIndex(rp => rp.role === params.where.role);
      if (index !== -1) {
        data.rolePermissions[index] = { ...data.rolePermissions[index], ...params.data, updatedAt: new Date().toISOString() };
        return data.rolePermissions[index];
      }
      return null;
    },
  },
  efficiencyStats: {
    findMany: (params?: any) => {
      let result = [...data.efficiencyStats];
      if (params?.where?.userId) {
        result = result.filter(s => s.userId === params.where.userId);
      }
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (params?.take) {
        result = result.slice(0, params.take);
      }
      return result;
    },
  },
};

export { data };
