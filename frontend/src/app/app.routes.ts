import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'booking',
    pathMatch: 'full',
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./pages/booking/booking.component').then((m) => m.BookingComponent),
    title: '预约咨询',
  },
  {
    path: 'booking/success',
    loadComponent: () =>
      import('./pages/booking-success/booking-success.component').then(
        (m) => m.BookingSuccessComponent
      ),
    title: '预约成功',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: '登录',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'duty',
        pathMatch: 'full',
      },
      {
        path: 'duty',
        loadComponent: () =>
          import('./pages/duty-dashboard/duty-dashboard.component').then(
            (m) => m.DutyDashboardComponent
          ),
        title: '值班控制台',
      },
      {
        path: 'packages',
        loadComponent: () =>
          import('./pages/package-management/package-management.component').then(
            (m) => m.PackageManagementComponent
          ),
        title: '套餐管理',
      },
      {
        path: 'counselors',
        loadComponent: () =>
          import('./pages/counselor-management/counselor-management.component').then(
            (m) => m.CounselorManagementComponent
          ),
        title: '咨询师管理',
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointment-list/appointment-list.component').then(
            (m) => m.AppointmentListComponent
          ),
        title: '预约管理',
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./pages/statistics/statistics.component').then(
            (m) => m.StatisticsComponent
          ),
        title: '统计导出',
      },
    ],
  },
];
