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
	TopicStatus,
	TaskStatus,
	ScheduleStatus
} from '$lib/types/index.ts';

function createStore() {
	let users = $state<User[]>([]);
	let tags = $state<Tag[]>([]);
	let materials = $state<Material[]>([]);
	let materialReuses = $state<MaterialReuse[]>([]);
	let topics = $state<Topic[]>([]);
	let scripts = $state<Script[]>([]);
	let tasks = $state<Task[]>([]);
	let deliverables = $state<Deliverable[]>([]);
	let schedules = $state<Schedule[]>([]);
	let anomalies = $state<Anomaly[]>([]);
	let sourceRecords = $state<SourceRecord[]>([]);

	let initialized = $state(false);

	async function loadAll() {
		try {
			const [
				materialsRes,
				tasksRes,
				schedulesRes,
				anomaliesRes,
				topicsRes,
				tagsRes,
				usersRes
			] = await Promise.all([
				fetch('/api/materials?pageSize=200').then((r) => (r.ok ? r.json() : null)),
				fetch('/api/tasks?pageSize=200').then((r) => (r.ok ? r.json() : null)),
				fetch('/api/schedules').then((r) => (r.ok ? r.json() : null)),
				fetch('/api/anomalies?pageSize=200').then((r) => (r.ok ? r.json() : null)),
				fetch('/api/topics?pageSize=200').then((r) => (r.ok ? r.json() : null)),
				fetch('/api/tags').then((r) => (r.ok ? r.json() : null)).catch(() => null),
				fetch('/api/users').then((r) => (r.ok ? r.json() : null)).catch(() => null)
			]);

			if (materialsRes?.data) materials = materialsRes.data.map(normalizeMaterial);
			if (tasksRes?.data) tasks = tasksRes.data.map(normalizeTask);
			if (schedulesRes?.data) schedules = schedulesRes.data.map(normalizeSchedule);
			if (anomaliesRes?.data) anomalies = anomaliesRes.data.map(normalizeAnomaly);
			if (topicsRes?.data) topics = topicsRes.data.map(normalizeTopic);
			if (tagsRes?.data) tags = tagsRes.data;
			if (Array.isArray(tagsRes)) tags = tagsRes;
			if (usersRes?.data) users = usersRes.data.map(normalizeUser);
			if (Array.isArray(usersRes)) users = usersRes;

			if (users.length === 0) {
				users = [
					{
						id: '00000000-0000-0000-0000-000000000001',
						name: '张伟',
						email: 'zhangwei@news.cn',
						role: 'supervisor' as UserRole,
						createdAt: new Date()
					}
				];
			}

			initialized = true;
		} catch (e) {
			console.warn('从 API 预加载数据失败，使用空 store', e);
			if (users.length === 0) {
				users = [
					{
						id: '00000000-0000-0000-0000-000000000001',
						name: '张伟',
						email: 'zhangwei@news.cn',
						role: 'supervisor' as UserRole,
						createdAt: new Date()
					}
				];
			}
			initialized = true;
		}
	}

	function toDate(v: unknown): Date {
		if (v instanceof Date) return v;
		if (typeof v === 'string') return new Date(v);
		return new Date();
	}

	function normalizeUser(u: any): User {
		return { ...u, createdAt: toDate(u.createdAt) };
	}

	function normalizeMaterial(m: any): Material {
		return {
			...m,
			createdAt: toDate(m.createdAt),
			tags: m.tags ?? [],
			reuseCount: m.reuseCount ?? 0
		};
	}

	function normalizeTask(t: any): Task {
		return {
			...t,
			createdAt: toDate(t.createdAt),
			updatedAt: toDate(t.updatedAt ?? t.createdAt),
			deliverables: t.deliverables ?? []
		};
	}

	function normalizeSchedule(s: any): Schedule {
		return { ...s, createdAt: toDate(s.createdAt) };
	}

	function normalizeAnomaly(a: any): Anomaly {
		return {
			...a,
			createdAt: toDate(a.createdAt),
			closedAt: a.closedAt ? toDate(a.closedAt) : null
		};
	}

	function normalizeTopic(t: any): Topic {
		return {
			...t,
			createdAt: toDate(t.createdAt),
			updatedAt: toDate(t.updatedAt ?? t.createdAt),
			materials: t.materials ?? [],
			scripts: t.scripts ?? []
		};
	}

	function addMaterial(material: Partial<Material> & { title: string; type: Material['type']; fileUrl: string; fileSize: number; uploadedBy: string }) {
		const newMaterial: Material = {
			id: material.id ?? crypto.randomUUID(),
			title: material.title,
			type: material.type,
			fileUrl: material.fileUrl,
			fileSize: material.fileSize,
			uploadedBy: material.uploadedBy,
			createdAt: material.createdAt ? toDate(material.createdAt) : new Date(),
			tags: material.tags ?? [],
			reuseCount: material.reuseCount ?? 0
		};
		const idx = materials.findIndex((m) => m.id === newMaterial.id);
		if (idx >= 0) {
			materials[idx] = newMaterial;
		} else {
			materials.unshift(newMaterial);
		}
		return newMaterial;
	}

	function updateMaterial(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>) {
		const idx = materials.findIndex((m) => m.id === id);
		if (idx === -1) return null;
		Object.assign(materials[idx], updates);
		return materials[idx];
	}

	function addTagToMaterial(materialId: string, tag: Tag) {
		const material = materials.find((m) => m.id === materialId);
		if (!material) return null;
		if (material.tags.some((t) => t.id === tag.id)) return material;
		material.tags.push(tag);
		return material;
	}

	function removeTagFromMaterial(materialId: string, tagId: string) {
		const material = materials.find((m) => m.id === materialId);
		if (!material) return null;
		const tagIdx = material.tags.findIndex((t) => t.id === tagId);
		if (tagIdx === -1) return material;
		material.tags.splice(tagIdx, 1);
		return material;
	}

	function addTopic(topic: Partial<Topic> & { title: string; status: Topic['status']; createdBy: string }) {
		const newTopic: Topic = {
			id: topic.id ?? crypto.randomUUID(),
			title: topic.title,
			description: topic.description ?? '',
			status: topic.status,
			createdBy: topic.createdBy,
			approvedBy: topic.approvedBy ?? null,
			createdAt: topic.createdAt ? toDate(topic.createdAt) : new Date(),
			updatedAt: topic.updatedAt ? toDate(topic.updatedAt) : new Date(),
			materials: topic.materials ?? [],
			scripts: topic.scripts ?? []
		};
		const idx = topics.findIndex((t) => t.id === newTopic.id);
		if (idx >= 0) {
			topics[idx] = newTopic;
		} else {
			topics.unshift(newTopic);
		}
		return newTopic;
	}

	function updateTopic(id: string, updates: Partial<Omit<Topic, 'id' | 'createdAt'>>) {
		const idx = topics.findIndex((t) => t.id === id);
		if (idx === -1) return null;
		Object.assign(topics[idx], updates, { updatedAt: new Date() });
		return topics[idx];
	}

	function updateTopicStatus(id: string, status: TopicStatus) {
		return updateTopic(id, { status } as Partial<Topic>);
	}

	function addScriptToTopic(topicId: string, script: Partial<Script> & { content: string; createdBy: string }) {
		const topic = topics.find((t) => t.id === topicId);
		if (!topic) return null;
		const maxVersion = topic.scripts.reduce((max: number, s: Script) => Math.max(max, s.version), 0);
		const newScript: Script = {
			id: script.id ?? crypto.randomUUID(),
			topicId,
			content: script.content,
			version: script.version ?? maxVersion + 1,
			createdBy: script.createdBy,
			createdAt: script.createdAt ? toDate(script.createdAt) : new Date()
		};
		topic.scripts.push(newScript);
		scripts.push(newScript);
		return newScript;
	}

	function addMaterialToTopic(topicId: string, material: Material) {
		const topic = topics.find((t) => t.id === topicId);
		if (!topic) return null;
		if (topic.materials.some((m) => m.id === material.id)) return topic;
		topic.materials.push(material);
		const mat = materials.find((m) => m.id === material.id);
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

	function addTask(task: Partial<Task> & { topicId: string; type: Task['type']; title: string; status: Task['status']; assigneeId: string; deadline: string; createdBy: string }) {
		const newTask: Task = {
			id: task.id ?? crypto.randomUUID(),
			topicId: task.topicId,
			type: task.type,
			title: task.title,
			description: task.description ?? '',
			status: task.status,
			assigneeId: task.assigneeId,
			deadline: task.deadline,
			createdBy: task.createdBy,
			createdAt: task.createdAt ? toDate(task.createdAt) : new Date(),
			updatedAt: task.updatedAt ? toDate(task.updatedAt) : new Date(),
			deliverables: task.deliverables ?? []
		};
		const idx = tasks.findIndex((t) => t.id === newTask.id);
		if (idx >= 0) {
			tasks[idx] = newTask;
		} else {
			tasks.unshift(newTask);
		}
		return newTask;
	}

	function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) {
		const idx = tasks.findIndex((t) => t.id === id);
		if (idx === -1) return null;
		Object.assign(tasks[idx], updates, { updatedAt: new Date() });
		return tasks[idx];
	}

	function updateTaskStatus(id: string, status: TaskStatus) {
		return updateTask(id, { status } as Partial<Task>);
	}

	function addSchedule(schedule: Partial<Schedule> & { topicId: string; platform: string; accountName: string; publishDate: string; publishTime: string; status: Schedule['status']; createdBy: string }) {
		const newSchedule: Schedule = {
			id: schedule.id ?? crypto.randomUUID(),
			topicId: schedule.topicId,
			platform: schedule.platform,
			accountName: schedule.accountName,
			publishDate: schedule.publishDate,
			publishTime: schedule.publishTime,
			status: schedule.status,
			supplementaryNotes: schedule.supplementaryNotes ?? '',
			createdBy: schedule.createdBy,
			createdAt: schedule.createdAt ? toDate(schedule.createdAt) : new Date()
		};
		const idx = schedules.findIndex((s) => s.id === newSchedule.id);
		if (idx >= 0) {
			schedules[idx] = newSchedule;
		} else {
			schedules.unshift(newSchedule);
		}
		return newSchedule;
	}

	function updateSchedule(id: string, updates: Partial<Omit<Schedule, 'id' | 'createdAt'>>) {
		const idx = schedules.findIndex((s) => s.id === id);
		if (idx === -1) return null;
		Object.assign(schedules[idx], updates);
		return schedules[idx];
	}

	function updateScheduleNotes(id: string, supplementaryNotes: string) {
		return updateSchedule(id, { supplementaryNotes });
	}

	function addAnomaly(anomaly: Partial<Anomaly> & { topicId: string; type: Anomaly['type']; severity: Anomaly['severity']; description: string; status: Anomaly['status']; createdBy: string }) {
		const newAnomaly: Anomaly = {
			id: anomaly.id ?? crypto.randomUUID(),
			topicId: anomaly.topicId,
			type: anomaly.type,
			severity: anomaly.severity,
			description: anomaly.description,
			status: anomaly.status,
			createdBy: anomaly.createdBy,
			createdAt: anomaly.createdAt ? toDate(anomaly.createdAt) : new Date(),
			closedBy: anomaly.closedBy ?? null,
			closedAt: anomaly.closedAt ? toDate(anomaly.closedAt) : null,
			closureNote: anomaly.closureNote ?? ''
		};
		const idx = anomalies.findIndex((a) => a.id === newAnomaly.id);
		if (idx >= 0) {
			anomalies[idx] = newAnomaly;
		} else {
			anomalies.unshift(newAnomaly);
		}
		return newAnomaly;
	}

	function updateAnomaly(id: string, updates: Partial<Omit<Anomaly, 'id' | 'createdAt'>>) {
		const idx = anomalies.findIndex((a) => a.id === id);
		if (idx === -1) return null;
		Object.assign(anomalies[idx], updates);
		return anomalies[idx];
	}

	function closeAnomaly(id: string, closureNote: string, closedAt?: Date | string, closedBy?: string) {
		if (!closureNote.trim()) return null;
		return updateAnomaly(id, {
			status: 'closed',
			closedBy: closedBy ?? getCurrentUser().id,
			closedAt: closedAt ? toDate(closedAt) : new Date(),
			closureNote
		} as Partial<Anomaly>);
	}

	function getMaterialReuseRecords(materialId: string): MaterialReuse[] {
		return materialReuses.filter((r) => r.materialId === materialId);
	}

	function getTopicSourceRecord(topicId: string): SourceRecord | undefined {
		return sourceRecords.find((sr) => sr.topicId === topicId);
	}

	function getDashboardStats(): DashboardStats {
		const topicsByStatus: Record<TopicStatus, number> = {
			draft: 0,
			pending_approval: 0,
			approved: 0,
			in_production: 0,
			published: 0,
			archived: 0
		};
		topics.forEach((t) => {
			topicsByStatus[t.status]++;
		});

		const tasksByStatus: Record<TaskStatus, number> = {
			assigned: 0,
			in_progress: 0,
			submitted: 0,
			reviewing: 0,
			completed: 0
		};
		tasks.forEach((t) => {
			tasksByStatus[t.status]++;
		});

		const openAnomalies = anomalies.filter((a) => a.status !== 'closed').length;

		const today = new Date();
		const nextWeek = new Date(today.getTime() + 7 * 86400000);
		const upcomingSchedules = schedules.filter((s) => {
			const d = new Date(s.publishDate);
			return d >= today && d <= nextWeek && s.status === 'scheduled';
		});

		return { topicsByStatus, tasksByStatus, openAnomalies, upcomingSchedules };
	}

	function addDeliverable(deliverable: Partial<Deliverable> & { taskId: string; fileUrl: string; fileType: string; note: string }) {
		const newDeliverable: Deliverable = {
			id: deliverable.id ?? crypto.randomUUID(),
			taskId: deliverable.taskId,
			fileUrl: deliverable.fileUrl,
			fileType: deliverable.fileType,
			submittedAt: deliverable.submittedAt ? toDate(deliverable.submittedAt) : new Date(),
			note: deliverable.note
		};
		const idx = deliverables.findIndex((d) => d.id === newDeliverable.id);
		if (idx >= 0) {
			deliverables[idx] = newDeliverable;
		} else {
			deliverables.unshift(newDeliverable);
		}
		const task = tasks.find((t) => t.id === deliverable.taskId);
		if (task && !task.deliverables.some((d) => d.id === newDeliverable.id)) {
			task.deliverables.push(newDeliverable);
		}
		return newDeliverable;
	}

	function getCurrentUser(): User {
		return users.find((u) => u.role === 'supervisor') ?? users[0];
	}

	return {
		get initialized() {
			return initialized;
		},
		get users() {
			return users;
		},
		get tags() {
			return tags;
		},
		get materials() {
			return materials;
		},
		get materialReuses() {
			return materialReuses;
		},
		get topics() {
			return topics;
		},
		get scripts() {
			return scripts;
		},
		get tasks() {
			return tasks;
		},
		get deliverables() {
			return deliverables;
		},
		get schedules() {
			return schedules;
		},
		get anomalies() {
			return anomalies;
		},
		get sourceRecords() {
			return sourceRecords;
		},

		loadAll,

		addMaterial,
		updateMaterial,
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
