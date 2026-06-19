import axios from 'axios';
import {
  User,
  LoginRequest,
  LoginResponse,
  Reagent,
  HazardLabel,
  RequisitionApplication,
  Schedule,
  ScheduleConflict,
  Notification,
  MaintenanceConfig,
  SampleTracking,
  ComplianceCheck,
  ComplianceDashboard,
  AuditLog,
  PageResult,
  ConflictCheckRequest,
  ConflictCheckResponse,
  DashboardStats,
  TodoItem,
  RelationGraph,
} from '@/types';
import {
  mockUsers,
  mockCurrentUser,
  mockReagents,
  mockHazardLabels,
  mockApplications,
  mockSchedules,
  mockConflicts,
  mockNotifications,
  mockMaintenanceConfigs,
  mockSampleTrackings,
  mockComplianceChecks,
  mockComplianceDashboard,
  mockAuditLogs,
  mockTodoItems,
  mockDashboardStats,
} from '@/mock/data';

const USE_MOCK = true;

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    if (USE_MOCK) {
      await delay(500);
      const user = mockUsers.find((u) => u.username === data.username);
      if (!user || data.password !== '123456') {
        throw new Error('用户名或密码错误');
      }
      return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user,
      };
    }
    return api.post('/auth/login', data);
  },

  logout: async (): Promise<{ success: boolean }> => {
    if (USE_MOCK) {
      await delay(200);
      return { success: true };
    }
    return api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    if (USE_MOCK) {
      await delay(200);
      return mockCurrentUser;
    }
    return api.get('/auth/me');
  },
};

export const reagentApi = {
  getList: async (params: {
    page?: number;
    size?: number;
    keyword?: string;
  }): Promise<PageResult<Reagent>> => {
    if (USE_MOCK) {
      await delay(300);
      let list = [...mockReagents];
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(kw) ||
            r.batchNo.toLowerCase().includes(kw) ||
            r.casNo.toLowerCase().includes(kw)
        );
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/reagents', { params });
  },

  getById: async (id: string): Promise<Reagent> => {
    if (USE_MOCK) {
      await delay(200);
      const reagent = mockReagents.find((r) => r.id === id);
      if (!reagent) throw new Error('试剂不存在');
      return reagent;
    }
    return api.get(`/reagents/${id}`);
  },

  create: async (data: Partial<Reagent>): Promise<Reagent> => {
    if (USE_MOCK) {
      await delay(300);
      const newReagent: Reagent = {
        ...data,
        id: `reagent${Date.now()}`,
        hazardLabels: data.hazardLabels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Reagent;
      mockReagents.unshift(newReagent);
      return newReagent;
    }
    return api.post('/reagents', data);
  },

  update: async (id: string, data: Partial<Reagent>): Promise<Reagent> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockReagents.findIndex((r) => r.id === id);
      if (index === -1) throw new Error('试剂不存在');
      mockReagents[index] = { ...mockReagents[index], ...data, updatedAt: new Date().toISOString() };
      return mockReagents[index];
    }
    return api.put(`/reagents/${id}`, data);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    if (USE_MOCK) {
      await delay(200);
      const index = mockReagents.findIndex((r) => r.id === id);
      if (index !== -1) {
        mockReagents.splice(index, 1);
      }
      return { success: true };
    }
    return api.delete(`/reagents/${id}`);
  },
};

export const applicationApi = {
  getList: async (params: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<PageResult<RequisitionApplication>> => {
    if (USE_MOCK) {
      await delay(300);
      let list = [...mockApplications];
      if (params.status) {
        list = list.filter((a) => a.status === params.status);
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/applications', { params });
  },

  getById: async (id: string): Promise<RequisitionApplication> => {
    if (USE_MOCK) {
      await delay(200);
      const app = mockApplications.find((a) => a.id === id);
      if (!app) throw new Error('申请不存在');
      return app;
    }
    return api.get(`/applications/${id}`);
  },

  create: async (data: Partial<RequisitionApplication>): Promise<RequisitionApplication> => {
    if (USE_MOCK) {
      await delay(300);
      const newApp: RequisitionApplication = {
        ...data,
        id: `app${Date.now()}`,
        status: 'PENDING',
        attachments: [],
        auditLog: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as RequisitionApplication;
      mockApplications.unshift(newApp);
      return newApp;
    }
    return api.post('/applications', data);
  },

  update: async (id: string, data: Partial<RequisitionApplication>): Promise<RequisitionApplication> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockApplications.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('申请不存在');
      mockApplications[index] = { ...mockApplications[index], ...data, updatedAt: new Date().toISOString() };
      return mockApplications[index];
    }
    return api.put(`/applications/${id}`, data);
  },

  approve: async (id: string, data: { approved: boolean; remark?: string }): Promise<RequisitionApplication> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockApplications.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('申请不存在');
      mockApplications[index].status = data.approved ? 'APPROVED' : 'REJECTED';
      mockApplications[index].rejectReason = data.approved ? undefined : data.remark;
      mockApplications[index].updatedAt = new Date().toISOString();
      return mockApplications[index];
    }
    return api.put(`/applications/${id}/approve`, data);
  },
};

