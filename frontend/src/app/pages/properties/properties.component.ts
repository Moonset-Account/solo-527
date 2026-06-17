import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { PropertiesService } from '../../services/properties.service';
import { ExportService } from '../../services/export.service';
import { Property, PropertyType, PropertyStatus } from '../../types';
import { PropertyFormComponent } from './property-form.component';
import { PropertyDetailComponent } from './property-detail.component';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderComponent,
    DataTableComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header title="房源档案" subtitle="管理所有房源信息">
      <button mat-stroked-button (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
      <button mat-raised-button color="primary" (click)="onAdd()">
        <mat-icon>add</mat-icon>
        新增房源
      </button>
    </app-page-header>

    <div class="page-content">
      <div class="filter-section">
        <div class="filter-form">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>类型</mat-label>
            <mat-select [(ngModel)]="filters.type">
              <mat-option value="">全部</mat-option>
              <mat-option value="private_office">独立办公室</mat-option>
              <mat-option value="hot_desk">开放工位</mat-option>
              <mat-option value="meeting_room">会议室</mat-option>
              <mat-option value="long_term">长期租赁</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="filters.status">
              <mat-option value="">全部</mat-option>
              <mat-option value="vacant">空置</mat-option>
              <mat-option value="rented">已租</mat-option>
              <mat-option value="maintenance">维修中</mat-option>
              <mat-option value="closed">关闭</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>楼栋</mat-label>
            <mat-select [(ngModel)]="filters.building">
              <mat-option value="">全部</mat-option>
              <mat-option value="A栋">A栋</mat-option>
              <mat-option value="B栋">B栋</mat-option>
              <mat-option value="C栋">C栋</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>关键词</mat-label>
            <input matInput [(ngModel)]="filters.keyword" placeholder="房源名称/编号">
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
          [data]="properties"
          [columns]="columns"
          [total]="total"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [sortable]="true"
          (pageChange)="onPageChange($event)"
          [actionTemplate]="actionTemplate"
        >
          <ng-template cellTemplate="type" let-row>
            <span>{{ getTypeLabel(row.type) }}</span>
          </ng-template>
          <ng-template cellTemplate="status" let-row>
            <app-status-badge [status]="getStatusBadge(row.status)" [label]="getStatusLabel(row.status)"></app-status-badge>
          </ng-template>
          <ng-template cellTemplate="price" let-row>
            <span class="amount">¥{{ row.price?.toFixed(2) }}</span>
          </ng-template>
          <ng-template #actionTemplate let-row>
            <button mat-button color="primary" (click)="onViewDetail(row)">查看</button>
            <button mat-button (click)="onEdit(row)">编辑</button>
            <button mat-button (click)="onUpdateStatus(row, 'vacant')" *ngIf="row.status !== 'vacant' && row.status !== 'closed'">置空</button>
            <button mat-button (click)="onUpdateStatus(row, 'rented')" *ngIf="row.status !== 'rented' && row.status !== 'closed'">出租</button>
            <button mat-button color="warn" *ngIf="row.status !== 'closed'" (click)="onCloseProperty(row)">关闭</button>
            <button mat-button color="warn" (click)="onDelete(row)">删除</button>
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
    .filter-field { flex: 1; min-width: 150px; }
    .filter-actions { display: flex; gap: 8px; padding-bottom: 4px; }
    .table-section { min-height: 400px; }
    .amount { color: #1976d2; font-weight: 600; }
    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .filter-form { flex-direction: column; }
      .filter-field { width: 100%; min-width: auto; }
      .filter-actions { width: 100%; justify-content: stretch; button { flex: 1; } }
    }
  `]
})
export class PropertiesComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  properties: Property[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  filters = {
    type: '',
    status: '',
    building: '',
    keyword: ''
  };

  columns: ColumnDef[] = [
    { key: 'code', label: '编号', sortable: true },
    { key: 'name', label: '名称', sortable: true },
    { key: 'type', label: '类型', type: 'template' },
    { key: 'building', label: '楼栋' },
    { key: 'floor', label: '楼层' },
    { key: 'area', label: '面积(㎡)' },
    { key: 'price', label: '月租金', type: 'template' },
    { key: 'status', label: '状态', type: 'template' }
  ];

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      type: this.filters.type || undefined,
      status: this.filters.status || undefined,
      building: this.filters.building || undefined,
      keyword: this.filters.keyword || undefined
    };

    this.propertiesService.getProperties(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data.items;
          this.total = response.data.total;
        } else {
          this.snackBar.open(response.message || '加载失败', '关闭', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('加载失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadProperties();
  }

  onReset(): void {
    this.filters = { type: '', status: '', building: '', keyword: '' };
    this.pageIndex = 0;
    this.loadProperties();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProperties();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(PropertyFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.propertiesService.createProperty(result).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('新增成功', '关闭', { duration: 2000 });
              this.loadProperties();
            } else {
              this.snackBar.open(response.message || '新增失败', '关闭', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open('新增失败：' + (err.message || err), '关闭', { duration: 3000 });
          }
        });
      }
    });
  }

  onEdit(property: Property): void {
    const dialogRef = this.dialog.open(PropertyFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { property }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.propertiesService.updateProperty(property.id, result).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('编辑成功', '关闭', { duration: 2000 });
              this.loadProperties();
            } else {
              this.snackBar.open(response.message || '编辑失败', '关闭', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open('编辑失败：' + (err.message || err), '关闭', { duration: 3000 });
          }
        });
      }
    });
  }

  onViewDetail(property: Property): void {
    this.dialog.open(PropertyDetailComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { property }
    });
  }

  onDelete(property: Property): void {
    if (confirm(`确认删除房源"${property.name}"吗？`)) {
      this.propertiesService.deleteProperty(property.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('删除成功', '关闭', { duration: 2000 });
            this.loadProperties();
          } else {
            this.snackBar.open(response.message || '删除失败', '关闭', { duration: 3000 });
          }
        },
        error: (err) => {
          this.snackBar.open('删除失败：' + (err.message || err), '关闭', { duration: 3000 });
        }
      });
    }
  }

  onUpdateStatus(property: Property, status: PropertyStatus): void {
    const reason = prompt('请输入变更原因：');
    if (reason !== null) {
      this.propertiesService.updatePropertyStatus(property.id, { status, reason }).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('状态更新成功', '关闭', { duration: 2000 });
            this.loadProperties();
          } else {
            this.snackBar.open(response.message || '状态更新失败', '关闭', { duration: 3000 });
          }
        },
        error: (err) => {
          this.snackBar.open('状态更新失败：' + (err.message || err), '关闭', { duration: 3000 });
        }
      });
    }
  }

  onCloseProperty(property: Property): void {
    const closeReason = prompt('请输入关闭原因：');
    if (closeReason !== null) {
      this.propertiesService.updatePropertyStatus(property.id, { status: 'closed', reason: closeReason }).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('房源已关闭', '关闭', { duration: 2000 });
            this.loadProperties();
          } else {
            this.snackBar.open(response.message || '关闭失败', '关闭', { duration: 3000 });
          }
        },
        error: (err) => {
          this.snackBar.open('关闭失败：' + (err.message || err), '关闭', { duration: 3000 });
        }
      });
    }
  }

  onExport(): void {
    const filters: Record<string, any> = {};
    if (this.filters.type) filters['type'] = this.filters.type;
    if (this.filters.status) filters['status'] = this.filters.status;
    if (this.filters.building) filters['building'] = this.filters.building;
    if (this.filters.keyword) filters['keyword'] = this.filters.keyword;

    this.exportService.exportData('properties', filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `房源数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('导出失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  getTypeLabel(type: PropertyType): string {
    const map: Record<PropertyType, string> = {
      private_office: '独立办公室',
      hot_desk: '开放工位',
      meeting_room: '会议室',
      long_term: '长期租赁'
    };
    return map[type] || type;
  }

  getStatusBadge(status: PropertyStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<PropertyStatus, any> = {
      vacant: 'success',
      rented: 'info',
      maintenance: 'warning',
      closed: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: PropertyStatus): string {
    const map: Record<PropertyStatus, string> = {
      vacant: '空置',
      rented: '已租',
      maintenance: '维修中',
      closed: '关闭'
    };
    return map[status] || status;
  }
}
