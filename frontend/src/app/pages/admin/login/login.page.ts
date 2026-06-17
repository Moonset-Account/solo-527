import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'admin-login-page',
  template: `
    <div class="wrap">
      <div class="bg-deco"></div>
      <div class="login-card">
        <div class="logo">
          <span class="material-icons">admin_panel_settings</span>
        </div>
        <h1>运营管理后台</h1>
        <p class="sub">行业峰会报名审核台 · 请登录</p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field appearance="outline" class="full">
            <mat-label>账号</mat-label>
            <span matTextPrefix style="margin-right:8px;color:#94a3b8"><span class="material-icons" style="font-size:20px">person</span></span>
            <input matInput formControlName="username" required autocomplete="username" placeholder="请输入管理员账号">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>密码</mat-label>
            <span matTextPrefix style="margin-right:8px;color:#94a3b8"><span class="material-icons" style="font-size:20px">lock</span></span>
            <input matInput formControlName="password" required [type]="showPwd?'text':'password'" placeholder="请输入密码">
            <button mat-icon-button matSuffix type="button" (click)="showPwd=!showPwd">
              <span class="material-icons">{{ showPwd ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </mat-form-field>
          <div class="demo-tip">
            <span class="material-icons">lightbulb</span>
            <span>演示账号: <code>admin</code> / 密码: <code>Admin@2024</code></span>
          </div>
          <button mat-raised-button color="primary" type="submit" class="btn-login" [disabled]="!form.valid || loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
        <div class="divider">
          <span><a routerLink="/" style="color:#64748b;text-decoration:none">← 返回参会者报名入口</a></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap {
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#2563eb 100%);position:relative;overflow:hidden;
    }
    .bg-deco {
      position:absolute;inset:0;
      background:
        radial-gradient(circle at 20% 20%, rgba(59,130,246,.25) 0, transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(16,185,129,.2) 0, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(168,85,247,.15) 0, transparent 50%);
    }
    .bg-deco::after {
      content:'';position:absolute;inset:0;opacity:.05;
      background-image:radial-gradient(circle at 1px 1px,white 1px,transparent 0);background-size:24px 24px;
    }
    .login-card {
      position:relative;background:rgba(255,255,255,.98);backdrop-filter:blur(20px);
      border-radius:24px;padding:48px 44px;width:440px;box-shadow:0 40px 80px -20px rgba(0,0,0,.4);
      border:1px solid rgba(255,255,255,.2);
    }
    .logo {
      width:72px;height:72px;margin:0 auto 16px;border-radius:20px;
      background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;
      display:flex;align-items:center;justify-content:center;box-shadow:0 12px 28px rgba(59,130,246,.4);
    }
    .logo .material-icons { font-size:36px; }
    h1 { font-size:26px;font-weight:800;margin:0;text-align:center;color:#0f172a; }
    .sub { text-align:center;color:#64748b;margin:6px 0 28px;font-size:13px; }
    .full { width:100%;display:block;margin-bottom:8px; }
    .demo-tip {
      margin:8px 0 20px;padding:10px 12px;background:#fffbeb;border-radius:8px;
      font-size:12px;color:#78350f;display:flex;gap:6px;align-items:center;
    }
    .demo-tip code { background:white;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:11px;color:#78350f;border:1px solid #fde68a; }
    .btn-login { width:100%;height:48px;font-size:15px;font-weight:700;border-radius:12px;
      background:linear-gradient(90deg,#1e3a8a,#3b82f6) !important;box-shadow:0 8px 20px rgba(59,130,246,.3); }
    .divider { margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px; }
  `],
})
export class AdminLoginPage {
  form: FormGroup; showPwd = false; loading = false;
  constructor(
    private fb: FormBuilder, private api: ApiService,
    private router: Router, private route: ActivatedRoute,
  ) {
    this.form = fb.group({
      username: ['admin', Validators.required],
      password: ['Admin@2024', Validators.required],
    });
  }
  async submit() {
    if (!this.form.valid) return;
    this.loading = true;
    try {
      await firstValueFrom(this.api.login(this.form.value.username, this.form.value.password));
      this.api.toast('登录成功');
      const url = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
      this.router.navigateByUrl(url);
    } catch (e: any) {
      this.api.toast(e.error?.message || '账号或密码错误', 'error');
    } finally { this.loading = false; }
  }
}
