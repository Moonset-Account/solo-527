import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, User } from './core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  permission?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  title = '连锁口腔处方收费台系统';
  currentUser?: User | null;
  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    { path: '/dashboard', label: '仪表盘', icon: 'dashboard' },
    { path: '/appointments', label: '预约管理', icon: 'event', permission: 'appointment:view' },
    { path: '/prescriptions', label: '处方管理', icon: 'receipt', permission: 'prescription:view' },
    { path: '/charges', label: '收费管理', icon: 'payments', permission: 'charge:view' },
    { path: '/reminders', label: '催办任务', icon: 'notifications_active', permission: 'reminder:view' },
    { path: '/followups', label: '随访管理', icon: 'follow_the_signs', permission: 'followup:view' },
    { path: '/revisits', label: '复诊流失', icon: 'person_off', permission: 'revisit:view' },
    { path: '/logs', label: '系统日志', icon: 'description', permission: 'log:view' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasPermission(permission?: string): boolean {
    if (!permission) return true;
    return this.authService.hasPermission(permission);
  }

  get filteredNavItems(): NavItem[] {
    return this.navItems.filter(item => this.hasPermission(item.permission));
  }
}
