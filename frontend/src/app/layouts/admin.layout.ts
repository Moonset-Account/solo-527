import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'admin-layout',
  template: `
    <mat-sidenav-container style="height:100vh">
      <mat-sidenav mode="side" opened style="width:240px;background:#0f172a;color:white;border:none">
        <div style="padding:20px 16px;border-bottom:1px solid rgba(255,255,255,.1)">
          <div style="font-weight:800;font-size:16px;color:white;display:flex;align-items:center;gap:8px">
            <span class="material-icons" style="color:#38bdf8">confirmation_number</span>
            峰会审核台
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">Summit Admin Console</div>
        </div>
        <mat-nav-list style="padding:8px">
          <a mat-list-item routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="material-icons">dashboard</span><span>总览仪表板</span>
          </a>
          <a mat-list-item routerLink="/admin/reviews" routerLinkActive="active" class="nav-item">
            <span class="material-icons">fact_check</span>
            <span>报名审核工作台</span>
            <span class="badge" *ngIf="todoCount>0">{{todoCount}}</span>
          </a>
          <div class="nav-group">票务资源</div>
          <a mat-list-item routerLink="/admin/tickets" routerLinkActive="active" class="nav-item">
            <span class="material-icons">local_activity</span><span>票种库存管理</span>
          </a>
          <a mat-list-item routerLink="/admin/sessions" routerLinkActive="active" class="nav-item">
            <span class="material-icons">event_seat</span><span>座位场次维护</span>
          </a>
          <a mat-list-item routerLink="/admin/guests" routerLinkActive="active" class="nav-item">
            <span class="material-icons">supervisor_account</span><span>嘉宾名额管理</span>
          </a>
          <a mat-list-item routerLink="/admin/checkin" routerLinkActive="active" class="nav-item">
            <span class="material-icons">qr_code_2</span><span>签到码中心</span>
          </a>
          <a mat-list-item routerLink="/admin/refunds" routerLinkActive="active" class="nav-item">
            <span class="material-icons">money_off</span>
            <span>退款申请处理</span>
            <span class="badge badge-warn" *ngIf="refundCount>0">{{refundCount}}</span>
          </a>
          <a mat-list-item routerLink="/admin/notifications" routerLinkActive="active" class="nav-item">
            <span class="material-icons">campaign</span><span>通知中心</span>
          </a>
          <div class="nav-group">数据运营</div>
          <a mat-list-item routerLink="/admin/analytics/quality" routerLinkActive="active" class="nav-item">
            <span class="material-icons">analytics</span><span>报名质量统计</span>
          </a>
          <a mat-list-item routerLink="/admin/analytics/funnel" routerLinkActive="active" class="nav-item">
            <span class="material-icons">waterfall_chart</span><span>转化漏斗分析</span>
          </a>
          <a mat-list-item routerLink="/admin/gap" routerLinkActive="active" class="nav-item">
            <span class="material-icons">error_outline</span>
            <span>到场缺口待办</span>
            <span class="badge badge-warn" *ngIf="gapCount>0">{{gapCount}}</span>
          </a>
          <a mat-list-item routerLink="/admin/exceptions" routerLinkActive="active" class="nav-item">
            <span class="material-icons">bug_report</span><span>异常关闭复盘</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content style="background:#f8fafc">
        <mat-toolbar style="background:white;border-bottom:1px solid #e2e8f0;padding:0 24px;height:64px">
          <div style="flex:1;font-size:14px;color:#64748b">
            欢迎回来，<strong style="color:#0f172a">{{ adminName }}</strong>
            · 实时数据 · {{ today }}
          </div>
          <button mat-button [matMenuTriggerFor]="userMenu" style="margin-right:-16px">
            <div class="avatar">{{ adminName?.charAt(0) }}</div>
            <span style="margin-left:8px">{{ adminName }}</span>
            <span class="material-icons">arrow_drop_down</span>
          </button>
          <mat-menu #userMenu>
            <button mat-menu-item (click)="api.logout()">
              <span class="material-icons">logout</span>退出登录
            </button>
          </mat-menu>
        </mat-toolbar>
        <div style="padding:0">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .nav-item {
      display:flex !important;align-items:center;gap:10px;
      color:#cbd5e1 !important;border-radius:8px;margin:4px 0;padding:0 14px !important;
      font-size:13px !important;height:42px !important;
    }
    .nav-item .material-icons { font-size:20px; }
    .nav-item:hover { background:rgba(255,255,255,.06);color:white !important; }
    .nav-item.active {
      background:linear-gradient(90deg,#1e40af,#3b82f6);color:white !important;
      box-shadow:0 4px 12px rgba(59,130,246,.3);
    }
    .nav-group {
      font-size:11px;color:#475569;padding:16px 18px 8px;font-weight:600;letter-spacing:.5px;
    }
    .badge {
      margin-left:auto;background:#ef4444;color:white;border-radius:999px;
      font-size:11px;padding:2px 8px;font-weight:600;
    }
    .badge-warn { background:#f59e0b; }
    .avatar {
      width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);
      color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;
    }
  `],
})
export class AdminLayout implements OnInit {
  adminName = '管理员';
  todoCount = 0;
  refundCount = 0;
  gapCount = 0;
  today = new Date().toLocaleDateString('zh-CN');
  constructor(public api: ApiService) {}
  ngOnInit() {
    const u = this.api.getAdmin();
    if (u) this.adminName = u.name || u.username;
    this.loadCounts();
  }
  loadCounts() {
    this.api.dashboardKpi().subscribe((res: any) => {
      this.todoCount = res.todos?.pendingReview || 0;
      this.refundCount = res.todos?.pendingRefunds || 0;
      this.gapCount = res.todos?.gapTodos || 0;
    });
  }
}
