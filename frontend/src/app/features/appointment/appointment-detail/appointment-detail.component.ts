import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { AppointmentService, Appointment, AppointmentSlot } from '../../../core/services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-appointment-detail',
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentDetailComponent implements OnInit, OnDestroy {
  appointmentForm: FormGroup;
  isEdit = false;
  appointmentId?: number;
  appointment?: Appointment;
  availableSlots: AppointmentSlot[] = [];
  private destroy$ = new Subject<void>();

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
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      patientId: ['', [Validators.required]],
      patientName: ['', [Validators.required]],
      patientPhone: ['', [Validators.required]],
      doctorId: ['', [Validators.required]],
      doctorName: ['', [Validators.required]],
      slotId: ['', [Validators.required]],
      appointmentDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      type: ['', [Validators.required]],
      status: ['pending'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          if (params['id']) {
            this.isEdit = true;
            this.appointmentId = +params['id'];
            return this.appointmentService.getAppointment(this.appointmentId);
          }
          return of(null);
        })
      )
      .subscribe(appointment => {
        if (appointment) {
          this.appointment = appointment;
          this.appointmentForm.patchValue(appointment);
          if (appointment.doctorId && appointment.appointmentDate) {
            this.loadAvailableSlots(appointment.doctorId, appointment.appointmentDate);
          }
        }
      });

    this.appointmentForm.get('doctorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(doctorId => {
        const date = this.appointmentForm.get('appointmentDate')?.value;
        if (doctorId && date) {
          this.loadAvailableSlots(doctorId, date);
        }
      });

    this.appointmentForm.get('appointmentDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(date => {
        const doctorId = this.appointmentForm.get('doctorId')?.value;
        if (doctorId && date) {
          this.loadAvailableSlots(doctorId, date);
        }
      });

    this.appointmentForm.get('slotId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(slotId => {
        const slot = this.availableSlots.find(s => s.id === slotId);
        if (slot) {
          this.appointmentForm.patchValue({
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvailableSlots(doctorId: number, date: string | Date): void {
    const dateStr = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
    this.appointmentService.getAvailableSlots(doctorId, dateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe(slots => {
        this.availableSlots = slots;
      });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      return;
    }

    const formValue = this.appointmentForm.value;
    if (formValue.appointmentDate instanceof Date) {
      formValue.appointmentDate = formValue.appointmentDate.toISOString().split('T')[0];
    }

    const request$ = this.isEdit
      ? this.appointmentService.updateAppointment(this.appointmentId!, formValue)
      : this.appointmentService.createAppointment(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? '更新成功' : '创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {}
    });
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
