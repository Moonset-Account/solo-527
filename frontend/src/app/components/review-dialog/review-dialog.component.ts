import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'review-dialog',
  template: `
    <h2 mat-dialog-title style="font-weight:700">
      <span class="material-icons" style="vertical-align:-5px;color:#065f46">
        {{ data.action === 'approve' ? 'check_circle' : 'cancel' }}
      </span>
      {{ data.action === 'approve' ? '审核通过' : '驳回申请' }}
    </h2>
    <mat-dialog-content>
      <div class="flex-col gap-12 mt-16">
        <div class="p-12" style="border-radius:8px;
          background:{{ data.action==='approve' ? '#ecfdf5;color:#065f46' : '#fef2f2;color:#7f1d1d' }}">
          {{ data.action==='approve'
          ? '通过后将自动生成签到码并发送通知邮件给参会者'
          : '驳回后参会者可以申请退款，请填写驳回原因' }}
        </div>
        <div class="grid grid-2 gap-12">
          <div><strong>订单号：</strong>{{ data.orderNo }}</div>
          <div><strong>参会人：</strong>{{ data.name }}</div>
          <div><strong>票种：</strong>{{ data.ticketName }}</div>
          <div><strong>场次：</strong>{{ data.sessionName }}</div>
        </div>
        <form [formGroup]="form">
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>{{ data.action==='approve' ? '审核备注（选填）' : '驳回原因 *' }}</mat-label>
            <textarea matInput formControlName="note" rows="4"
              [placeholder]="data.action==='approve' ? '审核意见，将在通知中展示' : '请详细说明驳回原因'"></textarea>
          </mat-form-field>
        </form>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions style="justify-content:flex-end;gap:8px;padding:16px">
      <button mat-button (click)="ref.close()">取消</button>
      <button mat-raised-button [color]="data.action==='approve' ? 'primary' : 'warn'"
        (click)="submit()" [disabled]="loading">
        {{ loading ? '提交中...' : '确认' + (data.action==='approve' ? '通过' : '驳回') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ReviewDialog {
  form: FormGroup;
  loading = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public ref: MatDialogRef<ReviewDialog>,
    private fb: FormBuilder, private api: ApiService,
  ) {
    this.form = fb.group({ note: [''] });
  }
  async submit() {
    this.loading = true;
    try {
      await firstValueFrom(this.api.reviewRegistration(this.data.id, {
        action: this.data.action, note: this.form.value.note,
      }));
      this.api.toast('审核操作成功');
      this.ref.close(true);
    } catch (e: any) {
      this.api.toast(e.error?.message || '操作失败', 'error');
    } finally {
      this.loading = false;
    }
  }
}
