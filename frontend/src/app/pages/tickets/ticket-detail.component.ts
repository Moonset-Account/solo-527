import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Ticket, TicketLog, TicketStatus } from '../../types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    StatusBadgeComponent
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      工单详情
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-tab-group>
        <mat-tab label="基本信息">
          <div class="tab-content">
            <mat-list>
              <mat-list-item>
                <span class="label">工单编号：</span>
                <span class="value">{{ ticket.ticketNo }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">类型：</span>
                <span class="value">{{ getTypeLabel(ticket.type) }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">优先级：</span>
                <app-status-badge [status]="getPriorityBadge(ticket.priority)" [label]="getPriorityLabel(ticket.priority)"></app-status-badge>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">状态：</span>
                <app-status-badge [status]="getStatusBadge(ticket.status)" [label]="getStatusLabel(ticket.status)"></app-status-badge>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">标题：</span>
                <span class="value">{{ ticket.title }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">关联房源：</span>
                <span class="value">{{ ticket.propertyName }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">描述：</span>
                <span class="value">{{ ticket.description }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">处理人：</span>
                <span class="value">{{ ticket.assignee || '未分配' }}</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item>
                <span class="label">创建时间：</span>
                <span class="value">{{ ticket.createdAt }}</span>
              </mat-list-item>
              <mat-divider *ngIf="ticket.closeNote"></mat-divider>
              <mat-list-item *ngIf="ticket.closeNote">
                <span class="label">关闭说明：</span>
                <span class="value">{{ ticket.closeNote }}</span>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <mat-tab label="处理记录">
          <div class="tab-content">
            <div class="timeline">
              <div *ngFor="let log of logs; let last = last" class="timeline-item">
                <div class="timeline-dot"></div>
                <div *ngIf="!last" class="timeline-line"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-action">{{ log.action }}</span>
                    <span class="timeline-operator">{{ log.operator }}</span>
                  </div>
                  <p *ngIf="log.remark" class="timeline-remark">{{ log.remark }}</p>
                  <span class="timeline-date">{{ log.createdAt }}</span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div class="action-section">
        <button
          *ngIf="ticket.status === 'pending'"
          mat-raised-button color="primary"
          (click)="onStatusChange('processing')"
        >
          开始处理
        </button>
        <button
          *ngIf="ticket.status === 'processing'"
          mat-raised-button color="primary"
          (click)="onStatusChange('completed')"
        >
          完成处理
        </button>
        <button
          *ngIf="ticket.status === 'completed'"
          mat-raised-button color="warn"
          (click)="onClose()"
        >
          关闭工单
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-title { display: flex; justify-content: space-between; align-items: center; margin: 0; padding: 16px 24px; }
    .close-btn { margin-right: -8px; }
    .dialog-content { padding: 0; min-height: 450px; }
    .tab-content { padding: 16px 24px; }
    .label { color: #666; min-width: 100px; }
    .value { color: #333; }
    .timeline { position: relative; padding-left: 24px; }
    .timeline-item { position: relative; padding-bottom: 24px; }
    .timeline-dot {
      position: absolute;
      left: -24px;
      top: 4px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1976d2;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px #1976d2;
    }
    .timeline-line {
      position: absolute;
      left: -19px;
      top: 16px;
      width: 2px;
      height: calc(100% + 12px);
      background: #e0e0e0;
    }
    .timeline-content { margin-left: 8px; }
    .timeline-header { display: flex; gap: 12px; margin-bottom: 4px; }
    .timeline-action { font-weight: 500; color: #333; }
    .timeline-operator { color: #666; font-size: 13px; }
    .timeline-remark { color: #666; font-size: 14px; margin: 4px 0; }
    .timeline-date { color: #999; font-size: 12px; }
    .action-section {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private snackBar = inject(MatSnackBar);

  ticket: Ticket;
  logs: TicketLog[] = [];

  constructor(
    public dialogRef: MatDialogRef<TicketDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {
    this.ticket = data.ticket;
  }

  ngOnInit(): void {
    this.mockDataService.getTicketLogs(this.ticket.id).subscribe(logs => {
      this.logs = logs;
    });
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      repair: '维修',
      complaint: '投诉',
      other: '其他'
    };
    return map[type] || type;
  }

  getPriorityBadge(priority: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error'
    };
    return map[priority] || 'default';
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return map[priority] || priority;
  }

  getStatusBadge(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const map: Record<string, any> = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      closed: 'default'
    };
    return map[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      closed: '已关闭'
    };
    return map[status] || status;
  }

  onStatusChange(status: TicketStatus): void {
    const remark = prompt('请输入备注：');
    if (remark !== null) {
      this.ticket.status = status;
      this.snackBar.open('状态已更新', '关闭', { duration: 2000 });
    }
  }

  onClose(): void {
    const note = prompt('请输入关闭说明：');
    if (note !== null) {
      this.ticket.status = 'closed';
      this.ticket.closeNote = note;
      this.ticket.closedAt = new Date().toISOString();
      this.snackBar.open('工单已关闭', '关闭', { duration: 2000 });
      this.dialogRef.close(this.ticket);
    }
  }
}