export const scheduleApi = {
  getList: async (params: {
    startDate?: string;
    endDate?: string;
    reagentId?: string;
    status?: string;
  }): Promise<Schedule[]> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockSchedules];
      if (params.status) {
        list = list.filter((s) => s.status === params.status);
      }
      return list;
    }
    return api.get('/schedules', { params });
  },

  getCalendar: async (params: { month?: number; year?: number }): Promise<Schedule[]> => {
    if (USE_MOCK) {
      await delay(200);
      return mockSchedules;
    }
    return api.get('/schedules/calendar', { params });
  },

  create: async (data: Partial<Schedule>): Promise<Schedule> => {
    if (USE_MOCK) {
      await delay(300);
      const newSchedule: Schedule = {
        ...data,
        id: `sch${Date.now()}`,
        status: 'SCHEDULED',
        conflictStatus: 'NONE',
        principalConfirmed: false,
        createdAt: new Date().toISOString(),
      } as Schedule;
      mockSchedules.unshift(newSchedule);
      return newSchedule;
    }
    return api.post('/schedules', data);
  },

  update: async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockSchedules.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('排期不存在');
      mockSchedules[index] = { ...mockSchedules[index], ...data };
      return mockSchedules[index];
    }
    return api.put(`/schedules/${id}`, data);
  },

  checkConflicts: async (data: ConflictCheckRequest): Promise<ConflictCheckResponse> => {
    if (USE_MOCK) {
      await delay(200);
      const conflicts = mockConflicts.filter(
        (c) =>
          (c.scheduleId1 !== data.excludeScheduleId && c.scheduleId2 !== data.excludeScheduleId) &&
          c.status === 'OPEN'
      );
      return {
        hasConflict: conflicts.length > 0,
        conflicts,
      };
    }
    return api.post('/schedules/check-conflicts', data);
  },

  getConflicts: async (params: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResult<ScheduleConflict>> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockConflicts];
      if (params.status) {
        list = list.filter((c) => c.status === params.status);
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/schedules/conflicts', { params });
  },

  resolveConflict: async (id: string, data: { resolution: string; resolvedScheduleId?: string }): Promise<ScheduleConflict> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockConflicts.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('冲突不存在');
      mockConflicts[index].status = 'RESOLVED';
      mockConflicts[index].resolution = data.resolution;
      mockConflicts[index].resolvedAt = new Date().toISOString();
      mockConflicts[index].resolvedBy = mockCurrentUser.id;
      mockConflicts[index].resolvedByName = mockCurrentUser.name;

      const s1Index = mockSchedules.findIndex((s) => s.id === mockConflicts[index].scheduleId1);
      const s2Index = mockSchedules.findIndex((s) => s.id === mockConflicts[index].scheduleId2);
      if (s1Index !== -1) mockSchedules[s1Index].conflictStatus = 'RESOLVED';
      if (s2Index !== -1) mockSchedules[s2Index].conflictStatus = 'RESOLVED';

      return mockConflicts[index];
    }
    return api.put(`/schedules/conflicts/${id}/resolve`, data);
  },
};

