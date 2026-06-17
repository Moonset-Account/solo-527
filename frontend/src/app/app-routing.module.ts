import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';

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
