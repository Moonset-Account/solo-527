export interface AppointmentDto {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  servicePackageId: string;
  servicePackageName: string;
  servicePackagePrice: number;
  appointmentTime: string;
  status: string;
  technicianId?: string;
  technicianName?: string;
  workstationId?: string;
  workstationName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  customerId: string;
  servicePackageId: string;
  appointmentTime: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  technicianId?: string;
  workstationId?: string;
  status?: string;
  notes?: string;
}

export interface AppointmentListRequest {
  startDate?: string;
  endDate?: string;
  status?: string;
  customerId?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface TechnicianDto {
  id: string;
  name: string;
  specialties: string[];
  status: string;
  currentWorkstationId?: string;
  currentWorkstationName?: string;
  capacityDay: number;
  capacityUsed: number;
}

export interface CreateTechnicianRequest {
  name: string;
  specialties: string[];
  capacityDay?: number;
}

export interface UpdateTechnicianRequest {
  name?: string;
  specialties?: string[];
  status?: string;
  capacityDay?: number;
}

export interface WorkstationDto {
  id: string;
  name: string;
  type: string;
  status: string;
  currentAppointmentId?: string;
  currentTechnicianId?: string;
  currentTechnicianName?: string;
}

export interface CreateWorkstationRequest {
  name: string;
  type: string;
}

export interface UpdateWorkstationRequest {
  name?: string;
  type?: string;
  status?: string;
}

export interface PartsShortageNodeDto {
  id: string;
  status: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  notes?: string;
}

export interface PartsShortageDto {
  id: string;
  partName: string;
  affectedServices: string[];
  affectedWorkstationIds: string[];
  status: string;
  estimatedArrival?: string;
  reportedAt: string;
  resolvedAt?: string;
  nodes: PartsShortageNodeDto[];
}

export interface CreatePartsShortageRequest {
  partName: string;
  affectedServices: string[];
  affectedWorkstationIds: string[];
  estimatedArrival?: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
}

export interface UpdatePartsShortageStatusRequest {
  status: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
  estimatedArrival?: string;
}

export interface DashboardSummaryDto {
  todayAppointments: number;
  arrivedCount: number;
  inServiceCount: number;
  completedCount: number;
  todayRevenue: number;
  availableTechnicians: number;
  availableWorkstations: number;
  activePartsShortages: number;
}

export interface ConversionReportDto {
  period: string;
  totalAppointments: number;
  arrivedCount: number;
  arrivalRate: number;
  completedCount: number;
  completionRate: number;
  avgRevenue: number;
}

export interface TechnicianPerformanceDto {
  technicianId: string;
  technicianName: string;
  serviceCount: number;
  revenue: number;
  rating: number;
}

export interface ReportQueryRequest {
  startDate: string;
  endDate: string;
  periodType?: string;
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  notes?: string;
}

export interface CreateAuditLogRequest {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
}

export interface AuditLogQueryRequest {
  entityType?: string;
  entityId?: string;
  operatorId?: string;
  startTime?: string;
  endTime?: string;
  pageIndex?: number;
  pageSize?: number;
}

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockAppointments: AppointmentDto[] = [
  {
    id: generateId(),
    customerId: generateId(),
    customerName: '张三',
    customerPhone: '13800138001',
    servicePackageId: generateId(),
    servicePackageName: '精致洗车套餐',
    servicePackagePrice: 88,
    appointmentTime: '2026-06-11T09:00:00',
    status: 'Pending',
    notes: '请提前准备',
    createdAt: '2026-06-10T10:00:00',
    updatedAt: '2026-06-10T10:00:00'
  },
  {
    id: generateId(),
    customerId: generateId(),
    customerName: '李四',
    customerPhone: '13800138002',
    servicePackageId: generateId(),
    servicePackageName: '豪华洗车套餐',
    servicePackagePrice: 168,
    appointmentTime: '2026-06-11T10:30:00',
    status: 'Arrived',
    technicianId: generateId(),
    technicianName: '王技师',
    workstationId: generateId(),
    workstationName: '1号工位',
    notes: '客户是会员',
    createdAt: '2026-06-10T11:00:00',
    updatedAt: '2026-06-11T09:30:00'
  },
  {
    id: generateId(),
    customerId: generateId(),
    customerName: '王五',
    customerPhone: '13800138003',
    servicePackageId: generateId(),
    servicePackageName: '标准洗车套餐',
    servicePackagePrice: 58,
    appointmentTime: '2026-06-11T14:00:00',
    status: 'InService',
    technicianId: generateId(),
    technicianName: '李技师',
    workstationId: generateId(),
    workstationName: '2号工位',
    createdAt: '2026-06-10T14:00:00',
    updatedAt: '2026-06-11T14:15:00'
  },
  {
    id: generateId(),
    customerId: generateId(),
    customerName: '赵六',
    customerPhone: '13800138004',
    servicePackageId: generateId(),
    servicePackageName: '精致洗车套餐',
    servicePackagePrice: 88,
    appointmentTime: '2026-06-11T15:30:00',
    status: 'Completed',
    technicianId: generateId(),
    technicianName: '张技师',
    workstationId: generateId(),
    workstationName: '3号工位',
    notes: '服务完成，客户满意',
    createdAt: '2026-06-10T16:00:00',
    updatedAt: '2026-06-11T16:30:00'
  },
  {
    id: generateId(),
    customerId: generateId(),
    customerName: '钱七',
    customerPhone: '13800138005',
    servicePackageId: generateId(),
    servicePackageName: '豪华洗车套餐',
    servicePackagePrice: 168,
    appointmentTime: '2026-06-12T09:00:00',
    status: 'Pending',
    createdAt: '2026-06-11T08:00:00',
    updatedAt: '2026-06-11T08:00:00'
  }
];

const mockTechnicians: TechnicianDto[] = [
  {
    id: generateId(),
    name: '王技师',
    specialties: ['精洗', '打蜡', '内饰清洁'],
    status: 'Available',
    currentWorkstationId: generateId(),
    currentWorkstationName: '1号工位',
    capacityDay: 8,
    capacityUsed: 3
  },
  {
    id: generateId(),
    name: '李技师',
    specialties: ['洗车', '抛光', '镀膜'],
    status: 'Busy',
    currentWorkstationId: generateId(),
    currentWorkstationName: '2号工位',
    capacityDay: 8,
    capacityUsed: 5
  },
  {
    id: generateId(),
    name: '张技师',
    specialties: ['精洗', '内饰清洁', '臭氧消毒'],
    status: 'Available',
    capacityDay: 6,
    capacityUsed: 2
  },
  {
    id: generateId(),
    name: '刘技师',
    specialties: ['洗车', '打蜡', '发动机清洗'],
    status: 'OffDuty',
    capacityDay: 8,
    capacityUsed: 0
  }
];

const mockWorkstations: WorkstationDto[] = [
  {
    id: generateId(),
    name: '1号工位',
    type: 'Standard',
    status: 'Occupied',
    currentAppointmentId: generateId(),
    currentTechnicianId: generateId(),
    currentTechnicianName: '王技师'
  },
  {
    id: generateId(),
    name: '2号工位',
    type: 'Premium',
    status: 'Occupied',
    currentAppointmentId: generateId(),
    currentTechnicianId: generateId(),
    currentTechnicianName: '李技师'
  },
  {
    id: generateId(),
    name: '3号工位',
    type: 'Standard',
    status: 'Available'
  },
  {
    id: generateId(),
    name: '4号工位',
    type: 'Premium',
    status: 'Maintenance'
  }
];

const mockPartsShortages: PartsShortageDto[] = [
  {
    id: generateId(),
    partName: '高档洗车液',
    affectedServices: ['精洗', '豪华套餐'],
    affectedWorkstationIds: [generateId()],
    status: 'Pending',
    estimatedArrival: '2026-06-13T10:00:00',
    reportedAt: '2026-06-10T08:00:00',
    nodes: [
      {
        id: generateId(),
        status: 'Reported',
        operatorId: generateId(),
        operatorName: '管理员',
        timestamp: '2026-06-10T08:00:00',
        notes: '库存不足，需补货'
      }
    ]
  },
  {
    id: generateId(),
    partName: '镀膜剂',
    affectedServices: ['镀膜服务'],
    affectedWorkstationIds: [generateId(), generateId()],
    status: 'InProgress',
    estimatedArrival: '2026-06-12T14:00:00',
    reportedAt: '2026-06-09T10:00:00',
    nodes: [
      {
        id: generateId(),
        status: 'Reported',
        operatorId: generateId(),
        operatorName: '张经理',
        timestamp: '2026-06-09T10:00:00',
        notes: '库存告急'
      },
      {
        id: generateId(),
        status: 'Ordered',
        operatorId: generateId(),
        operatorName: '李采购',
        timestamp: '2026-06-09T14:00:00',
        notes: '已下单采购'
      }
    ]
  },
  {
    id: generateId(),
    partName: '内饰清洁剂',
    affectedServices: ['内饰清洁'],
    affectedWorkstationIds: [],
    status: 'Resolved',
    reportedAt: '2026-06-05T09:00:00',
    resolvedAt: '2026-06-07T16:00:00',
    nodes: [
      {
        id: generateId(),
        status: 'Reported',
        operatorId: generateId(),
        operatorName: '王技师',
        timestamp: '2026-06-05T09:00:00',
        notes: '快用完了'
      },
      {
        id: generateId(),
        status: 'Ordered',
        operatorId: generateId(),
        operatorName: '李采购',
        timestamp: '2026-06-05T11:00:00'
      },
      {
        id: generateId(),
        status: 'Resolved',
        operatorId: generateId(),
        operatorName: '仓库管理员',
        timestamp: '2026-06-07T16:00:00',
        notes: '已到货入库'
      }
    ]
  }
];

const mockAuditLogs: AuditLogDto[] = [
  {
    id: generateId(),
    entityType: 'Appointment',
    entityId: generateId(),
    action: 'Create',
    newValue: '{"status":"Pending"}',
    operatorId: generateId(),
    operatorName: '前台小王',
    timestamp: '2026-06-11T08:00:00',
    notes: '客户预约'
  },
  {
    id: generateId(),
    entityType: 'Appointment',
    entityId: generateId(),
    action: 'Update',
    oldValue: '{"status":"Pending"}',
    newValue: '{"status":"Arrived"}',
    operatorId: generateId(),
    operatorName: '前台小李',
    timestamp: '2026-06-11T09:30:00',
    notes: '客户到店'
  },
  {
    id: generateId(),
    entityType: 'Technician',
    entityId: generateId(),
    action: 'Update',
    oldValue: '{"status":"Available"}',
    newValue: '{"status":"Busy"}',
    operatorId: generateId(),
    operatorName: '店长',
    timestamp: '2026-06-11T10:00:00',
    notes: '安排工作'
  },
  {
    id: generateId(),
    entityType: 'PartsShortage',
    entityId: generateId(),
    action: 'Create',
    newValue: '{"partName":"高档洗车液","status":"Pending"}',
    operatorId: generateId(),
    operatorName: '仓库管理员',
    timestamp: '2026-06-10T08:00:00'
  }
];

const mockDashboardSummary: DashboardSummaryDto = {
  todayAppointments: 12,
  arrivedCount: 8,
  inServiceCount: 3,
  completedCount: 5,
  todayRevenue: 2580,
  availableTechnicians: 2,
  availableWorkstations: 1,
  activePartsShortages: 2
};

const mockConversionReports: ConversionReportDto[] = [
  {
    period: '2026-06-01',
    totalAppointments: 15,
    arrivedCount: 12,
    arrivalRate: 0.8,
    completedCount: 11,
    completionRate: 0.733,
    avgRevenue: 95.5
  },
  {
    period: '2026-06-02',
    totalAppointments: 18,
    arrivedCount: 16,
    arrivalRate: 0.889,
    completedCount: 15,
    completionRate: 0.833,
    avgRevenue: 102.3
  },
  {
    period: '2026-06-03',
    totalAppointments: 14,
    arrivedCount: 13,
    arrivalRate: 0.929,
    completedCount: 12,
    completionRate: 0.857,
    avgRevenue: 88.6
  },
  {
    period: '2026-06-04',
    totalAppointments: 20,
    arrivedCount: 17,
    arrivalRate: 0.85,
    completedCount: 16,
    completionRate: 0.8,
    avgRevenue: 110.2
  },
  {
    period: '2026-06-05',
    totalAppointments: 22,
    arrivedCount: 19,
    arrivalRate: 0.864,
    completedCount: 18,
    completionRate: 0.818,
    avgRevenue: 98.7
  },
  {
    period: '2026-06-06',
    totalAppointments: 25,
    arrivedCount: 22,
    arrivalRate: 0.88,
    completedCount: 21,
    completionRate: 0.84,
    avgRevenue: 105.4
  },
  {
    period: '2026-06-07',
    totalAppointments: 28,
    arrivedCount: 24,
    arrivalRate: 0.857,
    completedCount: 23,
    completionRate: 0.821,
    avgRevenue: 112.8
  }
];

const mockTechnicianPerformances: TechnicianPerformanceDto[] = [
  {
    technicianId: generateId(),
    technicianName: '王技师',
    serviceCount: 45,
    revenue: 4500,
    rating: 4.8
  },
  {
    technicianId: generateId(),
    technicianName: '李技师',
    serviceCount: 52,
    revenue: 5800,
    rating: 4.6
  },
  {
    technicianId: generateId(),
    technicianName: '张技师',
    serviceCount: 38,
    revenue: 3200,
    rating: 4.9
  },
  {
    technicianId: generateId(),
    technicianName: '刘技师',
    serviceCount: 41,
    revenue: 3900,
    rating: 4.7
  }
];

export const appointmentApi = {
  async getAppointments(params?: AppointmentListRequest): Promise<PagedResult<AppointmentDto>> {
    await delay(300);
    let filtered = [...mockAppointments];
    
    if (params?.status) {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params?.customerId) {
      filtered = filtered.filter(a => a.customerId === params.customerId);
    }
    
    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (pageIndex - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    return { items, totalCount, pageIndex, pageSize, totalPages };
  },

  async getAppointment(id: string): Promise<AppointmentDto | null> {
    await delay(200);
    return mockAppointments.find(a => a.id === id) || null;
  },

  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentDto> {
    await delay(300);
    const newAppointment: AppointmentDto = {
      id: generateId(),
      customerId: data.customerId,
      customerName: '新客户',
      customerPhone: '',
      servicePackageId: data.servicePackageId,
      servicePackageName: '标准套餐',
      servicePackagePrice: 58,
      appointmentTime: data.appointmentTime,
      status: 'Pending',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockAppointments.unshift(newAppointment);
    return newAppointment;
  },

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<AppointmentDto> {
    await delay(200);
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('预约不存在');
    mockAppointments[index] = {
      ...mockAppointments[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    return mockAppointments[index];
  },

  async deleteAppointment(id: string): Promise<void> {
    await delay(200);
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAppointments.splice(index, 1);
    }
  }
};

export const technicianApi = {
  async getTechnicians(): Promise<TechnicianDto[]> {
    await delay(300);
    return [...mockTechnicians];
  },

  async getTechnician(id: string): Promise<TechnicianDto | null> {
    await delay(200);
    return mockTechnicians.find(t => t.id === id) || null;
  },

  async createTechnician(data: CreateTechnicianRequest): Promise<TechnicianDto> {
    await delay(300);
    const newTechnician: TechnicianDto = {
      id: generateId(),
      name: data.name,
      specialties: data.specialties,
      status: 'Available',
      capacityDay: data.capacityDay || 8,
      capacityUsed: 0
    };
    mockTechnicians.push(newTechnician);
    return newTechnician;
  },

  async updateTechnician(id: string, data: UpdateTechnicianRequest): Promise<TechnicianDto> {
    await delay(200);
    const index = mockTechnicians.findIndex(t => t.id === id);
    if (index === -1) throw new Error('技师不存在');
    mockTechnicians[index] = {
      ...mockTechnicians[index],
      ...data
    };
    return mockTechnicians[index];
  },

  async deleteTechnician(id: string): Promise<void> {
    await delay(200);
    const index = mockTechnicians.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTechnicians.splice(index, 1);
    }
  },

  async getWorkstations(): Promise<WorkstationDto[]> {
    await delay(300);
    return [...mockWorkstations];
  },

  async getWorkstation(id: string): Promise<WorkstationDto | null> {
    await delay(200);
    return mockWorkstations.find(w => w.id === id) || null;
  },

  async createWorkstation(data: CreateWorkstationRequest): Promise<WorkstationDto> {
    await delay(300);
    const newWorkstation: WorkstationDto = {
      id: generateId(),
      name: data.name,
      type: data.type,
      status: 'Available'
    };
    mockWorkstations.push(newWorkstation);
    return newWorkstation;
  },

  async updateWorkstation(id: string, data: UpdateWorkstationRequest): Promise<WorkstationDto> {
    await delay(200);
    const index = mockWorkstations.findIndex(w => w.id === id);
    if (index === -1) throw new Error('工位不存在');
    mockWorkstations[index] = {
      ...mockWorkstations[index],
      ...data
    };
    return mockWorkstations[index];
  },

  async deleteWorkstation(id: string): Promise<void> {
    await delay(200);
    const index = mockWorkstations.findIndex(w => w.id === id);
    if (index !== -1) {
      mockWorkstations.splice(index, 1);
    }
  }
};

export const partsShortageApi = {
  async getPartsShortages(): Promise<PartsShortageDto[]> {
    await delay(300);
    return [...mockPartsShortages];
  },

  async getPartsShortage(id: string): Promise<PartsShortageDto | null> {
    await delay(200);
    return mockPartsShortages.find(p => p.id === id) || null;
  },

  async createPartsShortage(data: CreatePartsShortageRequest): Promise<PartsShortageDto> {
    await delay(300);
    const newNode: PartsShortageNodeDto = {
      id: generateId(),
      status: 'Reported',
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      timestamp: new Date().toISOString(),
      notes: data.notes
    };
    const newPartsShortage: PartsShortageDto = {
      id: generateId(),
      partName: data.partName,
      affectedServices: data.affectedServices,
      affectedWorkstationIds: data.affectedWorkstationIds,
      status: 'Pending',
      estimatedArrival: data.estimatedArrival,
      reportedAt: new Date().toISOString(),
      nodes: [newNode]
    };
    mockPartsShortages.unshift(newPartsShortage);
    return newPartsShortage;
  },

  async updatePartsShortageStatus(id: string, data: UpdatePartsShortageStatusRequest): Promise<PartsShortageDto> {
    await delay(200);
    const index = mockPartsShortages.findIndex(p => p.id === id);
    if (index === -1) throw new Error('缺货记录不存在');
    
    const newNode: PartsShortageNodeDto = {
      id: generateId(),
      status: data.status,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      timestamp: new Date().toISOString(),
      notes: data.notes
    };
    
    mockPartsShortages[index] = {
      ...mockPartsShortages[index],
      status: data.status,
      estimatedArrival: data.estimatedArrival || mockPartsShortages[index].estimatedArrival,
      resolvedAt: data.status === 'Resolved' ? new Date().toISOString() : mockPartsShortages[index].resolvedAt,
      nodes: [...mockPartsShortages[index].nodes, newNode]
    };
    
    return mockPartsShortages[index];
  },

  async deletePartsShortage(id: string): Promise<void> {
    await delay(200);
    const index = mockPartsShortages.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPartsShortages.splice(index, 1);
    }
  }
};

export const dashboardApi = {
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    await delay(300);
    return { ...mockDashboardSummary };
  }
};

export const reportApi = {
  async getConversionReport(params: ReportQueryRequest): Promise<ConversionReportDto[]> {
    await delay(300);
    return [...mockConversionReports];
  },

  async getTechnicianPerformance(params: ReportQueryRequest): Promise<TechnicianPerformanceDto[]> {
    await delay(300);
    return [...mockTechnicianPerformances];
  }
};

export const auditLogApi = {
  async getAuditLogs(params?: AuditLogQueryRequest): Promise<PagedResult<AuditLogDto>> {
    await delay(300);
    let filtered = [...mockAuditLogs];
    
    if (params?.entityType) {
      filtered = filtered.filter(l => l.entityType === params.entityType);
    }
    if (params?.entityId) {
      filtered = filtered.filter(l => l.entityId === params.entityId);
    }
    if (params?.operatorId) {
      filtered = filtered.filter(l => l.operatorId === params.operatorId);
    }
    
    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 20;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (pageIndex - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    return { items, totalCount, pageIndex, pageSize, totalPages };
  },

  async getAuditLog(id: string): Promise<AuditLogDto | null> {
    await delay(200);
    return mockAuditLogs.find(l => l.id === id) || null;
  },

  async createAuditLog(data: CreateAuditLogRequest): Promise<AuditLogDto> {
    await delay(300);
    const newLog: AuditLogDto = {
      id: generateId(),
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      oldValue: data.oldValue,
      newValue: data.newValue,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      timestamp: new Date().toISOString(),
      notes: data.notes
    };
    mockAuditLogs.unshift(newLog);
    return newLog;
  }
};
