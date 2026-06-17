import type {
	ProjectWithStats,
	ShiftWithDetails,
	SigninRecordWithDetails,
	FeedbackWithDetails,
	ExportTaskWithUser
} from '$lib/types';
import type {
	Material,
	MaterialFlow,
	Photo,
	Budget,
	BudgetItem,
	OperationLog
} from '$lib/server/db/schema';

export const mockUsers = [
	{
		id: 'user-1',
		name: '张三',
		email: 'zhangsan@example.com',
		role: 'admin',
		passwordHash: 'mock',
		avatar: null,
		createdAt: new Date('2024-01-01')
	},
	{
		id: 'user-2',
		name: '李四',
		email: 'lisi@example.com',
		role: 'manager',
		passwordHash: 'mock',
		avatar: null,
		createdAt: new Date('2024-02-15')
	},
	{
		id: 'user-3',
		name: '王五',
		email: 'wangwu@example.com',
		role: 'volunteer',
		passwordHash: 'mock',
		avatar: null,
		createdAt: new Date('2024-03-10')
	},
	{
		id: 'user-4',
		name: '赵六',
		email: 'zhaoliu@example.com',
		role: 'volunteer',
		passwordHash: 'mock',
		avatar: null,
		createdAt: new Date('2024-04-20')
	}
];

export const mockProjects: ProjectWithStats[] = [
	{
		id: 'proj-1',
		title: '社区环境保护志愿服务',
		description: '组织志愿者清理社区公共区域垃圾，宣传环保知识，共建美好家园。',
		coverImage:
			'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteers%20cleaning%20park%20environmental%20protection&image_size=landscape_16_9',
		category: '环境保护',
		startDate: new Date('2025-06-01'),
		endDate: new Date('2025-12-31'),
		status: 'ongoing',
		location: '北京市朝阳区阳光社区',
		targetHours: '500',
		managerId: 'user-2',
		managerName: '李四',
		totalVolunteers: 156,
		totalHours: 328.5,
		shiftCount: 24,
		createdAt: new Date('2025-05-15')
	},
	{
		id: 'proj-2',
		title: '敬老院爱心陪伴活动',
		description: '定期探访敬老院老人，陪伴聊天、表演节目、帮助打扫卫生，传递温暖与关爱。',
		coverImage:
			'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteers%20visiting%20elderly%20in%20nursing%20home%20warm%20atmosphere&image_size=landscape_16_9',
		category: '关爱老人',
		startDate: new Date('2025-05-01'),
		endDate: new Date('2025-11-30'),
		status: 'ongoing',
		location: '北京市海淀区幸福敬老院',
		targetHours: '300',
		managerId: 'user-2',
		managerName: '李四',
		totalVolunteers: 89,
		totalHours: 245,
		shiftCount: 18,
		createdAt: new Date('2025-04-20')
	},
	{
		id: 'proj-3',
		title: '图书馆志愿服务',
		description: '协助图书馆整理书籍、引导读者、举办阅读推广活动，营造良好阅读氛围。',
		coverImage:
			'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteers%20helping%20in%20library%20organizing%20books&image_size=landscape_16_9',
		category: '文化教育',
		startDate: new Date('2025-03-01'),
		endDate: new Date('2025-08-31'),
		status: 'completed',
		location: '北京市西城区图书馆',
		targetHours: '200',
		managerId: 'user-1',
		managerName: '张三',
		totalVolunteers: 67,
		totalHours: 210,
		shiftCount: 30,
		createdAt: new Date('2025-02-10')
	},
	{
		id: 'proj-4',
		title: '无偿献血宣传活动',
		description: '在商圈、社区开展无偿献血知识宣传，协助血站开展献血活动。',
		coverImage:
			'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blood%20donation%20volunteer%20activity%20public%20service&image_size=landscape_16_9',
		category: '医疗卫生',
		startDate: new Date('2025-07-01'),
		endDate: new Date('2025-07-31'),
		status: 'published',
		location: '北京市各区县',
		targetHours: '150',
		managerId: 'user-1',
		managerName: '张三',
		totalVolunteers: 0,
		totalHours: 0,
		shiftCount: 8,
		createdAt: new Date('2025-06-10')
	}
];