export const notificationApi = {
  getList: async (params: {
    page?: number;
    size?: number;
    type?: string;
    status?: string;
    deliveryStatus?: string;
  }): Promise<PageResult<Notification> & { unreadCount: number }> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockNotifications];
      if (params.type) {
        list = list.filter((n) => n.type === params.type);
      }
      if (params.status) {
        list = list.filter((n) => n.status === params.status);
      }
      if (params.deliveryStatus) {
        list = list.filter((n) => n.deliveryStatus === params.deliveryStatus);
      }
      const unreadCount = mockNotifications.filter((n) => n.status === 'UNREAD').length;
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
        unreadCount,
      };
    }
    return api.get('/notifications', { params });
  },

  getFailures: async (params: {
    page?: number;
    size?: number;
    type?: string;
  }): Promise<PageResult<Notification>> => {
    if (USE_MOCK) {
      await delay(200);
      let list = mockNotifications.filter((n) => n.deliveryStatus === 'FAILED');
      if (params.type) {
        list = list.filter((n) => n.type === params.type);
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/notifications/failures', { params });
  },

  markAsRead: async (id: string): Promise<Notification> => {
    if (USE_MOCK) {
      await delay(100);
      const index = mockNotifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        mockNotifications[index].status = 'READ';
        mockNotifications[index].readAt = new Date().toISOString();
      }
      return mockNotifications[index];
    }
    return api.put(`/notifications/${id}/read`);
  },

  retryFailure: async (id: string): Promise<{ success: boolean; newStatus: string }> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockNotifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        mockNotifications[index].retryCount += 1;
        if (mockNotifications[index].retryCount >= 3) {
          mockNotifications[index].deliveryStatus = 'FAILED';
          return { success: false, newStatus: 'FAILED' };
        }
        mockNotifications[index].deliveryStatus = 'SENT';
        mockNotifications[index].failureReason = undefined;
        return { success: true, newStatus: 'SENT' };
      }
      return { success: false, newStatus: 'FAILED' };
    }
    return api.put(`/notifications/failures/${id}/retry`);
  },
};

