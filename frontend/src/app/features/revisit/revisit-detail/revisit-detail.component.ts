import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { RevisitService, RevisitChurn } from '../../../core/services/revisit.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-revisit-detail',
  templateUrl: './revisit-detail.component.html',
  styleUrls: ['./revisit-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevisitDetailComponent implements OnInit, OnDestroy {
  revisitForm: FormGroup;
  contactForm: FormGroup;
  isEdit = false;
  isRecordContact = false;
  revisitId?: number;
  revisit?: RevisitChurn;
  private destroy$ = new Subject<void>();

  riskLevelOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'critical', label: '严重' }
  ];

  statusOptions = [
    { value: 'identified', label: '已识别' },
    { value: 'contacted', label: '已联系' },
    { value: 'scheduled', label: '已预约' },
    { value: 'visited', label: '已复诊' },
    { value: 'lost', label: '已流失' }
  ];

  constructor(
    private fb: FormBuilder,
    private revisitService: RevisitService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.revisitForm = this.fb.group({
      patientId: ['', [Validators.required]],
      patientName: ['', [Validators.required]],
      patientPhone: ['', [Validators.required]],
      lastVisitDate: ['', [Validators.required]],
      expectedReturnDate: ['', [Validators.required]],
      churnRiskLevel: ['medium', [Validators.required]],
      treatmentHistory: ['', [Validators.required]],
      status: ['identified'],
      assignedTo: ['', [Validators.required]],
      assignedToName: ['', [Validators.required]],
      notes: [''],
      outcome: ['']
    });

    this.contactForm = this.fb.group({
      contactResult: ['', [Validators.required]],
      notes: [''],
      nextFollowUpDate: ['']
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
            this.revisitId = +params['id'];
            return this.revisitService.getRevisitChurn(this.revisitId);
          }
          return of(null);
        })
      )
      .subscribe(revisit => {
        if (revisit) {
          this.revisit = revisit;
          this.revisitForm.patchValue(revisit);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.revisitForm.invalid) {
      return;
    }

    const formValue = this.revisitForm.value;
    if (formValue.lastVisitDate instanceof Date) {
      formValue.lastVisitDate = formValue.lastVisitDate.toISOString().split('T')[0];
    }
    if (formValue.expectedReturnDate instanceof Date) {
      formValue.expectedReturnDate = formValue.expectedReturnDate.toISOString().split('T')[0];
    }

    const request$ = this.isEdit
      ? this.revisitService.updateRevisitChurn(this.revisitId!, formValue)
      : this.revisitService.createRevisitChurn(formValue);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? '更新成功' : '创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {}
    });
  }

  onRecordContact(): void {
    if (this.contactForm.invalid || !this.revisitId) {
      return;
    }

    const formValue = this.contactForm.value;
    if (formValue.nextFollowUpDate instanceof Date) {
      formValue.nextFollowUpDate = formValue.nextFollowUpDate.toISOString().split('T')[0];
    }

    this.revisitService.recordContact(this.revisitId, formValue)
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

  onMarkAsVisited(): void {
    if (!this.revisitId) return;

    this.revisitService.markAsVisited(this.revisitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('已标记为已复诊', '关闭', { duration: 3000 });
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: () => {}
      });
  }

  onMarkAsLost(): void {
    if (!this.revisitId) return;

    this.revisitService.markAsLost(this.revisitId, '多次联系未成功')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('已标记为已流失', '关闭', { duration: 3000 });
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: () => {}
      });
  }
}