export const mockShifts: Record<string, ShiftWithDetails[]> = {
	'proj-1': [
		{
			id: 'shift-1',
			projectId: 'proj-1',
			name: '周六上午社区清洁',
			startTime: new Date('2025-06-21T08:00:00'),
			endTime: new Date('2025-06-21T11:00:00'),
			maxParticipants: 30,
			location: '阳光社区中心广场',
			description: '清理社区主干道和绿化带垃圾',
			registeredCount: 25,
			isRegistered: true,
			registrationId: 'reg-1'
		},
		{
			id: 'shift-2',
			projectId: 'proj-1',
			name: '周日下午环保宣传',
			startTime: new Date('2025-06-22T14:00:00'),
			endTime: new Date('2025-06-22T17:00:00'),
			maxParticipants: 20,
			location: '阳光社区文化站',
			description: '发放环保宣传册，讲解垃圾分类知识',
			registeredCount: 18,
			isRegistered: false,
			registrationId: null
		},
		{
			id: 'shift-3',
			projectId: 'proj-1',
			name: '周三晚间巡逻',
			startTime: new Date('2025-06-25T19:00:00'),
			endTime: new Date('2025-06-25T21:00:00'),
			maxParticipants: 15,
			location: '阳光社区各片区',
			description: '夜间巡逻，提醒居民注意环保',
			registeredCount: 12,
			isRegistered: false,
			registrationId: null
		}
	],
	'proj-2': [
		{
			id: 'shift-4',
			projectId: 'proj-2',
			name: '周一上午陪伴',
			startTime: new Date('2025-06-23T09:00:00'),
			endTime: new Date('2025-06-23T11:30:00'),
			maxParticipants: 10,
			location: '幸福敬老院活动室',
			description: '陪伴老人聊天、读报',
			registeredCount: 8,
			isRegistered: false,
			registrationId: null
		},
		{
			id: 'shift-5',
			projectId: 'proj-2',
			name: '周五下午文艺表演',
			startTime: new Date('2025-06-27T14:00:00'),
			endTime: new Date('2025-06-27T16:30:00'),
			maxParticipants: 15,
			location: '幸福敬老院礼堂',
			description: '为老人表演文艺节目',
			registeredCount: 15,
			isRegistered: true,
			registrationId: 'reg-2'
		}
	]
};

export const mockMaterials: Record<string, Material[]> = {
	'proj-1': [
		{
			id: 'mat-1',
			projectId: 'proj-1',
			name: '垃圾夹',
			initialQuantity: 50,
			currentQuantity: 45,
			unit: '个',
			category: '工具',
			unitPrice: '25.00',
			location: '社区物资室',
			createdAt: new Date('2025-05-20')
		},
		{
			id: 'mat-2',
			projectId: 'proj-1',
			name: '垃圾袋',
			initialQuantity: 500,
			currentQuantity: 320,
			unit: '个',
			category: '消耗品',
			unitPrice: '0.50',
			location: '社区物资室',
			createdAt: new Date('2025-05-20')
		},
		{
			id: 'mat-3',
			projectId: 'proj-1',
			name: '环保宣传册',
			initialQuantity: 1000,
			currentQuantity: 680,
			unit: '份',
			category: '宣传品',
			unitPrice: '2.00',
			location: '社区文化站',
			createdAt: new Date('2025-05-25')
		}
	]
};

