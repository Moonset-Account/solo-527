import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { FollowUpService, FollowUpTask } from '../../../core/services/followup.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-followup-detail',
  templateUrl: './followup-detail.component.html',
  styleUrls: ['./followup-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FollowupDetailComponent implements OnInit, OnDestroy {
  followupForm: FormGroup;
  contactForm: FormGroup;
  isEdit = false;
  isRecordContact = false;
  followupId?: number;
  followup?: FollowUpTask;
  private destroy$ = new Subject<void>();

  followUpTypeOptions = [
    { value: 'treatment', label: '治疗后' },
    { value: 'postoperative', label: '术后' },
    { value: 'regular', label: '常规' }
  ];

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'no_answer', label: '无人接听' },
    { value: 'cancelled', label: '已取消' }
  ];

  constructor(
    private fb: FormBuilder,
    private followUpService: FollowUpService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.followupForm = this.fb.group({
      patientId: ['', [Validators.required]],
      patientName: ['', [Validators.required]],
      patientPhone: ['', [Validators.required]],
      appointmentId: ['', [Validators.required]],
      treatmentType: ['', [Validators.required]],
      followUpType: ['', [Validators.required]],
      followUpDate: ['', [Validators.required]],
      status: ['pending'],
      assignedTo: ['', [Validators.required]],
      assignedToName: ['', [Validators.required]],
      content: ['', [Validators.required]],
      response: [''],
      nextFollowUpDate: [''],
      remarks: ['']
    });

    this.contactForm = this.fb.group({
      response: ['', [Validators.required]],
      status: ['', [Validators.required]],
      nextFollowUpDate: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.isRecordContact = params['action'] === 'record';
      });

    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          if (params['id']) {
            this.isEdit = true;
            this.followupId = +params['id'];
            return this.followUpService.getFollowUp(this.followupId);
          }
          return of(null);
        })
      )
      .subscribe(followup => {
        if (followup) {
          this.followup = followup;
          this.followupForm.patchValue(followup);
          if (this.isRecordContact) {
            this.contactForm.patchValue({
              response: followup.response,
              status: followup.status,
              nextFollowUpDate: followup.nextFollowUpDate,
              remarks: ''
            });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.followupForm.invalid) {
      return;
    }

    const formValue = this.followupForm.value;
    if (formValue.followUpDate instanceof Date) {
      formValue.followUpDate = formValue.followUpDate.toISOString().split('T')[0];
    }
    if (formValue.nextFollowUpDate instanceof Date) {
      formValue.nextFollowUpDate = formValue.nextFollowUpDate.toISOString().split('T')[0];
    }

    const request$ = this.isEdit
      ? this.followUpService.updateFollowUp(this.followupId!, formValue)
      : this.followUpService.createFollowUp(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? '更新成功' : '创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {}
    });
  }

  onRecordContact(): void {
    if (this.contactForm.invalid || !this.followupId) {
      return;
    }

    const formValue = this.contactForm.value;
    if (formValue.nextFollowUpDate instanceof Date) {
      formValue.nextFollowUpDate = formValue.nextFollowUpDate.toISOString().split('T')[0];
    }

    this.followUpService.recordContact(this.followupId, formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('联系记录已保存', '关闭', { duration: 3000 });
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: () => {}
      });
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
