import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Deposit, SourceRecord } from '../../types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-deposit-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule, StatusBadgeComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      押金详情
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-list>
        <mat-list-item>
          <span class="label">押金编号：</span>
          <span class="value">{{ deposit.depositNo }}</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">关联租约：</span>
          <span class="value">{{ deposit.leaseNo }}</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">金额：</span>
          <span class="value amount">¥{{ deposit.amount }}</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">类型：</span>
          <span class="value">{{ getTypeLabel(deposit.type) }}</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">状态：</span>
          <app-status-badge [status]="getStatusBadge(deposit.status)" [label]="getStatusLabel(deposit.status)"></app-status-badge>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">日期：</span>
          <span class="value">{{ deposit.date }}</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item>
          <span class="label">来源：</span>
          <span class="value">{{ deposit.source }}</span>
        </mat-list-item>
        <mat-divider *ngIf="deposit.note"></mat-divider>
        <mat-list-item *ngIf="deposit.note">
          <span class="label">补充说明：</span>
          <span class="value">{{ deposit.note }}</span>
        </mat-list-item>
      </mat-list>

      <h3 class="section-title">来源记录</h3>
      <mat-list *ngIf="sources.length > 0">
        <mat-list-item *ngFor="let record of sources" class="source-item">
          <div class="source-info">
            <span class="source-action">{{ record.action }}</span>
            <span class="source-operator">{{ record.operator }}</span>
          </div>
          <span class="source-detail">{{ record.detail }}</span>
          <span class="source-date">{{ record.createdAt }}</span>
        </mat-list-item>
      </mat-list>
      <div *ngIf="sources.length === 0" class="empty">暂无来源记录</div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin: 0; padding: 16px 24px; }
    .close-btn { margin-right: -8px; }
    .dialog-content { padding: 0 24px 24px; }
    .label { color: #666; min-width: 100px; }
    .value { color: #333; }
    .amount { color: #1976d2; font-weight: 600; font-size: 18px; }
    .section-title { margin: 20px 0 10px; font-size: 16px; font-weight: 500; }
    .source-item { display: flex !important; flex-direction: column; align-items: flex-start !important; gap: 4px; }
    .source-info { display: flex; gap: 12px; }
    .source-action { font-weight: 500; }
    .source-operator { color: #666; font-size: 13px; }
    .source-detail { color: #666; font-size: 13px; }
    .source-date { color: #999; font-size: 12px; }
    .empty { text-align: center; color: #999; padding: 20px 0; }
  `]
})
export class DepositDetailComponent {
  deposit: Deposit;
  sources: SourceRecord[];

  constructor(
    public dialogRef: MatDialogRef<DepositDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { deposit: Deposit; sources: SourceRecord[] }
  ) {
    this.deposit = data.deposit;
    this.sources = data.sources;
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      rent_deposit: '房租押金',
      utility_deposit: '水电押金'
    };
    return map[type] || type;
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      collected: 'success',
      returned: 'info',
      deducted: 'warning'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      collected: '已收取',
      returned: '已退还',
      deducted: '已扣除'
    };
    return map[status] || status;
  }
}
