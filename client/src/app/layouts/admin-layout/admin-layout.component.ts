import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  private touchStartX = 0;
  private touchStartY = 0;

  @ViewChild('sidenav') sidenav!: any;

  navItems = [
    { label: '仪表盘', icon: 'dashboard', route: '/admin/dashboard' },
    { label: '项目管理', icon: 'folder', route: '/admin/projects' },
    { label: '合同管理', icon: 'description', route: '/admin/contracts' },
    { label: '客户反馈', icon: 'feedback', route: '/admin/feedbacks' },
    { label: '售后服务', icon: 'build', route: '/admin/after-sale' },
    { label: '报表统计', icon: 'bar_chart', route: '/admin/reports' },
  ];

  mobileNavItems = [
    { label: '首页', icon: 'home', route: '/admin/dashboard' },
    { label: '项目', icon: 'folder', route: '/admin/projects' },
    { label: '新增', icon: 'add_circle', route: '', isAction: true },
    { label: '售后', icon: 'build', route: '/admin/after-sale' },
    { label: '我的', icon: 'person', route: '', isAction: true },
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile) return;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isMobile) return;
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && this.touchStartX < 30) {
        this.sidenavOpened = true;
      } else if (deltaX < 0 && this.sidenavOpened) {
        this.sidenavOpened = false;
      }
    }
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
      this.notificationService.requestNotificationPermission();
      this.notificationService.refreshUnreadCount();
    }
    this.sub.add(
      this.notificationService.notification$.subscribe((n) => {
        this.notifications.unshift(n);
        this.unreadCount++;
      })
    );
    this.sub.add(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
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

  onMobileNavItemClick(item: any): void {
    if (item.isAction) {
      if (item.label === '新增') {
        this.router.navigate(['/admin/projects']);
      } else if (item.label === '我的') {
        this.showUserMenu();
      }
    }
  }

  private showUserMenu(): void {
    const event = new MouseEvent('click');
    const userBtn = this.elementRef.nativeElement.querySelector('.user-btn');
    if (userBtn) {
      userBtn.dispatchEvent(event);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
