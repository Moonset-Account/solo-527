import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@shared/services/auth.service';
import { NotificationService } from '@shared/services/notification.service';
import { Notification } from '@shared/models';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    StatusLabelPipe,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isMobile = false;
  sidenavOpened = true;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;
  private sub = new Subscription();

  navItems = [
    { label: '仪表盘', icon: 'dashboard', route: '/admin/dashboard' },
    { label: '项目管理', icon: 'folder', route: '/admin/projects' },
    { label: '合同管理', icon: 'description', route: '/admin/contracts' },
    { label: '客户反馈', icon: 'feedback', route: '/admin/feedbacks' },
    { label: '售后服务', icon: 'build', route: '/admin/after-sale' },
    { label: '报表统计', icon: 'bar_chart', route: '/admin/reports' },
  ];

  mobileNavItems = [
    { label: '仪表盘', icon: 'dashboard', route: '/admin/dashboard' },
    { label: '项目', icon: 'folder', route: '/admin/projects' },
    { label: '售后', icon: 'build', route: '/admin/after-sale' },
    { label: '更多', icon: 'more_horiz', route: '' },
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && !wasMobile) {
      this.sidenavOpened = false;
    } else if (!this.isMobile && wasMobile) {
      this.sidenavOpened = true;
    }
  }

  ngOnInit(): void {
    this.loadNotifications();
    const user = this.authService.getCurrentUser();
    if (user) {
      this.notificationService.connectWebSocket(user.id);
    }
    this.sub.add(
      this.notificationService.notification$.subscribe((n) => {
        this.notifications.unshift(n);
        this.unreadCount++;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.notificationService.disconnectWebSocket();
  }

  loadNotifications(): void {
    this.notificationService.getAll().subscribe((data) => {
      this.notifications = data;
      this.unreadCount = data.filter((n) => !n.read).length;
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach((n) => (n.read = true));
      this.unreadCount = 0;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
