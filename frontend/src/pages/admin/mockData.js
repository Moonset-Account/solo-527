
export const dashboardStats = {
  todayAppointments: 36,
  monthlyRevenue: 128650,
  totalMembers: 1256,
  stockAlerts: 8,
}

export const revenueTrendData = {
  dates: ['06-16', '06-17', '06-18', '06-19', '06-20', '06-21', '06-22'],
  revenue: [12500, 15800, 13200, 18900, 16500, 21000, 19200],
  appointments: [28, 32, 25, 38, 30, 42, 36],
}

export const memberGrowthData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月'],
  newMembers: [120, 150, 180, 200, 220, 256],
  totalMembers: [800, 950, 1130, 1050, 1270, 1526],
}

export const treatmentSalesData = [
  { name: '光子嫩肤', value: 156 },
  { name: '水光针', value: 132 },
  { name: '热玛吉', value: 98 },
  { name: '玻尿酸', value: 87 },
  { name: '祛斑美白', value: 76 },
  { name: '祛痘护理', value: 65 },
]

export const recentReminders = [
  { id: 1, type: '预约提醒', content: '张女士的水光针预约明天上午10:00', time: '2小时前', level: 'normal' },
  { id: 2, type: '疗程到期', content: '李先生的光子嫩肤疗程还剩1次，3天后到期', time: '3小时前', level: 'urgent' },
  { id: 3, type: '库存预警', content: '玻尿酸原液库存不足', time: '5小时前', level: 'warning' },
  { id: 4, type: '生日祝福', content: '王女士今天生日', time: '昨天', level: 'normal' },
  { id: 5, type: '回访提醒', content: '陈女士术后7天回访', time: '昨天', level: 'normal' },
]

export const stockAlertList = [
  { id: 1, name: '玻尿酸原液', sku: 'PRD-001', stock: 5, minStock: 20, unit: '瓶' },
  { id: 2, name: '光子嫩肤耗材', sku: 'PRD-005', stock: 8, minStock: 30, unit: '套' },
  { id: 3, name: '面膜（补水）', sku: 'PRD-012', stock: 12, minStock: 50, unit: '盒' },
  { id: 4, name: '精华液', sku: 'PRD-023', stock: 3, minStock: 15, unit: '瓶' },
  { id: 5, name: '防晒乳', sku: 'PRD-031', stock: 10, minStock: 40, unit: '支' },
]