export const configApi = {
  getHazardLabels: async (): Promise<HazardLabel[]> => {
    if (USE_MOCK) {
      await delay(200);
      return mockHazardLabels;
    }
    return api.get('/config/hazard-labels');
  },

  createHazardLabel: async (data: Partial<HazardLabel>): Promise<HazardLabel> => {
    if (USE_MOCK) {
      await delay(300);
      const newLabel: HazardLabel = {
        ...data,
        id: `hazard${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as HazardLabel;
      mockHazardLabels.unshift(newLabel);
      return newLabel;
    }
    return api.post('/config/hazard-labels', data);
  },

  updateHazardLabel: async (id: string, data: Partial<HazardLabel>): Promise<HazardLabel> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockHazardLabels.findIndex((l) => l.id === id);
      if (index === -1) throw new Error('标签不存在');
      mockHazardLabels[index] = { ...mockHazardLabels[index], ...data, updatedAt: new Date().toISOString() };
      return mockHazardLabels[index];
    }
    return api.put(`/config/hazard-labels/${id}`, data);
  },

  getMaintenanceConfigs: async (): Promise<MaintenanceConfig[]> => {
    if (USE_MOCK) {
      await delay(200);
      return mockMaintenanceConfigs;
    }
    return api.get('/config/maintenance');
  },

  createMaintenanceConfig: async (data: Partial<MaintenanceConfig>): Promise<MaintenanceConfig> => {
    if (USE_MOCK) {
      await delay(300);
      const newConfig: MaintenanceConfig = {
        ...data,
        id: `maint${Date.now()}`,
        updatedBy: mockCurrentUser.id,
        updatedByName: mockCurrentUser.name,
        updatedAt: new Date().toISOString(),
      } as MaintenanceConfig;
      mockMaintenanceConfigs.unshift(newConfig);
      return newConfig;
    }
    return api.post('/config/maintenance', data);
  },

  updateMaintenanceConfig: async (id: string, data: Partial<MaintenanceConfig>): Promise<MaintenanceConfig> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockMaintenanceConfigs.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('配置不存在');
      mockMaintenanceConfigs[index] = {
        ...mockMaintenanceConfigs[index],
        ...data,
        updatedBy: mockCurrentUser.id,
        updatedByName: mockCurrentUser.name,
        updatedAt: new Date().toISOString(),
      };
      return mockMaintenanceConfigs[index];
    }
    return api.put(`/config/maintenance/${id}`, data);
  },

  getAuditLogs: async (params: {
    page?: number;
    size?: number;
    entityType?: string;
    operatorId?: string;
  }): Promise<PageResult<AuditLog>> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockAuditLogs];
      if (params.entityType) {
        list = list.filter((l) => l.entityType === params.entityType);
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/config/audit-logs', { params });
  },
};

export const complianceApi = {
  getDashboard: async (): Promise<ComplianceDashboard> => {
    if (USE_MOCK) {
      await delay(300);
      return {
        ...mockComplianceDashboard,
        nonCompliantItems: mockComplianceChecks.filter((c) => c.status !== 'COMPLIANT'),
      };
    }
    return api.get('/compliance/dashboard');
  },

  getChecks: async (params: {
    reagentId?: string;
    status?: string;
    checkType?: string;
  }): Promise<ComplianceCheck[]> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockComplianceChecks];
      if (params.status) {
        list = list.filter((c) => c.status === params.status);
      }
      if (params.checkType) {
        list = list.filter((c) => c.checkType === params.checkType);
      }
      return list;
    }
    return api.get('/compliance/checks', { params });
  },
};

export const sampleTrackingApi = {
  getList: async (params: {
    page?: number;
    size?: number;
    status?: string;
    sampleNo?: string;
  }): Promise<PageResult<SampleTracking>> => {
    if (USE_MOCK) {
      await delay(200);
      let list = [...mockSampleTrackings];
      if (params.status) {
        list = list.filter((s) => s.status === params.status);
      }
      if (params.sampleNo) {
        list = list.filter((s) => s.sampleNo.toLowerCase().includes(params.sampleNo!.toLowerCase()));
      }
      const page = params.page || 1;
      const size = params.size || 10;
      const start = (page - 1) * size;
      return {
        content: list.slice(start, start + size),
        total: list.length,
        page,
        size,
      };
    }
    return api.get('/sample-tracking', { params });
  },

  getById: async (id: string): Promise<SampleTracking> => {
    if (USE_MOCK) {
      await delay(200);
      const sample = mockSampleTrackings.find((s) => s.id === id);
      if (!sample) throw new Error('样本不存在');
      return sample;
    }
    return api.get(`/sample-tracking/${id}`);
  },

  updateStatus: async (
    id: string,
    data: { status: string; location: string; remark?: string }
  ): Promise<SampleTracking> => {
    if (USE_MOCK) {
      await delay(300);
      const index = mockSampleTrackings.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('样本不存在');
      mockSampleTrackings[index].status = data.status as any;
      mockSampleTrackings[index].currentLocation = data.location;
      mockSampleTrackings[index].traceLog.push({
        id: `trace${Date.now()}`,
        status: data.status,
        location: data.location,
        operatorId: mockCurrentUser.id,
        operatorName: mockCurrentUser.name,
        timestamp: new Date().toISOString(),
        remark: data.remark,
      });
      return mockSampleTrackings[index];
    }
    return api.put(`/sample-tracking/${id}/status`, data);
  },

  getRelationGraph: async (params: { applicationId?: string }): Promise<RelationGraph> => {
    if (USE_MOCK) {
      await delay(300);
      return {
        nodes: [
          { id: 'reagent001', label: '乙醇', type: 'REAGENT' },
          { id: 'app001', label: '领用申请 #001', type: 'APPLICATION' },
          { id: 'sample001', label: '样本 SAM-2026-0620-001', type: 'SAMPLE' },
          { id: 'exp001', label: '中药材有效成分提取', type: 'EXPERIMENT' },
        ],
        edges: [
          { id: 'e1', source: 'reagent001', target: 'app001', label: '被领用' },
          { id: 'e2', source: 'app001', target: 'sample001', label: '用于处理' },
          { id: 'e3', source: 'sample001', target: 'exp001', label: '参与实验' },
        ],
      };
    }
    return api.get('/sample-tracking/relation-graph', { params });
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    if (USE_MOCK) {
      await delay(200);
      return mockDashboardStats;
    }
    return api.get('/dashboard/stats');
  },

  getTodoList: async (): Promise<TodoItem[]> => {
    if (USE_MOCK) {
      await delay(200);
      return mockTodoItems;
    }
    return api.get('/dashboard/todos');
  },
};
