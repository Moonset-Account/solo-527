import { Component, OnInit, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CollectionService } from '../../services/collection.service';
import { CollectionRecord } from '../../services/api.config';


@Component({
  selector: 'app-collection-records',
  template: `
    <div class="records-container">
      <mat-card class="filter-card">
        <mat-card-title>筛选条件</mat-card-title>
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>账单号</mat-label>
            <input matInput formControlName="billNumber" placeholder="请输入账单号">
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>客户</mat-label>
            <input matInput formControlName="customerName" placeholder="请输入客户名">
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>严重程度</mat-label>
            <mat-select formControlName="severity">
              <mat-option value="">全部</mat-option>
              <mat-option value="reminder">提醒</mat-option>
              <mat-option value="warning">警告</mat-option>
              <mat-option value="urgent">紧急</mat-option>
              <mat-option value="legal">法务</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>渠道</mat-label>
            <mat-select formControlName="channel">
              <mat-option value="">全部</mat-option>
              <mat-option value="email">邮件</mat-option>
              <mat-option value="sms">短信</mat-option>
              <mat-option value="phone">电话</mat-option>
              <mat-option value="letter">信函</mat-option>
              <mat-option value="in_person">上门</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">全部</mat-option>
              <mat-option value="pending">待处理</mat-option>
              <mat-option value="in_progress">进行中</mat-option>
              <mat-option value="completed">已完成</mat-option>
              <mat-option value="failed">失败</mat-option>
              <mat-option value="skipped">已跳过</mat-option>
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
          <div>
            <mat-card-title>催收记录</mat-card-title>
            <mat-card-subtitle>查看和管理所有催收操作记录</mat-card-subtitle>
          </div>
        </div>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="records-table">
            <ng-container matColumnDef="billNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>账单号</th>
              <td mat-cell *matCellDef="let record">
                <span class="bill-number">{{ record.bill?.billNumber || '-' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>客户</th>
              <td mat-cell *matCellDef="let record">
                <div class="customer-info">
                  <div class="customer-name">{{ record.bill?.customer?.name || '-' }}</div>
                  <div class="customer-contact">{{ record.bill?.customer?.email || record.bill?.customer?.phone || '' }}</div>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>严重程度</th>
              <td mat-cell *matCellDef="let record">
                <span [ngClass]="getSeverityClass(record.severity)" class="severity-badge">
                  {{ record.severity | statusDisplay }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="channel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>渠道</th>
              <td mat-cell *matCellDef="let record">
                <mat-icon class="channel-icon">{{ getChannelIcon(record.channel) }}</mat-icon>
                {{ record.channel | statusDisplay }}
              </td>
            </ng-container>
            <ng-container matColumnDef="contactDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>联系日期</th>
              <td mat-cell *matCellDef="let record">{{ record.contactDate | formatDateTime }}</td>
            </ng-container>
            <ng-container matColumnDef="customerResponse">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>客户响应</th>
              <td mat-cell *matCellDef="let record">
                <span [ngClass]="getResponseClass(record.customerResponse)" class="response-badge" *ngIf="record.customerResponse">
                  {{ record.customerResponse | statusDisplay }}
                </span>
                <span *ngIf="!record.customerResponse" class="no-response">-</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="promisedPaymentDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>承诺付款日期</th>
              <td mat-cell *matCellDef="let record">
                <span *ngIf="record.promisedPaymentDate" class="promised-date">
                  {{ record.promisedPaymentDate | formatDate }}
                </span>
                <span *ngIf="!record.promisedPaymentDate" class="no-promise">-</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="promisedAmount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>承诺金额</th>
              <td mat-cell *matCellDef="let record">
                <span *ngIf="record.promisedAmount" class="promised-amount">
                  {{ record.promisedAmount | formatCurrency:record.bill?.currency }}
                </span>
                <span *ngIf="!record.promisedAmount" class="no-amount">-</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>状态</th>
              <td mat-cell *matCellDef="let record">
                <span [ngClass]="record.status | statusBadge" class="status-badge">
                  {{ record.status | statusDisplay }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>操作</th>
              <td mat-cell *matCellDef="let record">
                <button mat-icon-button color="primary" matTooltip="查看详情" (click)="viewDetail(record)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" matTooltip="更新状态" (click)="updateStatus(record)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="添加跟进记录" (click)="addFollowUp(record)">
                  <mat-icon>add_comment</mat-icon>
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
    .records-container {
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
      min-width: 180px;
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
    .records-table {
      width: 100%;
    }
    .bill-number {
      font-weight: 500;
      color: #1976d2;
    }
    .customer-info {
      display: flex;
      flex-direction: column;
    }
    .customer-name {
      font-weight: 500;
    }
    .customer-contact {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .severity-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .severity-reminder {
      background: #e3f2fd;
      color: #1565c0;
    }
    .severity-warning {
      background: #fff3e0;
      color: #e65100;
    }
    .severity-urgent {
      background: #ffebee;
      color: #c62828;
    }
    .severity-legal {
      background: #fce4ec;
      color: #880e4f;
    }
    .channel-icon {
      font-size: 18px;
      margin-right: 8px;
      vertical-align: middle;
    }
    .response-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .response-no_response {
      background: #e0e0e0;
      color: #616161;
    }
    .response-promised_to_pay {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .response-disputed {
      background: #ffebee;
      color: #c62828;
    }
    .response-negotiated {
      background: #fff3e0;
      color: #e65100;
    }
    .response-paid {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .no-response, .no-promise, .no-amount {
      color: rgba(0, 0, 0, 0.54);
    }
    .promised-date {
      color: #1565c0;
    }
    .promised-amount {
      font-weight: 500;
      color: #2e7d32;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }
    .status-in_progress {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-completed {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .status-failed {
      background: #ffebee;
      color: #c62828;
    }
    .status-skipped {
      background: #e0e0e0;
      color: #616161;
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
export class CollectionRecordsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['billNumber', 'customer', 'severity', 'channel', 'contactDate', 'customerResponse', 'promisedPaymentDate', 'promisedAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<CollectionRecord>([]);
  filterForm: FormGroup;
  totalCount = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      billNumber: [''],
      customerName: [''],
      severity: [''],
      channel: [''],
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
    this.loadRecords();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.paginator.page.subscribe(() => {
      this.filterForm.patchValue({
        page: this.paginator.pageIndex + 1,
        limit: this.paginator.pageSize,
      });
      this.loadRecords();
    });

    this.sort.sortChange.subscribe(() => {
      this.filterForm.patchValue({
        sortBy: this.sort.active,
        sortOrder: this.sort.direction,
      });
      this.loadRecords();
    });
  }

  loadRecords(): void {
    const filters = this.filterForm.value;
    this.collectionService.findAllRecords(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalCount = response.total;
        this.paginator.length = this.totalCount;
      },
      error: (error) => {
        console.error('Failed to load records:', error);
      }
    });
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getResponseClass(response: string): string {
    return `response-${response}`;
  }

  getChannelIcon(channel: string): string {
    const icons: Record<string, string> = {
      email: 'email',
      sms: 'sms',
      phone: 'phone',
      letter: 'description',
      in_person: 'person'
    };
    return icons[channel] || 'notifications';
  }

  onSearch(): void {
    this.paginator.firstPage();
    this.loadRecords();
  }

  onReset(): void {
    this.filterForm.reset({
      billNumber: '',
      customerName: '',
      severity: '',
      channel: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
      sortBy: '',
      sortOrder: '',
    });
    this.paginator.firstPage();
    this.loadRecords();
  }

  viewDetail(record: CollectionRecord): void {
    this.dialog.open(CollectionRecordDetailDialogComponent, {
      width: '700px',
      data: record
    });
  }

  updateStatus(record: CollectionRecord): void {
    const dialogRef = this.dialog.open(UpdateStatusDialogComponent, {
      width: '500px',
      data: record
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRecords();
      }
    });
  }

  addFollowUp(record: CollectionRecord): void {
    const dialogRef = this.dialog.open(FollowUpDialogComponent, {
      width: '500px',
      data: record
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRecords();
      }
    });
  }
}

@Component({
  selector: 'app-collection-record-detail-dialog',
  template: `
    <h2 mat-dialog-title>催收记录详情</h2>
    <mat-dialog-content class="dialog-content">
      <div class="detail-section">
        <h3>基本信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">账单号:</span>
            <span class="value">{{ data.bill?.billNumber || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">客户:</span>
            <span class="value">{{ data.bill?.customer?.name || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">严重程度:</span>
            <span [ngClass]="getSeverityClass(data.severity)" class="severity-badge">
              {{ data.severity | statusDisplay }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">渠道:</span>
            <span class="value">{{ data.channel | statusDisplay }}</span>
          </div>
          <div class="detail-item">
            <span class="label">联系日期:</span>
            <span class="value">{{ data.contactDate | formatDateTime }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态:</span>
            <span [ngClass]="data.status | statusBadge" class="status-badge">
              {{ data.status | statusDisplay }}
            </span>
          </div>
        </div>
      </div>

      <div class="detail-section" *ngIf="data.customerResponse">
        <h3>客户响应</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">响应类型:</span>
            <span [ngClass]="getResponseClass(data.customerResponse)" class="response-badge">
              {{ data.customerResponse | statusDisplay }}
            </span>
          </div>
          <div class="detail-item" *ngIf="data.promisedPaymentDate">
            <span class="label">承诺付款日期:</span>
            <span class="value">{{ data.promisedPaymentDate | formatDate }}</span>
          </div>
          <div class="detail-item" *ngIf="data.promisedAmount">
            <span class="label">承诺金额:</span>
            <span class="value">{{ data.promisedAmount | formatCurrency:data.bill?.currency }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section" *ngIf="data.notes || data.content">
        <h3>备注信息</h3>
        <div class="detail-grid">
          <div class="detail-item full-width" *ngIf="data.content">
            <span class="label">消息内容:</span>
            <p class="value content">{{ data.content }}</p>
          </div>
          <div class="detail-item full-width" *ngIf="data.notes">
            <span class="label">备注:</span>
            <p class="value content">{{ data.notes }}</p>
          </div>
          <div class="detail-item full-width" *ngIf="data.conversationRecord">
            <span class="label">通话记录:</span>
            <p class="value content">{{ data.conversationRecord }}</p>
          </div>
        </div>
      </div>

      <div class="detail-section" *ngIf="data.followUpActions && data.followUpActions.length > 0">
        <h3>跟进计划</h3>
        <div class="followup-list">
          <div *ngFor="let action of data.followUpActions" class="followup-item" [class.completed]="action.completed">
            <div class="followup-header">
              <mat-icon>{{ action.completed ? 'check_circle' : 'schedule' }}</mat-icon>
              <span class="followup-action">{{ action.action }}</span>
              <span class="followup-date">{{ action.scheduledDate | formatDate }}</span>
            </div>
            <div class="followup-assignee">负责人: {{ action.assignee }}</div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>关闭</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      padding: 24px 0;
      min-width: 600px;
    }
    .detail-section {
      margin-bottom: 24px;
    }
    .detail-section h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-item.full-width {
      grid-column: 1 / -1;
    }
    .label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .value {
      font-size: 14px;
    }
    .value.content {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin: 0;
      white-space: pre-wrap;
    }
    .severity-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
      width: fit-content;
    }
    .severity-reminder {
      background: #e3f2fd;
      color: #1565c0;
    }
    .severity-warning {
      background: #fff3e0;
      color: #e65100;
    }
    .severity-urgent {
      background: #ffebee;
      color: #c62828;
    }
    .severity-legal {
      background: #fce4ec;
      color: #880e4f;
    }
    .response-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
      width: fit-content;
    }
    .response-no_response {
      background: #e0e0e0;
      color: #616161;
    }
    .response-promised_to_pay {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .response-disputed {
      background: #ffebee;
      color: #c62828;
    }
    .response-negotiated {
      background: #fff3e0;
      color: #e65100;
    }
    .response-paid {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
      width: fit-content;
    }
    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }
    .status-in_progress {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-completed {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .status-failed {
      background: #ffebee;
      color: #c62828;
    }
    .status-skipped {
      background: #e0e0e0;
      color: #616161;
    }
    .followup-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .followup-item {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
    }
    .followup-item.completed {
      background: #e8f5e9;
      opacity: 0.7;
    }
    .followup-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .followup-header mat-icon {
      font-size: 20px;
    }
    .followup-action {
      flex: 1;
      font-weight: 500;
    }
    .followup-date {
      color: rgba(0, 0, 0, 0.54);
      font-size: 12px;
    }
    .followup-assignee {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      margin-left: 28px;
    }
  `]
})
export class CollectionRecordDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CollectionRecord
  ) {}

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getResponseClass(response: string): string {
    return `response-${response}`;
  }
}

@Component({
  selector: 'app-update-status-dialog',
  template: `
    <h2 mat-dialog-title>更新状态</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <p class="info-text">账单: {{ data.bill?.billNumber }} - {{ data.bill?.customer?.name }}</p>
        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>状态</mat-label>
          <mat-select formControlName="status" required>
            <mat-option value="pending">待处理</mat-option>
            <mat-option value="in_progress">进行中</mat-option>
            <mat-option value="completed">已完成</mat-option>
            <mat-option value="failed">失败</mat-option>
            <mat-option value="skipped">已跳过</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>客户响应</mat-label>
          <mat-select formControlName="customerResponse">
            <mat-option value="">无</mat-option>
            <mat-option value="no_response">无回应</mat-option>
            <mat-option value="promised_to_pay">承诺付款</mat-option>
            <mat-option value="disputed">有争议</mat-option>
            <mat-option value="negotiated">协商中</mat-option>
            <mat-option value="paid">已付款</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="form-row" *ngIf="form.get('customerResponse')?.value === 'promised_to_pay'">
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>承诺付款日期</mat-label>
            <input matInput [matDatepicker]="promisePicker" formControlName="promisedPaymentDate">
            <mat-datepicker-toggle matSuffix [for]="promisePicker"></mat-datepicker-toggle>
            <mat-datepicker #promisePicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>承诺金额</mat-label>
            <input matInput type="number" formControlName="promisedAmount">
          </mat-form-field>
        </div>
        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>备注</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>取消</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
          保存
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      padding: 24px 0;
      min-width: 450px;
    }
    .info-text {
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.6);
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-field {
      flex: 1;
      min-width: 180px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class UpdateStatusDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    public dialogRef: MatDialogRef<UpdateStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CollectionRecord
  ) {
    this.form = this.fb.group({
      status: [data.status, Validators.required],
      customerResponse: [data.customerResponse || ''],
      promisedPaymentDate: [data.promisedPaymentDate || ''],
      promisedAmount: [data.promisedAmount || null],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = { ...this.form.value };
    if (!formValue.customerResponse) {
      delete formValue.customerResponse;
    }
    if (!formValue.promisedPaymentDate) {
      delete formValue.promisedPaymentDate;
    }
    if (!formValue.promisedAmount) {
      delete formValue.promisedAmount;
    }

    this.collectionService.updateRecord(this.data.id, formValue).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Failed to update record:', error);
      }
    });
  }
}

@Component({
  selector: 'app-followup-dialog',
  template: `
    <h2 mat-dialog-title>添加跟进记录</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <p class="info-text">账单: {{ data.bill?.billNumber }} - {{ data.bill?.customer?.name }}</p>
        <mat-form-field appearance="fill" class="form-field full-width">
          <mat-label>跟进内容</mat-label>
          <textarea matInput formControlName="content" rows="4" required></textarea>
          <mat-error *ngIf="form.get('content')?.hasError('required')">
            请输入跟进内容
          </mat-error>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>下次联系日期</mat-label>
            <input matInput [matDatepicker]="followupPicker" formControlName="nextContactDate">
            <mat-datepicker-toggle matSuffix [for]="followupPicker"></mat-datepicker-toggle>
            <mat-datepicker #followupPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-field">
            <mat-label>客户响应</mat-label>
            <mat-select formControlName="customerResponse">
              <mat-option value="">无</mat-option>
              <mat-option value="no_response">无回应</mat-option>
              <mat-option value="promised_to_pay">承诺付款</mat-option>
              <mat-option value="disputed">有争议</mat-option>
              <mat-option value="negotiated">协商中</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>取消</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
          添加
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      padding: 24px 0;
      min-width: 450px;
    }
    .info-text {
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.6);
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-field {
      flex: 1;
      min-width: 180px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class FollowUpDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private collectionService: CollectionService,
    public dialogRef: MatDialogRef<FollowUpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CollectionRecord
  ) {
    this.form = this.fb.group({
      content: ['', Validators.required],
      nextContactDate: [''],
      customerResponse: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = { ...this.form.value };
    formValue.notes = formValue.content;
    delete formValue.content;

    if (formValue.nextContactDate) {
      formValue.followUpActions = [{
        action: '跟进客户',
        scheduledDate: formValue.nextContactDate,
        assignee: '当前用户',
        completed: false
      }];
    }
    delete formValue.nextContactDate;

    if (!formValue.customerResponse) {
      delete formValue.customerResponse;
    }

    this.collectionService.updateRecord(this.data.id, formValue).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Failed to add follow-up:', error);
      }
    });
  }
}
