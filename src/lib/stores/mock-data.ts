import type {
	User,
	Tag,
	Material,
	MaterialReuse,
	Topic,
	Script,
	SourceRecord,
	Task,
	Deliverable,
	Schedule,
	Anomaly,
	DashboardStats,
	UserRole,
	MaterialType,
	TopicStatus,
	TaskType,
	TaskStatus,
	ScheduleStatus,
	AnomalySeverity,
	AnomalyStatus,
	ReuseTargetType,
	RefType
} from '$lib/types/index.ts';

function createStore() {
	const now = new Date();
	const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
	const daysLater = (d: number) => new Date(now.getTime() + d * 86400000);
	const dateStr = (d: Date) => d.toISOString().slice(0, 10);

	let users = $state<User[]>([
		{ id: 'u-001', name: '张伟', email: 'zhangwei@news.cn', role: 'supervisor' as UserRole, createdAt: daysAgo(365) },
		{ id: 'u-002', name: '李娜', email: 'lina@news.cn', role: 'editor' as UserRole, createdAt: daysAgo(300) },
		{ id: 'u-003', name: '王磊', email: 'wanglei@news.cn', role: 'shooter' as UserRole, createdAt: daysAgo(250) },
		{ id: 'u-004', name: '赵敏', email: 'zhaomin@news.cn', role: 'cutter' as UserRole, createdAt: daysAgo(200) }
	]);

	let tags = $state<Tag[]>([
		{ id: 't-001', name: '人物', category: '主题' },
		{ id: 't-002', name: '时政', category: '主题' },
		{ id: 't-003', name: '经济', category: '主题' },
		{ id: 't-004', name: '科技', category: '主题' },
		{ id: 't-005', name: '采访', category: '拍摄类型' },
		{ id: 't-006', name: '航拍', category: '拍摄类型' },
		{ id: 't-007', name: '演播室', category: '拍摄类型' },
		{ id: 't-008', name: '纪实', category: '拍摄类型' }
	]);

	let materials = $state<Material[]>([
		{
			id: 'm-001', title: '市两会现场采访录像', type: 'video' as MaterialType,
			fileUrl: '/files/m-001.mp4', fileSize: 524288000,
			uploadedBy: 'u-003', createdAt: daysAgo(20),
			tags: [tags[1], tags[4]], reuseCount: 2
		},
		{
			id: 'm-002', title: '经济特区航拍素材', type: 'video' as MaterialType,
			fileUrl: '/files/m-002.mp4', fileSize: 1073741824,
			uploadedBy: 'u-003', createdAt: daysAgo(15),
			tags: [tags[2], tags[5]], reuseCount: 1
		},
		{
			id: 'm-003', title: '科技园区全景照片', type: 'image' as MaterialType,
			fileUrl: '/files/m-003.jpg', fileSize: 8388608,
			uploadedBy: 'u-003', createdAt: daysAgo(12),
			tags: [tags[3], tags[5]], reuseCount: 1
		},
		{
			id: 'm-004', title: '交通治理政策文件', type: 'document' as MaterialType,
			fileUrl: '/files/m-004.pdf', fileSize: 2097152,
			uploadedBy: 'u-002', createdAt: daysAgo(18),
			tags: [tags[1]], reuseCount: 1
		},
		{
			id: 'm-005', title: '民生热线采访录音', type: 'audio' as MaterialType,
			fileUrl: '/files/m-005.mp3', fileSize: 15728640,
			uploadedBy: 'u-003', createdAt: daysAgo(10),
			tags: [tags[0], tags[4]], reuseCount: 0
		},
		{
			id: 'm-006', title: '数字经济论坛实录', type: 'document' as MaterialType,
			fileUrl: '/files/m-006.pdf', fileSize: 4194304,
			uploadedBy: 'u-002', createdAt: daysAgo(8),
			tags: [tags[2], tags[3]], reuseCount: 1
		}
	]);

	let materialReuses = $state<MaterialReuse[]>([
		{ id: crypto.randomUUID(), materialId: 'm-001', targetType: 'topic' as ReuseTargetType, targetId: 'tp-001', usedBy: 'u-002', usedAt: daysAgo(18) },
		{ id: crypto.randomUUID(), materialId: 'm-001', targetType: 'topic' as ReuseTargetType, targetId: 'tp-004', usedBy: 'u-002', usedAt: daysAgo(5) },
		{ id: crypto.randomUUID(), materialId: 'm-002', targetType: 'topic' as ReuseTargetType, targetId: 'tp-002', usedBy: 'u-002', usedAt: daysAgo(12) },
		{ id: crypto.randomUUID(), materialId: 'm-003', targetType: 'topic' as ReuseTargetType, targetId: 'tp-003', usedBy: 'u-002', usedAt: daysAgo(10) },
		{ id: crypto.randomUUID(), materialId: 'm-004', targetType: 'topic' as ReuseTargetType, targetId: 'tp-001', usedBy: 'u-002', usedAt: daysAgo(17) },
		{ id: crypto.randomUUID(), materialId: 'm-006', targetType: 'topic' as ReuseTargetType, targetId: 'tp-002', usedBy: 'u-002', usedAt: daysAgo(7) }
	]);

	let topics = $state<Topic[]>([
		{
			id: 'tp-001', title: '2026年城市交通治理特别报道',
			description: '围绕2026年城市交通治理新政策，深入报道各地交通拥堵治理成效、公共交通优化方案及市民出行体验改善情况。',
			status: 'published' as TopicStatus, createdBy: 'u-002', approvedBy: 'u-001',
			createdAt: daysAgo(20), updatedAt: daysAgo(2),
			materials: [materials[0], materials[3]],
			scripts: []
		},
		{
			id: 'tp-002', title: '数字经济新动能专题',
			description: '聚焦数字经济发展新趋势，探讨数字化转型如何为传统产业注入新动能，采访多位业内专家与企业代表。',
			status: 'in_production' as TopicStatus, createdBy: 'u-002', approvedBy: 'u-001',
			createdAt: daysAgo(14), updatedAt: daysAgo(1),
			materials: [materials[1], materials[5]],
			scripts: []
		},
		{
			id: 'tp-003', title: '科技创新驱动发展',
			description: '关注前沿科技领域最新突破，展示科技创新如何驱动产业升级与社会进步，涵盖人工智能、量子计算等方向。',
			status: 'approved' as TopicStatus, createdBy: 'u-002', approvedBy: 'u-001',
			createdAt: daysAgo(10), updatedAt: daysAgo(3),
			materials: [materials[2]],
			scripts: []
		},
		{
			id: 'tp-004', title: '民生实事追踪',
			description: '追踪报道政府民生实事项目落实情况，关注教育、医疗、住房等与百姓生活密切相关的议题进展。',
			status: 'draft' as TopicStatus, createdBy: 'u-002', approvedBy: null,
			createdAt: daysAgo(5), updatedAt: daysAgo(5),
			materials: [materials[4]],
			scripts: []
		}
	]);

	let scripts = $state<Script[]>([
		{ id: 'sc-001', topicId: 'tp-001', content: '开场：各位观众大家好，欢迎收看本期特别报道。2026年城市交通治理取得了显著成效……\n\n正文第一段：政策回顾与现状分析\n正文第二段：典型案例采访\n正文第三段：市民反馈与数据对比\n\n结语：城市交通治理任重道远，我们期待更多创新举措。', version: 1, createdBy: 'u-002', createdAt: daysAgo(18) },
		{ id: 'sc-002', topicId: 'tp-001', content: '开场：城市交通，关乎每一位市民的日常出行……\n\n正文第一段：新政策亮点解读\n正文第二段：各地治理成效对比\n正文第三段：未来规划与展望\n\n结语：让城市出行更便捷，我们一直在路上。', version: 2, createdBy: 'u-002', createdAt: daysAgo(10) },
		{ id: 'sc-003', topicId: 'tp-002', content: '开场：数字经济正成为推动高质量发展的新引擎……\n\n正文第一段：数字经济发展现状\n正文第二段：传统产业数字化转型案例\n正文第三段：专家观点与趋势研判\n\n结语：数字赋能未来，新动能正加速涌现。', version: 1, createdBy: 'u-002', createdAt: daysAgo(12) },
		{ id: 'sc-004', topicId: 'tp-003', content: '开场：科技创新是引领发展的第一动力……\n\n正文第一段：AI技术最新突破\n正文第二段：量子计算研究进展\n正文第三段：科技成果转化实践\n\n结语：创新驱动发展，科技改变未来。', version: 1, createdBy: 'u-002', createdAt: daysAgo(8) },
		{ id: 'sc-005', topicId: 'tp-004', content: '开场：民生无小事，枝叶总关情……\n\n正文第一段：教育公平新举措\n正文第二段：医疗改革进展\n正文第三段：住房保障新政策\n\n结语：民生实事，我们持续关注。', version: 1, createdBy: 'u-002', createdAt: daysAgo(4) }
	]);

	let tasks = $state<Task[]>([
		{
			id: 'tk-001', topicId: 'tp-001', type: 'shooting' as TaskType, title: '市两会现场拍摄',
			description: '前往市两会现场进行全程拍摄，重点捕捉代表发言、政策解读环节。',
			status: 'completed' as TaskStatus, assigneeId: 'u-003',
			deadline: dateStr(daysAgo(15)), createdBy: 'u-001',
			createdAt: daysAgo(19), updatedAt: daysAgo(14),
			deliverables: []
		},
		{
			id: 'tk-002', topicId: 'tp-001', type: 'editing' as TaskType, title: '交通治理报道剪辑',
			description: '根据脚本v2对交通治理特别报道进行剪辑，包含现场素材与采访片段。',
			status: 'completed' as TaskStatus, assigneeId: 'u-004',
			deadline: dateStr(daysAgo(5)), createdBy: 'u-001',
			createdAt: daysAgo(16), updatedAt: daysAgo(4),
			deliverables: []
		},
		{
			id: 'tk-003', topicId: 'tp-002', type: 'shooting' as TaskType, title: '数字经济论坛拍摄',
			description: '拍摄数字经济论坛现场，重点录制主题演讲与圆桌讨论环节。',
			status: 'in_progress' as TaskStatus, assigneeId: 'u-003',
			deadline: dateStr(daysLater(3)), createdBy: 'u-001',
			createdAt: daysAgo(10), updatedAt: daysAgo(2),
			deliverables: []
		},
		{
			id: 'tk-004', topicId: 'tp-002', type: 'editing' as TaskType, title: '数字经济专题剪辑',
			description: '根据脚本对数字经济专题进行剪辑，需整合航拍素材与采访内容。',
			status: 'assigned' as TaskStatus, assigneeId: 'u-004',
			deadline: dateStr(daysLater(7)), createdBy: 'u-001',
			createdAt: daysAgo(8), updatedAt: daysAgo(8),
			deliverables: []
		},
		{
			id: 'tk-005', topicId: 'tp-003', type: 'shooting' as TaskType, title: '科技园区取景拍摄',
			description: '前往高新技术产业园区进行取景拍摄，重点展示实验室与产线实景。',
			status: 'assigned' as TaskStatus, assigneeId: 'u-003',
			deadline: dateStr(daysLater(5)), createdBy: 'u-001',
			createdAt: daysAgo(6), updatedAt: daysAgo(6),
			deliverables: []
		}
	]);

	let deliverables = $state<Deliverable[]>([
		{
			id: 'dv-001', taskId: 'tk-002', fileUrl: '/deliverables/dv-001.mp4',
			fileType: 'video/mp4', submittedAt: daysAgo(4),
			note: '交通治理特别报道终版，含字幕与背景音乐'
		},
		{
			id: 'dv-002', taskId: 'tk-001', fileUrl: '/deliverables/dv-002.mp4',
			fileType: 'video/mp4', submittedAt: daysAgo(14),
			note: '市两会现场原始拍摄素材'
		}
	]);

	let schedules = $state<Schedule[]>([
		{
			id: 'sch-001', topicId: 'tp-001', platform: '微信公众号', accountName: '城市观察',
			publishDate: dateStr(daysAgo(2)), publishTime: '08:00',
			status: 'published' as ScheduleStatus, supplementaryNotes: '推送头条位置，配9张精选图',
			createdBy: 'u-002', createdAt: daysAgo(5)
		},
		{
			id: 'sch-002', topicId: 'tp-001', platform: '抖音', accountName: '城市观察官方',
			publishDate: dateStr(daysAgo(1)), publishTime: '12:00',
			status: 'published' as ScheduleStatus, supplementaryNotes: '发布竖屏剪辑版，时长3分钟以内',
			createdBy: 'u-002', createdAt: daysAgo(5)
		},
		{
			id: 'sch-003', topicId: 'tp-002', platform: '夯闻APP', accountName: '经济频道',
			publishDate: dateStr(daysLater(5)), publishTime: '09:30',
			status: 'scheduled' as ScheduleStatus, supplementaryNotes: '专题页面形式发布，嵌入视频与图集',
			createdBy: 'u-002', createdAt: daysAgo(3)
		}
	]);

	let anomalies = $state<Anomaly[]>([
		{
			id: 'an-001', topicId: 'tp-001', type: 'version_conflict', severity: 'medium' as AnomalySeverity,
			description: '交通治理报道脚本存在v1与v2版本冲突，剪辑任务引用了v1脚本但编辑已更新至v2。',
			status: 'closed' as AnomalyStatus, createdBy: 'u-001', createdAt: daysAgo(9),
			closedBy: 'u-001', closedAt: daysAgo(7), closureNote: '已确认剪辑任务统一使用v2脚本，旧版本已归档标记。'
		},
		{
			id: 'an-002', topicId: 'tp-002', type: 'version_conflict', severity: 'high' as AnomalySeverity,
			description: '数字经济专题脚本在编辑与审核环节出现不一致，审核版本与编辑版本内容差异较大。',
			status: 'open' as AnomalyStatus, createdBy: 'u-001', createdAt: daysAgo(3),
			closedBy: null, closedAt: null, closureNote: ''
		}
	]);

	let sourceRecords = $state<SourceRecord[]>([
		{
			id: 'sr-001', topicId: 'tp-001', createdBy: 'u-002', createdAt: daysAgo(2),
			supplementaryNotes: '城市交通治理特别报道发布审核通过，所有素材来源已核实。',
			references: [
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'material' as RefType, refId: 'm-001', refLabel: '市两会现场采访录像' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'material' as RefType, refId: 'm-004', refLabel: '交通治理政策文件' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'task' as RefType, refId: 'tk-001', refLabel: '市两会现场拍摄' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'task' as RefType, refId: 'tk-002', refLabel: '交通治理报道剪辑' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'schedule' as RefType, refId: 'sch-001', refLabel: '微信公众号发布' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-001', refType: 'schedule' as RefType, refId: 'sch-002', refLabel: '抖音发布' }
			]
		},
		{
			id: 'sr-002', topicId: 'tp-003', createdBy: 'u-002', createdAt: daysAgo(1),
			supplementaryNotes: '科技创新驱动发展专题审批通过，素材来源已确认。',
			references: [
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-002', refType: 'material' as RefType, refId: 'm-003', refLabel: '科技园区全景照片' },
				{ id: crypto.randomUUID(), sourceRecordId: 'sr-002', refType: 'task' as RefType, refId: 'tk-005', refLabel: '科技园区取景拍摄' }
			]
		}
	]);

	topics[0].scripts = [scripts[0], scripts[1]];
	topics[1].scripts = [scripts[2]];
	topics[2].scripts = [scripts[3]];
	topics[3].scripts = [scripts[4]];

	tasks[0].deliverables = [deliverables[1]];
	tasks[1].deliverables = [deliverables[0]];

	function addMaterial(material: Omit<Material, 'id' | 'createdAt' | 'reuseCount'>) {
		const newMaterial: Material = {
			...material,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			reuseCount: 0,
			tags: material.tags ?? []
		};
		materials.push(newMaterial);
		return newMaterial;
	}

	function updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>) {
		const idx = materials.findIndex((m: Material) => m.id === id);
		if (idx === -1) return null;
		Object.assign(materials[idx], updates);
		return materials[idx];
	}

	function deleteMaterial(id: string) {
		const idx = materials.findIndex((m: Material) => m.id === id);
		if (idx === -1) return false;
		materials.splice(idx, 1);
		return true;
	}

	function addTagToMaterial(materialId: string, tag: Tag) {
		const material = materials.find((m: Material) => m.id === materialId);
		if (!material) return null;
		if (material.tags.some((t: Tag) => t.id === tag.id)) return material;
		material.tags.push(tag);
		return material;
	}

	function removeTagFromMaterial(materialId: string, tagId: string) {
		const material = materials.find((m: Material) => m.id === materialId);
		if (!material) return null;
		const tagIdx = material.tags.findIndex((t: Tag) => t.id === tagId);
		if (tagIdx === -1) return material;
		material.tags.splice(tagIdx, 1);
		return material;
	}

	function addTopic(topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'materials' | 'scripts'>) {
		const newTopic: Topic = {
			...topic,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			materials: [],
			scripts: []
		};
		topics.push(newTopic);
		return newTopic;
	}

	function updateTopic(id: string, updates: Partial<Omit<Topic, 'id' | 'createdAt'>>) {
		const idx = topics.findIndex((t: Topic) => t.id === id);
		if (idx === -1) return null;
		Object.assign(topics[idx], updates, { updatedAt: new Date() });
		return topics[idx];
	}

	function updateTopicStatus(id: string, status: TopicStatus) {
		return updateTopic(id, { status } as Partial<Topic>);
	}

	function addScriptToTopic(topicId: string, script: Omit<Script, 'id' | 'topicId' | 'createdAt'>) {
		const topic = topics.find((t: Topic) => t.id === topicId);
		if (!topic) return null;
		const maxVersion = topic.scripts.reduce((max: number, s: Script) => Math.max(max, s.version), 0);
		const newScript: Script = {
			...script,
			id: crypto.randomUUID(),
			topicId,
			version: maxVersion + 1,
			createdAt: new Date()
		};
		topic.scripts.push(newScript);
		scripts.push(newScript);
		return newScript;
	}

	function addMaterialToTopic(topicId: string, material: Material) {
		const topic = topics.find((t: Topic) => t.id === topicId);
		if (!topic) return null;
		if (topic.materials.some((m: Material) => m.id === material.id)) return topic;
		topic.materials.push(material);
		const mat = materials.find((m: Material) => m.id === material.id);
		if (mat) mat.reuseCount++;
		materialReuses.push({
			id: crypto.randomUUID(),
			materialId: material.id,
			targetType: 'topic',
			targetId: topicId,
			usedBy: getCurrentUser().id,
			usedAt: new Date()
		});
		return topic;
	}

	function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deliverables'>) {
		const newTask: Task = {
			...task,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			deliverables: []
		};
		tasks.push(newTask);
		return newTask;
	}

	function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
		const idx = tasks.findIndex((t: Task) => t.id === id);
		if (idx === -1) return null;
		Object.assign(tasks[idx], updates, { updatedAt: new Date() });
		return tasks[idx];
	}

	function updateTaskStatus(id: string, status: TaskStatus) {
		return updateTask(id, { status } as Partial<Task>);
	}

	function addDeliverable(deliverable: Omit<Deliverable, 'id' | 'submittedAt'>) {
		const newDeliverable: Deliverable = {
			...deliverable,
			id: crypto.randomUUID(),
			submittedAt: new Date()
		};
		deliverables.push(newDeliverable);
		const task = tasks.find((t: Task) => t.id === deliverable.taskId);
		if (task) task.deliverables.push(newDeliverable);
		return newDeliverable;
	}

	function addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>) {
		const newSchedule: Schedule = {
			...schedule,
			id: crypto.randomUUID(),
			createdAt: new Date()
		};
		schedules.push(newSchedule);
		return newSchedule;
	}

	function updateSchedule(id: string, updates: Partial<Omit<Schedule, 'id' | 'createdAt'>>) {
		const idx = schedules.findIndex((s: Schedule) => s.id === id);
		if (idx === -1) return null;
		Object.assign(schedules[idx], updates);
		return schedules[idx];
	}

	function updateScheduleNotes(id: string, supplementaryNotes: string) {
		return updateSchedule(id, { supplementaryNotes });
	}

	function addAnomaly(anomaly: Omit<Anomaly, 'id' | 'createdAt' | 'closedBy' | 'closedAt' | 'closureNote'>) {
		const newAnomaly: Anomaly = {
			...anomaly,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			closedBy: null,
			closedAt: null,
			closureNote: ''
		};
		anomalies.push(newAnomaly);
		return newAnomaly;
	}

	function updateAnomaly(id: string, updates: Partial<Omit<Anomaly, 'id' | 'createdAt'>>) {
		const idx = anomalies.findIndex((a: Anomaly) => a.id === id);
		if (idx === -1) return null;
		Object.assign(anomalies[idx], updates);
		return anomalies[idx];
	}

	function closeAnomaly(id: string, closureNote: string) {
		if (!closureNote.trim()) return null;
		return updateAnomaly(id, {
			status: 'closed' as AnomalyStatus,
			closedBy: getCurrentUser().id,
			closedAt: new Date(),
			closureNote
		} as Partial<Anomaly>);
	}

	function getMaterialReuseRecords(materialId: string): MaterialReuse[] {
		return materialReuses.filter((r: MaterialReuse) => r.materialId === materialId);
	}

	function getTopicSourceRecord(topicId: string): SourceRecord | undefined {
		return sourceRecords.find((sr: SourceRecord) => sr.topicId === topicId);
	}

	function getDashboardStats(): DashboardStats {
		const topicsByStatus: Record<TopicStatus, number> = {
			draft: 0, pending_approval: 0, approved: 0, in_production: 0, published: 0, archived: 0
		};
		topics.forEach((t: Topic) => { topicsByStatus[t.status]++; });

		const tasksByStatus: Record<TaskStatus, number> = {
			assigned: 0, in_progress: 0, submitted: 0, reviewing: 0, completed: 0
		};
		tasks.forEach((t: Task) => { tasksByStatus[t.status]++; });

		const openAnomalies = anomalies.filter((a: Anomaly) => a.status !== 'closed').length;

		const today = new Date();
		const nextWeek = new Date(today.getTime() + 7 * 86400000);
		const upcomingSchedules = schedules.filter((s: Schedule) => {
			const d = new Date(s.publishDate);
			return d >= today && d <= nextWeek && s.status === 'scheduled';
		});

		return { topicsByStatus, tasksByStatus, openAnomalies, upcomingSchedules };
	}

	function getCurrentUser(): User {
		return users.find((u: User) => u.role === 'supervisor')!;
	}

	return {
		get users() { return users; },
		get tags() { return tags; },
		get materials() { return materials; },
		get materialReuses() { return materialReuses; },
		get topics() { return topics; },
		get scripts() { return scripts; },
		get tasks() { return tasks; },
		get deliverables() { return deliverables; },
		get schedules() { return schedules; },
		get anomalies() { return anomalies; },
		get sourceRecords() { return sourceRecords; },

		addMaterial,
		updateMaterial,
		deleteMaterial,
		addTagToMaterial,
		removeTagFromMaterial,

		addTopic,
		updateTopic,
		updateTopicStatus,
		addScriptToTopic,
		addMaterialToTopic,

		addTask,
		updateTask,
		updateTaskStatus,
		addDeliverable,

		addSchedule,
		updateSchedule,
		updateScheduleNotes,

		addAnomaly,
		updateAnomaly,
		closeAnomaly,

		getMaterialReuseRecords,
		getTopicSourceRecord,
		getDashboardStats,
		getCurrentUser
	};
}

export const store = createStore();
