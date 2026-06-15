import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Bill } from '../../services/api.config';

@Component({
  selector: 'app-status-dialog',
  template: `
    <h2 mat-dialog-title>更新状态</h2>
    <mat-dialog-content>
      <div class="current-status" *ngIf="data.bill">
        <span class="label">当前状态:</span>
        <span [ngClass]="data.bill.status | statusBadge">{{ data.bill.status | statusDisplay }}</span>
      </div>
      <form [formGroup]="statusForm" class="status-form">
        <mat-form-field appearance="fill">
          <mat-label>新状态</mat-label>
          <mat-select formControlName="status">
            <mat-option value="draft">草稿</mat-option>
            <mat-option value="issued">已出具</mat-option>
            <mat-option value="pending">待支付</mat-option>
            <mat-option value="partial">部分支付</mat-option>
            <mat-option value="paid">已支付</mat-option>
            <mat-option value="overdue">已逾期</mat-option>
            <mat-option value="written_off">已核销</mat-option>
            <mat-option value="disputed">有争议</mat-option>
          </mat-select>
          <mat-error *ngIf="statusForm.get('status')?.hasError('required')">请选择新状态</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>变更原因</mat-label>
          <textarea matInput formControlName="reason" rows="4" placeholder="请输入状态变更原因"></textarea>
          <mat-error *ngIf="statusForm.get('reason')?.hasError('required')">请输入变更原因</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">取消</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!statusForm.valid || isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span *ngIf="!isLoading">确认更新</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .current-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .label {
      color: rgba(0, 0, 0, 0.6);
    }
    .status-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }
    .full-width {
      width: 100%;
    }
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class StatusDialogComponent {
  statusForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bill: Bill }
  ) {
    this.statusForm = this.fb.group({
      status: [data.bill?.status || '', Validators.required],
      reason: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.statusForm.valid) {
      this.isLoading = true;
      this.dialogRef.close(this.statusForm.value);
    }
  }
}
