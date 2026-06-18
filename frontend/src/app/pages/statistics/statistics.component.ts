import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatCardModule,
} from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { DateUtils } from '../../core/utils/date.utils';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatGridListModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent implements OnInit {
  Math = Math;
  dateForm: FormGroup;
  stats: any = null;
  workload: any[] = [];
  loading = false;

  displayedWorkloadColumns = [
    'counselorName',
    'count',
    'totalMinutes',
    'avgMinutes',
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateForm = this.fb.group({
      startDate: [thirtyDaysAgo],
      endDate: [today],
    });
  }

  private getStartDate(): string | null {
    return DateUtils.formatDate(this.dateForm.value.startDate, 'yyyy-MM-dd');
  }

  private getEndDate(): string | null {
    return DateUtils.formatDate(this.dateForm.value.endDate, 'yyyy-MM-dd');
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    if (!startDate || !endDate) return;

    this.loading = true;

    this.apiService.getDashboardStats(startDate, endDate).subscribe({
      next: (data) => {
        this.stats = data;
        this.workload = data.counselorWorkload || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  exportAppointments(): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    if (startDate && endDate) {
      this.apiService.exportAppointments(startDate, endDate);
    }
  }

  exportWorkload(): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    if (startDate && endDate) {
      this.apiService.exportWorkload(startDate, endDate);
    }
  }

  exportNoShow(): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    if (startDate && endDate) {
      this.apiService.exportNoShow(startDate, endDate);
    }
  }

  exportOperationLogs(): void {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    if (startDate && endDate) {
      this.apiService.exportOperationLogs(startDate, endDate);
    }
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
    }
    return `${mins}分钟`;
  }
}
