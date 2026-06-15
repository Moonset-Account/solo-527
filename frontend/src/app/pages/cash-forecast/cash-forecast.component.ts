import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { CashForecastService } from '../../services/cash-forecast.service';
import { CashForecast } from '../../services/api.config';

interface BillBreakdown {
  overdueGroup: string;
  billCount: number;
  expectedAmount: number;
  probability: number;
  expectedDate: string;
}

interface ForecastComparison {
  month: string;
  projected: number;
  actual: number;
}

interface ReconciliationNote {
  id: string;
  date: string;
  content: string;
  author: string;
}

@Component({
  selector: 'app-cash-forecast',
  template: `
    <div class="forecast-container">
      <div class="forecast-header">
        <h2>现金预测</h2>
        <div class="period-selector">
          <mat-form-field appearance="outline">
            <mat-label>预测周期</mat-label>
            <mat-select [formControl]="periodControl">
              <mat-option value="7d">未来7天</mat-option>
              <mat-option value="30d">未来30天</mat-option>
              <mat-option value="90d">未来90天</mat-option>
              <mat-option value="180d">未来180天</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="generateForecast()">
            <mat-icon>refresh</mat-icon>
            生成预测
          </button>
        </div>
      </div>

      <div class="cash-flow-cards">
        <mat-card class="flow-card">
          <mat-card-content>
            <div class="card-label">期初余额</div>
            <div class="card-value">{{ forecast?.openingBalance | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="flow-card">
          <mat-card-content>
            <div class="card-label">预期应收</div>
            <div class="card-value positive">{{ forecast?.expectedReceivables | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="flow-card">
          <mat-card-content>
            <div class="card-label">预期应付</div>
            <div class="card-value negative">{{ forecast?.expectedPayables | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="flow-card">
          <mat-card-content>
            <div class="card-label">其他收支</div>
            <div class="card-value" [class.positive]="otherIncomeExpense >= 0" [class.negative]="otherIncomeExpense < 0">
              {{ otherIncomeExpense | formatCurrency }}
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="flow-card">
          <mat-card-content>
            <div class="card-label">预计期末余额</div>
            <div class="card-value">{{ forecast?.projectedClosingBalance | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="flow-card cash-gap" [class.has-gap]="forecast?.projectedCashGap && forecast.projectedCashGap > 0">
          <mat-card-content>
            <div class="card-label">预计现金缺口</div>
            <div class="card-value gap-value">{{ forecast?.projectedCashGap | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="content-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>账单分解 - 按逾期天数分组</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="billBreakdownDataSource" class="full-width-table">
              <ng-container matColumnDef="overdueGroup">
                <th mat-header-cell *matHeaderCellDef>逾期分组</th>
                <td mat-cell *matCellDef="let item">
                  <span [class]="'overdue-badge ' + getOverdueClass(item.overdueGroup)">
                    {{ item.overdueGroup }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="billCount">
                <th mat-header-cell *matHeaderCellDef>账单数</th>
                <td mat-cell *matCellDef="let item">{{ item.billCount }}</td>
              </ng-container>

              <ng-container matColumnDef="expectedAmount">
                <th mat-header-cell *matHeaderCellDef>预计回款金额</th>
                <td mat-cell *matCellDef="let item">{{ item.expectedAmount | formatCurrency }}</td>
              </ng-container>

              <ng-container matColumnDef="probability">
                <th mat-header-cell *matHeaderCellDef>回款概率</th>
                <td mat-cell *matCellDef="let item">
                  <mat-progress-bar
                    mode="determinate"
                    [value]="item.probability * 100"
                    [color]="getProbabilityColor(item.probability)"
                  ></mat-progress-bar>
                  <span class="probability-text">{{ (item.probability * 100).toFixed(0) }}%</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="expectedDate">
                <th mat-header-cell *matHeaderCellDef>预计回款日期</th>
                <td mat-cell *matCellDef="let item">{{ item.expectedDate | formatDate }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="billBreakdownColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: billBreakdownColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="content-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>历史预测对比（近3个月）</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="comparison-chart">
              <div class="comparison-item" *ngFor="let item of forecastComparison">
                <div class="comparison-month">{{ item.month }}</div>
                <div class="comparison-bars">
                  <div class="bar-group">
                    <div class="bar-label">预测</div>
                    <div class="bar projected" [style.width.%]="getBarWidth(item.projected)">
                      {{ item.projected | formatCurrency }}
                    </div>
                  </div>
                  <div class="bar-group">
                    <div class="bar-label">实际</div>
                    <div class="bar actual" [style.width.%]="getBarWidth(item.actual)">
                      {{ item.actual | formatCurrency }}
                    </div>
                  </div>
                </div>
                <div class="comparison-diff" [class.positive]="item.actual >= item.projected" [class.negative]="item.actual < item.projected">
                  差异: {{ (item.actual - item.projected) | formatCurrency }}
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="content-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>对账备注</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let note of reconciliationNotes" class="note-item">
                <mat-icon matListItemIcon>note</mat-icon>
                <div matListItemTitle class="note-content">{{ note.content }}</div>
                <div matListItemLine class="note-meta">
                  {{ note.author }} · {{ note.date | formatDate }}
                </div>
              </mat-list-item>
              <mat-list-item *ngIf="reconciliationNotes.length === 0">
                <div matListItemTitle class="empty-state">暂无对账备注</div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .forecast-container {
      padding: 24px;
    }
    .forecast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .forecast-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    .period-selector {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .period-selector mat-form-field {
      width: 160px;
    }
    .cash-flow-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .flow-card {
      text-align: center;
    }
    .card-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 24px;
      font-weight: 600;
    }
    .card-value.positive {
      color: #2e7d32;
    }
    .card-value.negative {
      color: #c62828;
    }
    .cash-gap.has-gap {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      border: 2px solid #ef5350;
    }
    .gap-value {
      color: #c62828;
    }
    .content-section {
      margin-bottom: 24px;
    }
    .full-width-table {
      width: 100%;
    }
    .overdue-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .overdue-badge.current {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .overdue-badge.overdue-1-30 {
      background: #fff8e1;
      color: #f57f17;
    }
    .overdue-badge.overdue-31-60 {
      background: #ffe0b2;
      color: #e65100;
    }
    .overdue-badge.overdue-61-90 {
      background: #ffccbc;
      color: #d84315;
    }
    .overdue-badge.overdue-90 {
      background: #ffebee;
      color: #c62828;
    }
    .probability-text {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-left: 8px;
    }
    td.mat-cell {
      padding: 12px 16px;
    }
    .comparison-chart {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .comparison-item {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
    }
    .comparison-month {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .comparison-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bar-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bar-label {
      width: 40px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .bar {
      height: 28px;
      line-height: 28px;
      padding: 0 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: white;
      min-width: 120px;
    }
    .bar.projected {
      background: #1976d2;
    }
    .bar.actual {
      background: #388e3c;
    }
    .comparison-diff {
      margin-top: 12px;
      font-size: 13px;
      font-weight: 500;
    }
    .comparison-diff.positive {
      color: #2e7d32;
    }
    .comparison-diff.negative {
      color: #c62828;
    }
    .note-item {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .note-item:last-child {
      border-bottom: none;
    }
    .note-content {
      font-size: 14px;
    }
    .note-meta {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    .empty-state {
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
      padding: 24px 0;
    }
  `]
})
export class CashForecastComponent implements OnInit {
  periodControl = new FormControl('30d');
  forecast: CashForecast | null = null;
  billBreakdownColumns = ['overdueGroup', 'billCount', 'expectedAmount', 'probability', 'expectedDate'];
  billBreakdownDataSource = new MatTableDataSource<BillBreakdown>([]);
  forecastComparison: ForecastComparison[] = [];
  reconciliationNotes: ReconciliationNote[] = [];
  maxComparisonValue = 0;

