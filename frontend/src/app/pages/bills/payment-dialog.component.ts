import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Bill } from '../../services/api.config';

@Component({
  selector: 'app-payment-dialog',
  template: `
    <h2 mat-dialog-title>登记付款</h2>
    <mat-dialog-content>
      <div class="bill-info" *ngIf="data.bill">
        <div class="info-row">
          <span class="label">账单编号:</span>
          <span class="value">{{ data.bill.billNumber }}</span>
        </div>
        <div class="info-row">
          <span class="label">待付金额:</span>
          <span class="value overdue">{{ data.bill.remainingAmount | formatCurrency:data.bill.currency }}</span>
        </div>
      </div>
      <form [formGroup]="paymentForm" class="payment-form">
        <mat-form-field appearance="fill">
          <mat-label>付款金额</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matPrefix>{{ data.bill?.currency || 'CNY' }} </span>
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('required')">请输入付款金额</mat-error>
          <mat-error *ngIf="paymentForm.get('amount')?.hasError('min')">金额必须大于0</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>付款日期</mat-label>
          <input matInput [matDatepicker]="paymentDatePicker" formControlName="paymentDate">
          <mat-datepicker-toggle matSuffix [for]="paymentDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #paymentDatePicker></mat-datepicker>
          <mat-error *ngIf="paymentForm.get('paymentDate')?.hasError('required')">请选择付款日期</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>付款方式</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="bank_transfer">银行转账</mat-option>
            <mat-option value="credit_card">信用卡</mat-option>
            <mat-option value="alipay">支付宝</mat-option>
            <mat-option value="wechat">微信支付</mat-option>
            <mat-option value="cash">现金</mat-option>
            <mat-option value="check">支票</mat-option>
            <mat-option value="other">其他</mat-option>
          </mat-select>
          <mat-error *ngIf="paymentForm.get('paymentMethod')?.hasError('required')">请选择付款方式</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>备注</mat-label>
          <textarea matInput formControlName="notes" rows="3" placeholder="请输入备注信息（可选）"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">取消</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!paymentForm.valid || isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
        <span *ngIf="!isLoading">确认付款</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .bill-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .label {
      color: rgba(0, 0, 0, 0.6);
    }
    .value {
      font-weight: 500;
    }
    .value.overdue {
      color: #f44336;
    }
    .payment-form {
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
export class PaymentDialogComponent {
  paymentForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bill: Bill }
  ) {
    this.paymentForm = this.fb.group({
      amount: [data.bill?.remainingAmount || null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['bank_transfer', Validators.required],
      notes: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.isLoading = true;
      const formValue = this.paymentForm.value;
      const paymentData = {
        amount: formValue.amount,
        paymentDate: formValue.paymentDate instanceof Date 
          ? formValue.paymentDate.toISOString().split('T')[0]
          : formValue.paymentDate,
        paymentMethod: formValue.paymentMethod,
        notes: formValue.notes
      };
      this.dialogRef.close(paymentData);
    }
  }
}
