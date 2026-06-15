import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ApplicationsComponent } from './applications/applications.component';
import { ApplicationDetailComponent } from './applications/application-detail/application-detail.component';
import { FaultsComponent } from './faults/faults.component';
import { FaultDetailComponent } from './faults/fault-detail/fault-detail.component';
import { InspectionTemplatesComponent } from './inspection-templates/inspection-templates.component';
import { TemplateDetailComponent } from './inspection-templates/template-detail/template-detail.component';
import { InspectionTasksComponent } from './inspection-tasks/inspection-tasks.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { rolesGuard } from './guards/roles.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'applications', component: ApplicationsComponent },
      { path: 'applications/new', redirectTo: 'applications' },
      { path: 'applications/:id', component: ApplicationDetailComponent },
      { path: 'faults', component: FaultsComponent },
      { path: 'faults/new', redirectTo: 'faults' },
      { path: 'faults/:id', component: FaultDetailComponent },
      { path: 'inspection-templates', component: InspectionTemplatesComponent },
      { path: 'inspection-templates/new', redirectTo: 'inspection-templates' },
      { path: 'inspection-templates/:id', component: TemplateDetailComponent },
      { path: 'inspection-tasks', component: InspectionTasksComponent },
      {
        path: 'audit-logs',
        component: AuditLogsComponent,
        canActivate: [rolesGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
];
