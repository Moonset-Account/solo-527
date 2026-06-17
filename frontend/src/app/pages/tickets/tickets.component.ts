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
import { MockDataService } from '../../services/mock-data.service';
import { Ticket, PageResult, Property } from '../../types';
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
          <mat-option value="repair">维修</mat-option>
          <mat-option value="complaint">投诉</mat-option>
          <mat-option value="other">其他</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>优先级</mat-label>
        <mat-select [(ngModel)]="form.priority">
          <mat-option value="low">低</mat-option>
          <mat-option value="medium">中</mat-option>
          <mat-option value="high">高</mat-option>
          <mat-option value="urgent">紧急</mat-option>
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
  private mockDataService = inject(MockDataService);
  private snackBar = inject(MatSnackBar);

  properties: Property[] = [];
  form: any = {
    type: 'repair',
    priority: 'medium',
    propertyId: null,
    title: '',
    description: ''
  };

  constructor(
    public dialogRef: MatDialogRef<TicketFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mockDataService.getProperties({ pageSize: 100 }).subscribe(result => {
      this.properties = result.items;
      if (this.properties.length > 0) {
        this.form.propertyId = this.properties[0].id;
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
      <button mat-raised-button color="primary" (click)="onAdd()">
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
              <mat-option value="repair">维修</mat-option>
              <mat-option value="complaint">投诉</mat-option>
              <mat-option value="other">其他</mat-option>
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
              <mat-option value="urgent">紧急</mat-option>
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
  private mockDataService = inject(MockDataService);
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
    { key: 'type', label: '类型' },
    { key: 'title', label: '标题' },
    { key: 'propertyName', label: '房源' },
    { key: 'priority', label: '优先级' },
    { key: 'status', label: '状态' },
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

    this.mockDataService.getTickets(params).subscribe((result: PageResult<Ticket>) => {
      this.tickets = result.items;
      this.total = result.total;
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

  onAdd(): void {
    const dialogRef = this.dialog.open(TicketFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('工单创建成功', '关闭', { duration: 2000 });
        this.loadTickets();
      }
    });
  }

  onViewDetail(ticket: Ticket): void {
    const dialogRef = this.dialog.open(TicketDetailComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { ticket }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTickets();
      }
    });
  }
}