export const mockMaterialFlows: Record<string, MaterialFlow[]> = {
	'mat-1': [
		{
			id: 'flow-1',
			materialId: 'mat-1',
			type: 'purchase',
			quantity: 50,
			direction: 'in',
			flowTime: new Date('2025-05-20T10:00:00'),
			handler: '李四',
			recipient: null,
			remark: '统一采购',
			createdAt: new Date('2025-05-20')
		},
		{
			id: 'flow-2',
			materialId: 'mat-1',
			type: 'distribute',
			quantity: 5,
			direction: 'out',
			flowTime: new Date('2025-06-10T08:30:00'),
			handler: '李四',
			recipient: '王五',
			remark: '6月10日活动领用',
			createdAt: new Date('2025-06-10')
		}
	],
	'mat-2': [
		{
			id: 'flow-3',
			materialId: 'mat-2',
			type: 'purchase',
			quantity: 500,
			direction: 'in',
			flowTime: new Date('2025-05-20T10:00:00'),
			handler: '李四',
			recipient: null,
			remark: '统一采购',
			createdAt: new Date('2025-05-20')
		},
		{
			id: 'flow-4',
			materialId: 'mat-2',
			type: 'use',
			quantity: 180,
			direction: 'out',
			flowTime: new Date('2025-06-15T17:00:00'),
			handler: '李四',
			recipient: null,
			remark: '6月15日活动消耗',
			createdAt: new Date('2025-06-15')
		}
	]
};

export const mockPhotos: Record<string, Photo[]> = {
	'proj-1': [
		{
			id: 'photo-1',
			projectId: 'proj-1',
			uploadedBy: 'user-2',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=group%20of%20volunteers%20with%20green%20vests%20cleaning%20park&image_size=square_hd',
			thumbnailUrl: null,
			caption: '6月10日社区清洁活动合影',
			category: '活动合影',
			uploadedAt: new Date('2025-06-10T18:30:00')
		},
		{
			id: 'photo-2',
			projectId: 'proj-1',
			uploadedBy: 'user-2',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20picking%20up%20trash%20in%20park%20close%20up&image_size=square_hd',
			thumbnailUrl: null,
			caption: '志愿者认真清理垃圾',
			category: '活动现场',
			uploadedAt: new Date('2025-06-10T18:35:00')
		},
		{
			id: 'photo-3',
			projectId: 'proj-1',
			uploadedBy: 'user-3',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20learning%20recycling%20sorting%20from%20volunteer&image_size=square_hd',
			thumbnailUrl: null,
			caption: '向小朋友讲解垃圾分类',
			category: '宣传活动',
			uploadedAt: new Date('2025-06-14T15:00:00')
		},
		{
			id: 'photo-4',
			projectId: 'proj-1',
			uploadedBy: 'user-3',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20park%20after%20volunteer%20activity%20beautiful&image_size=square_hd',
			thumbnailUrl: null,
			caption: '清洁后的社区公园',
			category: '活动成果',
			uploadedAt: new Date('2025-06-14T15:30:00')
		}
	],
	'proj-2': [
		{
			id: 'photo-5',
			projectId: 'proj-2',
			uploadedBy: 'user-2',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20talking%20to%20elderly%20woman%20warm%20smile&image_size=square_hd',
			thumbnailUrl: null,
			caption: '志愿者与老人亲切交谈',
			category: '活动现场',
			uploadedAt: new Date('2025-06-09T11:00:00')
		},
		{
			id: 'photo-6',
			projectId: 'proj-2',
			uploadedBy: 'user-4',
			url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=group%20of%20elderly%20watching%20performance%20happy&image_size=square_hd',
			thumbnailUrl: null,
			caption: '老人们观看文艺表演',
			category: '文艺表演',
			uploadedAt: new Date('2025-06-13T16:00:00')
		}
	]
};

