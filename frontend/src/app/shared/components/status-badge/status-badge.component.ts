import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() customClass: string = '';

  get statusClass(): string {
    if (this.customClass) {
      return this.customClass;
    }

    const statusMap: Record<string, string> = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed',
      'paid': 'status-completed',
      'refunded': 'status-cancelled',
      'in_progress': 'status-pending',
      'no_answer': 'status-pending',
      'identified': 'status-pending',
      'contacted': 'status-pending',
      'scheduled': 'status-confirmed',
      'visited': 'status-completed',
      'lost': 'status-cancelled',
      'success': 'status-completed',
      'failed': 'status-cancelled',
      'retrying': 'status-pending',
      'urgent': 'status-cancelled',
      'high': 'status-pending',
      'medium': 'status-confirmed',
      'low': 'status-completed',
      'critical': 'status-cancelled'
    };

    return statusMap[this.status?.toLowerCase()] || 'status-pending';
  }

  get displayText(): string {
    const textMap: Record<string, string> = {
      'pending': '待处理',
      'confirmed': '已确认',
      'cancelled': '已取消',
      'completed': '已完成',
      'paid': '已支付',
      'refunded': '已退款',
      'in_progress': '处理中',
      'no_answer': '无人接听',
      'identified': '已识别',
      'contacted': '已联系',
      'scheduled': '已预约',
      'visited': '已复诊',
      'lost': '已流失',
      'success': '成功',
      'failed': '失败',
      'retrying': '重试中',
      'urgent': '紧急',
      'high': '高',
      'medium': '中',
      'low': '低',
      'critical': '严重',
      'treatment': '治疗后',
      'postoperative': '术后',
      'regular': '常规'
    };

    return textMap[this.status?.toLowerCase()] || this.status;
  }
}
