import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'refund-apply-page',
  template: `
    <div class="wrap">
      <div class="card">
        <h1>申请退款</h1>
        <p class="sub">请填写退款原因，我们将在 3 个工作日内处理</p>

        <div class="order-info" *ngIf="reg">
          <div class="row"><span>订单号</span><strong style="font-family:monospace">{{ reg.orderNo }}</strong></div>
          <div class="row"><span>参会人</span><strong>{{ reg.user.name }}</strong></div>
          <div class="row"><span>票种 / 场次</span><strong>{{ reg.ticketType.name }} · {{ reg.session.name }}</strong></div>
          <div class="row"><span>提交时间</span><strong>{{ formatDate(reg.createdAt) }}</strong></div>
          <div class="row total"><span>退款金额</span><strong style="color:#be123c;font-size:24px">¥{{ reg.amount.toFixed(2) }}</strong></div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form mt-24">
          <mat-form-field appearance="outline" class="full">
            <mat-label>报名手机号（验证身份）*</mat-label>
            <input matInput formControlName="phone" required maxlength="11">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>退款原因 *</mat-label>
            <mat-select formControlName="reason" required>
              <mat-option value="行程冲突">行程冲突 / 临时有事</mat-option>
              <mat-option value="重复报名">重复报名</mat-option>
              <mat-option value="费用问题">费用问题</mat-option>
              <mat-option value="内容不符">会议内容与预期不符</mat-option>
              <mat-option value="其他">其他原因</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>补充说明</mat-label>
            <textarea matInput formControlName="note" rows="4" placeholder="请详细说明情况，便于我们更好地处理"></textarea>
          </mat-form-field>

          <div class="tips">
            <p>• 退款申请一经提交将进入审核流程，审核通过后 1-3 个工作日原路返回</p>
            <p>• 审核未通过的报名，退款将直接退回</p>
            <p>• 如有疑问，请联系客服 summit&#64;example.com</p>
          </div>

          <div class="actions">
            <button mat-stroked-button type="button" [routerLink]="['/status']">返回</button>
            <button mat-raised-button color="warn" type="submit" [disabled]="!form.valid || loading">
              {{ loading ? '提交中...' : '确认申请退款' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh;background:linear-gradient(180deg,#fef2f2 0%,#f8fafc 30%);padding:40px 24px; }
    .card { max-width:600px;margin:0 auto;background:white;border-radius:20px;padding:36px 44px;box-shadow:0 10px 30px rgba(0,0,0,.06); }
    h1 { font-size:24px;font-weight:800;margin:0 0 4px;color:#991b1b; }
    .sub { color:#64748b;margin:0 0 24px; }
    .order-info { padding:20px 24px;background:#fafafa;border-radius:12px;border:1px solid #f1f5f9; }
    .row { display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:13px; }
    .row:last-child { border:none; }
    .row span { color:#64748b; }
    .row.total { padding-top:12px;margin-top:4px;border-top:2px solid #0f172a;border-bottom:none; }
    .full { width:100%;display:block; }
    .tips { background:#fffbeb;padding:12px 16px;border-radius:10px;margin-top:16px;font-size:12px;color:#78350f; }
    .tips p { margin:4px 0; }
    .actions { display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0; }
  `],
})
export class RefundApplyPage implements OnInit {
  orderId = ''; reg: any = null; form: FormGroup; loading = false;
  constructor(
    private route: ActivatedRoute, private router: Router,
    private fb: FormBuilder, private api: ApiService,
  ) {
    this.form = fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      reason: ['', Validators.required],
      note: [''],
    });
  }
  async ngOnInit() {
    this.orderId = this.route.snapshot.params['orderId'];
  }
  formatDate(d: any) { return d ? new Date(d).toLocaleString('zh-CN') : '-'; }
  async submit() {
    if (!this.form.valid) return;
    this.loading = true;
    try {
      const res = await firstValueFrom(this.api.applyRefund({
        orderId: this.orderId, ...this.form.value,
      }));
      this.api.toast('退款申请提交成功');
      this.router.navigate(['/status'], { queryParams: { orderId: this.orderId, phone: this.form.value.phone } });
    } catch (e: any) {
      this.api.toast(e.error?.message || '提交失败', 'error');
    } finally { this.loading = false; }
  }
}
