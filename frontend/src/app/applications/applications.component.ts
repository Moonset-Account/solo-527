import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationsService } from '../services/applications.service';
import { Application } from '../models/application.model';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class ApplicationsComponent implements OnInit {
  applications: Application[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = true;
  statusFilter = '';
  priorityFilter = '';

  displayedColumns: string[] = ['title', 'applicantName', 'accountType', 'status', 'priority', 'responsiblePerson', 'department', 'createdAt'];

  statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'PENDING', label: '待处理' },
    { value: 'APPROVED', label: '已批准' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'REJECTED', label: '已拒绝' },
  ];

  priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  constructor(private applicationsService: ApplicationsService, private router: Router) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationsService.getAll({
      status: this.statusFilter || undefined,
      priority: this.priorityFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.applications = res.data;
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
    this.loadApplications();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadApplications();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '待处理',
      APPROVED: '已批准',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      REJECTED: '已拒绝',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };
    return map[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    return 'priority-' + priority.toLowerCase();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/applications', id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/applications', 'new']);
  }
}
