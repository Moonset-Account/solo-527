import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { ExportService } from '../../services/export.service';
import { ExportRecord } from '../../types';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    PageHeaderComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header title="数据导出" subtitle="导出各类业务数据"></app-page-header>

    <div class="page-content">
      <div class="export-section">
        <mat-card class="export-card">
          <mat-card-header>
            <mat-card-title>数据导出</mat-card-title>
            <mat-card-subtitle>选择导出类型和筛选条件</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>导出类型</mat-label>
                <mat-select [(ngModel)]="exportType">
                  <mat-option value="property">房源数据</mat-option>
                  <mat-option value="lease">租约数据</mat-option>
                  <mat-option value="bill">账单数据</mat-option>
                  <mat-option value="deposit">押金数据</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row date-range">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>日期范围</mat-label>
                <mat-date-range-input [rangePicker]="picker">
                  <input matStartDate [(ngModel)]="dateRange.start" placeholder="开始日期">
                  <input matEndDate [(ngModel)]="dateRange.end" placeholder="结束日期">
                </mat-date-range-input>
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-date-range-picker #picker></mat-date-range-picker>
              </mat-form-field>
            </div>

            <div class="form-row">
              <button mat-raised-button color="primary" (click)="onExport()" [disabled]="exporting">
                <mat-icon>file_download</mat-icon>
                {{ exporting ? '导出中...' : '开始导出' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="history-section">
        <h3>导出历史</h3>
        <mat-card>
          <mat-card-content>
            <mat-list *ngIf="exportRecords.length > 0">
              <mat-list-item *ngFor="let record of exportRecords" class="history-item">
                <div class="item-left">
                  <mat-icon class="file-icon">description</mat-icon>
                  <div class="item-info">
                    <span class="item-name">{{ record.fileName }}</span>
                    <span class="item-type">{{ getTypeLabel(record.exportType) }}</span>
                  </div>
                </div>
                <div class="item-right">
                  <app-status-badge [status]="getStatusBadge(record.status)" [label]="getStatusLabel(record.status)"></app-status-badge>
                  <span class="item-date">{{ record.createdAt }}</span>
                  <button
                    *ngIf="record.status === 'completed'"
                    mat-icon-button
                    color="primary"
                    (click)="onDownload(record)"
                  >
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </mat-list-item>
            </mat-list>
            <div *ngIf="exportRecords.length === 0" class="empty">
              暂无导出记录
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-content { padding: 0 24px 24px; }
    .export-section { margin-bottom: 24px; }
    .export-card { max-width: 500px; }
    .form-row { margin-bottom: 16px; }
    .form-row:last-child { margin-bottom: 0; }
    .form-field { width: 100%; }
    .date-range .form-field { min-width: 300px; }

    .history-section h3 { margin: 0 0 12px 0; font-size: 16px; }
    .history-item {
      display: flex !important;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 !important;
    }
    .item-left { display: flex; align-items: center; gap: 12px; }
    .file-icon { color: #1976d2; }
    .item-info { display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-weight: 500; }
    .item-type { font-size: 12px; color: #999; }
    .item-right { display: flex; align-items: center; gap: 16px; }
    .item-date { font-size: 12px; color: #999; }
    .empty {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }
    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .item-right { flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
    }
  `]
})
export class ExportComponent implements OnInit {
  private exportService = inject(ExportService);
  private snackBar = inject(MatSnackBar);

  exportType = 'lease';
  dateRange = { start: null as Date | null, end: null as Date | null };
  exporting = false;
  exportRecords: ExportRecord[] = [];

  ngOnInit(): void {
    this.loadExportRecords();
  }

  loadExportRecords(): void {
    this.exportRecords = [];
  }

  async onExport(): Promise<void> {
    this.exporting = true;

    try {
      const typeMap: Record<string, string> = {
        property: 'properties',
        lease: 'leases',
        bill: 'bills',
        deposit: 'deposits'
      };
      const type = typeMap[this.exportType] || this.exportType;
      
      const filters: Record<string, any> = {};
      if (this.dateRange.start) {
        filters['startDate'] = this.dateRange.start.toISOString().split('T')[0];
      }
      if (this.dateRange.end) {
        filters['endDate'] = this.dateRange.end.toISOString().split('T')[0];
      }

      const blob = await lastValueFrom(this.exportService.exportData(type, filters));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      this.snackBar.open('导出成功', '关闭', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('导出失败，请稍后重试', '关闭', { duration: 3000 });
    } finally {
      this.exporting = false;
    }
  }

  onDownload(record: ExportRecord): void {
    this.snackBar.open(`开始下载：${record.fileName}`, '关闭', { duration: 2000 });
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      property: '房源数据',
      lease: '租约数据',
      bill: '账单数据',
      deposit: '押金数据'
    };
    return map[type] || type;
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      completed: 'success',
      processing: 'info',
      pending: 'warning',
      failed: 'error'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      failed: '失败'
    };
    return map[status] || status;
  }
}
