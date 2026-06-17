import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Lease, Bill, Deposit, SourceRecord } from '../../types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-lease-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTabsModule, MatListModule, MatDividerModule, MatButtonModule, MatIconModule, StatusBadgeComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      租约详情
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group>
        <mat-tab label="租约信息">
          <div class="tab-content">
            <mat-list>
              <mat-list-item>
                <span class="label">租约编号：</span>
                <span class="value">{{ data.lease.leaseNo }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">房源：</span>
                <span class="value">{{ data.lease.propertyName }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">租客姓名：</span>
                <span class="value">{{ data.lease.tenantName }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">联系电话：</span>
                <span class="value">{{ data.lease.tenantPhone }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">租期：</span>
                <span class="value">{{ data.lease.startDate }} 至 {{ data.lease.endDate }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">月租金：</span>
                <span class="value">¥{{ data.lease.monthlyRent }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">押金：</span>
                <span class="value">¥{{ data.lease.deposit }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">状态：</span>
                <app-status-badge [status]="getStatusBadge(data.lease.status)" [label]="getStatusLabel(data.lease.status)"></app-status-badge>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">来源：</span>
                <span class="value">{{ data.lease.source }}</span>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <mat-tab label="关联账单">
          <div class="tab-content">
            <mat-list *ngIf="data.bills.length > 0">
              <mat-list-item *ngFor="let bill of data.bills" class="bill-item">
                <div class="bill-info">
                  <span class="bill-no">{{ bill.billNo }}</span>
                  <span class="bill-type">{{ getBillTypeLabel(bill.type) }}</span>
                </div>
                <div class="bill-amount">¥{{ bill.amount }}</div>
                <app-status-badge [status]="getBillStatusBadge(bill.status)" [label]="getBillStatusLabel(bill.status)"></app-status-badge>
              </mat-list-item>
            </mat-list>
            <div *ngIf="data.bills.length === 0" class="empty">暂无账单</div>
          </div>
        </mat-tab>

        <mat-tab label="押金记录">
          <div class="tab-content">
            <mat-list *ngIf="data.deposits.length > 0">
              <mat-list-item *ngFor="let deposit of data.deposits" class="deposit-item">
                <div class="deposit-info">
                  <span class="deposit-no">{{ deposit.depositNo }}</span>
                  <span class="deposit-type">{{ getDepositTypeLabel(deposit.type) }}</span>
                </div>
                <div class="deposit-amount">¥{{ deposit.amount }}</div>
                <app-status-badge [status]="getDepositStatusBadge(deposit.status)" [label]="getDepositStatusLabel(deposit.status)"></app-status-badge>
              </mat-list-item>
            </mat-list>
            <div *ngIf="data.deposits.length === 0" class="empty">暂无押金记录</div>
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
    .bill-item, .deposit-item {
      display: flex !important;
      justify-content: space-between;
      align-items: center;
    }
    .bill-info, .deposit-info {
      display: flex;
      flex-direction: column;
    }
    .bill-no, .deposit-no {
      font-weight: 500;
    }
    .bill-type, .deposit-type {
      font-size: 12px;
      color: #999;
    }
    .bill-amount, .deposit-amount {
      font-weight: 600;
      color: #1976d2;
    }
    .source-item {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start !important;
      gap: 4px;
    }
    .source-info {
      display: flex;
      gap: 12px;
    }
    .source-action {
      font-weight: 500;
    }
    .source-operator {
      color: #666;
      font-size: 13px;
    }
    .source-detail {
      color: #666;
      font-size: 13px;
    }
    .source-date {
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
export class LeaseDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<LeaseDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      lease: Lease;
      bills: Bill[];
      deposits: Deposit[];
      sources: SourceRecord[];
    }
  ) {}

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      active: 'success',
      pending: 'warning',
      expired: 'info',
      terminated: 'error'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: '进行中',
      pending: '待生效',
      expired: '已到期',
      terminated: '已终止'
    };
    return map[status] || status;
  }

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

  getBillStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      paid: 'success',
      unpaid: 'warning',
      overdue: 'error',
      cancelled: 'default'
    };
    return map[status] || 'default';
  }

  getBillStatusLabel(status: string): string {
    const map: Record<string, string> = {
      paid: '已支付',
      unpaid: '未支付',
      overdue: '已逾期',
      cancelled: '已取消'
    };
    return map[status] || status;
  }

  getDepositTypeLabel(type: string): string {
    const map: Record<string, string> = {
      rent_deposit: '房租押金',
      utility_deposit: '水电押金'
    };
    return map[type] || type;
  }

  getDepositStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      collected: 'success',
      returned: 'info',
      deducted: 'warning'
    };
    return map[status] || 'default';
  }

  getDepositStatusLabel(status: string): string {
    const map: Record<string, string> = {
      collected: '已收取',
      returned: '已退还',
      deducted: '已扣除'
    };
    return map[status] || status;
  }
}
