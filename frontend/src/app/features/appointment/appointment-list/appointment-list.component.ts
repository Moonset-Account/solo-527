import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  displayedColumns: string[] = ['id', 'patientName', 'patientPhone', 'doctorName', 'appointmentDate', 'startTime', 'type', 'status', 'actions'];
  dataSource = new MatTableDataSource<Appointment>([]);
  total = 0;
  page = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  appointmentTypes = [
    { value: 'checkup', label: '检查' },
    { value: 'cleaning', label: '洁牙' },
    { value: 'filling', label: '补牙' },
    { value: 'root_canal', label: '根管治疗' },
    { value: 'extraction', label: '拔牙' },
    { value: 'implant', label: '种植牙' },
    { value: 'orthodontics', label: '正畸' },
    { value: 'other', label: '其他' }
  ];

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'confirmed', label: '已确认' },
    { value: 'cancelled', label: '已取消' },
    { value: 'completed', label: '已完成' }
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      patientName: [''],
      doctorName: [''],
      type: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAppointments(): void {
    const filters = this.filterForm.value;
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    if (filters.startDate) {
      filters.startDate = new Date(filters.startDate).toISOString().split('T')[0];
    }
    if (filters.endDate) {
      filters.endDate = new Date(filters.endDate).toISOString().split('T')[0];
    }

    this.appointmentService.getAppointments(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.total = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadAppointments();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.loadAppointments();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAppointments();
  }

  onEdit(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: '确定要删除这条预约记录吗？此操作不可恢复。',
        confirmText: '删除',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.appointmentService.deleteAppointment(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.snackBar.open('删除成功', '关闭', { duration: 3000 });
              this.loadAppointments();
            });
        }
      });
  }

  onUpdateStatus(id: number, status: string): void {
    this.appointmentService.updateStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('状态更新成功', '关闭', { duration: 3000 });
        this.loadAppointments();
      });
  }
}
