import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class StatisticsService {
  constructor(
    private appointmentsService: AppointmentsService,
    private operationLogsService: OperationLogsService,
  ) {}

  async getDashboardStats(startDate: string, endDate: string) {
    const stats = await this.appointmentsService.getStatistics(startDate, endDate);
    const workload = await this.appointmentsService.getCounselorWorkload(startDate, endDate);

    return {
      ...stats,
      counselorWorkload: workload,
    };
  }

  async exportAppointments(startDate: string, endDate: string): Promise<string> {
    const { data } = await this.appointmentsService.findAll(
      undefined,
      undefined,
      startDate,
      endDate,
      1,
      10000,
    );

    const headers = [
      '预约ID',
      '咨询师',
      '套餐',
      '客户姓名',
      '客户电话',
      '预约时间',
      '来访原因',
      '状态',
      '备注',
      '最近操作人',
      '创建时间',
      '更新时间',
    ];

    const statusMap: Record<string, string> = {
      [AppointmentStatus.PENDING]: '待确认',
      [AppointmentStatus.CONFIRMED]: '已确认',
      [AppointmentStatus.CHECKED_IN]: '已到店',
      [AppointmentStatus.COMPLETED]: '已完成',
      [AppointmentStatus.CANCELLED]: '已取消',
      [AppointmentStatus.NO_SHOW]: '爽约',
    };

    const rows = data.map((apt) => [
      apt.id,
      apt.counselor?.name || '',
      apt.package?.name || '',
      apt.clientName,
      apt.clientPhone,
      apt.appointmentTime.toLocaleString('zh-CN'),
      apt.reason,
      statusMap[apt.status] || apt.status,
      apt.notes || '',
      apt.lastOperatorName || '',
      apt.createdAt.toLocaleString('zh-CN'),
      apt.updatedAt.toLocaleString('zh-CN'),
    ]);

    return this.toCSV(headers, rows);
  }

  async exportWorkload(startDate: string, endDate: string): Promise<string> {
    const workload = await this.appointmentsService.getCounselorWorkload(startDate, endDate);

    const headers = [
      '咨询师ID',
      '咨询师姓名',
      '预约数',
      '服务时长(分钟)',
      '平均时长(分钟)',
    ];

    const rows = workload.map((w) => [
      w.counselorId,
      w.counselorName,
      w.count,
      w.totalMinutes,
      w.count > 0 ? Math.round(w.totalMinutes / w.count) : 0,
    ]);

    return this.toCSV(headers, rows);
  }

  async exportNoShow(startDate: string, endDate: string): Promise<string> {
    const { data } = await this.appointmentsService.findAll(
      AppointmentStatus.NO_SHOW,
      undefined,
      startDate,
      endDate,
      1,
      10000,
    );

    const headers = [
      '预约ID',
      '咨询师',
      '客户姓名',
      '客户电话',
      '预约时间',
      '来访原因',
      '备注',
      '最近操作人',
    ];

    const rows = data.map((apt) => [
      apt.id,
      apt.counselor?.name || '',
      apt.clientName,
      apt.clientPhone,
      apt.appointmentTime.toLocaleString('zh-CN'),
      apt.reason,
      apt.notes || '',
      apt.lastOperatorName || '',
    ]);

    return this.toCSV(headers, rows);
  }

  async exportOperationLogs(startDate: string, endDate: string): Promise<string> {
    const { data } = await this.operationLogsService.findAll(
      startDate,
      endDate,
      undefined,
      undefined,
      undefined,
      1,
      10000,
    );

    const headers = [
      '日志ID',
      '操作人',
      '操作类型',
      '目标类型',
      '目标ID',
      '详情',
      'IP地址',
      '操作时间',
    ];

    const rows = data.map((log) => [
      log.id,
      log.operatorName,
      log.action,
      log.targetType,
      log.targetId || '',
      log.details ? JSON.stringify(log.details) : '',
      log.ipAddress || '',
      log.createdAt.toLocaleString('zh-CN'),
    ]);

    return this.toCSV(headers, rows);
  }

  private toCSV(headers: string[], rows: any[][]): string {
    const escapeCSV = (value: any): string => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];

    return '\uFEFF' + csvRows.join('\n');
  }
}