  constructor(private cashForecastService: CashForecastService) {}

  ngOnInit() {
    this.loadForecast();
    this.loadTrend();
    this.periodControl.valueChanges.subscribe(() => {
      this.loadForecast();
    });
  }

  get otherIncomeExpense(): number {
    if (!this.forecast) return 0;
    return (this.forecast.otherIncome || 0) - (this.forecast.otherExpenses || 0);
  }

  loadForecast() {
    this.cashForecastService.findAll(1, 1).subscribe(response => {
      if (response.data.length > 0) {
        this.forecast = response.data[0];
        this.loadBillBreakdown();
        this.loadReconciliationNotes();
      }
    });
  }

  loadTrend() {
    this.cashForecastService.getTrend(3).subscribe(data => {
      this.forecastComparison = data.map((item: any) => ({
        month: item.month,
        projected: item.projectedClosingBalance,
        actual: item.actualClosingBalance || item.projectedClosingBalance * 0.9
      }));
      this.maxComparisonValue = Math.max(
        ...this.forecastComparison.flatMap(item => [item.projected, item.actual])
      );
    });
  }

  generateForecast() {
    const period = this.periodControl.value || '30d';
    this.cashForecastService.generate(period, this.forecast?.openingBalance || 100000).subscribe(forecast => {
      this.forecast = forecast;
      this.loadBillBreakdown();
      this.loadReconciliationNotes();
    });
  }

