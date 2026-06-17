import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'refunds-page',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="page-title">💸 退款申请中心</div>
          <div class="page-subtitle">审核退款申请、执行退款操作、关联原单追溯</div>
        </div>
      </div>

      <div class="grid grid-4 gap-16 mb-24">
        <kpi-card label="总申请" [value]="total" theme="rose"></kpi-card>
        <kpi-card label="待处理" [value]="pendingCount" theme="amber" sub="需审核"></kpi-card>
        <kpi-card label="已退款" [value]="executedCount" theme="emerald"></kpi-card>
        <kpi-card label="已驳回" [value]="rejectedCount" theme="indigo"></kpi-card>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><span class="material-icons icon">history</span> 退款申请列表</div>
          <div class="flex gap-8">
            <mat-button-toggle-group [(value)]="filterStatus" (change)="load()">
              <mat-button-toggle value="">全部</mat-button-toggle>
              <mat-button-toggle value="pending">待处理</mat-button-toggle>
              <mat-button-toggle value="approved">待执行</mat-button-toggle>
              <mat-button-toggle value="executed">已完成</mat-button-toggle>
              <mat-button-toggle value="rejected">已驳回</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <table mat-table [dataSource]="data" style="width:100%">
          <ng-container matColumnDef="refundNo">
            <th mat-header-cell *matHeaderCellDef>退款单号</th>
            <td mat-cell *matCellDef="let r" style="font-family:monospace;color:#be123c;font-weight:600">{{ r.refundNo }}</td>
          </ng-container>
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>申请人</th>
            <td mat-cell *matCellDef="let r">
              <div style="font-weight:600">{{ r.registration.user.name }}</div>
              <div style="font-size:11px;color:#64748b">{{ r.registration.user.phone }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="order">
            <th mat-header-cell *matHeaderCellDef>关联原单</th>
            <td mat-cell *matCellDef="let r">
              <div style="font-family:monospace;color:#3b82f6;font-size:12px">{{ r.registration.orderNo }}</div>
              <div style="font-size:11px;color:#64748b">
                {{ r.registration.ticketType.name }} · ¥{{ r.registration.amount }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>退款金额</th>
            <td mat-cell *matCellDef="let r" style="color:#be123c;font-weight:700;font-size:16px">¥{{ r.amount.toFixed(2) }}</td>
          </ng-container>
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>原因</th>
            <td mat-cell *matCellDef="let r">
              <div style="max-width:200px">{{ r.reason }}</div>
              <div *ngIf="r.note" style="font-size:11px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">{{ r.note }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let r">
              <span class="chip" [ngClass]="{
                'chip-pending': r.status==='pending',
                'chip-reviewing': r.status==='approved',
                'chip-checked': r.status==='executed',
                'chip-rejected': r.status==='rejected',
                'chip-closed': r.status==='failed',
              }">{{ {
                pending: '待审核', approved: '待执行', executed: '已完成',
                rejected: '已驳回', failed: '失败'
              }[r.status] }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef>申请时间</th>
            <td mat-cell *matCellDef="let r" style="font-size:12px;color:#64748b">{{ formatTime(r.createdAt) }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="width:220px">操作</th>
            <td mat-cell *matCellDef="let r">
              <button *ngIf="r.status==='pending'" mat-stroked-button color="primary" (click)="review(r, 'approve')" style="margin-right:4px">通过</button>
              <button *ngIf="r.status==='pending'" mat-stroked-button color="warn" (click)="review(r, 'reject')" style="margin-right:4px">驳回</button>
              <button *ngIf="r.status==='approved'" mat-raised-button color="primary" (click)="execute(r)">执行退款</button>
              <button mat-icon-button (click)="view(r)"><span class="material-icons">visibility</span></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols" class="row-hover"></tr>
        </table>
        <mat-paginator #p [length]="total" [pageSize]="10" (page)="load()"></mat-paginator>
      </div>

      <div *ngIf="detail" class="mt-24 card" style="border:2px solid #bfdbfe;background:#f0f9ff">
        <div class="flex-between mb-16">
          <div style="font-weight:700;color:#1e40af;font-size:16px">🔗 退款详情 · 原单追溯</div>
          <button mat-icon-button (click)="detail=null"><span class="material-icons">close</span></button>
        </div>
        <div class="grid grid-2 gap-24">
          <div class="detail-box">
            <div class="d-title" style="color:#be123c">退款申请</div>
            <div class="d-row"><span>退款单号</span><strong style="font-family:monospace">{{ detail.refundNo }}</strong></div>
            <div class="d-row"><span>退款金额</span><strong style="color:#be123c;font-size:20px">¥{{ detail.amount }}</strong></div>
            <div class="d-row"><span>原因</span><strong>{{ detail.reason }}</strong></div>
            <div class="d-row"><span>备注</span><div style="text-align:right;max-width:240px">{{ detail.note || '-' }}</div></div>
            <div class="d-row"><span>申请时间</span><strong>{{ formatTime(detail.createdAt) }}</strong></div>
            <div class="d-row"><span>审核时间</span><strong>{{ detail.reviewedAt ? formatTime(detail.reviewedAt) : '-' }}</strong></div>
            <div class="d-row"><span>执行时间</span><strong>{{ detail.executedAt ? formatTime(detail.executedAt) : '-' }}</strong></div>
            <div class="d-row"><span>流水号</span><strong style="font-family:monospace">{{ detail.transactionId || '-' }}</strong></div>
          </div>
          <div class="detail-box">
            <div class="d-title" style="color:#1e40af">关联原单</div>
            <div class="d-row"><span>订单号</span><strong style="font-family:monospace">{{ detail.registration.orderNo }}</strong></div>
            <div class="d-row"><span>状态</span><strong><status-badge [status]="detail.registration.status"></status-badge></strong></div>
            <div class="d-row"><span>参会人</span><strong>{{ detail.registration.user.name }} · {{ detail.registration.user.phone }}</strong></div>
            <div class="d-row"><span>公司职位</span><strong>{{ detail.registration.user.company }} · {{ detail.registration.user.title }}</strong></div>
            <div class="d-row"><span>票种场次</span><strong>{{ detail.registration.ticketType.name }} · {{ detail.registration.session.name }}</strong></div>
            <div class="d-row"><span>原单金额</span><strong style="color:#be123c">¥{{ detail.registration.amount }}</strong></div>
            <div class="d-row"><span>质量评分</span><strong>{{ detail.registration.qualityScore }} 分</strong></div>
            <div class="d-row"><span>提交时间</span><strong>{{ formatTime(detail.registration.createdAt) }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.row-hover:hover { background:#f8fafc; }
    .detail-box { background:white;padding:16px 20px;border-radius:12px;border:1px solid #e2e8f0; }
    .d-title { font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f1f5f9; }
    .d-row { display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px; }
    .d-row span { color:#64748b; }`],
})
export class RefundsPage implements OnInit {
  cols = ['refundNo', 'user', 'order', 'amount', 'reason', 'status', 'time', 'actions'];
  data = new MatTableDataSource<any>([]);
  total = 0; pendingCount = 0; executedCount = 0; rejectedCount = 0;
  filterStatus = ''; detail: any = null;
  @ViewChild('p') pager!: MatPaginator;
  constructor(public api: ApiService) {}
  formatTime(t: any) { return t ? new Date(t).toLocaleString('zh-CN') : '-'; }
  async ngOnInit() { await this.load(); }
  async load() {
    const params: any = { page: (this.pager?.pageIndex || 0) + 1, pageSize: this.pager?.pageSize || 10 };
    if (this.filterStatus) params.status = this.filterStatus;
    const res: any = await firstValue(this.api.listRefunds(params));
    this.data.data = res.items; this.total = res.total;
    this.pendingCount = res.items.filter((x: any) => x.status === 'pending').length;
    this.executedCount = res.items.filter((x: any) => x.status === 'executed').length;
    this.rejectedCount = res.items.filter((x: any) => x.status === 'rejected').length;
  }
  async review(r: any, action: string) {
    const note = prompt(action === 'approve' ? '审核通过备注（可选）' : '请填写驳回原因');
    if (action === 'reject' && !note) { this.api.toast('驳回必须填写原因', 'error'); return; }
    try {
      await firstValue(this.api.reviewRefund(r.id, { action, note: note || '' }));
      this.api.toast('审核成功'); this.load();
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
  }
  async execute(r: any) {
    if (!confirm(`确认执行退款 ¥${r.amount}？将模拟支付退款并释放库存`)) return;
    try {
      await firstValue(this.api.executeRefund(r.id));
      this.api.toast('退款执行成功，已释放库存和座位');
      this.load();
    } catch (e: any) { this.api.toast(e.error?.message || '失败', 'error'); }
  }
  async view(r: any) { this.detail = await firstValue(this.api.getRefund(r.id)) as any; }
}
function firstValue(o: any) { return (o as any).pipe ? (o as any).toPromise() : Promise.resolve(o); }
