import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillService } from '../../services/bill.service';
import { Bill } from '../../services/api.config';
import { PaymentDialogComponent } from './payment-dialog.component';
import { StatusDialogComponent } from './status-dialog.component';

@Component({
  selector: 'app-bills',
  template: `
    <div class="bills-container">
      <mat-card class="filter-card">
        <mat-card-title>搜索过滤</mat-card-title>
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>账单号</mat-label>
            <input matInput formControlName="billNumber" placeholder="请输入账单号">
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>客户名</mat-label>
            <input matInput formControlName="customerName" placeholder="请输入客户名">
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">全部</mat-option>
              <mat-option value="draft">草稿</mat-option>
              <mat-option value="issued">已出具</mat-option>
              <mat-option value="pending">待支付</mat-option>
              <mat-option value="partial">部分支付</mat-option>
              <mat-option value="paid">已支付</mat-option>
              <mat-option value="overdue">已逾期</mat-option>
              <mat-option value="written_off">已核销</mat-option>
              <mat-option value="disputed">有争议</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>开始日期</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>结束日期</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          <div class="filter-actions">
            <button mat-raised-button color="primary" (click)="onSearch()">
              <mat-icon>search</mat-icon>
              搜索
            </button>
            <button mat-button (click)="onReset()">
              <mat-icon>refresh</mat-icon>
              重置
            </button>
          </div>
        </form>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-header">
          <mat-card-title>账单列表</mat-card-title>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="bills-table">
            <ng-container matColumnDef="billNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>账单号</th>
              <td mat-cell *matCellDef="let bill">{{ bill.billNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>客户</th>
              <td mat-cell *matCellDef="let bill">{{ bill.customer?.name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="subscription">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>订阅计划</th>
              <td mat-cell *matCellDef="let bill">{{ bill.subscription?.planName || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>金额</th>
              <td mat-cell *matCellDef="let bill">{{ bill.totalAmount | formatCurrency:bill.currency }}</td>
            </ng-container>
            <ng-container matColumnDef="remainingAmount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>剩余金额</th>
              <td mat-cell *matCellDef="let bill">
                <span [class.overdue-amount]="bill.remainingAmount > 0 && bill.status === 'overdue'">
                  {{ bill.remainingAmount | formatCurrency:bill.currency }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>到期日</th>
              <td mat-cell *matCellDef="let bill">{{ bill.dueDate | formatDate }}</td>
            </ng-container>
            <ng-container matColumnDef="overdueDays">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>逾期天数</th>
              <td mat-cell *matCellDef="let bill">
                <span *ngIf="bill.overdueDays > 0" class="overdue-days">
                  {{ bill.overdueDays }} 天
                </span>
                <span *ngIf="bill.overdueDays <= 0" class="no-overdue">-</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>状态</th>
              <td mat-cell *matCellDef="let bill">
                <span [ngClass]="bill.status | statusBadge">{{ bill.status | statusDisplay }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let bill">
                <button mat-icon-button color="primary" matTooltip="查看详情" (click)="viewDetail(bill)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" matTooltip="登记付款" (click)="recordPayment(bill)">
                  <mat-icon>payments</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="更新状态" (click)="updateStatus(bill)">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 20, 50, 100]" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .bills-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .filter-card {
      margin-bottom: 16px;
    }
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .filter-field {
      flex: 1;
      min-width: 200px;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      padding-bottom: 8px;
    }
    .table-card {
      flex: 1;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .table-container {
      overflow-x: auto;
    }
    .bills-table {
      width: 100%;
    }
    .overdue-amount {
      color: #f44336;
      font-weight: 500;
    }
    .overdue-days {
      color: #f44336;
      font-weight: 500;
    }
    .no-overdue {
      color: rgba(0, 0, 0, 0.54);
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .status-draft {
      background: #e0e0e0;
      color: #616161;
    }
    .status-issued {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status-pending {
      background: #fff3e0;
      color: #f57c00;
    }
    .status-partial {
      background: #fff8e1;
      color: #fbc02d;
    }
    .status-paid {
      background: #e8f5e9;
      color: #388e3c;
    }
    .status-overdue {
      background: #ffebee;
      color: #d32f2f;
    }
    .status-written-off {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .status-disputed {
      background: #ffe0b2;
      color: #e65100;
    }
    .mat-mdc-header-cell {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }
    .mat-mdc-cell {
      padding: 8px 16px 8px 0;
    }
  `]
})
export class BillsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['billNumber', 'customer', 'subscription', 'totalAmount', 'remainingAmount', 'dueDate', 'overdueDays', 'status', 'actions'];
  dataSource = new MatTableDataSource<Bill>([]);
  filterForm: FormGroup;
  totalCount = 0;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private billService: BillService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      billNumber: [''],
      customerName: [''],
      status: [''],
      startDate: [''],
      endDate: [''],
      page: [1],
      limit: [10],
      sortBy: [''],
      sortOrder: [''],
    });
  }

  ngOnInit(): void {
    this.loadBills();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.paginator.page.subscribe(() => {
      this.filterForm.patchValue({
        page: this.paginator.pageIndex + 1,
        limit: this.paginator.pageSize,
      });
      this.loadBills();
    });

    this.sort.sortChange.subscribe(() => {
      this.filterForm.patchValue({
        sortBy: this.sort.active,
        sortOrder: this.sort.direction,
      });
      this.loadBills();
    });
  }

  loadBills(): void {
    this.isLoading = true;
    const filters = this.filterForm.value;
    this.billService.findAll(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalCount = response.total;
        this.paginator.length = this.totalCount;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load bills:', error);
        this.snackBar.open('加载账单列表失败', '关闭', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.paginator.firstPage();
    this.loadBills();
  }

  onReset(): void {
    this.filterForm.reset({
      billNumber: '',
      customerName: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
      sortBy: '',
      sortOrder: '',
    });
    this.paginator.firstPage();
    this.loadBills();
  }

  viewDetail(bill: Bill): void {
    this.router.navigate(['/bills', bill.id]);
  }

  recordPayment(bill: Bill): void {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '520px',
      data: { bill }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.billService.recordPayment(bill.id, result).subscribe({
          next: (updatedBill) => {
            this.snackBar.open('付款登记成功', '关闭', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadBills();
          },
          error: (error) => {
            console.error('Failed to record payment:', error);
            this.snackBar.open('付款登记失败', '关闭', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
      }
    });
  }

  updateStatus(bill: Bill): void {
    const dialogRef = this.dialog.open(StatusDialogComponent, {
      width: '520px',
      data: { bill }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.billService.updateStatus(bill.id, result.status, result.reason).subscribe({
          next: (updatedBill) => {
            this.snackBar.open('状态更新成功', '关闭', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadBills();
          },
          error: (error) => {
            console.error('Failed to update status:', error);
            this.snackBar.open('状态更新失败', '关闭', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
      }
    });
  }
}
