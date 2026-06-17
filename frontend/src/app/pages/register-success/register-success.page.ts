import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'register-success-page',
  template: `
    <div class="wrap">
      <div class="card">
        <div class="check">
          <span class="material-icons">check</span>
        </div>
        <h1>报名提交成功！</h1>
        <p class="sub">我们已收到您的报名资料，工作人员将在 24 小时内完成审核</p>
        <div class="order-info">
          <div class="info-row"><span>报名姓名</span><strong>{{ params.name }}</strong></div>
          <div class="info-row"><span>订单编号</span><strong style="font-family:monospace">{{ params.orderId }}</strong></div>
          <div class="info-row"><span>联系手机</span><strong>{{ params.phone }}</strong></div>
          <div class="info-row" *ngIf="params.quality">
            <span>报名质量评分</span>
            <strong [style.color]="params.quality>=80?'#059669':'#2563eb'">
              {{ params.quality }} 分 / 100
              <span style="font-size:12px;font-weight:400;color:#64748b;margin-left:8px">
                {{ params.quality>=85 ? '⭐ 优质候选人' : params.quality>=75 ? '✨ 良好' : '' }}
              </span>
            </strong>
          </div>
        </div>
        <div class="tips">
          <p><span class="material-icons" style="color:#d97706">info</span>
            审核结果将通过短信和邮件通知，请保持手机畅通。您也可以通过下方按钮随时查询进度。
          </p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary"
            [routerLink]="['/status']" [queryParams]="{phone:params.phone,orderId:params.orderId}">
            <span class="material-icons">visibility</span> 查看审核进度
          </button>
          <button mat-stroked-button routerLink="/">返回首页</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ecfdf5,#eff6ff);padding:24px; }
    .card { background:white;border-radius:24px;padding:48px 56px;max-width:520px;
      box-shadow:0 20px 60px rgba(0,0,0,.1);text-align:center; }
    .check {
      width:80px;height:80px;border-radius:50%;margin:0 auto 20px;
      background:linear-gradient(135deg,#10b981,#059669);color:white;
      display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(16,185,129,.4);
      animation: pop .5s cubic-bezier(.175,.885,.32,1.275);
    }
    .check .material-icons { font-size:48px; }
    @keyframes pop { 0%{transform:scale(0)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
    h1 { font-size:28px;font-weight:800;margin:0 0 8px;color:#065f46; }
    .sub { color:#64748b;margin:0 0 28px; }
    .order-info { text-align:left;background:#f8fafc;padding:20px 24px;border-radius:12px; }
    .info-row { display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:14px; }
    .info-row:last-child { border:none; }
    .info-row span { color:#64748b; }
    .tips { margin-top:20px;padding:16px;background:#fffbeb;border-radius:10px;text-align:left;font-size:13px;color:#78350f; }
    .tips p { margin:0;display:flex;gap:8px;align-items:flex-start; }
    .actions { display:flex;gap:12px;margin-top:28px;justify-content:center; }
  `],
})
export class RegisterSuccessPage implements OnInit {
  params: any = {};
  constructor(private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    this.params = this.route.snapshot.queryParams;
    if (!this.params.orderId) this.router.navigate(['/']);
  }
}
