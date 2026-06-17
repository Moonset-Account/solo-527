import { Component, Input } from '@angular/core';
@Component({
  selector: 'status-badge',
  template: `<span class="chip chip-{{ cls }}">{{ text }}</span>`,
  styles: [``],
})
export class StatusBadge {
  @Input() status = 'pending';
  map: Record<string, [string, string]> = {
    pending: ['pending', '待审核'],
    reviewing: ['reviewing', '审核中'],
    approved: ['approved', '审核通过'],
    paid: ['paid', '已支付'],
    checked_in: ['checked', '已签到'],
    refunded: ['refunded', '已退款'],
    closed: ['closed', '异常关闭'],
    rejected: ['rejected', '审核未通过'],
  };
  get cls() { return this.map[this.status]?.[0] || 'pending'; }
  get text() { return this.map[this.status]?.[1] || this.status; }
}
