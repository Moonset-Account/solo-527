import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Bill, SourceRecord } from '../../types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTabsModule, MatListModule, MatDividerModule, MatButtonModule, MatIconModule, StatusBadgeComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      账单详情
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group>
        <mat-tab label="账单信息">
          <div class="tab-content">
            <mat-list>
              <mat-list-item>
                <span class="label">账单编号：</span>
                <span class="value">{{ data.bill.billNo }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">关联租约：</span>
                <span class="value">{{ data.bill.leaseNo }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">账单类型：</span>
                <span class="value">{{ getBillTypeLabel(data.bill.type) }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">金额：</span>
                <span class="value amount">¥{{ data.bill.amount }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">账单日期：</span>
                <span class="value">{{ data.bill.billDate }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">到期日：</span>
                <span class="value">{{ data.bill.dueDate }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">状态：</span>
                <app-status-badge [status]="getStatusBadge(data.bill.status)" [label]="getStatusLabel(data.bill.status)"></app-status-badge>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">对账状态：</span>
                <app-status-badge [status]="data.bill.reconciled ? 'success' : 'warning'" [label]="data.bill.reconciled ? '已对账' : '未对账'"></app-status-badge>
              </mat-list-item>
              <mat-divider *ngIf="data.bill.reconcileNote"></mat-divider>
              <mat-list-item *ngIf="data.bill.reconcileNote">
                <span class="label">对账说明：</span>
                <span class="value">{{ data.bill.reconcileNote }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">来源：</span>
                <span class="value">{{ data.bill.source }}</span>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <mat-tab label="来源记录">
          <div class="tab-content">
            <mat-list *ngIf="data.sources.length > 0">
              <mat-list-item *ngFor="let record of data.sources" class="source-item">
                <div class="source-info">
                  <span class="source-action">{{ record.action }}</span>
                  <span class="source-operator">{{ record.operator }}</span>
                </div>
                <span class="source-detail">{{ record.detail }}</span>
                <span class="source-date">{{ record.createdAt }}</span>
              </mat-list-item>
            </mat-list>
            <div *ngIf="data.sources.length === 0" class="empty">暂无来源记录</div>
          </div>
        </mat-tab>

        <mat-tab label="操作日志">
          <div class="tab-content">
            <mat-list>
              <mat-list-item class="log-item">
                <div class="log-info">
                  <span class="log-action">创建账单</span>
                  <span class="log-operator">系统</span>
                </div>
                <span class="log-date">{{ data.bill.createdAt }}</span>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 16px 24px;
    }
    .close-btn {
      margin-right: -8px;
    }
    .dialog-content {
      padding: 0;
      min-height: 400px;
    }
    .tab-content {
      padding: 16px 0;
    }
    .label {
      color: #666;
      min-width: 100px;
    }
    .value {
      color: #333;
    }
    .amount {
      color: #1976d2;
      font-weight: 600;
      font-size: 18px;
    }
    .source-item, .log-item {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start !important;
      gap: 4px;
    }
    .source-info, .log-info {
      display: flex;
      gap: 12px;
    }
    .source-action, .log-action {
      font-weight: 500;
    }
    .source-operator, .log-operator {
      color: #666;
      font-size: 13px;
    }
    .source-detail {
      color: #666;
      font-size: 13px;
    }
    .source-date, .log-date {
      color: #999;
      font-size: 12px;
    }
    .empty {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }
  `]
})
export class BillDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<BillDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      bill: Bill;
      sources: SourceRecord[];
    }
  ) {}

  getBillTypeLabel(type: string): string {
    const map: Record<string, string> = {
      rent: '租金',
      water: '水费',
      electricity: '电费',
      service: '服务费',
      other: '其他'
    };
    return map[type] || type;
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      paid: 'success',
      unpaid: 'warning',
      overdue: 'error',
      cancelled: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      paid: '已支付',
      unpaid: '未支付',
      overdue: '已逾期',
      cancelled: '已取消'
    };
    return map[status] || status;
  }
}
