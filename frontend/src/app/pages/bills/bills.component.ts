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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { MockDataService } from '../../services/mock-data.service';
import { Bill, PageResult, SourceRecord } from '../../types';
import { BillDetailComponent } from './bill-detail.component';

@Component({
  selector: 'app-bills',
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
    MatCheckboxModule,
    MatSnackBarModule,
    PageHeaderComponent,
    DataTableComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header title="账单管理" subtitle="管理所有账单信息">
      <button mat-stroked-button (click)="onBatchReconcile()" [disabled]="selectedBills.length === 0">
        <mat-icon>check_circle</mat-icon>
        批量对账
      </button>
      <button mat-raised-button color="primary" (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
    </app-page-header>

    <div class="page-content">
      <div class="filter-section">
        <div class="filter-form">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>账单类型</mat-label>
            <mat-select [(ngModel)]="filters.type">
              <mat-option value="">全部</mat-option>
              <mat-option value="rent">租金</mat-option>
              <mat-option value="water">水费</mat-option>
              <mat-option value="electricity">电费</mat-option>
              <mat-option value="service">服务费</mat-option>
              <mat-option value="other">其他</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="filters.status">
              <mat-option value="">全部</mat-option>
              <mat-option value="unpaid">未支付</mat-option>
              <mat-option value="paid">已支付</mat-option>
              <mat-option value="overdue">已逾期</mat-option>
              <mat-option value="cancelled">已取消</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>对账状态</mat-label>
            <mat-select [(ngModel)]="filters.reconciled">
              <mat-option value="">全部</mat-option>
              <mat-option [value]="true">已对账</mat-option>
              <mat-option [value]="false">未对账</mat-option>
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
          [data]="bills"
          [columns]="columns"
          [total]="total"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [sortable]="true"
          [selectable]="true"
          (pageChange)="onPageChange($event)"
          (selectionChange)="onSelectionChange($event)"
          [actionTemplate]="actionTemplate"
          [cellTemplate]="cellTemplates"
        >
          <ng-template #statusTemplate let-row>
            <app-status-badge [status]="getStatusBadge(row.status)" [label]="getStatusLabel(row.status)"></app-status-badge>
          </ng-template>
          <ng-template #reconciledTemplate let-row>
            <app-status-badge [status]="row.reconciled ? 'success' : 'warning'" [label]="row.reconciled ? '已对账' : '未对账'"></app-status-badge>
          </ng-template>
          <ng-template #amountTemplate let-row>
            <span class="amount">¥{{ row.amount }}</span>
          </ng-template>
          <ng-template #actionTemplate let-row>
            <button mat-button color="primary" (click)="onViewDetail(row)">查看</button>
            <button mat-button (click)="onReconcile(row)" *ngIf="!row.reconciled">对账</button>
          </ng-template>
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      padding: 0 24px 24px;
    }
    .filter-section {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
    }
    .filter-field {
      flex: 1;
      min-width: 160px;
    }
    .date-range {
      min-width: 280px;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
      padding-bottom: 4px;
    }
    .table-section {
      min-height: 400px;
    }
    .amount {
      color: #1976d2;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .page-content {
        padding: 0 12px 12px;
      }
      .filter-form {
        flex-direction: column;
      }
      .filter-field, .date-range {
        width: 100%;
        min-width: auto;
      }
      .filter-actions {
        width: 100%;
        justify-content: stretch;
        button { flex: 1; }
      }
    }
  `]
})
export class BillsComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  bills: Bill[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  selectedBills: Bill[] = [];

  filters = {
    type: '',
    status: '',
    reconciled: '' as any,
    dateRange: { start: null as Date | null, end: null as Date | null }
  };

  columns: ColumnDef[] = [
    { key: 'billNo', label: '账单编号', sortable: true },
    { key: 'leaseNo', label: '租约编号' },
    { key: 'type', label: '类型' },
    { key: 'amount', label: '金额', type: 'template' },
    { key: 'billDate', label: '账单日期' },
    { key: 'dueDate', label: '到期日' },
    { key: 'status', label: '状态', type: 'template' },
    { key: 'reconciled', label: '对账状态', type: 'template' }
  ];

  get cellTemplates() {
    return {
      status: null,
      reconciled: null,
      amount: null
    };
  }

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      type: this.filters.type || undefined,
      status: this.filters.status || undefined,
      reconciled: this.filters.reconciled !== '' ? this.filters.reconciled : undefined
    };

    this.mockDataService.getBills(params).subscribe((result: PageResult<Bill>) => {
      this.bills = result.items;
      this.total = result.total;
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadBills();
  }

  onReset(): void {
    this.filters = {
      type: '',
      status: '',
      reconciled: '',
      dateRange: { start: null, end: null }
    };
    this.pageIndex = 0;
    this.loadBills();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBills();
  }

  onSelectionChange(selected: any[]): void {
    this.selectedBills = selected;
  }

  onViewDetail(bill: Bill): void {
    this.mockDataService.getSourceRecords('bill', bill.id).subscribe(sources => {
      this.dialog.open(BillDetailComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: { bill, sources }
      });
    });
  }

  onReconcile(bill: Bill): void {
    const note = prompt('请输入对账说明：');
    if (note !== null) {
      bill.reconciled = true;
      bill.reconcileNote = note || '已对账';
      this.snackBar.open('对账成功', '关闭', { duration: 2000 });
    }
  }

  onBatchReconcile(): void {
    if (this.selectedBills.length === 0) return;
    const note = prompt(`确认对 ${this.selectedBills.length} 条账单进行对账？请输入说明：`);
    if (note !== null) {
      this.selectedBills.forEach(bill => {
        bill.reconciled = true;
        bill.reconcileNote = note || '批量对账';
      });
      this.snackBar.open(`已对账 ${this.selectedBills.length} 条账单`, '关闭', { duration: 2000 });
    }
  }

  onExport(): void {
    alert('导出功能待实现');
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
