import { db } from './index';
import {
	tourRoutes,
	itineraries,
	inventories,
	inventoryLogs,
	assemblyReminders,
	touristReviews,
	driverVehicleAssignments,
	disputeNotes,
	reminderRules,
	todoItems
} from './schema';
import { sql } from 'drizzle-orm';

async function seed() {
	console.log('🌱 开始插入种子数据...');

	// ===== 1. 旅游路线 =====
	console.log('插入旅游路线...');
	const routes = await db.insert(tourRoutes).values([
		{
			name: '北京故宫深度游',
			city: '北京',
			description: '穿越六百年紫禁城，领略明清皇家建筑之美，探寻宫廷历史故事的每一个角落。',
			status: 'active',
			meetingPoint: '午门广场南侧集合',
			duration: 240
		},
		{
			name: '上海外滩夜景漫步',
			city: '上海',
			description: '漫步万国建筑博览群，欣赏浦江两岸璀璨夜景，感受东方巴黎的独特魅力。',
			status: 'active',
			meetingPoint: '南京东路外滩观光平台入口',
			duration: 180
		},
		{
			name: '西安兵马俑探秘',
			city: '西安',
			description: '亲临世界第八大奇迹，近距离观赏两千年前的秦代军阵，感受千古一帝的恢宏气魄。',
			status: 'active',
			meetingPoint: '兵马俑博物馆正门售票处旁',
			duration: 300
		},
		{
			name: '成都宽窄巷子美食之旅',
			city: '成都',
			description: '穿梭于宽窄巷子之间，品尝地道川味小吃，体验老成都的悠闲市井生活。',
			status: 'active',
			meetingPoint: '宽巷子东广场牌坊下',
			duration: 180
		},
		{
			name: '杭州西湖环湖骑行',
			city: '杭州',
			description: '骑行环游西湖十景，从断桥残雪到雷峰夕照，饱览湖光山色的诗意画卷。',
			status: 'active',
			meetingPoint: '湖滨路骑行驿站',
			duration: 240
		},
		{
			name: '苏州园林品鉴之旅',
			city: '苏州',
			description: '游赏拙政园、留园等世界文化遗产，品味江南园林移步换景的精妙设计。',
			status: 'inactive',
			meetingPoint: '拙政园东门游客中心',
			duration: 300
		}
	]).returning();

	// ===== 2. 行程安排 =====
	console.log('插入行程安排...');
	const allItineraries: typeof itineraries.$inferSelect[] = [];

	for (const route of routes) {
		const versionCount = route.name.includes('北京') || route.name.includes('西安') ? 4 : 3;
		const itinerariesForRoute = [];

		for (let v = 1; v <= versionCount; v++) {
			const dayOffset = v * 3;
			const departureDate = new Date();
			departureDate.setDate(departureDate.getDate() + dayOffset);
			departureDate.setHours(8, 30, 0, 0);

			const changeReasons: Record<number, string> = {
				1: '初始版本创建',
				2: '调整集合时间，增加中途休息点',
				3: '根据游客反馈优化讲解路线',
				4: '旺季增加午间场次'
			};

			itinerariesForRoute.push({
				routeId: route.id,
				version: v,
				departureTime: departureDate,
				guide: ['张明', '李晓华', '王芳', '赵建国', '刘洋', '陈思'][routes.indexOf(route)],
				content: {
					stops: v === 1
						? ['集合出发', '核心景点参观', '自由活动', '返回集合点']
						: v === 2
							? ['集合出发', '核心景点参观', '中途休息', '特色体验', '返回集合点']
							: v === 3
								? ['集合出发', '精华路线讲解', '互动体验环节', '摄影留念', '返回集合点']
								: ['午间场集合', '快速通道参观', '深度讲解', '返回集合点'],
					tips: ['请穿着舒适的步行鞋', '请携带防晒用品', '保持手机畅通以便联系']
				},
				changeReason: changeReasons[v] || '版本更新',
				operatorId: 'admin001',
				operatorName: '系统管理员'
			});
		}

		const inserted = await db.insert(itineraries).values(itinerariesForRoute).returning();
		allItineraries.push(...inserted);
	}

	// ===== 3. 库存数据 =====
	console.log('插入库存数据...');
	const inventoryData = routes.map((route) => {
		const totalMap: Record<string, number> = {
			'北京': 50,
			'上海': 40,
			'西安': 60,
			'成都': 35,
			'杭州': 45,
			'苏州': 30
		};
		const total = totalMap[route.city] || 40;
		const sold = Math.floor(total * 0.5);
		const reserved = Math.floor(total * 0.15);
		const available = total - sold - reserved;

		return {
			routeId: route.id,
			available,
			sold,
			reserved,
			total
		};
	});

	const insertedInventories = await db.insert(inventories).values(inventoryData).returning();

	// ===== 4. 库存变更日志 =====
	console.log('插入库存变更日志...');
	await db.insert(inventoryLogs).values([
		{
			routeId: routes[0].id,
			type: 'manual_adjust',
			beforeValue: 20,
			afterValue: 25,
			quantity: 5,
			reason: '旺季到来，增加故宫日接待名额',
			operatorId: 'admin001',
			operatorName: '系统管理员'
		},
		{
			routeId: routes[0].id,
			type: 'order_deduct',
			beforeValue: 25,
			afterValue: 21,
			quantity: 4,
			reason: '团队订单扣减4位',
			operatorId: 'op002',
			operatorName: '周丽萍'
		},
		{
			routeId: routes[1].id,
			type: 'reserve_hold',
			beforeValue: 14,
			afterValue: 8,
			quantity: 6,
			reason: '旅行社团队预留6个名额',
			operatorId: 'op003',
			operatorName: '孙伟'
		},
		{
			routeId: routes[2].id,
			type: 'reserve_release',
			beforeValue: 6,
			afterValue: 11,
			quantity: 5,
			reason: '旅行社取消预留，释放5个名额',
			operatorId: 'op003',
			operatorName: '孙伟'
		},
		{
			routeId: routes[3].id,
			type: 'order_deduct',
			beforeValue: 15,
			afterValue: 12,
			quantity: 3,
			reason: '散客订单扣减3位',
			operatorId: 'op004',
			operatorName: '马丽'
		}
	]);

	// ===== 5. 集合提醒 =====
	console.log('插入集合提醒...');
	const reminderData = allItineraries.slice(0, 10).map((itinerary, index) => {
		const sendTime = new Date(itinerary.departureTime);
		sendTime.setHours(sendTime.getHours() - 2);

		return {
			itineraryId: itinerary.id,
			sendTime,
			method: (['sms', 'wechat', 'app_push'] as const)[index % 3],
			recipient: `游客${index + 1}组`,
			status: (['sent', 'delivered', 'failed'] as const)[index % 3 === 2 ? 2 : index % 2]
		};
	});

	await db.insert(assemblyReminders).values(reminderData);

	// ===== 6. 游客评价 =====
	console.log('插入游客评价...');
	const reviewData = [
		{
			itineraryId: allItineraries[0].id,
			touristName: '张小凡',
			rating: 5,
			content: '故宫太壮观了！讲解员非常专业，让我们对明清历史有了更深的了解，特别推荐午门和太和殿的讲解。',
			reply: '感谢您的好评，期待您再次参加我们的行程！',
			processingNote: '已回复',
			operatorId: 'op002',
			operatorName: '周丽萍'
		},
		{
			itineraryId: allItineraries[0].id,
			touristName: '李婉清',
			rating: 4,
			content: '整体体验不错，但行程中自由活动时间稍短，希望能多留一些拍照时间。',
			reply: null,
			processingNote: '已记录建议，下一版本将调整时间分配',
			operatorId: 'op002',
			operatorName: '周丽萍'
		},
		{
			itineraryId: allItineraries[1].id,
			touristName: '王海涛',
			rating: 5,
			content: '外滩夜景太美了！导游推荐的摄影角度非常棒，拍出了很多好照片。',
			reply: '感谢认可！我们持续优化摄影推荐点。',
			processingNote: null,
			operatorId: 'op003',
			operatorName: '孙伟'
		},
		{
			itineraryId: allItineraries[3].id,
			touristName: '陈雨欣',
			rating: 3,
			content: '兵马俑确实震撼，但是排队时间太长了，建议优化入馆流程。',
			reply: null,
			processingNote: '旺季排队问题已知，正在协调快速通道',
			operatorId: 'op004',
			operatorName: '马丽'
		},
		{
			itineraryId: allItineraries[6].id,
			touristName: '赵思远',
			rating: 5,
			content: '宽窄巷子的小吃太地道了！火锅和担担面是亮点，导游推荐的小店都很好吃。',
			reply: '成都美食之旅就是要让您吃到最正宗的！',
			processingNote: null,
			operatorId: 'op004',
			operatorName: '马丽'
		},
		{
			itineraryId: allItineraries[9].id,
			touristName: '林梦瑶',
			rating: 4,
			content: '西湖骑行很惬意，沿途风景如画。不过部分路段游人较多，骑行速度受限。',
			reply: null,
			processingNote: null,
			operatorId: 'op005',
			operatorName: '黄建国'
		},
		{
			itineraryId: allItineraries[12].id,
			touristName: '吴志豪',
			rating: 2,
			content: '苏州园林虽然精致，但当天遇到大雨，部分户外景点无法参观，体验大打折扣。',
			reply: '非常抱歉给您带来不好的体验，我们已增加雨天备选方案。',
			processingNote: '已启动雨天应急预案评估',
			operatorId: 'op005',
			operatorName: '黄建国'
		}
	];

	await db.insert(touristReviews).values(reviewData);

	// ===== 7. 司机车辆分配 =====
	console.log('插入司机车辆分配...');
	const assignmentData = allItineraries.slice(0, 8).map((itinerary, index) => {
		const driverNames = ['钱大伟', '孔德明', '曹文斌', '严志强', '金永福', '魏国安', '陶明亮', '贺晓东'];
		const plates = [
			'京A·88001', '沪B·66023', '陕A·33015', '川A·55007',
			'浙A·77009', '苏E·44011', '京A·22003', '沪B·11005'
		];

		return {
			itineraryId: itinerary.id,
			driverName: driverNames[index],
			vehiclePlate: plates[index],
			assignedBy: 'admin001',
			assignedByName: '系统管理员',
			changeReason: index === 0 ? '初始分配' : index < 4 ? '常规分配' : '因原司机请假临时调整'
		};
	});

	await db.insert(driverVehicleAssignments).values(assignmentData);

	// ===== 8. 争议记录 =====
	console.log('插入争议记录...');
	await db.insert(disputeNotes).values([
		{
			itineraryId: allItineraries[0].id,
			category: 'assembly',
			content: '游客反映集合时间与确认短信不一致，短信显示8:30，实际应为9:00出发。',
			evidence: '游客提供的短信截图及系统发送记录对比',
			operatorId: 'op002',
			operatorName: '周丽萍'
		},
		{
			itineraryId: allItineraries[3].id,
			category: 'review',
			content: '游客对3星评价处理结果不满，认为应该获得部分退款补偿。',
			evidence: '评价截图及客服沟通记录',
			operatorId: 'op004',
			operatorName: '马丽'
		},
		{
			itineraryId: allItineraries[5].id,
			category: 'driver_vehicle',
			content: '车辆空调故障，导致行程中车厢温度过高，多位游客投诉。',
			evidence: '游客投诉记录及车辆维修工单',
			operatorId: 'op003',
			operatorName: '孙伟'
		},
		{
			itineraryId: allItineraries[12].id,
			category: 'other',
			content: '因突发暴雨导致户外行程取消，游客要求退还部分费用。',
			evidence: '天气预报记录及景区公告截图',
			operatorId: 'op005',
			operatorName: '黄建国'
		}
	]);

	// ===== 9. 提醒规则 =====
	console.log('插入提醒规则...');
	const insertedRules = await db.insert(reminderRules).values([
		{
			name: '出发前两小时集合提醒',
			enabled: true,
			condition: { timeBeforeDeparture: 120, unit: 'minutes' },
			action: { type: 'send_reminder', method: 'sms', template: '集合提醒' },
			operatorId: 'admin001',
			operatorName: '系统管理员'
		},
		{
			name: '低库存预警',
			enabled: true,
			condition: { availableLessThan: 5, unit: 'seats' },
			action: { type: 'create_todo', urgency: 'high', assignTo: 'op002' },
			operatorId: 'admin001',
			operatorName: '系统管理员'
		},
		{
			name: '差评自动升级处理',
			enabled: true,
			condition: { ratingLessThan: 3 },
			action: { type: 'create_todo', urgency: 'high', assignTo: 'op004', category: 'review' },
			operatorId: 'admin001',
			operatorName: '系统管理员'
		},
		{
			name: '库存归零紧急通知',
			enabled: true,
			condition: { availableEquals: 0 },
			action: { type: 'notify', channel: 'wechat', group: '运营组' },
			operatorId: 'admin001',
			operatorName: '系统管理员'
		}
	]).returning();

	// ===== 10. 待办事项 =====
	console.log('插入待办事项...');
	await db.insert(todoItems).values([
		{
			source: 'escalation',
			sourceRuleId: insertedRules[2].id,
			itineraryId: allItineraries[3].id,
			routeId: routes[2].id,
			urgency: 'high',
			description: '游客陈雨欣3星差评需要跟进处理，涉及兵马俑排队等候问题',
			status: 'in_progress',
			result: null,
			evidence: '游客评价记录',
			operatorId: 'op004',
			operatorName: '马丽'
		},
		{
			source: 'escalation',
			sourceRuleId: insertedRules[1].id,
			itineraryId: null,
			routeId: routes[5].id,
			urgency: 'high',
			description: '苏州园林路线库存不足5个名额，需考虑是否增加班次',
			status: 'pending',
			result: null,
			evidence: '库存快照',
			operatorId: 'op005',
			operatorName: '黄建国'
		},
		{
			source: 'manual',
			sourceRuleId: null,
			itineraryId: allItineraries[0].id,
			routeId: routes[0].id,
			urgency: 'medium',
			description: '故宫路线集合时间不一致问题需修正短信模板',
			status: 'pending',
			result: null,
			evidence: '争议记录及短信截图',
			operatorId: 'op002',
			operatorName: '周丽萍'
		},
		{
			source: 'escalation',
			sourceRuleId: insertedRules[2].id,
			itineraryId: allItineraries[12].id,
			routeId: routes[5].id,
			urgency: 'high',
			description: '游客吴志豪2星差评需紧急处理，涉雨天行程取消退款问题',
			status: 'in_progress',
			result: null,
			evidence: '游客评价及投诉记录',
			operatorId: 'op005',
			operatorName: '黄建国'
		},
		{
			source: 'manual',
			sourceRuleId: null,
			itineraryId: allItineraries[5].id,
			routeId: routes[1].id,
			urgency: 'medium',
			description: '上海外滩路线车辆空调故障，需安排车辆维修并通知次日司机',
			status: 'completed',
			result: '已安排备用车辆，维修工单已提交',
			evidence: '车辆维修工单及调度记录',
			operatorId: 'op003',
			operatorName: '孙伟',
			completedAt: new Date()
		},
		{
			source: 'escalation',
			sourceRuleId: insertedRules[3].id,
			itineraryId: null,
			routeId: routes[5].id,
			urgency: 'low',
			description: '苏州园林路线当前处于下线状态，需确认恢复上线时间',
			status: 'pending',
			result: null,
			evidence: null,
			operatorId: 'op005',
			operatorName: '黄建国'
		}
	]);

	console.log('✅ 种子数据插入完成！');
	console.log(`  - 旅游路线: ${routes.length} 条`);
	console.log(`  - 行程安排: ${allItineraries.length} 条`);
	console.log(`  - 库存记录: ${insertedInventories.length} 条`);
	console.log(`  - 提醒规则: ${insertedRules.length} 条`);
}

seed()
	.catch((error) => {
		console.error('❌ 种子数据插入失败:', error);
		if (typeof process !== 'undefined') process.exit(1);
	})
	.finally(async () => {
		if (typeof process !== 'undefined') process.exit(0);
	});
