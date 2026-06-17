import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'close-dialog',
  template: `
    <h2 mat-dialog-title class="mb-0" style="color:#991b1b;font-weight:700">
      <span class="material-icons" style="vertical-align:-5px">report_gmailerrorred</span>
      异常关闭报名
    </h2>
    <mat-dialog-content>
      <div class="flex-col gap-16 mt-16">
        <div class="p-12" style="background:#fef2f2;border-radius:8px;color:#7f1d1d">
          ⚠️ 关闭后将自动释放票种库存和座位，操作不可撤销
        </div>
        <form [formGroup]="form" class="flex-col gap-12">
          <mat-form-field appearance="outline">
            <mat-label>关闭原因 *</mat-label>
            <mat-select formControlName="closeReasonId" required>
              <mat-option *ngFor="let r of reasons" [value]="r.id">
                [{{ r.category }}] {{ r.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="form.get('closeReasonId')?.value === otherId">
            <mat-label>请说明具体原因</mat-label>
            <input matInput formControlName="customReason" placeholder="必填">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>详细备注</mat-label>
            <textarea matInput formControlName="note" rows="3"
              placeholder="请记录详细情况，便于后续复盘追溯（建议）"></textarea>
          </mat-form-field>
        </form>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions style="justify-content:flex-end;gap:8px;padding:16px">
      <button mat-button (click)="ref.close()">取消</button>
      <button mat-raised-button color="warn" (click)="submit()"
        [disabled]="!form.valid || loading">
        {{ loading ? '提交中...' : '确认关闭' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CloseDialog {
  form: FormGroup;
  reasons: any[] = [];
  otherId = '';
  loading = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public ref: MatDialogRef<CloseDialog>,
    private fb: FormBuilder, private api: ApiService,
  ) {
    this.form = fb.group({
      closeReasonId: ['', Validators.required],
      customReason: [''],
      note: [''],
    });
    this.loadReasons();
  }
  async loadReasons() {
    this.reasons = await firstValueFrom(this.api.listCloseReasons()) as any[];
    const other = this.reasons.find(r => r.name.includes('其他'));
    if (other) this.otherId = other.id;
  }
  async submit() {
    if (!this.form.valid) return;
    this.loading = true;
    try {
      const v = this.form.value;
      const res: any = await firstValueFrom(this.api.reviewRegistration(this.data.id, {
        action: 'close',
        closeReasonId: v.closeReasonId,
        customReason: v.customReason,
        note: v.note,
      }));
      this.api.toast('报名已异常关闭');
      this.ref.close(true);
    } catch (e: any) {
      this.api.toast(e.error?.message || '操作失败', 'error');
    } finally {
      this.loading = false;
    }
  }
}
