import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="app-toolbar">
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="toolbar-title">{{ currentTitle }}</span>
        <span class="spacer"></span>
        <button mat-button>
          <mat-icon>notifications</mat-icon>
        </button>
        <button mat-button>
          <mat-icon>account_circle</mat-icon>
          <span>管理员</span>
        </button>
      </mat-toolbar>

      <div class="app-content">
        <mat-sidenav-container style="flex: 1; display: flex;">
          <mat-sidenav #sidenav mode="side" opened class="app-sidenav">
            <mat-nav-list>
              <mat-list-item routerLink="/dashboard" routerLinkActive="active">
                <mat-icon matListItemIcon>dashboard</mat-icon>
                <span matListItemTitle>仪表盘</span>
              </mat-list-item>
              <mat-list-item routerLink="/customer-success" routerLinkActive="active">
                <mat-icon matListItemIcon>supervisor_account</mat-icon>
                <span matListItemTitle>客户成功视图</span>
              </mat-list-item>
              <mat-list-item routerLink="/bills" routerLinkActive="active">
                <mat-icon matListItemIcon>receipt</mat-icon>
                <span matListItemTitle>应收管理</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <div class="nav-section-title">催收管理</div>
              <mat-list-item routerLink="/collection/rhythms" routerLinkActive="active">
                <mat-icon matListItemIcon>tune</mat-icon>
                <span matListItemTitle>催收节奏配置</span>
              </mat-list-item>
              <mat-list-item routerLink="/collection/records" routerLinkActive="active">
                <mat-icon matListItemIcon>history</mat-icon>
                <span matListItemTitle>催收记录</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <div class="nav-section-title">月底核对</div>
              <mat-list-item routerLink="/reconciliation" routerLinkActive="active">
                <mat-icon matListItemIcon>balance</mat-icon>
                <span matListItemTitle>对账管理</span>
              </mat-list-item>
              <mat-list-item routerLink="/cash-forecast" routerLinkActive="active">
                <mat-icon matListItemIcon>trending_up</mat-icon>
                <span matListItemTitle>现金预测</span>
              </mat-list-item>
              <mat-divider></mat-divider>
              <mat-list-item routerLink="/exports" routerLinkActive="active">
                <mat-icon matListItemIcon>download</mat-icon>
                <span matListItemTitle>导出队列</span>
              </mat-list-item>
            </mat-nav-list>
          </mat-sidenav>

          <mat-sidenav-content class="app-main">
            <div class="page-container">
              <router-outlet></router-outlet>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .toolbar-title { margin-left: 16px; font-size: 18px; }
    .nav-section-title { padding: 12px 16px; font-size: 12px; color: rgba(0,0,0,0.54); font-weight: 500; }
    .active { background: rgba(25, 118, 210, 0.1); }
    .mat-list-item.active { color: #1976d2; }
  `]
})
export class AppComponent {
  currentTitle = '仪表盘';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      const routeData = this.router.routerState.root.firstChild?.snapshot.data;
      this.currentTitle = routeData?.['title'] || '仪表盘';
    });
  }
}
