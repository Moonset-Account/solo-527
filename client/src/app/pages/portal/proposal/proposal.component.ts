import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Budget, Project, BudgetItemCategory } from '@shared/models';
import { BudgetService } from '@shared/services/budget.service';
import { ProjectService } from '@shared/services/project.service';
import { CategoryLabelPipe } from '@shared/pipes/category-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';

@Component({
  selector: 'app-portal-proposal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatSnackBarModule,
    CategoryLabelPipe,
    CurrencyPipe,
    StatusLabelPipe,
  ],
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.scss'],
})
export class PortalProposalComponent implements OnInit {
  project!: Project;
  budget!: Budget;
  token = '';
  loading = true;

  categoryOrder: BudgetItemCategory[] = [
    'demolition', 'plumbing', 'masonry', 'carpentry', 'painting', 'main_material', 'other'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetService: BudgetService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'current') {
      this.loadBudget(id);
    }
  }

  loadBudget(budgetId: string): void {
    this.budgetService.getById(budgetId).subscribe({
      next: (data) => {
        this.budget = data;
        this.loadProject(data.projectId);
      },
      error: () => {
        this.snackBar.open('加载报价单失败', '关闭', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  loadProject(projectId: string): void {
    this.projectService.getById(projectId).subscribe({
      next: (data) => {
        this.project = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getGroupedItems(): { category: BudgetItemCategory; items: Budget['items'] }[] {
    if (!this.budget?.items) return [];
    const groups = new Map<BudgetItemCategory, Budget['items']>();
    for (const item of this.budget.items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category)!.push(item);
    }
    return this.categoryOrder
      .filter((cat) => groups.has(cat))
      .map((cat) => ({ category: cat, items: groups.get(cat)! }));
  }

  getCategorySubtotal(items: Budget['items']): number {
    return items.reduce((sum, i) => sum + i.totalPrice, 0);
  }

  confirm(): void {
    if (confirm('确定要确认此报价单吗？确认后将无法修改。')) {
      this.budgetService.confirm(this.budget.id).subscribe({
        next: () => {
          this.snackBar.open('已确认报价单', '关闭', { duration: 2000 });
          this.loadBudget(this.budget.id);
        },
        error: () => this.snackBar.open('操作失败', '关闭', { duration: 3000 }),
      });
    }
  }

  requestChanges(): void {
    const reason = prompt('请输入修改意见（可选）：');
    if (reason !== null) {
      this.budgetService.requestChanges(this.budget.id, reason || undefined).subscribe({
        next: () => {
          this.snackBar.open('已提交修改请求', '关闭', { duration: 2000 });
          this.loadBudget(this.budget.id);
        },
        error: () => this.snackBar.open('操作失败', '关闭', { duration: 3000 }),
      });
    }
  }

  canAct(): boolean {
    return this.budget?.status === 'sent_to_client';
  }
}
