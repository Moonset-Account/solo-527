import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { PropertiesService } from '../../services/properties.service';
import { RoomStatusLogsService } from '../../services/room-status-logs.service';
import { ExportService } from '../../services/export.service';
import { Property, RoomStatusLog, PropertyStatus } from '../../types';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-room-status-change',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>更改房态</h2>
    <mat-dialog-content>
      <p>当前房源：{{ property.name }}</p>
      <p>当前状态：{{ currentStatusLabel }}</p>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>新状态</mat-label>
        <mat-select [(ngModel)]="newStatus">
          <mat-option value="vacant">空置</mat-option>
          <mat-option value="rented">已租</mat-option>
          <mat-option value="maintenance">维修中</mat-option>
          <mat-option value="closed">已关闭</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>变更原因</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3" placeholder="请输入变更原因"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">取消</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">确认</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-field { width: 100%; margin-top: 12px; }
  `]
})
export class RoomStatusChangeComponent {
  property: Property;
  newStatus: PropertyStatus = 'vacant';
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<RoomStatusChangeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { property: Property }
  ) {
    this.property = data.property;
    this.newStatus = this.property.status;
  }

  get currentStatusLabel(): string {
    const map: Record<string, string> = {
      vacant: '空置',
      rented: '已租',
      maintenance: '维修中',
      closed: '已关闭'
    };
    return map[this.property.status] || this.property.status;
  }

  onConfirm(): void {
    this.dialogRef.close({ status: this.newStatus, reason: this.reason });
  }
}

@Component({
  selector: 'app-room-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatListModule,
    MatDividerModule,
    MatTabsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    RoomStatusChangeComponent
  ],
  template: `
    <app-page-header title="房态管理" subtitle="查看和管理房源状态">
      <button mat-stroked-button (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
      <div class="view-toggle">
        <button mat-stroked-button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">
          <mat-icon>grid_view</mat-icon>
          网格视图
        </button>
        <button mat-stroked-button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">
          <mat-icon>list</mat-icon>
          列表视图
        </button>
      </div>
    </app-page-header>

    <div class="page-content">
      <div class="legend">
        <span class="legend-item">
          <span class="legend-color vacant"></span>
          空置
        </span>
        <span class="legend-item">
          <span class="legend-color rented"></span>
          已租
        </span>
        <span class="legend-item">
          <span class="legend-color maintenance"></span>
          维修中
        </span>
        <span class="legend-item">
          <span class="legend-color closed"></span>
          已关闭
        </span>
      </div>

      <div *ngIf="viewMode === 'grid'" class="grid-view">
        <mat-card
          *ngFor="let prop of properties"
          class="room-card"
          [ngClass]="'status-' + prop.status"
          (click)="onChangeStatus(prop)"
        >
          <mat-card-content>
            <div class="room-name">{{ prop.name }}</div>
            <div class="room-code">{{ prop.code }}</div>
            <div class="room-info">{{ prop.area }}㎡ · ¥{{ prop.price }}/月</div>
            <div class="room-status">
              <app-status-badge [status]="getStatusBadge(prop.status)" [label]="getStatusLabel(prop.status)"></app-status-badge>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="viewMode === 'list'" class="list-view">
        <div *ngFor="let prop of properties" class="list-item" (click)="onChangeStatus(prop)">
          <div class="item-left">
            <div class="status-dot" [ngClass]="'dot-' + prop.status"></div>
            <div class="item-info">
              <div class="item-name">{{ prop.name }}</div>
              <div class="item-code">{{ prop.code }} · {{ prop.building }} · {{ prop.area }}㎡</div>
            </div>
          </div>
          <div class="item-right">
            <app-status-badge [status]="getStatusBadge(prop.status)" [label]="getStatusLabel(prop.status)"></app-status-badge>
            <mat-icon>chevron_right</mat-icon>
          </div>
        </div>
      </div>

      <div *ngIf="selectedProperty" class="history-section">
        <h3>房态历史记录 - {{ selectedProperty.name }}</h3>
        <mat-list *ngIf="statusLogs.length > 0">
          <mat-list-item *ngFor="let log of statusLogs" class="log-item">
            <div class="log-info">
              <app-status-badge [status]="getStatusBadge(log.status)" [label]="getStatusLabel(log.status)"></app-status-badge>
              <span class="log-reason">{{ log.reason }}</span>
            </div>
            <div class="log-meta">
              <span>操作人：{{ log.operator }}</span>
              <span>{{ log.createdAt }}</span>
            </div>
          </mat-list-item>
        </mat-list>
        <div *ngIf="statusLogs.length === 0" class="empty">暂无历史记录</div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { padding: 0 24px 24px; }
    .view-toggle { display: flex; gap: 8px; }
    .view-toggle button.active { background: #e3f2fd; }
    .legend { display: flex; gap: 24px; padding: 12px 0; margin-bottom: 16px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .legend-color { width: 16px; height: 16px; border-radius: 4px; }
    .legend-color.vacant { background: #4caf50; }
    .legend-color.rented { background: #2196f3; }
    .legend-color.maintenance { background: #ff9800; }
    .legend-color.closed { background: #9e9e9e; }

    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .room-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    }
    .room-card.status-vacant { border-left-color: #4caf50; }
    .room-card.status-rented { border-left-color: #2196f3; }
    .room-card.status-maintenance { border-left-color: #ff9800; }
    .room-card.status-closed { border-left-color: #9e9e9e; }
    .room-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .room-code { color: #666; font-size: 13px; margin-bottom: 8px; }
    .room-info { color: #1976d2; font-size: 14px; margin-bottom: 8px; }
    .room-status { margin-top: 8px; }

    .list-view { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .list-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer;
      &:last-child { border-bottom: none; }
      &:hover { background: #f5f5f5; }
    }
    .item-left { display: flex; align-items: center; gap: 12px; }
    .status-dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot-vacant { background: #4caf50; }
    .dot-rented { background: #2196f3; }
    .dot-maintenance { background: #ff9800; }
    .dot-closed { background: #9e9e9e; }
    .item-name { font-weight: 500; }
    .item-code { font-size: 13px; color: #666; }
    .item-right { display: flex; align-items: center; gap: 12px; color: #999; }

    .history-section { margin-top: 24px; }
    .history-section h3 { margin-bottom: 12px; font-size: 16px; }
    .log-item {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start !important;
      gap: 6px;
      padding: 12px 0 !important;
    }
    .log-info { display: flex; align-items: center; gap: 12px; }
    .log-reason { color: #666; }
    .log-meta { display: flex; gap: 16px; font-size: 13px; color: #999; }
    .empty { text-align: center; color: #999; padding: 20px; background: #fff; border-radius: 8px; }

    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .grid-view { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .view-toggle { display: none; }
    }
  `]
})
export class RoomStatusComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private roomStatusLogsService = inject(RoomStatusLogsService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  viewMode: 'grid' | 'list' = 'grid';
  properties: Property[] = [];
  selectedProperty: Property | null = null;
  statusLogs: RoomStatusLog[] = [];

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.propertiesService.getProperties({ pageSize: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data.items;
          if (this.properties.length > 0) {
            this.selectedProperty = this.properties[0];
            this.loadStatusLogs();
          }
        } else {
          this.snackBar.open(response.message || '加载失败', '关闭', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('加载失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  loadStatusLogs(): void {
    if (this.selectedProperty) {
      this.roomStatusLogsService.getRoomStatusLogs(this.selectedProperty.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.statusLogs = response.data;
          }
        },
        error: (err) => {
          console.error('加载状态日志失败', err);
        }
      });
    }
  }

  onChangeStatus(property: Property): void {
    this.selectedProperty = property;
    this.loadStatusLogs();

    const dialogRef = this.dialog.open(RoomStatusChangeComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: { property }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.propertiesService.updatePropertyStatus(property.id, { status: result.status, reason: result.reason }).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('房态更新成功', '关闭', { duration: 2000 });
              this.loadProperties();
            } else {
              this.snackBar.open(response.message || '房态更新失败', '关闭', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open('房态更新失败：' + (err.message || err), '关闭', { duration: 3000 });
          }
        });
      }
    });
  }

  onExport(): void {
    this.exportService.exportData('properties', {}).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `房态数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('导出失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      vacant: 'success',
      rented: 'info',
      maintenance: 'warning',
      closed: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      vacant: '空置',
      rented: '已租',
      maintenance: '维修中',
      closed: '已关闭'
    };
    return map[status] || status;
  }
}
