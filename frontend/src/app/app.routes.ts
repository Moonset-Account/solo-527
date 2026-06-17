import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'leases',
        loadComponent: () => import('./pages/leases/leases.component').then(m => m.LeasesComponent)
      },
      {
        path: 'bills',
        loadComponent: () => import('./pages/bills/bills.component').then(m => m.BillsComponent)
      },
      {
        path: 'deposits',
        loadComponent: () => import('./pages/deposits/deposits.component').then(m => m.DepositsComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/properties/properties.component').then(m => m.PropertiesComponent)
      },
      {
        path: 'room-status',
        loadComponent: () => import('./pages/room-status/room-status.component').then(m => m.RoomStatusComponent)
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./pages/tickets/tickets.component').then(m => m.TicketsComponent)
      },
      {
        path: 'export',
        loadComponent: () => import('./pages/export/export.component').then(m => m.ExportComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