export const productList = [
  { id: 1, name: '玻尿酸原液', sku: 'PRD-001', category: '精华类', stock: 5, price: 298, status: 'warning', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20serum%20bottle%20product%20photo&image_size=square' },
  { id: 2, name: '光子嫩肤耗材套装', sku: 'PRD-005', category: '耗材类', stock: 8, price: 1280, status: 'warning', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20product%20set%20box%20package&image_size=square' },
  { id: 3, name: '补水面膜', sku: 'PRD-012', category: '面膜类', stock: 12, price: 168, status: 'warning', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=facial%20mask%20box%20skincare%20product&image_size=square' },
  { id: 4, name: '美白精华液', sku: 'PRD-023', category: '精华类', stock: 35, price: 398, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=whitening%20serum%20bottle%20luxury%20skincare&image_size=square' },
  { id: 5, name: '防晒霜SPF50', sku: 'PRD-031', category: '防晒类', stock: 10, price: 128, status: 'warning', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sunscreen%20cream%20tube%20product%20photo&image_size=square' },
  { id: 6, name: '紧致眼霜', sku: 'PRD-045', category: '护肤类', stock: 56, price: 458, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eye%20cream%20jar%20luxury%20skincare&image_size=square' },
  { id: 7, name: '洁面乳', sku: 'PRD-056', category: '洁面类', stock: 120, price: 88, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=facial%20cleanser%20bottle%20skincare&image_size=square' },
  { id: 8, name: '爽肤水', sku: 'PRD-067', category: '护肤类', stock: 89, price: 158, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=toner%20bottle%20skincare%20product&image_size=square' },
  { id: 9, name: '乳液', sku: 'PRD-078', category: '护肤类', stock: 72, price: 198, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=moisturizer%20lotion%20bottle%20skincare&image_size=square' },
  { id: 10, name: '祛痘膏', sku: 'PRD-089', category: '功效类', stock: 45, price: 138, status: 'normal', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acne%20cream%20tube%20skincare%20product&image_size=square' },
]

export const damageReportList = [
  { id: 1, code: 'BS-20240620-001', productName: '玻尿酸原液', quantity: 3, reason: '瓶盖破损导致渗漏', applicant: '李小红', status: 'pending', createTime: '2024-06-20 10:30' },
  { id: 2, code: 'BS-20240619-002', productName: '补水面膜', quantity: 5, reason: '包装破损', applicant: '王大明', status: 'approved', createTime: '2024-06-19 14:20', approver: '张经理', approveTime: '2024-06-19 16:00' },
  { id: 3, code: 'BS-20240618-003', productName: '防晒霜', quantity: 2, reason: '过期产品', applicant: '陈美丽', status: 'rejected', createTime: '2024-06-18 09:15', approver: '张经理', approveTime: '2024-06-18 11:30', rejectReason: '过期产品应走报废处理，不属于报损范围' },
  { id: 4, code: 'BS-20240617-004', productName: '光子嫩肤耗材', quantity: 1, reason: '仪器故障导致耗材损坏', applicant: '刘小芳', status: 'approved', createTime: '2024-06-17 15:45', approver: '张经理', approveTime: '2024-06-17 17:00' },
  { id: 5, code: 'BS-20240616-005', productName: '美白精华液', quantity: 4, reason: '运输途中破损', applicant: '赵小华', status: 'pending', createTime: '2024-06-16 11:00' },
]

export const reminderRuleList = [
  { id: 1, name: '疗程到期提醒', treatment: '光子嫩肤', daysBefore: 7, level: 'urgent', enabled: true, description: '疗程到期前7天提醒' },
  { id: 2, name: '预约前提醒', treatment: '全部', daysBefore: 1, level: 'normal', enabled: true, description: '预约前1天提醒顾客' },
  { id: 3, name: '生日祝福', treatment: '全部', daysBefore: 0, level: 'normal', enabled: true, description: '会员生日当天发送祝福' },
  { id: 4, name: '术后回访', treatment: '热玛吉', daysBefore: -7, level: 'normal', enabled: true, description: '术后7天回访提醒' },
  { id: 5, name: '疗程即将到期', treatment: '水光针', daysBefore: 3, level: 'warning', enabled: false, description: '疗程到期前3天提醒' },
  { id: 6, name: '库存预警', treatment: '全部', daysBefore: 0, level: 'warning', enabled: true, description: '库存低于安全线时提醒' },
]

export const consultantList = [
  { id: 1, name: '张美丽', level: '高级顾问', commissionRate: 15, status: 'active', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20consultant%20portrait%20business%20woman&image_size=square', totalSales: 256800, customerCount: 86 },
  { id: 2, name: '李小红', level: '中级顾问', commissionRate: 12, status: 'active', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20professional%20woman%20portrait%20office%20worker&image_size=square', totalSales: 189500, customerCount: 62 },
  { id: 3, name: '王大明', level: '初级顾问', commissionRate: 8, status: 'active', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20consultant%20portrait%20businessman&image_size=square', totalSales: 125600, customerCount: 45 },
  { id: 4, name: '陈美丽', level: '高级顾问', commissionRate: 15, status: 'inactive', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20woman%20portrait%20business&image_size=square', totalSales: 312000, customerCount: 98 },
  { id: 5, name: '刘小芳', level: '中级顾问', commissionRate: 12, status: 'active', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smiling%20professional%20woman%20portrait%20office&image_size=square', totalSales: 198700, customerCount: 70 },
]

export const commissionList = [
  { id: 1, consultantName: '张美丽', amount: 3852, type: '销售提成', orderNo: 'ORD-20240620-001', status: 'pending', createTime: '2024-06-20 10:30', settleTime: null },
  { id: 2, consultantName: '李小红', amount: 2268, type: '销售提成', orderNo: 'ORD-20240620-002', status: 'settled', createTime: '2024-06-19 14:20', settleTime: '2024-06-20 09:00' },
  { id: 3, consultantName: '王大明', amount: 1024, type: '销售提成', orderNo: 'ORD-20240619-003', status: 'settled', createTime: '2024-06-18 09:15', settleTime: '2024-06-19 10:30' },
  { id: 4, consultantName: '张美丽', amount: 5680, type: '销售提成', orderNo: 'ORD-20240618-004', status: 'pending', createTime: '2024-06-17 15:45', settleTime: null },
  { id: 5, consultantName: '刘小芳', amount: 2976, type: '销售提成', orderNo: 'ORD-20240617-005', status: 'settled', createTime: '2024-06-16 11:00', settleTime: '2024-06-17 16:00' },
  { id: 6, consultantName: '李小红', amount: 1856, type: '推荐奖励', orderNo: 'REF-20240615-001', status: 'pending', createTime: '2024-06-15 13:20', settleTime: null },
]

export const operationLogList = [
  { id: 1, module: '产品管理', action: '新增产品', operator: '管理员', target: '玻尿酸原液', ip: '192.168.1.100', time: '2024-06-22 10:30:25', detail: '新增产品：玻尿酸原液，SKU：PRD-001' },
  { id: 2, module: '会员管理', action: '编辑会员', operator: '张经理', target: '张三', ip: '192.168.1.101', time: '2024-06-22 09:45:12', detail: '修改会员张三的手机号' },
  { id: 3, module: '预约管理', action: '取消预约', operator: '李小红', target: '王女士', ip: '192.168.1.102', time: '2024-06-22 09:20:33', detail: '取消6月23日上午10点预约' },
  { id: 4, module: '库存管理', action: '入库', operator: '仓管小王', target: '补水面膜', ip: '192.168.1.103', time: '2024-06-21 16:50:08', detail: '补水面膜入库100盒' },
  { id: 5, module: '系统设置', action: '修改配置', operator: '管理员', target: '提醒规则', ip: '192.168.1.100', time: '2024-06-21 14:30:00', detail: '修改疗程到期提醒天数' },
  { id: 6, module: '报损管理', action: '审批通过', operator: '张经理', target: 'BS-20240619-002', ip: '192.168.1.101', time: '2024-06-19 16:00:00', detail: '审批通过报损单BS-20240619-002' },
  { id: 7, module: '顾问管理', action: '新增顾问', operator: '管理员', target: '刘小芳', ip: '192.168.1.100', time: '2024-06-18 10:00:00', detail: '新增顾问刘小芳，级别：中级顾问' },
  { id: 8, module: '提成管理', action: '结算提成', operator: '财务小李', target: '李小红', ip: '192.168.1.104', time: '2024-06-20 09:00:00', detail: '结算提成2268元' },
]

export const batchImportList = [
  { id: 1, type: '产品', fileName: 'products_20240620.xlsx', totalCount: 50, successCount: 48, failCount: 2, status: 'completed', operator: '管理员', createTime: '2024-06-20 10:30' },
  { id: 2, type: '会员', fileName: 'members_20240618.xlsx', totalCount: 200, successCount: 195, failCount: 5, status: 'completed', operator: '张经理', createTime: '2024-06-18 14:20' },
  { id: 3, type: '产品', fileName: 'products_20240615.xlsx', totalCount: 30, successCount: 0, failCount: 0, status: 'processing', operator: '李小红', createTime: '2024-06-15 09:15' },
  { id: 4, type: '预约', fileName: 'appointments_20240610.xlsx', totalCount: 80, successCount: 75, failCount: 5, status: 'completed', operator: '王大明', createTime: '2024-06-10 15:45' },
  { id: 5, type: '会员', fileName: 'members_20240605.xlsx', totalCount: 100, successCount: 0, failCount: 100, status: 'failed', operator: '陈美丽', createTime: '2024-06-05 11:00' },
]

export const portfolioList = [
  { id: 1, memberName: '张女士', treatment: '光子嫩肤', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20woman%20face%20skincare%20before%20after&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20treatment%20result%20face&image_size=square',
  ], description: '光子嫩肤一个疗程后效果明显改善', createTime: '2024-06-20', status: 'approved' },
  { id: 2, memberName: '李小姐', treatment: '水光针', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=glowing%20skin%20treatment%20result&image_size=square',
  ], description: '水光针三次治疗后皮肤水润有光泽', createTime: '2024-06-18', status: 'approved' },
  { id: 3, memberName: '王女士', treatment: '热玛吉', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=anti-aging%20treatment%20result%20face&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skin%20tightening%20treatment%20before%20after&image_size=square',
  ], description: '热玛吉术后三个月，脸部紧致提升明显', createTime: '2024-06-15', status: 'pending' },
  { id: 4, memberName: '陈女士', treatment: '祛斑美白', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spot%20removal%20treatment%20result&image_size=square',
  ], description: '雀斑治疗效果显著', createTime: '2024-06-12', status: 'approved' },
  { id: 5, memberName: '赵女士', treatment: '祛痘护理', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acne%20treatment%20result%20clear%20skin&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clear%20skin%20face%20portrait&image_size=square',
  ], description: '祛痘护理两个月，痘痘基本消失', createTime: '2024-06-10', status: 'approved' },
  { id: 6, memberName: '刘小姐', treatment: '玻尿酸', images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hyaluronic%20acid%20filler%20result&image_size=square',
  ], description: '玻尿酸填充，面部更饱满', createTime: '2024-06-08', status: 'pending' },
]

export const treatmentOptions = ['光子嫩肤', '水光针', '热玛吉', '玻尿酸', '祛斑美白', '祛痘护理']

