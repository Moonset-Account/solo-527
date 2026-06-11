import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    const labels: Record<string, string> = {
      draft: '草稿',
      budgeting: '预算中',
      confirmed: '已确认',
      contracted: '已签约',
      constructing: '施工中',
      completed: '已完成',
      pending_review: '待审核',
      approved: '已审批',
      rejected: '已驳回',
      sent_to_client: '已发送客户',
      sent: '已发送',
      signed: '已签署',
      pending: '待处理',
      processing: '处理中',
      closed: '已关闭',
    };
    return labels[value] || value;
  }
}
