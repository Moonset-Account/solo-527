import {
  Profile,
  Topic,
  Vote,
  Rectification,
  PatrolTask,
  ReportRecord,
  ExportTask,
  OperationLog,
  StatsOverview,
  ResidentParticipation,
} from '@/types';
import {
  mockProfiles,
  mockTopics,
  mockVotes,
  mockRectifications,
  mockPatrolTasks,
  mockReportRecords,
  mockExportTasks,
  mockOperationLogs,
  mockStatsOverview,
} from '@/lib/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  getStatsOverview: async (): Promise<StatsOverview> => {
    await delay(300);
    return mockStatsOverview;
  },

  getProfiles: async (role?: string): Promise<Profile[]> => {
    await delay(300);
    if (role) return mockProfiles.filter((p) => p.role === role);
    return mockProfiles;
  },

  getProfile: async (id: string): Promise<Profile | undefined> => {
    await delay(200);
    return mockProfiles.find((p) => p.id === id);
  },

  getResidentParticipation: async (): Promise<ResidentParticipation[]> => {
    await delay(400);
    const residents = mockProfiles.filter((p) => p.role === 'resident');
    const allTopics = mockTopics.filter((t) => t.status === 'ended' || t.status === 'ongoing');

    return residents.map((r) => {
      const residentVotes = mockVotes.filter((v) => v.resident_id === r.id);
      const participatedTopics = new Set(residentVotes.map((v) => v.topic_id));
      const participationRate = allTopics.length > 0
        ? Math.round((participatedTopics.size / allTopics.length) * 100)
        : 0;
      const lastVote = residentVotes.sort(
        (a, b) => new Date(b.voted_at).getTime() - new Date(a.voted_at).getTime()
      )[0];

      let status: ResidentParticipation['status'] = 'new';
      if (participatedTopics.size > 0) {
        status = participationRate >= 60 ? 'active' : 'inactive';
      }

      return {
        resident_id: r.id,
        name: r.name,
        area: r.area,
        building: r.building,
        total_votes: residentVotes.length,
        last_participation_at: lastVote?.voted_at || null,
        participation_rate: participationRate,
        status,
      };
    });
  },

  getTopics: async (status?: string): Promise<Topic[]> => {
    await delay(300);
    let topics = [...mockTopics];
    if (status) {
      topics = topics.filter((t) => t.status === status);
    }
    return topics.map((t) => ({
      ...t,
      vote_count: mockVotes.filter((v) => v.topic_id === t.id).length,
    }));
  },

  getTopic: async (id: string): Promise<Topic | undefined> => {
    await delay(200);
    const topic = mockTopics.find((t) => t.id === id);
    if (topic) {
      return {
        ...topic,
        vote_count: mockVotes.filter((v) => v.topic_id === id).length,
      };
    }
    return topic;
  },

  getVotesByTopic: async (topicId: string): Promise<Vote[]> => {
    await delay(200);
    return mockVotes.filter((v) => v.topic_id === topicId);
  },

  getVotesByResident: async (residentId: string): Promise<Vote[]> => {
    await delay(200);
    const votes = mockVotes.filter((v) => v.resident_id === residentId);
    return votes.map((v) => ({
      ...v,
      topic: mockTopics.find((t) => t.id === v.topic_id),
      option: mockTopics
        .flatMap((t) => t.options || [])
        .find((o) => o.id === v.option_id),
    }));
  },

  submitVote: async (topicId: string, residentId: string, optionId: string): Promise<Vote> => {
    await delay(500);
    const existingVote = mockVotes.find(
      (v) => v.topic_id === topicId && v.resident_id === residentId
    );
    if (existingVote) {
      throw new Error('您已经对此议题投过票了');
    }

    const newVote: Vote = {
      id: `vote-${Date.now()}`,
      topic_id: topicId,
      resident_id: residentId,
      option_id: optionId,
      voted_at: new Date().toISOString(),
    };
    mockVotes.push(newVote);
    return newVote;
  },

  getRectifications: async (status?: string): Promise<Rectification[]> => {
    await delay(300);
    let rectifications = [...mockRectifications];
    if (status) {
      rectifications = rectifications.filter((r) => r.status === status);
    }
    return rectifications.map((r) => ({
      ...r,
      assignee: mockProfiles.find((p) => p.id === r.assignee_id),
    }));
  },

  getRectification: async (id: string): Promise<Rectification | undefined> => {
    await delay(200);
    const rect = mockRectifications.find((r) => r.id === id);
    if (rect) {
      return {
        ...rect,
        assignee: mockProfiles.find((p) => p.id === rect.assignee_id),
      };
    }
    return rect;
  },

  updateRectificationStatus: async (
    id: string,
    status: string,
    operatorId: string,
    remark?: string
  ): Promise<Rectification | undefined> => {
    await delay(400);
    const rect = mockRectifications.find((r) => r.id === id);
    if (rect) {
      const oldStatus = rect.status;
      rect.status = status as any;
      rect.updated_at = new Date().toISOString();
      return rect;
    }
    return undefined;
  },

  getPatrolTasks: async (status?: string): Promise<PatrolTask[]> => {
    await delay(300);
    let tasks = [...mockPatrolTasks];
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    return tasks.map((t) => ({
      ...t,
      executor: mockProfiles.find((p) => p.id === t.executor_id),
    }));
  },

  getPatrolTask: async (id: string): Promise<PatrolTask | undefined> => {
    await delay(200);
    const task = mockPatrolTasks.find((t) => t.id === id);
    if (task) {
      return {
        ...task,
        executor: mockProfiles.find((p) => p.id === task.executor_id),
      };
    }
    return task;
  },

  getReportRecords: async (status?: string): Promise<ReportRecord[]> => {
    await delay(300);
    let records = [...mockReportRecords];
    if (status) {
      records = records.filter((r) => r.status === status);
    }
    return records.map((r) => ({
      ...r,
      handler: r.handler_id ? mockProfiles.find((p) => p.id === r.handler_id) : undefined,
    }));
  },

  getExportTasks: async (): Promise<ExportTask[]> => {
    await delay(300);
    return mockExportTasks.map((t) => ({
      ...t,
      created_by_profile: mockProfiles.find((p) => p.id === t.created_by),
    }));
  },

  createExportTask: async (
    type: string,
    name: string,
    filters: Record<string, any>,
    format: string
  ): Promise<ExportTask> => {
    await delay(500);
    const newTask: ExportTask = {
      id: `export-${Date.now()}`,
      type,
      name,
      filters,
      format: format as any,
      status: 'processing',
      download_count: 0,
      created_by: 'admin-001',
      created_at: new Date().toISOString(),
      created_by_profile: mockProfiles.find((p) => p.id === 'admin-001'),
      download_logs: [],
    };
    mockExportTasks.unshift(newTask);

    setTimeout(() => {
      newTask.status = 'completed';
      newTask.completed_at = new Date().toISOString();
      newTask.file_url = `/exports/${newTask.id}.${format}`;
      newTask.file_size = Math.floor(Math.random() * 50000) + 10000;
    }, 2000);

    return newTask;
  },

  downloadExport: async (taskId: string, userId: string): Promise<void> => {
    await delay(300);
    const task = mockExportTasks.find((t) => t.id === taskId);
    if (task) {
      task.download_count++;
    }
  },

  getOperationLogs: async (module?: string): Promise<OperationLog[]> => {
    await delay(300);
    let logs = [...mockOperationLogs];
    if (module) {
      logs = logs.filter((l) => l.module === module);
    }
    return logs
      .map((l) => ({
        ...l,
        operator: mockProfiles.find((p) => p.id === l.operator_id),
      }))
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  createTopic: async (topic: Partial<Topic>): Promise<Topic> => {
    await delay(500);
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      title: topic.title || '',
      description: topic.description || '',
      type: topic.type || 'vote',
      status: 'draft',
      start_time: topic.start_time || new Date().toISOString(),
      end_time: topic.end_time || new Date().toISOString(),
      target_area: topic.target_area,
      created_by: 'admin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      options: topic.options || [],
      vote_count: 0,
    };
    mockTopics.unshift(newTopic);
    return newTopic;
  },

  updateTopic: async (id: string, topic: Partial<Topic>): Promise<Topic | undefined> => {
    await delay(400);
    const existing = mockTopics.find((t) => t.id === id);
    if (existing) {
      Object.assign(existing, topic, { updated_at: new Date().toISOString() });
      return existing;
    }
    return undefined;
  },

  createRectification: async (rect: Partial<Rectification>): Promise<Rectification> => {
    await delay(500);
    const newRect: Rectification = {
      id: `rect-${Date.now()}`,
      title: rect.title || '',
      description: rect.description || '',
      type: rect.type || '其他',
      status: 'pending',
      location: rect.location || '',
      assignee_id: rect.assignee_id || '',
      deadline: rect.deadline || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logs: [],
    };
    mockRectifications.unshift(newRect);
    return newRect;
  },

  createPatrolTask: async (task: Partial<PatrolTask>): Promise<PatrolTask> => {
    await delay(500);
    const newTask: PatrolTask = {
      id: `patrol-${Date.now()}`,
      title: task.title || '',
      area: task.area || '',
      scheduled_at: task.scheduled_at || new Date().toISOString(),
      executor_id: task.executor_id || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      check_items: [],
    };
    mockPatrolTasks.unshift(newTask);
    return newTask;
  },
};
