import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStats, TodoItem } from '../models/dashboard.model';
import { TimelinessChartComponent } from './timeliness-chart/timeliness-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TimelinessChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  todoItems: TodoItem[] = [];
  loading = true;
  todoDisplayedColumns: string[] = ['type', 'title', 'status', 'priority', 'createdAt', 'action'];

  statCards = [
    { label: '待处理申请', icon: 'assignment', color: '#3f51b5', field: 'pendingApplications' },
    { label: '进行中故障', icon: 'error', color: '#f44336', field: 'openFaults' },
    { label: '活跃告警', icon: 'notification_important', color: '#ff9800', field: 'activeAlerts' },
    { label: '待执行巡检', icon: 'fact_check', color: '#009688', field: 'pendingTasks' },
  ];

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTodo();
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadTodo(): void {
    this.dashboardService.getTodo().subscribe({
      next: (data) => {
        this.todoItems = data;
      },
    });
  }

  getStatValue(field: string): number {
    return this.stats ? (this.stats as any)[field] ?? 0 : 0;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'HIGH': return '高';
      case 'MEDIUM': return '中';
      case 'LOW': return '低';
      default: return priority;
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '待处理',
      IN_PROGRESS: '处理中',
      COMPLETED: '已完成',
      RESOLVED: '已解决',
      CLOSED: '已关闭',
    };
    return map[status] || status;
  }

  navigateToItem(item: TodoItem): void {
    if (item.type === 'application') {
      this.router.navigate(['/applications', item.id]);
    } else if (item.type === 'fault') {
      this.router.navigate(['/faults', item.id]);
    } else if (item.type === 'task') {
      this.router.navigate(['/inspection-tasks']);
    }
  }
}
