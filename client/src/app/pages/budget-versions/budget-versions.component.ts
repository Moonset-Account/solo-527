import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Budget, BudgetComparison, BudgetDiffItem } from '@shared/models';
import { BudgetService } from '@shared/services/budget.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CategoryLabelPipe } from '@shared/pipes/category-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

@Component({
  selector: 'app-budget-versions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    StatusLabelPipe,
    CategoryLabelPipe,
    CurrencyPipe,
  ],
  templateUrl: './budget-versions.component.html',
  styleUrls: ['./budget-versions.component.scss'],
})
export class BudgetVersionsComponent implements OnInit {
  budgets: Budget[] = [];
  projectId = '';
  showComparison = false;
  comparison: BudgetComparison | null = null;
  leftVersionId = '';
  rightVersionId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetService: BudgetService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    if (this.projectId) {
      this.loadBudgets();
    }
  }

  loadBudgets(): void {
    this.budgetService.getByProject(this.projectId).subscribe({
      next: (data) => (this.budgets = data.sort((a, b) => b.version - a.version)),
      error: () => this.snackBar.open('加载预算版本失败', '关闭', { duration: 3000 }),
    });
  }

  editBudget(budgetId: string): void {
    this.router.navigate(['/admin/budgets', budgetId, 'edit']);
  }

  compareVersions(): void {
    if (!this.leftVersionId || !this.rightVersionId) {
      this.snackBar.open('请选择两个版本进行对比', '关闭', { duration: 3000 });
      return;
    }
    this.budgetService.compare(this.leftVersionId, this.rightVersionId).subscribe({
      next: (data) => {
        this.comparison = data;
        this.showComparison = true;
      },
      error: () => this.snackBar.open('对比失败', '关闭', { duration: 3000 }),
    });
  }

  closeComparison(): void {
    this.showComparison = false;
    this.comparison = null;
  }

  goBack(): void {
    this.router.navigate(['/admin/projects', this.projectId]);
  }

  isDiffChanged(diff: BudgetDiffItem): boolean {
    return diff.leftValue !== diff.rightValue;
  }
}
