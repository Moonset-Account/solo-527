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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Budget, BudgetComparison, BudgetItemDifference } from '@shared/models';
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
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatTableModule,
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
  loadingComparison = false;
  filterType: 'all' | 'added' | 'removed' | 'modified' = 'all';

  categoryLabels: Record<string, string> = {
    demolition: '拆除工程',
    plumbing: '水电工程',
    masonry: '泥瓦工程',
    carpentry: '木工工程',
    painting: '油漆工程',
    main_material: '主材',
    other: '其他',
  };

  displayedColumns: string[] = ['type', 'category', 'name', 'oldValue', 'newValue', 'diff'];

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
    if (this.leftVersionId === this.rightVersionId) {
      this.snackBar.open('请选择两个不同的版本', '关闭', { duration: 3000 });
      return;
    }
    this.loadingComparison = true;
    this.budgetService.compare(this.leftVersionId, this.rightVersionId).subscribe({
      next: (data) => {
        this.comparison = data;
        this.showComparison = true;
        this.loadingComparison = false;
      },
      error: () => {
        this.snackBar.open('对比失败', '关闭', { duration: 3000 });
        this.loadingComparison = false;
      },
    });
  }

  closeComparison(): void {
    this.showComparison = false;
    this.comparison = null;
    this.leftVersionId = '';
    this.rightVersionId = '';
    this.filterType = 'all';
  }

  goBack(): void {
    this.router.navigate(['/admin/projects', this.projectId]);
  }

  getFilteredDifferences(): BudgetItemDifference[] {
    if (!this.comparison) return [];
    if (this.filterType === 'all') return this.comparison.itemDifferences;
    return this.comparison.itemDifferences.filter(d => d.type === this.filterType);
  }

  getDiffTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      added: '新增',
      removed: '删除',
      modified: '修改',
    };
    return labels[type] || type;
  }

  getDiffTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      added: 'add_circle',
      removed: 'remove_circle',
      modified: 'edit',
    };
    return icons[type] || 'info';
  }

  formatDiff(diff: number): string {
    const prefix = diff > 0 ? '+' : '';
    return `${prefix}${diff.toFixed(2)}`;
  }

  getDiffClass(diff: number): string {
    if (diff > 0) return 'diff-increase';
    if (diff < 0) return 'diff-decrease';
    return '';
  }

  getBudgetById(id: string): Budget | undefined {
    return this.budgets.find(b => b.id === id);
  }
}
