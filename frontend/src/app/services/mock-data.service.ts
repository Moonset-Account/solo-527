import { Injectable } from '@angular/core';
import {
  Property, Lease, Bill, Deposit, Ticket, TicketLog,
  PricePlan, RoomStatusLog, SourceRecord, ExportRecord,
  PropertyStatus, LeaseStatus, BillType, BillStatus,
  DepositType, DepositStatus, TicketType, TicketPriority, TicketStatus,
  PageResult
} from '../types';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private properties: Property[] = [
    { id: '1', code: 'A0101', name: 'A栋101室', type: 'private_office', building: 'A栋', floor: 1, area: 50, status: 'rented', price: 5000, description: '朝南，采光好', createdAt: '2024-01-15', updatedAt: '2024-03-20' },
    { id: '2', code: 'A0102', name: 'A栋102室', type: 'private_office', building: 'A栋', floor: 1, area: 45, status: 'vacant', price: 4500, description: '小型办公室', createdAt: '2024-01-15', updatedAt: '2024-02-10' },
    { id: '3', code: 'A0201', name: 'A栋201室', type: 'private_office', building: 'A栋', floor: 2, area: 80, status: 'maintenance', price: 8000, description: '大面积办公', createdAt: '2024-01-20', updatedAt: '2024-04-01' },
    { id: '4', code: 'B0101', name: 'B栋101室', type: 'hot_desk', building: 'B栋', floor: 1, area: 35, status: 'rented', price: 3500, description: '工作室', createdAt: '2024-02-01', updatedAt: '2024-03-15' },
    { id: '5', code: 'B0201', name: 'B栋201室', type: 'hot_desk', building: 'B栋', floor: 2, area: 40, status: 'vacant', price: 4000, description: '安静舒适', createdAt: '2024-02-05', updatedAt: '2024-03-10' },
    { id: '6', code: 'C0101', name: 'C栋101室', type: 'meeting_room', building: 'C栋', floor: 1, area: 60, status: 'closed', price: 6000, description: '商铺', createdAt: '2024-01-10', updatedAt: '2024-02-28' }
  ];

  private leases: Lease[] = [
    { id: '1', leaseNo: 'ZL202403001', propertyId: '1', propertyName: 'A栋101室', tenantName: '张三', tenantPhone: '13800138001', startDate: '2024-03-01', endDate: '2025-02-28', monthlyRent: 5000, deposit: 10000, status: 'active', source: '中介介绍', createdAt: '2024-02-25', updatedAt: '2024-03-01' },
    { id: '2', leaseNo: 'ZL202403002', propertyId: '4', propertyName: 'B栋101室', tenantName: '李四', tenantPhone: '13800138002', startDate: '2024-03-15', endDate: '2024-09-14', monthlyRent: 3500, deposit: 7000, status: 'active', source: '线上咨询', createdAt: '2024-03-10', updatedAt: '2024-03-15' },
    { id: '3', leaseNo: 'ZL202402001', propertyId: '2', propertyName: 'A栋102室', tenantName: '王五', tenantPhone: '13800138003', startDate: '2024-02-01', endDate: '2024-07-31', monthlyRent: 4500, deposit: 9000, status: 'expired', source: '老客户推荐', createdAt: '2024-01-25', updatedAt: '2024-07-31' },
    { id: '4', leaseNo: 'ZL202404001', propertyId: '5', propertyName: 'B栋201室', tenantName: '赵六', tenantPhone: '13800138004', startDate: '2024-04-01', endDate: '2025-03-31', monthlyRent: 4000, deposit: 8000, status: 'pending', source: '门店咨询', createdAt: '2024-03-25', updatedAt: '2024-03-28' }
  ];

  private bills: Bill[] = [
    { id: '1', billNo: 'ZD202404001', leaseId: '1', leaseNo: 'ZL202403001', type: 'rent', amount: 5000, billDate: '2024-04-01', dueDate: '2024-04-05', status: 'paid', reconciled: true, reconcileNote: '已对账', source: '系统自动生成', createdAt: '2024-04-01', updatedAt: '2024-04-01' },
    { id: '2', billNo: 'ZD202404002', leaseId: '1', leaseNo: 'ZL202403001', type: 'service', amount: 150, billDate: '2024-04-01', dueDate: '2024-04-10', status: 'unpaid', reconciled: false, source: '系统自动生成', createdAt: '2024-04-01', updatedAt: '2024-04-01' },
    { id: '3', billNo: 'ZD202404003', leaseId: '2', leaseNo: 'ZL202403002', type: 'rent', amount: 3500, billDate: '2024-04-15', dueDate: '2024-04-20', status: 'unpaid', reconciled: false, source: '系统自动生成', createdAt: '2024-04-15', updatedAt: '2024-04-15' },
    { id: '4', billNo: 'ZD202403001', leaseId: '3', leaseNo: 'ZL202402001', type: 'rent', amount: 4500, billDate: '2024-03-01', dueDate: '2024-03-05', status: 'paid', reconciled: true, source: '系统自动生成', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
    { id: '5', billNo: 'ZD202404004', leaseId: '1', leaseNo: 'ZL202403001', type: 'service', amount: 200, billDate: '2024-04-01', dueDate: '2024-04-15', status: 'partial', reconciled: false, source: '手动创建', createdAt: '2024-04-01', updatedAt: '2024-04-01' }
  ];

  private deposits: Deposit[] = [
    { id: '1', depositNo: 'YJ202403001', leaseId: '1', leaseNo: 'ZL202403001', amount: 10000, type: 'received', status: 'active', date: '2024-02-28', source: '租约签订', note: '两个月租金押金', createdAt: '2024-02-28', updatedAt: '2024-02-28' },
    { id: '2', depositNo: 'YJ202403002', leaseId: '2', leaseNo: 'ZL202403002', amount: 7000, type: 'received', status: 'active', date: '2024-03-14', source: '租约签订', note: '两个月租金押金', createdAt: '2024-03-14', updatedAt: '2024-03-14' },
    { id: '3', depositNo: 'YJ202402001', leaseId: '3', leaseNo: 'ZL202402001', amount: 9000, type: 'refunded', status: 'refunded', date: '2024-07-31', source: '租约到期退还', note: '全额退还', createdAt: '2024-02-01', updatedAt: '2024-07-31' },
    { id: '4', depositNo: 'YJ202404001', leaseId: '4', leaseNo: 'ZL202404001', amount: 8000, type: 'received', status: 'active', date: '2024-03-28', source: '租约签订', note: '两个月租金押金', createdAt: '2024-03-28', updatedAt: '2024-03-28' }
  ];

  private tickets: Ticket[] = [
    { id: '1', ticketNo: 'GD202404001', type: 'maintenance', priority: 'high', status: 'processing', title: '空调故障', description: 'A栋101室空调不制冷', propertyId: '1', propertyName: 'A栋101室', assigneeId: '1', createdAt: '2024-04-05 09:30:00', updatedAt: '2024-04-05 14:00:00' },
    { id: '2', ticketNo: 'GD202404002', type: 'complaint', priority: 'medium', status: 'pending', title: '噪音投诉', description: '楼上装修噪音太大', propertyId: '4', propertyName: 'B栋101室', createdAt: '2024-04-06 10:15:00', updatedAt: '2024-04-06 10:15:00' },
    { id: '3', ticketNo: 'GD202403001', type: 'maintenance', priority: 'low', status: 'closed', title: '门锁维修', description: '门锁开关不顺畅', propertyId: '2', propertyName: 'A栋102室', assigneeId: '2', createdAt: '2024-03-10 08:00:00', updatedAt: '2024-03-12 16:00:00', closedAt: '2024-03-12 16:00:00', closeNote: '已更换锁芯' },
    { id: '4', ticketNo: 'GD202404003', type: 'maintenance', priority: 'high', status: 'pending', title: '紧急报修水管爆裂', description: '卫生间水管爆裂', propertyId: '3', propertyName: 'A栋201室', createdAt: '2024-04-07 07:30:00', updatedAt: '2024-04-07 07:30:00' }
  ];

  private ticketLogs: TicketLog[] = [
    { id: '1', ticketId: '1', action: '创建工单', operator: '张三', remark: '空调不制冷', createdAt: '2024-04-05 09:30:00' },
    { id: '2', ticketId: '1', action: '分配工单', operator: '管理员', remark: '分配给李师傅', createdAt: '2024-04-05 10:00:00' },
    { id: '3', ticketId: '1', action: '开始处理', operator: '李师傅', remark: '已上门检查', createdAt: '2024-04-05 14:00:00' },
    { id: '4', ticketId: '3', action: '创建工单', operator: '王五', remark: '门锁问题', createdAt: '2024-03-10 08:00:00' },
    { id: '5', ticketId: '3', action: '处理完成', operator: '王师傅', remark: '已更换锁芯', createdAt: '2024-03-12 15:00:00' },
    { id: '6', ticketId: '3', action: '关闭工单', operator: '管理员', remark: '确认修复', createdAt: '2024-03-12 16:00:00' }
  ];

  private pricePlans: PricePlan[] = [
    { id: '1', propertyId: '1', propertyName: 'A栋101室', name: '标准价', price: 5000, priceType: 'monthly', effectiveDate: '2024-01-01', isCurrent: true, source: '初始设置', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', propertyId: '2', propertyName: 'A栋102室', name: '标准价', price: 4500, priceType: 'monthly', effectiveDate: '2024-01-01', isCurrent: true, source: '初始设置', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '3', propertyId: '1', propertyName: 'A栋101室', name: '优惠价', price: 4800, priceType: 'monthly', effectiveDate: '2023-06-01', isCurrent: false, source: '促销活动', createdAt: '2023-05-20', updatedAt: '2023-05-20' }
  ];

  private roomStatusLogs: RoomStatusLog[] = [
    { id: '1', propertyId: '1', status: 'rented', reason: '租出给张三', operator: '管理员', createdAt: '2024-03-01' },
    { id: '2', propertyId: '2', status: 'vacant', reason: '租约到期', operator: '管理员', createdAt: '2024-07-31' },
    { id: '3', propertyId: '3', status: 'maintenance', reason: '装修升级', operator: '管理员', createdAt: '2024-04-01' },
    { id: '4', propertyId: '6', status: 'closed', reason: '长期空置关闭', operator: '管理员', createdAt: '2024-02-28' }
  ];

  private sourceRecords: SourceRecord[] = [
    { id: '1', sourceType: 'lease', sourceId: '1', operator: '管理员', action: '创建', detail: '创建租约 ZL202403001', createdAt: '2024-02-25' },
    { id: '2', sourceType: 'lease', sourceId: '1', operator: '管理员', action: '生效', detail: '租约开始生效', createdAt: '2024-03-01' },
    { id: '3', sourceType: 'bill', sourceId: '1', operator: '系统', action: '生成', detail: '自动生成4月租金账单', createdAt: '2024-04-01' },
    { id: '4', sourceType: 'property', sourceId: '3', operator: '管理员', action: '状态变更', detail: '变更为维修中', createdAt: '2024-04-01' }
  ];

  private exportRecords: ExportRecord[] = [
    { id: '1', exportType: 'lease', fileName: '租约数据_20240401.xlsx', status: 'completed', createdAt: '2024-04-01 10:00:00', completedAt: '2024-04-01 10:01:00' },
    { id: '2', exportType: 'bill', fileName: '账单数据_20240401.xlsx', status: 'completed', createdAt: '2024-04-02 14:30:00', completedAt: '2024-04-02 14:31:30' },
    { id: '3', exportType: 'deposit', fileName: '押金数据_20240401.xlsx', status: 'processing', createdAt: '2024-04-07 09:00:00' }
  ];

  getProperties(params?: any): Observable<PageResult<Property>> {
    let data = [...this.properties];
    if (params?.type) {
      data = data.filter(p => p.type === params.type);
    }
    if (params?.status) {
      data = data.filter(p => p.status === params.status);
    }
    if (params?.building) {
      data = data.filter(p => p.building === params.building);
    }
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw));
    }
    return of(this.paginate(data, params));
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    return of(this.properties.find(p => p.id === id));
  }

  getLeases(params?: any): Observable<PageResult<Lease>> {
    let data = [...this.leases];
    if (params?.propertyId) {
      data = data.filter(l => l.propertyId === params.propertyId);
    }
    if (params?.tenantName) {
      data = data.filter(l => l.tenantName.includes(params.tenantName));
    }
    if (params?.status) {
      data = data.filter(l => l.status === params.status);
    }
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      data = data.filter(l => l.leaseNo.toLowerCase().includes(kw) || l.tenantName.includes(params.keyword));
    }
    return of(this.paginate(data, params));
  }

  getLeaseById(id: string): Observable<Lease | undefined> {
    return of(this.leases.find(l => l.id === id));
  }

  getBills(params?: any): Observable<PageResult<Bill>> {
    let data = [...this.bills];
    if (params?.type) {
      data = data.filter(b => b.type === params.type);
    }
    if (params?.status) {
      data = data.filter(b => b.status === params.status);
    }
    if (params?.reconciled !== undefined) {
      data = data.filter(b => b.reconciled === params.reconciled);
    }
    return of(this.paginate(data, params));
  }

  getBillById(id: string): Observable<Bill | undefined> {
    return of(this.bills.find(b => b.id === id));
  }

  getDeposits(params?: any): Observable<PageResult<Deposit>> {
    let data = [...this.deposits];
    if (params?.status) {
      data = data.filter(d => d.status === params.status);
    }
    if (params?.type) {
      data = data.filter(d => d.type === params.type);
    }
    return of(this.paginate(data, params));
  }

  getDepositById(id: string): Observable<Deposit | undefined> {
    return of(this.deposits.find(d => d.id === id));
  }

  getTickets(params?: any): Observable<PageResult<Ticket>> {
    let data = [...this.tickets];
    if (params?.type) {
      data = data.filter(t => t.type === params.type);
    }
    if (params?.status) {
      data = data.filter(t => t.status === params.status);
    }
    if (params?.priority) {
      data = data.filter(t => t.priority === params.priority);
    }
    return of(this.paginate(data, params));
  }

  getTicketById(id: string): Observable<Ticket | undefined> {
    return of(this.tickets.find(t => t.id === id));
  }

  getTicketLogs(ticketId: string): Observable<TicketLog[]> {
    return of(this.ticketLogs.filter(l => l.ticketId === ticketId));
  }

  getPricePlans(params?: any): Observable<PricePlan[]> {
    let data = [...this.pricePlans];
    if (params?.propertyId) {
      data = data.filter(p => p.propertyId === params.propertyId);
    }
    return of(data);
  }

  getRoomStatusLogs(propertyId: string): Observable<RoomStatusLog[]> {
    return of(this.roomStatusLogs.filter(l => l.propertyId === propertyId));
  }

  getSourceRecords(sourceType: string, sourceId: string): Observable<SourceRecord[]> {
    return of(this.sourceRecords.filter(r => r.sourceType === sourceType && r.sourceId === sourceId));
  }

  getExportRecords(): Observable<ExportRecord[]> {
    return of(this.exportRecords);
  }

  getLeaseBills(leaseId: string): Observable<Bill[]> {
    return of(this.bills.filter(b => b.leaseId === leaseId));
  }

  getLeaseDeposits(leaseId: string): Observable<Deposit[]> {
    return of(this.deposits.filter(d => d.leaseId === leaseId));
  }

  private paginate<T>(data: T[], params?: any): PageResult<T> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize
    };
  }
}
