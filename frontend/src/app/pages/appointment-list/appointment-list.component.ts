import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../core/services/api.service';
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusLabels,
  Counselor,
  PaginatedResponse,
} from '../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    DatePipe,
  ],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css'],
  providers: [DatePipe],
})
export class AppointmentListComponent implements OnInit {
  @ViewChild('detailDialog') detailDialogTemplate!: TemplateRef<any>;
  private detailDialogRef!: MatDialogRef<any>;

  appointments: Appointment[] = [];
  counselors: Counselor[] = [];
  displayedColumns: string[] = [
    'clientName',
    'clientPhone',
    'counselor',
    'package',
    'appointmentTime',
    'status',
    'lastOperatorName',
    'actions',
  ];
  appointmentStatusLabels = AppointmentStatusLabels;
  appointmentStatuses = Object.values(AppointmentStatus);
  isLoading = false;
  filterForm: FormGroup;
  selectedAppointment: Appointment | null = null;
  total = 0;
  page = 1;
  limit = 10;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      counselorId: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  ngOnInit(): void {
    this.loadCounselors();
    this.loadAppointments();
  }

  loadCounselors(): void {
    this.apiService.getCounselors(true).subscribe({
      next: (counselors) => {
        this.counselors = counselors;
      },
      error: () => {},
    });
  }

  loadAppointments(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;
    const params: any = {
      page: this.page,
      limit: this.limit,
    };

    if (formValue.status) {
      params.status = formValue.status;
    }
    if (formValue.counselorId) {
      params.counselorId = formValue.counselorId;
    }
    if (formValue.startDate) {
      params.startDate = this.datePipe.transform(
        formValue.startDate,
        'yyyy-MM-dd'
      );
    }
    if (formValue.endDate) {
      params.endDate = this.datePipe.transform(
        formValue.endDate,
        'yyyy-MM-dd'
      );
    }

    this.apiService.getAppointments(params).subscribe({
      next: (response: PaginatedResponse<Appointment>) => {
        this.appointments = response.data;
        this.total = response.total;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('加载预约列表失败', '关闭', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  onFilter(): void {
    this.page = 1;
    this.loadAppointments();
  }

  onReset(): void {
    this.filterForm.reset({
      status: '',
      counselorId: '',
      startDate: '',
      endDate: '',
    });
    this.page = 1;
    this.loadAppointments();
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusMap: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'status-pending',
      [AppointmentStatus.CONFIRMED]: 'status-confirmed',
      [AppointmentStatus.CHECKED_IN]: 'status-checked-in',
      [AppointmentStatus.COMPLETED]: 'status-completed',
      [AppointmentStatus.CANCELLED]: 'status-cancelled',
      [AppointmentStatus.NO_SHOW]: 'status-no-show',
    };
    return statusMap[status] || '';
  }

  canConfirm(appointment: Appointment): boolean {
    return appointment.status === AppointmentStatus.PENDING;
  }

  canCancel(appointment: Appointment): boolean {
    return (
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED
    );
  }

  canMarkNoShow(appointment: Appointment): boolean {
    return (
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.CONFIRMED
    );
  }

  confirmAppointment(appointment: Appointment): void {
    this.updateStatus(appointment.id, AppointmentStatus.CONFIRMED, '确认预约');
  }

  cancelAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '确认取消',
        message: `确定要取消${appointment.clientName}的预约吗？`,
        confirmText: '取消预约',
        cancelText: '返回',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateStatus(
          appointment.id,
          AppointmentStatus.CANCELLED,
          '取消预约'
        );
      }
    });
  }

  markNoShow(appointment: Appointment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '标记爽约',
        message: `确定要将${appointment.clientName}标记为爽约吗？`,
        confirmText: '标记爽约',
        cancelText: '取消',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateStatus(
          appointment.id,
          AppointmentStatus.NO_SHOW,
          '标记爽约'
        );
      }
    });
  }

  updateStatus(id: string, status: AppointmentStatus, action: string): void {
    this.apiService.updateAppointmentStatus(id, status).subscribe({
      next: () => {
        this.snackBar.open(`${action}成功`, '关闭', { duration: 3000 });
        this.loadAppointments();
      },
      error: () => {
        this.snackBar.open(`${action}失败`, '关闭', { duration: 3000 });
      },
    });
  }

  viewDetail(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.detailDialogRef = this.dialog.open(this.detailDialogTemplate, {
      width: '500px',
    });
  }
}
