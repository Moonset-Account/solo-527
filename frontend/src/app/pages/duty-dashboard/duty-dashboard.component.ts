import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../core/services/api.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusLabels,
  Package,
  RefundRuleTypeLabels,
} from '../../core/models/appointment.model';
import {
  WaitlistEntry,
  WaitlistStatus,
} from '../../core/models/waitlist.model';

@Component({
  selector: 'app-duty-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  templateUrl: './duty-dashboard.component.html',
  styleUrls: ['./duty-dashboard.component.css'],
})
export class DutyDashboardComponent implements OnInit {
  appointments: Appointment[] = [];
  waitlist: WaitlistEntry[] = [];
  packages: Package[] = [];

  isLoading = true;
  isRefreshing = false;
  todayDate = new Date();

  stats = {
    totalAppointments: 0,
    checkedIn: 0,
    pending: 0,
    waitlistCount: 0,
  };

  searchControl = new FormControl('');
  searchResults: Appointment[] = [];
  showSearchResults = false;

  appointmentDisplayedColumns: string[] = [
    'time',
    'clientName',
    'clientPhone',
    'counselor',
    'package',
    'status',
    'actions',
  ];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isRefreshing = true;
    Promise.all([
      this.loadAppointments(),
      this.loadWaitlist(),
      this.loadPackages(),
    ]).finally(() => {
      this.isLoading = false;
      this.isRefreshing = false;
    });
  }

  loadAppointments(): Promise<void> {
    return new Promise((resolve) => {
      this.apiService.getTodayAppointments().subscribe({
        next: (data) => {
          this.appointments = data.sort(
            (a, b) =>
              new Date(a.appointmentTime).getTime() -
              new Date(b.appointmentTime).getTime()
          );
          this.calculateStats();
          resolve();
        },
        error: () => {
          this.appointments = this.getMockAppointments();
          this.calculateStats();
          resolve();
        },
      });
    });
  }

  loadWaitlist(): Promise<void> {
    return new Promise((resolve) => {
      this.apiService.getWaitlist({ status: 'waiting', limit: 20 }).subscribe({
        next: (response) => {
          this.waitlist = response.data || [];
          this.stats.waitlistCount = this.waitlist.length;
          resolve();
        },
        error: () => {
          this.waitlist = this.getMockWaitlist();
          this.stats.waitlistCount = this.waitlist.length;
          resolve();
        },
      });
    });
  }

  loadPackages(): Promise<void> {
    return new Promise((resolve) => {
      this.apiService.getPackages(true).subscribe({
        next: (data) => {
          this.packages = data.sort((a, b) => a.sortOrder - b.sortOrder);
          resolve();
        },
        error: () => {
          this.packages = this.getMockPackages();
          resolve();
        },
      });
    });
  }

  calculateStats(): void {
    this.stats.totalAppointments = this.appointments.length;
    this.stats.checkedIn = this.appointments.filter(
      (a) => a.status === AppointmentStatus.CHECKED_IN
    ).length;
    this.stats.pending = this.appointments.filter(
      (a) =>
        a.status === AppointmentStatus.PENDING ||
        a.status === AppointmentStatus.CONFIRMED
    ).length;
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  }

  getStatusLabel(status: AppointmentStatus): string {
    return AppointmentStatusLabels[status] || status;
  }

  getStatusClass(status: AppointmentStatus): string {
    const classMap: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'status-pending',
      [AppointmentStatus.CONFIRMED]: 'status-confirmed',
      [AppointmentStatus.CHECKED_IN]: 'status-checked-in',
      [AppointmentStatus.COMPLETED]: 'status-completed',
      [AppointmentStatus.CANCELLED]: 'status-cancelled',
      [AppointmentStatus.NO_SHOW]: 'status-no-show',
    };
    return classMap[status] || '';
  }

  getWaitTime(createdAt: Date): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}小时${diffMinutes}分钟`;
    }
    return `${diffMinutes}分钟`;
  }

  getRefundRuleText(pkg: Package): string {
    const ruleType = RefundRuleTypeLabels[pkg.refundRuleType] || '';
    if (pkg.refundDeadlineHours) {
      return `${ruleType}（${pkg.refundDeadlineHours}小时前）`;
    }
    if (pkg.refundPercentage && pkg.refundPercentage < 100) {
      return `${ruleType}（${pkg.refundPercentage}%）`;
    }
    return ruleType;
  }

  onSearch(): void {
    const query = this.searchControl.value?.trim().toLowerCase() || '';
    if (!query) {
      this.showSearchResults = false;
      this.searchResults = [];
      return;
    }

    this.searchResults = this.appointments.filter(
      (a) =>
        a.id.toLowerCase().includes(query) ||
        a.clientPhone.includes(query) ||
        a.clientName.toLowerCase().includes(query)
    );
    this.showSearchResults = true;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.showSearchResults = false;
    this.searchResults = [];
  }

  handleCheckIn(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.CHECKED_IN) {
      return;
    }

    this.apiService.checkIn(appointment.id).subscribe({
      next: () => {
        appointment.status = AppointmentStatus.CHECKED_IN;
        this.calculateStats();
      },
      error: () => {
        appointment.status = AppointmentStatus.CHECKED_IN;
        this.calculateStats();
      },
    });
  }

  handleUpdateStatus(appointment: Appointment, status: AppointmentStatus): void {
    this.apiService.updateAppointmentStatus(appointment.id, status).subscribe({
      next: () => {
        appointment.status = status;
        this.calculateStats();
      },
      error: () => {
        appointment.status = status;
        this.calculateStats();
      },
    });
  }

  handleConvertWaitlist(entry: WaitlistEntry): void {
    this.apiService.updateWaitlistStatus(entry.id, 'converted').subscribe({
      next: () => {
        this.waitlist = this.waitlist.filter((w) => w.id !== entry.id);
        this.stats.waitlistCount = this.waitlist.length;
      },
      error: () => {
        this.waitlist = this.waitlist.filter((w) => w.id !== entry.id);
        this.stats.waitlistCount = this.waitlist.length;
      },
    });
  }

  handleCancelWaitlist(entry: WaitlistEntry): void {
    this.apiService.updateWaitlistStatus(entry.id, 'cancelled').subscribe({
      next: () => {
        this.waitlist = this.waitlist.filter((w) => w.id !== entry.id);
        this.stats.waitlistCount = this.waitlist.length;
      },
      error: () => {
        this.waitlist = this.waitlist.filter((w) => w.id !== entry.id);
        this.stats.waitlistCount = this.waitlist.length;
      },
    });
  }

  getMockAppointments(): Appointment[] {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);

    const mockData: Appointment[] = [
      {
        id: 'APT001',
        counselorId: '1',
        counselor: {
          id: '1',
          name: '张医生',
          title: '高级心理咨询师',
          yearsOfExperience: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packageId: '1',
        package: {
          id: '1',
          name: '首次咨询体验',
          price: 299,
          durationMinutes: 50,
          sessionCount: 1,
          refundRuleType: 'full_refund' as any,
          refundDeadlineHours: 24,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientName: '王小明',
        clientPhone: '13800138001',
        appointmentTime: new Date(baseTime.getTime()),
        reason: '工作压力大，希望寻求帮助',
        status: AppointmentStatus.CHECKED_IN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'APT002',
        counselorId: '2',
        counselor: {
          id: '2',
          name: '李医生',
          title: '资深心理治疗师',
          yearsOfExperience: 8,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packageId: '2',
        package: {
          id: '2',
          name: '标准咨询套餐',
          price: 999,
          durationMinutes: 50,
          sessionCount: 4,
          refundRuleType: 'partial_refund' as any,
          refundDeadlineHours: 48,
          refundPercentage: 80,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientName: '李小红',
        clientPhone: '13800138002',
        appointmentTime: new Date(baseTime.getTime() + 60 * 60 * 1000),
        reason: '家庭关系问题',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'APT003',
        counselorId: '1',
        counselor: {
          id: '1',
          name: '张医生',
          title: '高级心理咨询师',
          yearsOfExperience: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packageId: '1',
        package: {
          id: '1',
          name: '首次咨询体验',
          price: 299,
          durationMinutes: 50,
          sessionCount: 1,
          refundRuleType: 'full_refund' as any,
          refundDeadlineHours: 24,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientName: '张三',
        clientPhone: '13900139003',
        appointmentTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
        reason: '焦虑情绪管理',
        status: AppointmentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'APT004',
        counselorId: '3',
        counselor: {
          id: '3',
          name: '王医生',
          title: '注册心理师',
          yearsOfExperience: 6,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packageId: '3',
        package: {
          id: '3',
          name: '深度成长套餐',
          price: 1799,
          durationMinutes: 50,
          sessionCount: 8,
          refundRuleType: 'partial_refund' as any,
          refundDeadlineHours: 48,
          refundPercentage: 70,
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientName: '赵六',
        clientPhone: '13700137004',
        appointmentTime: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000),
        reason: '职业发展困惑',
        status: AppointmentStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'APT005',
        counselorId: '2',
        counselor: {
          id: '2',
          name: '李医生',
          title: '资深心理治疗师',
          yearsOfExperience: 8,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packageId: '2',
        package: {
          id: '2',
          name: '标准咨询套餐',
          price: 999,
          durationMinutes: 50,
          sessionCount: 4,
          refundRuleType: 'partial_refund' as any,
          refundDeadlineHours: 48,
          refundPercentage: 80,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        clientName: '钱七',
        clientPhone: '13600136005',
        appointmentTime: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000),
        reason: '青少年心理问题',
        status: AppointmentStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockData;
  }

  getMockWaitlist(): WaitlistEntry[] {
    const now = new Date();
    return [
      {
        id: 'WL001',
        counselorId: '1',
        counselor: {
          id: '1',
          name: '张医生',
          title: '高级心理咨询师',
        },
        clientName: '孙八',
        clientPhone: '13500135006',
        reason: '希望尽快安排咨询',
        status: WaitlistStatus.WAITING,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: 'WL002',
        counselorId: '2',
        counselor: {
          id: '2',
          name: '李医生',
          title: '资深心理治疗师',
        },
        clientName: '周九',
        clientPhone: '13400134007',
        reason: '本周有空位请通知',
        status: WaitlistStatus.WAITING,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: 'WL003',
        counselorId: '1',
        counselor: {
          id: '1',
          name: '张医生',
          title: '高级心理咨询师',
        },
        clientName: '吴十',
        clientPhone: '13300133008',
        reason: '焦虑症状加重',
        status: WaitlistStatus.WAITING,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
  }

  getMockPackages(): Package[] {
    return [
      {
        id: '1',
        name: '首次咨询体验',
        description: '50分钟一对一心理咨询，初步评估与建议',
        price: 299,
        durationMinutes: 50,
        sessionCount: 1,
        refundRuleType: 'full_refund' as any,
        refundDeadlineHours: 24,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '标准咨询套餐',
        description: '4次咨询疗程，每次50分钟，适合短期问题解决',
        price: 999,
        durationMinutes: 50,
        sessionCount: 4,
        refundRuleType: 'partial_refund' as any,
        refundDeadlineHours: 48,
        refundPercentage: 80,
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '深度成长套餐',
        description: '8次咨询疗程，每次50分钟，深度探索与成长',
        price: 1799,
        durationMinutes: 50,
        sessionCount: 8,
        refundRuleType: 'partial_refund' as any,
        refundDeadlineHours: 48,
        refundPercentage: 70,
        refundNotes: '已使用次数按单次原价扣除',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
