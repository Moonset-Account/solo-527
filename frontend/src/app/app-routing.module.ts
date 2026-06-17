import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HomePage } from './pages/home/home.page';
import { RegisterPage } from './pages/register/register.page';
import { RegisterSuccessPage } from './pages/register-success/register-success.page';
import { StatusPage } from './pages/status/status.page';
import { CheckinPage } from './pages/checkin/checkin.page';
import { RefundApplyPage } from './pages/refund-apply/refund-apply.page';
import { AdminLoginPage } from './pages/admin/login/login.page';
import { AdminLayout } from './layouts/admin.layout';
import { DashboardPage } from './pages/admin/dashboard/dashboard.page';
import { ReviewsPage } from './pages/admin/reviews/reviews.page';
import { GuestsPage } from './pages/admin/guests/guests.page';
import { TicketsPage } from './pages/admin/tickets/tickets.page';
import { SessionsPage } from './pages/admin/sessions/sessions.page';
import { CheckinAdminPage } from './pages/admin/checkin/checkin.page';
import { RefundsPage } from './pages/admin/refunds/refunds.page';
import { NotificationsPage } from './pages/admin/notifications/notifications.page';
import { QualityPage } from './pages/admin/quality/quality.page';
import { FunnelPage } from './pages/admin/funnel/funnel.page';
import { GapPage } from './pages/admin/gap/gap.page';
import { ExceptionsPage } from './pages/admin/exceptions/exceptions.page';

const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    inject(Router).navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  return true;
};

const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'register', component: RegisterPage },
  { path: 'register/success', component: RegisterSuccessPage },
  { path: 'status', component: StatusPage },
  { path: 'checkin/:code', component: CheckinPage },
  { path: 'refund/apply/:orderId', component: RefundApplyPage },
  { path: 'admin/login', component: AdminLoginPage },
  {
    path: 'admin', component: AdminLayout, canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'reviews', component: ReviewsPage },
      { path: 'guests', component: GuestsPage },
      { path: 'tickets', component: TicketsPage },
      { path: 'sessions', component: SessionsPage },
      { path: 'checkin', component: CheckinAdminPage },
      { path: 'refunds', component: RefundsPage },
      { path: 'notifications', component: NotificationsPage },
      { path: 'analytics/quality', component: QualityPage },
      { path: 'analytics/funnel', component: FunnelPage },
      { path: 'gap', component: GapPage },
      { path: 'exceptions', component: ExceptionsPage },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
