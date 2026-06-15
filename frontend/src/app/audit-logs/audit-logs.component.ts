import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLog } from '../models/audit-log.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = true;
  expandedRow: string | null = null;

  entityTypeFilter = '';
  actionFilter = '';
  operatorFilter = '';

  displayedColumns: string[] = ['expand', 'operatorName', 'action', 'entityType', 'entityId', 'ipAddress', 'createdAt'];

  entityTypeOptions = [
    { value: '', label: '全部类型' },
    { value: 'application', label: '账号申请' },
    { value: 'fault', label: '故障报告' },
    { value: 'inspection_template', label: '巡检模板' },
    { value: 'inspection_task', label: '巡检任务' },
    { value: 'change_window', label: '变更窗口' },
    { value: 'user', label: '用户' },
  ];

  actionOptions = [
    { value: '', label: '全部操作' },
    { value: 'CREATE', label: '创建' },
    { value: 'UPDATE', label: '更新' },
    { value: 'DELETE', label: '删除' },
    { value: 'LOGIN', label: '登录' },
    { value: 'RESOLVE', label: '解决' },
  ];

  constructor(private auditLogsService: AuditLogsService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditLogsService.getAll({
      entityType: this.entityTypeFilter || undefined,
      action: this.actionFilter || undefined,
      operator: this.operatorFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.logs = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadLogs();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadLogs();
  }

  toggleRow(id: string): void {
    this.expandedRow = this.expandedRow === id ? null : id;
  }

  isExpanded(id: string): boolean {
    return this.expandedRow === id;
  }

  getEntityTypeLabel(type: string): string {
    const map: Record<string, string> = {
      application: '账号申请',
      fault: '故障报告',
      inspection_template: '巡检模板',
      inspection_task: '巡检任务',
      change_window: '变更窗口',
      user: '用户',
    };
    return map[type] || type;
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      LOGIN: '登录',
      RESOLVE: '解决',
    };
    return map[action] || action;
  }
}
