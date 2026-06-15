import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusBadge' })
export class StatusBadgePipe implements PipeTransform {
  transform(status: string, type: string = 'status'): string {
    if (!status) return '';
    const statusClass = status.replace(/_/g, '-').toLowerCase();
    return `status-badge ${type}-${statusClass}`;
  }
}

@Pipe({ name: 'statusDisplay' })
export class StatusDisplayPipe implements PipeTransform {
  private statusMap: Record<string, string> = {
    draft: '草稿',
    issued: '已出具',
    pending: '待处理',
    partial: '部分支付',
    paid: '已支付',
    overdue: '已逾期',
    written_off: '已核销',
    disputed: '有争议',
    reminder: '提醒',
    warning: '警告',
    urgent: '紧急',
    legal: '法务',
    in_progress: '进行中',
    completed: '已完成',
    failed: '失败',
    skipped: '已跳过',
    no_response: '无回应',
    promised_to_pay: '承诺付款',
    negotiated: '协商中',
    active: '活跃',
    inactive: '非活跃',
    suspended: '暂停',
    approved: '已批准',
    reconciled: '已对账',
    finalized: '已确认',
  };

  transform(status: string): string {
    if (!status) return '';
    return this.statusMap[status] || status.replace(/_/g, ' ').toUpperCase();
  }
}
