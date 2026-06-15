import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  currentUser = this.authService.getCurrentUser();
  isAdmin = this.authService.hasRole('ADMIN');

  navItems = [
    { label: '工作台', icon: 'dashboard', route: '/dashboard' },
    { label: '账号申请', icon: 'assignment', route: '/applications' },
    { label: '故障报告', icon: 'error', route: '/faults' },
    { label: '巡检模板', icon: 'description', route: '/inspection-templates' },
    { label: '巡检任务', icon: 'fact_check', route: '/inspection-tasks' },
    { label: '审计日志', icon: 'history', route: '/audit-logs', adminOnly: true },
  ];

  filteredNavItems = this.navItems.filter((item) => !item.adminOnly || this.isAdmin);

  constructor(private authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.sidenav?.mode === 'over') {
          this.sidenav.close();
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
