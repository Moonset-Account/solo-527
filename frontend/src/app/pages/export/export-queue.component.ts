import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ExportService } from '../../services/export.service';
import { ExportQueue } from '../../services/api.config';

const typeMap: Record<string, string> = {
  bills: '账单数据',
  collection: '催收记录',
  reconciliation: '对账报告',
  'cash-forecast': '现金预测'
};

const formatMap: Record<string, string> = {
  excel: 'Excel',
  csv: 'CSV',
  pdf: 'PDF'
};

@Component({
  selector: 'app-export-queue',
  template: `
    <div class="export-container">
      <div class="export-header">
        <h2>导出队列</h2>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          创建导出
        </button>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" class="full-width-table">
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>类型</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip>{{ typeMap[item.type] || item.type }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="format">
            <th mat-header-cell *matHeaderCellDef>格式</th>
            <td mat-cell *matCellDef="let item">
              <span class="format-badge">{{ formatMap[item.format] || item.format }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>状态</th>
            <td mat-cell *matCellDef="let item">
              <span [class]="item.status | statusBadge">
                {{ item.status | statusDisplay }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="fileName">
            <th mat-header-cell *matHeaderCellDef>文件名</th>
            <td mat-cell *matCellDef="let item">
              <div class="file-name">
                <mat-icon>insert_drive_file</mat-icon>
                {{ item.fileName }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="recordCount">
            <th mat-header-cell *matHeaderCellDef>记录数</th>
            <td mat-cell *matCellDef="let item">{{ item.recordCount || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="fileSize">
            <th mat-header-cell *matHeaderCellDef>文件大小</th>
            <td mat-cell *matCellDef="let item">{{ formatFileSize(item.fileSize) }}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>创建时间</th>
            <td mat-cell *matCellDef="let item">{{ item.createdAt | formatDateTime }}</td>
          </ng-container>

          <ng-container matColumnDef="completedAt">
            <th mat-header-cell *matHeaderCellDef>完成时间</th>
            <td mat-cell *matCellDef="let item">{{ item.completedAt | formatDateTime }}</td>
          </ng-container>

          <ng-container matColumnDef="summary">
            <th mat-header-cell *matHeaderCellDef>摘要</th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button [matMenuTriggerFor]="summaryMenu" *ngIf="item.exportSummary">
                <mat-icon>info</mat-icon>
              </button>
              <mat-menu #summaryMenu="matMenu" class="summary-menu">
                <div class="summary-content">
                  <div class="summary-title">导出摘要</div>
                  <div class="summary-item" *ngIf="item.exportSummary?.totalAmount !== undefined">
                    <span class="summary-label">总金额:</span>
                    <span class="summary-value">{{ item.exportSummary.totalAmount | formatCurrency }}</span>
                  </div>
                  <div class="summary-item" *ngIf="item.exportSummary?.paidAmount !== undefined">
                    <span class="summary-label">已付金额:</span>
                    <span class="summary-value positive">{{ item.exportSummary.paidAmount | formatCurrency }}</span>
                  </div>
                  <div class="summary-item" *ngIf="item.exportSummary?.overdueAmount !== undefined">
                    <span class="summary-label">逾期金额:</span>
                    <span class="summary-value negative">{{ item.exportSummary.overdueAmount | formatCurrency }}</span>
                  </div>
                  <div class="summary-item" *ngIf="item.exportSummary?.reconciliationVariance !== undefined">
                    <span class="summary-label">对账差异:</span>
                    <span class="summary-value" [class.negative]="item.exportSummary.reconciliationVariance !== 0">
                      {{ item.exportSummary.reconciliationVariance | formatCurrency }}
                    </span>
                  </div>
                  <div class="summary-item" *ngIf="item.exportSummary?.cashGap !== undefined">
                    <span class="summary-label">现金缺口:</span>
                    <span class="summary-value negative">{{ item.exportSummary.cashGap | formatCurrency }}</span>
                  </div>
                  <div class="summary-item" *ngIf="item.exportSummary?.lastChangeDate">
                    <span class="summary-label">最近变更日期:</span>
                    <span class="summary-value">{{ item.exportSummary.lastChangeDate | formatDate }}</span>
                  </div>
                </div>
              </mat-menu>
              <span *ngIf="!item.exportSummary">-</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let item">
              <button
                mat-icon-button
                (click)="download(item)"
                [disabled]="item.status !== 'completed'"
                matTooltip="下载"
              >
                <mat-icon>download</mat-icon>
              </button>
              <button
                mat-icon-button
                (click)="retry(item)"
                [disabled]="item.status !== 'failed'"
                matTooltip="重试"
              >
                <mat-icon>refresh</mat-icon>
              </button>
              <button
                mat-icon-button
                (click)="cancel(item)"
                [disabled]="item.status !== 'pending' && item.status !== 'in_progress'"
                matTooltip="取消"
              >
                <mat-icon>cancel</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>cloud_download</mat-icon>
          <p>暂无导出任务</p>
        </div>
      </div>
    </div>

    <ng-template #createDialogTemplate>
      <div class="create-dialog">
        <h2 mat-dialog-title>创建导出任务</h2>
        <mat-dialog-content>
          <form [formGroup]="createForm" class="create-form">
            <mat-form-field appearance="outline">
              <mat-label>导出类型</mat-label>
              <mat-select formControlName="type">
                <mat-option value="bills">账单数据</mat-option>
                <mat-option value="collection">催收记录</mat-option>
                <mat-option value="reconciliation">对账报告</mat-option>
                <mat-option value="cash-forecast">现金预测</mat-option>
              </mat-select>
              <mat-error *ngIf="createForm.get('type')?.hasError('required')">请选择导出类型</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>导出格式</mat-label>
              <mat-select formControlName="format">
                <mat-option value="excel">Excel (.xlsx)</mat-option>
                <mat-option value="csv">CSV (.csv)</mat-option>
                <mat-option value="pdf">PDF (.pdf)</mat-option>
              </mat-select>
              <mat-error *ngIf="createForm.get('format')?.hasError('required')">请选择导出格式</mat-error>
            </mat-form-field>

            <div class="filter-section">
              <div class="filter-title">筛选条件</div>

              <mat-form-field appearance="outline" *ngIf="createForm.get('type')?.value === 'bills'">
                <mat-label>账单状态</mat-label>
                <mat-select formControlName="status" multiple>
                  <mat-option value="pending">待支付</mat-option>
                  <mat-option value="partial">部分支付</mat-option>
                  <mat-option value="paid">已支付</mat-option>
                  <mat-option value="overdue">已逾期</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>开始日期</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>结束日期</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button (click)="dialogRef?.close()">取消</button>
          <button mat-raised-button color="primary" (click)="createExport()" [disabled]="!createForm.valid">
            创建
          </button>
        </mat-dialog-actions>
      </div>
    </ng-template>
  `,
  styles: [`
    .export-container {
      padding: 24px;
    }
    .export-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .export-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .full-width-table {
      width: 100%;
    }
    .file-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .file-name mat-icon {
      font-size: 20px;
      color: #1976d2;
    }
    .format-badge {
      padding: 4px 10px;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-pending {
      background: #fff8e1;
      color: #f57f17;
    }
    .status-in-progress {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-completed {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-failed {
      background: #ffebee;
      color: #c62828;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: rgba(0,0,0,0.54);
    }
    .empty-state mat-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .summary-menu {
      max-width: none !important;
    }
    .summary-content {
      padding: 8px 0;
      min-width: 280px;
    }
    .summary-title {
      font-size: 14px;
      font-weight: 600;
      padding: 0 16px 8px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 8px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 16px;
      font-size: 13px;
    }
    .summary-label {
      color: rgba(0,0,0,0.6);
    }
    .summary-value {
      font-weight: 500;
    }
    .summary-value.positive {
      color: #2e7d32;
    }
    .summary-value.negative {
      color: #c62828;
    }
    .create-dialog {
      min-width: 480px;
    }
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 16px;
    }
    .filter-section {
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .filter-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: rgba(0,0,0,0.87);
    }
    td.mat-cell, th.mat-header-cell {
      padding: 12px 16px;
    }
    mat-chip {
      font-size: 12px;
    }
  `]
})
export class ExportQueueComponent implements OnInit {
  @ViewChild('createDialogTemplate') createDialogTemplate!: TemplateRef<any>;
  displayedColumns = ['type', 'format', 'status', 'fileName', 'recordCount', 'fileSize', 'createdAt', 'completedAt', 'summary', 'actions'];
  dataSource = new MatTableDataSource<ExportQueue>([]);
  createForm: FormGroup;
  dialogRef: MatDialogRef<any> | null = null;
  typeMap = typeMap;
  formatMap = formatMap;

