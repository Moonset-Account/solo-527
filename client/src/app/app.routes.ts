import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { portalGuard } from './shared/guards/portal.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./pages/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./pages/project-detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent
          ),
      },
      {
        path: 'projects/:projectId/budget/new',
        loadComponent: () =>
          import('./pages/budget-create/budget-create.component').then(
            (m) => m.BudgetCreateComponent
          ),
      },
      {
        path: 'projects/:projectId/budget-versions',
        loadComponent: () =>
          import('./pages/budget-versions/budget-versions.component').then(
            (m) => m.BudgetVersionsComponent
          ),
      },
      {
        path: 'budgets/:id/edit',
        loadComponent: () =>
          import('./pages/budget-edit/budget-edit.component').then(
            (m) => m.BudgetEditComponent
          ),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./pages/contract-list/contract-list.component').then(
            (m) => m.ContractListComponent
          ),
      },
      {
        path: 'contracts/:id',
        loadComponent: () =>
          import('./pages/contract-detail/contract-detail.component').then(
            (m) => m.ContractDetailComponent
          ),
      },
      {
        path: 'feedbacks',
        loadComponent: () =>
          import('./pages/feedback-list/feedback-list.component').then(
            (m) => m.FeedbackListComponent
          ),
      },
      {
        path: 'after-sale',
        loadComponent: () =>
          import('./pages/after-sale-list/after-sale-list.component').then(
            (m) => m.AfterSaleListComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
    ],
  },
  {
    path: 'portal/:token',
    canActivate: [portalGuard],
    loadComponent: () =>
      import('./layouts/portal-layout/portal-layout.component').then(
        (m) => m.PortalLayoutComponent
      ),
    children: [
      {
        path: 'proposal/:id',
        loadComponent: () =>
          import('./pages/portal/proposal/proposal.component').then(
            (m) => m.PortalProposalComponent
          ),
      },
      {
        path: 'contract/:id',
        loadComponent: () =>
          import('./pages/portal/contract/portal-contract.component').then(
            (m) => m.PortalContractComponent
          ),
      },
      {
        path: 'feedback/:id',
        loadComponent: () =>
          import('./pages/portal/feedback/portal-feedback.component').then(
            (m) => m.PortalFeedbackComponent
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
