import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { PageHeaderComponent } from '../../shared/page-header.component';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { TicketsService } from '../../services/tickets.service';
import { PropertiesService } from '../../services/properties.service';
import { ExportService } from '../../services/export.service';
import { Ticket, Property, TicketType, TicketPriority, TicketStatus } from '../../types';
import { TicketDetailComponent } from './ticket-detail.component';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>新增工单</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>类型</mat-label>
        <mat-select [(ngModel)]="form.type">
          <mat-option value="maintenance">维修</mat-option>
          <mat-option value="complaint">投诉</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>优先级</mat-label>
        <mat-select [(ngModel)]="form.priority">
          <mat-option value="low">低</mat-option>
          <mat-option value="medium">中</mat-option>
          <mat-option value="high">高</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>关联房源</mat-label>
        <mat-select [(ngModel)]="form.propertyId">
          <mat-option *ngFor="let prop of properties" [value]="prop.id">{{ prop.name }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>标题</mat-label>
        <input matInput [(ngModel)]="form.title" placeholder="请输入标题">
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>描述</mat-label>
        <textarea matInput [(ngModel)]="form.description" rows="4" placeholder="请详细描述问题"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">取消</button>
      <button mat-raised-button color="primary" (click)="onSubmit()">提交</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-field { width: 100%; margin-top: 12px; }
  `]
})
export class TicketFormComponent {
  private snackBar = inject(MatSnackBar);

  properties: Property[] = [];
  form: any = {
    type: 'maintenance' as TicketType,
    priority: 'medium' as TicketPriority,
    propertyId: null,
    title: '',
    description: ''
  };

  constructor(
    public dialogRef: MatDialogRef<TicketFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private propertiesService: PropertiesService
  ) {
    this.propertiesService.getProperties({ pageSize: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data.items;
          if (this.properties.length > 0) {
            this.form.propertyId = this.properties[0].id;
          }
        }
      }
    });
  }

  onSubmit(): void {
    if (!this.form.title || !this.form.description) {
      this.snackBar.open('请填写完整信息', '关闭', { duration: 2000 });
      return;
    }
    this.dialogRef.close(this.form);
  }
}

@Component({
  selector: 'app-tickets',
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
    StatusBadgeComponent,
    TicketFormComponent,
    TicketDetailComponent
  ],
  template: `
    <app-page-header title="维修投诉" subtitle="管理维修和投诉工单">
      <button mat-stroked-button (click)="onExport()">
        <mat-icon>file_download</mat-icon>
        导出
      </button>
      <button mat-raised-button color="primary" (click)="onCreate()">
        <mat-icon>add</mat-icon>
        新增工单
      </button>
    </app-page-header>

    <div class="page-content">
      <div class="filter-section">
        <div class="filter-form">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>类型</mat-label>
            <mat-select [(ngModel)]="filters.type" (selectionChange)="loadTickets()">
              <mat-option value="">全部</mat-option>
              <mat-option value="maintenance">维修</mat-option>
              <mat-option value="complaint">投诉</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>状态</mat-label>
            <mat-select [(ngModel)]="filters.status" (selectionChange)="loadTickets()">
              <mat-option value="">全部</mat-option>
              <mat-option value="pending">待处理</mat-option>
              <mat-option value="processing">处理中</mat-option>
              <mat-option value="completed">已完成</mat-option>
              <mat-option value="closed">已关闭</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>优先级</mat-label>
            <mat-select [(ngModel)]="filters.priority" (selectionChange)="loadTickets()">
              <mat-option value="">全部</mat-option>
              <mat-option value="low">低</mat-option>
              <mat-option value="medium">中</mat-option>
              <mat-option value="high">高</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="filter-actions">
            <button mat-stroked-button (click)="onReset()">
              <mat-icon>refresh</mat-icon>
              重置
            </button>
          </div>
        </div>
      </div>

      <div class="table-section">
        <app-data-table
          [data]="tickets"
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
          <ng-template cellTemplate="priority" let-row>
            <app-status-badge [status]="getPriorityBadge(row.priority)" [label]="getPriorityLabel(row.priority)"></app-status-badge>
          </ng-template>
          <ng-template cellTemplate="status" let-row>
            <app-status-badge [status]="getStatusBadge(row.status)" [label]="getStatusLabel(row.status)"></app-status-badge>
          </ng-template>
          <ng-template #actionTemplate let-row>
            <button mat-button color="primary" (click)="onViewDetail(row)">查看</button>
            <button mat-button (click)="onUpdateStatus(row, 'processing')" *ngIf="row.status === 'pending'">开始处理</button>
            <button mat-button (click)="onUpdateStatus(row, 'completed')" *ngIf="row.status === 'processing'">完成</button>
            <button mat-button color="warn" *ngIf="row.status !== 'closed'" (click)="onClose(row)">关闭</button>
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
    @media (max-width: 768px) {
      .page-content { padding: 0 12px 12px; }
      .filter-form { flex-direction: column; }
      .filter-field { width: 100%; min-width: auto; }
    }
  `]
})
export class TicketsComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tickets: Ticket[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  filters = {
    type: '',
    status: '',
    priority: ''
  };

  columns: ColumnDef[] = [
    { key: 'ticketNo', label: '工单号', sortable: true },
    { key: 'type', label: '类型', type: 'template' },
    { key: 'title', label: '标题' },
    { key: 'propertyName', label: '房源' },
    { key: 'priority', label: '优先级', type: 'template' },
    { key: 'status', label: '状态', type: 'template' },
    { key: 'createdAt', label: '创建时间' }
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    const params: any = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      type: this.filters.type || undefined,
      status: this.filters.status || undefined,
      priority: this.filters.priority || undefined
    };

    this.ticketsService.getTickets(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.tickets = response.data.items;
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

  onReset(): void {
    this.filters = { type: '', status: '', priority: '' };
    this.pageIndex = 0;
    this.loadTickets();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTickets();
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ticketsService.createTicket(result).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('工单创建成功', '关闭', { duration: 2000 });
              this.loadTickets();
            } else {
              this.snackBar.open(response.message || '创建失败', '关闭', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open('创建失败：' + (err.message || err), '关闭', { duration: 3000 });
          }
        });
      }
    });
  }

  onUpdateStatus(ticket: Ticket, status: TicketStatus): void {
    const remark = prompt('请输入处理备注：');
    if (remark !== null) {
      this.ticketsService.updateTicketStatus(ticket.id, { status, remark }).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('状态更新成功', '关闭', { duration: 2000 });
            this.loadTickets();
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

  onClose(ticket: Ticket): void {
    const closeRemark = prompt('请输入关闭备注：');
    if (closeRemark !== null) {
      this.ticketsService.updateTicketStatus(ticket.id, { status: 'closed', remark: closeRemark }).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('工单已关闭', '关闭', { duration: 2000 });
            this.loadTickets();
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

  onViewDetail(ticket: Ticket): void {
    this.ticketsService.getTicket(ticket.id).subscribe({
      next: (response) => {
        if (response.success) {
          const dialogRef = this.dialog.open(TicketDetailComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: { ticket: response.data }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.loadTickets();
            }
          });
        } else {
          this.snackBar.open(response.message || '加载详情失败', '关闭', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open('加载详情失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  onExport(): void {
    const filters: Record<string, any> = {};
    if (this.filters.type) filters['type'] = this.filters.type;
    if (this.filters.status) filters['status'] = this.filters.status;
    if (this.filters.priority) filters['priority'] = this.filters.priority;

    this.exportService.exportData('tickets', filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `工单数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('导出失败：' + (err.message || err), '关闭', { duration: 3000 });
      }
    });
  }

  getTypeLabel(type: TicketType): string {
    const map: Record<TicketType, string> = {
      maintenance: '维修',
      complaint: '投诉'
    };
    return map[type] || type;
  }

  getPriorityBadge(priority: TicketPriority): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<TicketPriority, any> = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    return map[priority] || 'default';
  }

  getPriorityLabel(priority: TicketPriority): string {
    const map: Record<TicketPriority, string> = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return map[priority] || priority;
  }

  getStatusBadge(status: TicketStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<TicketStatus, any> = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      closed: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      closed: '已关闭'
    };
    return map[status] || status;
  }
}
