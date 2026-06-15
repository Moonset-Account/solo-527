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
import { FaultsService } from '../services/faults.service';
import { Fault } from '../models/fault.model';

@Component({
  selector: 'app-faults',
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
  ],
  templateUrl: './faults.component.html',
  styleUrls: ['./faults.component.scss'],
})
export class FaultsComponent implements OnInit {
  faults: Fault[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = true;
  statusFilter = '';
  severityFilter = '';

  displayedColumns: string[] = ['title', 'reporterName', 'severity', 'status', 'responsiblePerson', 'department', 'systemName', 'createdAt'];

  statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'OPEN', label: '待处理' },
    { value: 'IN_PROGRESS', label: '处理中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' },
  ];

  severityOptions = [
    { value: '', label: '全部级别' },
    { value: 'CRITICAL', label: '严重' },
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  constructor(private faultsService: FaultsService, private router: Router) {}

  ngOnInit(): void {
    this.loadFaults();
  }

  loadFaults(): void {
    this.loading = true;
    this.faultsService.getAll({
      status: this.statusFilter || undefined,
      severity: this.severityFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.faults = res.data;
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
    this.loadFaults();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadFaults();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: '待处理', IN_PROGRESS: '处理中', RESOLVED: '已解决', CLOSED: '已关闭',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: '严重', HIGH: '高', MEDIUM: '中', LOW: '低',
    };
    return map[severity] || severity;
  }

  getSeverityClass(severity: string): string {
    return 'severity-' + severity.toLowerCase();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/faults', id]);
  }
}
