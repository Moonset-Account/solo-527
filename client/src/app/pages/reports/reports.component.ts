import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AfterSaleReport, MonthlyBreakdown } from '@shared/models';
import { ApiService } from '@shared/services/api.service';
import { ExportService } from '@shared/services/export.service';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    CurrencyPipe,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  report!: AfterSaleReport;
  filterForm: FormGroup;
  maxOrders = 0;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      period: ['month'],
    });
  }

  ngOnInit(): void {
    this.loadReport();
    this.filterForm.get('period')?.valueChanges.subscribe(() => this.loadReport());
  }

  loadReport(): void {
    const period = this.filterForm.get('period')?.value || 'month';
    this.api.get<AfterSaleReport>('/after-sale/report', { period }).subscribe({
      next: (data) => {
        this.report = data;
        this.maxOrders = Math.max(
          ...data.monthlyBreakdown.map((m) => m.totalOrders),
          1
        );
      },
      error: () => this.snackBar.open('加载报表失败', '关闭', { duration: 3000 }),
    });
  }

  getBarHeight(totalOrders: number): string {
    const pct = this.maxOrders > 0 ? (totalOrders / this.maxOrders) * 100 : 0;
    return pct + '%';
  }

  getClosedBarHeight(breakdown: MonthlyBreakdown): string {
    const pct = this.maxOrders > 0 ? (breakdown.closedOrders / this.maxOrders) * 100 : 0;
    return pct + '%';
  }

  exportReport(): void {
    const period = this.filterForm.get('period')?.value || 'month';
    this.exportService.exportAfterSaleReport({ period });
  }
}