  constructor(
    private exportService: ExportService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.createForm = this.fb.group({
      type: ['', Validators.required],
      format: ['', Validators.required],
      status: [[]],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit() {
    this.loadExports();
  }

  loadExports() {
    this.exportService.findAll().subscribe(response => {
      if (response.data.length === 0) {
        this.dataSource.data = this.getMockExports();
      } else {
        this.dataSource.data = response.data;
      }
    });
  }

  openCreateDialog() {
    this.createForm.reset({ type: '', format: '', status: [], startDate: null, endDate: null });
    this.dialogRef = this.dialog.open(this.createDialogTemplate, {
      width: '520px'
    });
  }

  createExport() {
    if (!this.createForm.valid) return;

    const filters: any = {};
    const formValue = this.createForm.value;

    if (formValue.status?.length) {
      filters.status = formValue.status;
    }
    if (formValue.startDate) {
      filters.startDate = formValue.startDate.toISOString().split('T')[0];
    }
    if (formValue.endDate) {
      filters.endDate = formValue.endDate.toISOString().split('T')[0];
    }

    this.exportService.create({
      type: formValue.type,
      format: formValue.format,
      filters
    }).subscribe(() => {
      this.dialogRef?.close();
      this.loadExports();
    });
  }

  download(item: ExportQueue) {
    this.exportService.download(item.id).subscribe(response => {
      const blob = response.body;
      if (!blob) return;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  retry(item: ExportQueue) {
    this.exportService.retry(item.id).subscribe(() => {
      this.loadExports();
    });
  }

  cancel(item: ExportQueue) {
    this.loadExports();
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getMockExports(): ExportQueue[] {
    return [
      {
        id: '1',
        type: 'bills',
        format: 'excel',
        status: 'completed',
        filters: { status: ['overdue'] },
        columns: [],
        fileName: '逾期账单报告_20260615.xlsx',
        storagePath: '',
        downloadUrl: '',
        fileSize: 245760,
        recordCount: 156,
        startedAt: '2026-06-15T10:30:00Z',
        completedAt: '2026-06-15T10:30:15Z',
        errorMessage: '',
        exportSummary: {
          totalAmount: 585000,
          paidAmount: 320000,
          overdueAmount: 265000,
          lastChangeDate: '2026-06-15'
        },
        retryCount: 0,
        createdAt: '2026-06-15T10:30:00Z'
      },
      {
        id: '2',
        type: 'reconciliation',
        format: 'pdf',
        status: 'completed',
        filters: { period: '2026-05' },
        columns: [],
        fileName: '2026年5月对账报告.pdf',
        storagePath: '',
        downloadUrl: '',
        fileSize: 1238000,
        recordCount: 89,
        startedAt: '2026-06-10T14:00:00Z',
        completedAt: '2026-06-10T14:00:45Z',
        errorMessage: '',
        exportSummary: {
          reconciliationVariance: 15000,
          totalAmount: 1250000,
          lastChangeDate: '2026-06-10'
        },
        retryCount: 0,
        createdAt: '2026-06-10T14:00:00Z'
      },
      {
        id: '3',
        type: 'cash-forecast',
        format: 'excel',
        status: 'in_progress',
        filters: { period: '30d' },
        columns: [],
        fileName: '现金预测报告_30天.xlsx',
        storagePath: '',
        downloadUrl: '',
        fileSize: 0,
        recordCount: 0,
        startedAt: '2026-06-16T09:00:00Z',
        completedAt: '',
        errorMessage: '',
        exportSummary: {
          cashGap: 85000,
          lastChangeDate: '2026-06-16'
        },
        retryCount: 0,
        createdAt: '2026-06-16T09:00:00Z'
      },
      {
        id: '4',
        type: 'collection',
        format: 'csv',
        status: 'failed',
        filters: { channel: 'email' },
        columns: [],
        fileName: '催收记录_邮件.csv',
        storagePath: '',
        downloadUrl: '',
        fileSize: 0,
        recordCount: 0,
        startedAt: '2026-06-14T16:00:00Z',
        completedAt: '',
        errorMessage: '连接数据库超时',
        exportSummary: undefined,
        retryCount: 2,
        createdAt: '2026-06-14T16:00:00Z'
      },
      {
        id: '5',
        type: 'bills',
        format: 'excel',
        status: 'pending',
        filters: {},
        columns: [],
        fileName: '全部账单导出.xlsx',
        storagePath: '',
        downloadUrl: '',
        fileSize: 0,
        recordCount: 0,
        startedAt: '',
        completedAt: '',
        errorMessage: '',
        exportSummary: undefined,
        retryCount: 0,
        createdAt: '2026-06-16T08:45:00Z'
      }
    ];
  }
}
