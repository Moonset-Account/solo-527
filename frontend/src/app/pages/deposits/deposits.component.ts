import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { lastValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { DepositsService } from '../../services/deposits.service';
import { ExportService } from '../../services/export.service';
import { Deposit, DepositType, DepositStatus } from '../../types';
import { DepositDetailComponent } from './deposit-detail.component';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderComponent,
    DataTableComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header title="押金记录" subtitle="管理所有押金收支记录">
      <button mat-raised-button color="primary" (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
    </app-page-header>

    <div class="page-content">
      <div class="filter-section">
        <div class="filter-form">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="filters.status">
              <mat-option value="">全部</mat-option>
              <mat-option value="active">有效</mat-option>
              <mat-option value="refunded">已退还</mat-option>
              <mat-option value="deducted">已扣除</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>类型</mat-label>
            <mat-select [(ngModel)]="filters.type">
              <mat-option value="">全部</mat-option>
              <mat-option value="received">已收</mat-option>
              <mat-option value="refunded">已退</mat-option>
              <mat-option value="deducted">扣除</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field date-range">
            <mat-label>日期范围</mat-label>
            <mat-date-range-input [rangePicker]="picker">
              <input matStartDate [(ngModel)]="filters.dateRange.start" placeholder="开始日期">
              <input matEndDate [(ngModel)]="filters.dateRange.end" placeholder="结束日期">
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>

          <div class="filter-actions">
            <button mat-raised-button color="primary" (click)="onSearch()">
              <mat-icon>search</mat-icon>
              搜索
            </button>
            <button mat-stroked-button (click)="onReset()">
              <mat-icon>refresh</mat-icon>
              重置
            </button>
          </div>
        </div>
      </div>

      <div class="table-section">
        <app-data-table
          [data]="deposits"
          [columns]="columns"
          [total]="total"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [sortable]="true"
          (pageChange)="onPageChange($event)"
          [actionTemplate]="actionTemplate"
        >
          <ng-template cellTemplate="amount" let-row>
            <span class="amount">¥{{ row.amount?.toFixed(2) }}</span>
          </ng-template>
          <ng-template cellTemplate="type" let-row>
            <app-status-badge [status]="getTypeBadge(row.type)" [label]="getTypeLabel(row.type)"></app-status-badge>
          </ng-template>
          <ng-template cellTemplate="status" let-row>
            <app-status-badge [status]="getStatusBadge(row.status)" [label]="getStatusLabel(row.status)"></app-status-badge>
          </ng-template>
          <ng-template #actionTemplate let-row>
            <button mat-button color="primary" (click)="onViewDetail(row)">查看</button>
          </ng-template>
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .page-content { padding: 0 24px 24px; }
    .filter-section {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .filter-form { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
    .filter-field { flex: 1; min-width: 160px; }
    .date-range { min-width: 280px; }
    .filter-actions { display: flex; gap: 8px; padding-bottom: 4px; }
    .table-section { min-height: 400px; }
    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .filter-form { flex-direction: column; }
      .filter-field, .date-range { width: 100%; min-width: auto; }
      .filter-actions { width: 100%; justify-content: stretch; button { flex: 1; } }
    }
  `]
})
export class DepositsComponent implements OnInit {
  private depositsService = inject(DepositsService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);

  deposits: Deposit[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  filters = {
    status: '',
    type: '',
    dateRange: { start: null as Date | null, end: null as Date | null }
  };

  columns: ColumnDef[] = [
    { key: 'depositNo', label: '押金编号', sortable: true },
    { key: 'leaseNo', label: '租约编号' },
    { key: 'amount', label: '金额', type: 'template' },
    { key: 'type', label: '类型', type: 'template' },
    { key: 'status', label: '状态', type: 'template' },
    { key: 'date', label: '日期' },
    { key: 'source', label: '来源' }
  ];

  ngOnInit(): void {
    this.loadDeposits();
  }

  loadDeposits(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      status: this.filters.status || undefined,
      type: this.filters.type || undefined
    };

    this.depositsService.getDeposits(params).subscribe(response => {
      if (response.success) {
        this.deposits = response.data.items;
        this.total = response.data.total;
        this.pageIndex = response.data.page - 1;
        this.pageSize = response.data.pageSize;
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadDeposits();
  }

  onReset(): void {
    this.filters = {
      status: '',
      type: '',
      dateRange: { start: null, end: null }
    };
    this.pageIndex = 0;
    this.loadDeposits();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDeposits();
  }

  async onViewDetail(deposit: Deposit): Promise<void> {
    try {
      const response = await lastValueFrom(this.depositsService.getDeposit(deposit.id));
      if (response.success) {
        this.dialog.open(DepositDetailComponent, {
          width: '500px',
          maxWidth: '90vw',
          data: { deposit: response.data }
        });
      }
    } catch (error) {
      console.error('获取押金详情失败:', error);
    }
  }

  async onExport(): Promise<void> {
    try {
      const filters = {
        status: this.filters.status || undefined,
        type: this.filters.type || undefined
      };
      const blob = await lastValueFrom(this.exportService.exportData('deposits', filters));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deposits_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  }

  getStatusBadge(status: DepositStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<DepositStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      active: 'success',
      refunded: 'info',
      deducted: 'warning'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: DepositStatus): string {
    const map: Record<DepositStatus, string> = {
      active: '有效',
      refunded: '已退还',
      deducted: '已扣除'
    };
    return map[status] || status;
  }

  getTypeBadge(type: DepositType): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<DepositType, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      received: 'success',
      refunded: 'info',
      deducted: 'warning'
    };
    return map[type] || 'default';
  }

  getTypeLabel(type: DepositType): string {
    const map: Record<DepositType, string> = {
      received: '已收',
      refunded: '已退',
      deducted: '扣除'
    };
    return map[type] || type;
  }
}
