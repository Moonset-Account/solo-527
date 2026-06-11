import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { DashboardStats, Notification, Budget } from '@shared/models';
import { ApiService } from '@shared/services/api.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    StatusLabelPipe,
    CurrencyPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    activeProjects: 0,
    pendingBudgets: 0,
    monthlyAfterSaleOrders: 0,
    unreadNotifications: 0,
  };
  budgetNotifications: Notification[] = [];
  pendingBudgets: Budget[] = [];
  pendingFeedbackCount = 0;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadNotifications();
    this.loadPendingItems();
  }

  private loadStats(): void {
    this.api.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (data) => (this.stats = data),
      error: () => {},
    });
  }

  private loadNotifications(): void {
    this.api.get<Notification[]>('/notifications').subscribe({
      next: (data) => {
        this.budgetNotifications = data
          .filter((n) => n.type === 'budget_change')
          .slice(0, 5);
      },
      error: () => {},
    });
  }

  private loadPendingItems(): void {
    this.api.get<Budget[]>('/budgets/pending').subscribe({
      next: (data) => (this.pendingBudgets = data.slice(0, 5)),
      error: () => {},
    });
  }

  goToBudgetDetail(budgetId: string): void {
    this.router.navigate(['/admin/budgets', budgetId]);
  }

  goToProjectList(): void {
    this.router.navigate(['/admin/projects']);
  }
}
