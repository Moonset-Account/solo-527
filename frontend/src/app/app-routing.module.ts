import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PermissionGuard } from './core/guards/permission.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'appointments',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['appointment:view'] },
    loadChildren: () => import('./features/appointment/appointment.module').then(m => m.AppointmentModule)
  },
  {
    path: 'prescriptions',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['prescription:view'] },
    loadChildren: () => import('./features/charge/charge.module').then(m => m.ChargeModule)
  },
  {
    path: 'charges',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['charge:view'] },
    loadChildren: () => import('./features/charge/charge.module').then(m => m.ChargeModule)
  },
  {
    path: 'reminders',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['reminder:view'] },
    loadChildren: () => import('./features/reminder/reminder.module').then(m => m.ReminderModule)
  },
  {
    path: 'followups',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['followup:view'] },
    loadChildren: () => import('./features/followup/followup.module').then(m => m.FollowupModule)
  },
  {
    path: 'revisits',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['revisit:view'] },
    loadChildren: () => import('./features/revisit/revisit.module').then(m => m.RevisitModule)
  },
  {
    path: 'logs',
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['log:view'] },
    loadChildren: () => import('./features/log/log.module').then(m => m.LogModule)
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