export const mockBudget: Record<string, Budget & { items: BudgetItem[] }> = {
	'proj-1': {
		id: 'budget-1',
		projectId: 'proj-1',
		totalAmount: '10000',
		usedAmount: '6850',
		currency: 'CNY',
		createdAt: new Date('2025-05-15'),
		items: [
			{
				id: 'item-1',
				budgetId: 'budget-1',
				itemName: '清洁工具采购',
				amount: '2500',
				category: '物资采购',
				expenseDate: new Date('2025-05-20'),
				recipient: 'XX环卫用品商店',
				invoiceNo: 'INV-2025-001',
				remark: '垃圾夹、手套、垃圾袋等',
				createdAt: new Date('2025-05-20')
			},
			{
				id: 'item-2',
				budgetId: 'budget-1',
				itemName: '宣传册印刷',
				amount: '2000',
				category: '宣传费用',
				expenseDate: new Date('2025-05-25'),
				recipient: 'XX印刷厂',
				invoiceNo: 'INV-2025-002',
				remark: '环保宣传册1000份',
				createdAt: new Date('2025-05-25')
			},
			{
				id: 'item-3',
				budgetId: 'budget-1',
				itemName: '志愿者服装',
				amount: '2350',
				category: '物资采购',
				expenseDate: new Date('2025-06-01'),
				recipient: 'XX服装定制店',
				invoiceNo: 'INV-2025-003',
				remark: '志愿者马甲50件',
				createdAt: new Date('2025-06-01')
			}
		]
	}
};

export const mockSigninRecords: SigninRecordWithDetails[] = [
	{
		id: 'signin-1',
		userId: 'user-3',
		shiftId: 'shift-1',
		signinTime: new Date('2025-06-14T08:05:00'),
		signoutTime: new Date('2025-06-14T11:05:00'),
		durationHours: '3.00',
		status: 'confirmed',
		location: '阳光社区中心广场',
		projectName: '社区环境保护志愿服务',
		shiftName: '周六上午社区清洁',
		userName: '王五'
	},
	{
		id: 'signin-2',
		userId: 'user-3',
		shiftId: 'shift-2',
		signinTime: new Date('2025-06-15T14:10:00'),
		signoutTime: new Date('2025-06-15T17:00:00'),
		durationHours: '2.83',
		status: 'confirmed',
		location: '阳光社区文化站',
		projectName: '社区环境保护志愿服务',
		shiftName: '周日下午环保宣传',
		userName: '王五'
	},
	{
		id: 'signin-3',
		userId: 'user-4',
		shiftId: 'shift-5',
		signinTime: new Date('2025-06-13T13:55:00'),
		signoutTime: new Date('2025-06-13T16:30:00'),
		durationHours: '2.58',
		status: 'confirmed',
		location: '幸福敬老院礼堂',
		projectName: '敬老院爱心陪伴活动',
		shiftName: '周五下午文艺表演',
		userName: '赵六'
	},
	{
		id: 'signin-4',
		userId: 'user-3',
		shiftId: 'shift-4',
		signinTime: new Date('2025-06-09T09:03:00'),
		signoutTime: new Date('2025-06-09T11:25:00'),
		durationHours: '2.37',
		status: 'confirmed',
		location: '幸福敬老院活动室',
		projectName: '敬老院爱心陪伴活动',
		shiftName: '周一上午陪伴',
		userName: '王五'
	},
	{
		id: 'signin-5',
		userId: 'user-3',
		shiftId: 'shift-1',
		signinTime: new Date('2025-06-07T08:00:00'),
		signoutTime: new Date('2025-06-07T11:00:00'),
		durationHours: '3.00',
		status: 'confirmed',
		location: '阳光社区中心广场',
		projectName: '社区环境保护志愿服务',
		shiftName: '周六上午社区清洁',
		userName: '王五'
	}
];

