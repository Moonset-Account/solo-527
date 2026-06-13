import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { ReminderService, ReminderTask } from '../../../core/services/reminder.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reminder-detail',
  templateUrl: './reminder-detail.component.html',
  styleUrls: ['./reminder-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReminderDetailComponent implements OnInit, OnDestroy {
  reminderForm: FormGroup;
  isEdit = false;
  reminderId?: number;
  reminder?: ReminderTask;
  private destroy$ = new Subject<void>();

  typeOptions = [
    { value: 'appointment', label: '预约提醒' },
    { value: 'followup', label: '随访提醒' },
    { value: 'payment', label: '缴费提醒' },
    { value: 'revisit', label: '复诊提醒' }
  ];

  priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' }
  ];

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.reminderForm = this.fb.group({
      type: ['', [Validators.required]],
      relatedId: ['', [Validators.required]],
      patientId: ['', [Validators.required]],
      patientName: ['', [Validators.required]],
      patientPhone: ['', [Validators.required]],
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      priority: ['medium', [Validators.required]],
      status: ['pending'],
      assignedTo: ['', [Validators.required]],
      assignedToName: ['', [Validators.required]],
      dueDate: ['', [Validators.required]],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          if (params['id']) {
            this.isEdit = true;
            this.reminderId = +params['id'];
            return this.reminderService.getReminder(this.reminderId);
          }
          return of(null);
        })
      )
      .subscribe(reminder => {
        if (reminder) {
          this.reminder = reminder;
          this.reminderForm.patchValue(reminder);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.reminderForm.invalid) {
      return;
    }

    const formValue = this.reminderForm.value;
    if (formValue.dueDate instanceof Date) {
      formValue.dueDate = formValue.dueDate.toISOString();
    }

    const request$ = this.isEdit
      ? this.reminderService.updateReminder(this.reminderId!, formValue)
      : this.reminderService.createReminder(formValue);

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

  onSendReminder(): void {
    if (!this.reminderId) return;

    this.reminderService.sendReminder(this.reminderId, 'sms')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('提醒已发送', '关闭', { duration: 3000 });
      });
  }

  onComplete(): void {
    if (!this.reminderId) return;

    this.reminderService.completeReminder(this.reminderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('任务已完成', '关闭', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      });
  }
}