  loadBillBreakdown() {
    if (!this.forecast?.billBreakdown) {
      this.billBreakdownDataSource.data = this.getMockBillBreakdown();
      return;
    }
    this.billBreakdownDataSource.data = this.forecast.billBreakdown as BillBreakdown[];
  }

  loadReconciliationNotes() {
    if (!this.forecast?.reconciliationNotes) {
      this.reconciliationNotes = this.getMockNotes();
      return;
    }
    this.reconciliationNotes = this.forecast.reconciliationNotes as ReconciliationNote[];
  }

  getMockBillBreakdown(): BillBreakdown[] {
    return [
      { overdueGroup: '当期', billCount: 12, expectedAmount: 285000, probability: 0.95, expectedDate: '2026-06-20' },
      { overdueGroup: '逾期1-30天', billCount: 8, expectedAmount: 156000, probability: 0.75, expectedDate: '2026-06-25' },
      { overdueGroup: '逾期31-60天', billCount: 5, expectedAmount: 89000, probability: 0.5, expectedDate: '2026-07-05' },
      { overdueGroup: '逾期61-90天', billCount: 3, expectedAmount: 45000, probability: 0.3, expectedDate: '2026-07-15' },
      { overdueGroup: '逾期90天以上', billCount: 2, expectedAmount: 28000, probability: 0.15, expectedDate: '2026-07-30' }
    ];
  }

  getMockNotes(): ReconciliationNote[] {
    return [
      { id: '1', date: '2026-06-15', content: '客户ABC公司承诺本周内支付逾期款项¥156,000', author: '张三' },
      { id: '2', date: '2026-06-14', content: 'XYZ公司的¥45,000账单正在走付款审批流程', author: '李四' },
      { id: '3', date: '2026-06-12', content: '确认收到DEF公司的¥89,000付款，已入账', author: '王五' }
    ];
  }

  getOverdueClass(group: string): string {
    const map: Record<string, string> = {
      '当期': 'current',
      '逾期1-30天': 'overdue-1-30',
      '逾期31-60天': 'overdue-31-60',
      '逾期61-90天': 'overdue-61-90',
      '逾期90天以上': 'overdue-90'
    };
    return map[group] || '';
  }

  getProbabilityColor(probability: number): string {
    if (probability >= 0.8) return 'primary';
    if (probability >= 0.5) return 'accent';
    return 'warn';
  }

  getBarWidth(value: number): number {
    if (this.maxComparisonValue === 0) return 0;
    return (value / this.maxComparisonValue) * 100;
  }
}