export const mockFeedbacks: FeedbackWithDetails[] = [
	{
		id: 'feedback-1',
		userId: 'user-3',
		projectId: 'proj-1',
		type: 'suggestion',
		content: '建议增加更多的手套和口罩，夏天天气热，手套容易湿。另外希望能提供饮用水。',
		urgency: 'normal',
		status: 'pending',
		createdAt: new Date('2025-06-15T18:00:00'),
		userName: '王五',
		projectName: '社区环境保护志愿服务',
		processings: []
	},
	{
		id: 'feedback-2',
		userId: 'user-4',
		projectId: 'proj-2',
		type: 'complaint',
		content: '上次活动的签到记录有误，我实际参加了2.5小时，但系统只记录了2小时。请核实。',
		urgency: 'high',
		status: 'processing',
		createdAt: new Date('2025-06-14T10:00:00'),
		userName: '赵六',
		projectName: '敬老院爱心陪伴活动',
		processings: [
			{
				id: 'processing-1',
				feedbackId: 'feedback-2',
				processorId: 'user-1',
				processorName: '张三',
				affectedParties: '赵六（志愿者）、敬老院活动对接人',
				responsiblePerson: '张三（系统管理员）',
				nextSteps: '1. 核对当天活动签到表照片；2. 联系现场负责人确认；3. 修正系统记录并通知用户。',
				processingResult: '已联系现场负责人核实，确认用户实际服务时间为2.5小时，正在修正数据。',
				status: 'processing',
				processedAt: new Date('2025-06-14T14:30:00')
			}
		]
	},
	{
		id: 'feedback-3',
		userId: 'user-3',
		projectId: 'proj-3',
		type: 'praise',
		content: '图书馆的工作人员很热情，指导很到位，这次志愿服务收获很大！',
		urgency: 'low',
		status: 'resolved',
		createdAt: new Date('2025-06-10T16:00:00'),
		userName: '王五',
		projectName: '图书馆志愿服务',
		processings: [
			{
				id: 'processing-2',
				feedbackId: 'feedback-3',
				processorId: 'user-2',
				processorName: '李四',
				affectedParties: '图书馆工作人员、全体志愿者',
				responsiblePerson: '李四（项目队长）',
				nextSteps: '将此好评转达给图书馆，并在志愿者群内表扬。',
				processingResult: '已转达图书馆，并在志愿者群内发布了表扬消息。',
				status: 'completed',
				processedAt: new Date('2025-06-11T09:00:00')
			}
		]
	}
];

export const mockLogs: (OperationLog & { userName: string | null })[] = Array.from({ length: 100 }, (_, i) => {
	const actions = [
		'login',
		'logout',
		'view_project',
		'register_shift',
		'signin',
		'signout',
		'create_project',
		'update_project',
		'create_shift',
		'process_feedback',
		'add_budget_item',
		'export_data',
		'upload_photo'
	];
	const targets = ['project', 'shift', 'user', 'feedback', 'budget', 'log', 'photo'];
	const action = actions[Math.floor(Math.random() * actions.length)];
	const target = targets[Math.floor(Math.random() * targets.length)];
	const userIdx = Math.floor(Math.random() * 4);

	return {
		id: `log-${i + 1}`,
		userId: mockUsers[userIdx].id,
		userName: mockUsers[userIdx].name,
		action,
		targetType: target,
		targetId: `${target}-${Math.floor(Math.random() * 10)}`,
		ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
		details: { note: `操作记录 ${i + 1}` },
		createdAt: new Date(Date.now() - i * 3600000)
	};
});

export const mockExportTasks: ExportTaskWithUser[] = [
	{
		id: 'export-1',
		userId: 'user-1',
		userName: '张三',
		exportType: 'signin',
		filters: { dateRange: { start: '2025-06-01', end: '2025-06-30' } },
		status: 'completed',
		fileUrl: '/exports/signin-2025-06.csv',
		fileName: '志愿服务记录_2025年6月.csv',
		fileSize: 24568,
		progress: 100,
		createdAt: new Date('2025-06-16T10:00:00'),
		completedAt: new Date('2025-06-16T10:00:05')
	},
	{
		id: 'export-2',
		userId: 'user-2',
		userName: '李四',
		exportType: 'project',
		filters: { status: ['ongoing'] },
		status: 'processing',
		fileUrl: null,
		fileName: null,
		fileSize: null,
		progress: 65,
		createdAt: new Date('2025-06-17T09:30:00'),
		completedAt: null
	}
];

export const currentUser = mockUsers[2];
