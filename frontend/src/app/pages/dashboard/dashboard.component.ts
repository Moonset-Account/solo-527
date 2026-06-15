import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';

interface SummaryStats {
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  overdueCount: number;
  remainingAmount: number;
  totalBills: number;
  avgOverdueDays: number;
  totalCollections: number;
  pendingCollections: number;
  completedCollections: number;
  promisedPayments: number;
}

interface AgingItem {
  bracket: string;
  count: number;
  amount: number;
  percentage?: string;
}

interface OverdueBill {
  id: string;
  billNumber: string;
  customerName: string;
  remainingAmount: number;
  dueDate: string;
  overdueDays: number;
  status: string;
}

interface CollectionRecord {
  id: string;
  customerName: string;
  billNumber: string;
  severity: string;
  channel: string;
  scheduledDate: string;
  rhythmName: string;
}

interface MonthlyTrendItem {
  period: string;
  systemBillsTotal: number;
  bankDepositsTotal: number;
  totalVariance: number;
  matchedBills: number;
  totalBills: number;
  matchRate: string;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">仪表盘</h1>
          <p class="page-subtitle">应收账款概览与关键指标</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary">
            <mat-icon>refresh</mat-icon>
            刷新数据
          </button>
          <button mat-stroked-button color="primary">
            <mat-icon>picture_as_pdf</mat-icon>
            导出报表
          </button>
        </div>
      </div>

      <div class="stats-row">
        <mat-card class="stat-card receivable-card">
          <div class="stat-icon">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">应收总额</div>
            <div class="stat-value">{{ summary?.totalAmount | formatCurrency }}</div>
            <div class="stat-trend positive">
              <mat-icon>trending_up</mat-icon>
              <span>共 {{ summary?.totalBills }} 笔账单</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card received-card">
          <div class="stat-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已收总额</div>
            <div class="stat-value">{{ summary?.paidAmount | formatCurrency }}</div>
            <div class="stat-trend positive">
              <mat-icon>trending_up</mat-icon>
              <span>已完成 {{ summary?.completedCollections }} 次催收</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card overdue-card">
          <div class="stat-icon">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">逾期总额</div>
            <div class="stat-value">{{ summary?.overdueAmount | formatCurrency }}</div>
            <div class="stat-trend negative">
              <mat-icon>trending_down</mat-icon>
              <span>平均逾期 {{ summary?.avgOverdueDays | number:'1.0' }} 天</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card overdue-count-card">
          <div class="stat-icon">
            <mat-icon>error</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">逾期账单数</div>
            <div class="stat-value">{{ summary?.overdueCount }}</div>
            <div class="stat-trend warning">
              <mat-icon>schedule</mat-icon>
              <span>{{ summary?.pendingCollections }} 笔待催收</span>
            </div>
          </div>
        </mat-card>
      </div>

      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>账龄分析</mat-card-title>
          <mat-card-subtitle>按逾期天数分组统计</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="agingData" class="aging-table">
            <ng-container matColumnDef="bracket">
              <th mat-header-cell *matHeaderCellDef>账龄区间</th>
              <td mat-cell *matCellDef="let element">
                <span class="bracket-label">{{ element.bracket }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="count">
              <th mat-header-cell *matHeaderCellDef>账单数量</th>
              <td mat-cell *matCellDef="let element">{{ element.count }} 笔</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>金额</th>
              <td mat-cell *matCellDef="let element" class="amount-cell">
                {{ element.amount | formatCurrency }}
              </td>
            </ng-container>

            <ng-container matColumnDef="percentage">
              <th mat-header-cell *matHeaderCellDef>占比</th>
              <td mat-cell *matCellDef="let element">
                <div class="progress-bar-container">
                  <div class="progress-bar" [style.width.%]="getPercentage(element.amount)"></div>
                  <span class="progress-label">{{ getPercentage(element.amount) | number:'1.1' }}%</span>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="agingColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: agingColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>月度趋势</mat-card-title>
          <mat-card-subtitle>最近6个月对账情况</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="monthlyTrendData" class="trend-table">
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>月份</th>
              <td mat-cell *matCellDef="let element">{{ element.period }}</td>
            </ng-container>

            <ng-container matColumnDef="systemBillsTotal">
              <th mat-header-cell *matHeaderCellDef>系统账单总额</th>
              <td mat-cell *matCellDef="let element" class="amount-cell">
                {{ element.systemBillsTotal | formatCurrency }}
              </td>
            </ng-container>

            <ng-container matColumnDef="bankDepositsTotal">
              <th mat-header-cell *matHeaderCellDef>银行到账总额</th>
              <td mat-cell *matCellDef="let element" class="amount-cell">
                {{ element.bankDepositsTotal | formatCurrency }}
              </td>
            </ng-container>

            <ng-container matColumnDef="totalVariance">
              <th mat-header-cell *matHeaderCellDef>差异总额</th>
              <td mat-cell *matCellDef="let element" 
                  [class.negative]="element.totalVariance > 0" 
                  [class.positive]="element.totalVariance < 0"
                  class="amount-cell">
                {{ element.totalVariance | formatCurrency }}
              </td>
            </ng-container>

            <ng-container matColumnDef="matchRate">
              <th mat-header-cell *matHeaderCellDef>匹配率</th>
              <td mat-cell *matCellDef="let element">
                <span class="match-rate">{{ element.matchRate }}</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="monthlyColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: monthlyColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <div class="recent-records-row">
        <mat-card class="section-card half-card">
          <mat-card-header>
            <mat-card-title>最近逾期账单</mat-card-title>
            <mat-card-subtitle>逾期时间最长的前5笔</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recentOverdueBills" class="list-table">
              <ng-container matColumnDef="billNumber">
                <th mat-header-cell *matHeaderCellDef>账单编号</th>
                <td mat-cell *matCellDef="let element" class="font-medium">
                  {{ element.billNumber }}
                </td>
              </ng-container>

              <ng-container matColumnDef="customerName">
                <th mat-header-cell *matHeaderCellDef>客户名称</th>
                <td mat-cell *matCellDef="let element">{{ element.customerName }}</td>
              </ng-container>

              <ng-container matColumnDef="remainingAmount">
                <th mat-header-cell *matHeaderCellDef>待收金额</th>
                <td mat-cell *matCellDef="let element" class="amount-cell">
                  {{ element.remainingAmount | formatCurrency }}
                </td>
              </ng-container>

              <ng-container matColumnDef="overdueDays">
                <th mat-header-cell *matHeaderCellDef>逾期天数</th>
                <td mat-cell *matCellDef="let element">
                  <span class="overdue-badge" [ngClass]="getOverdueSeverity(element.overdueDays)">
                    {{ element.overdueDays }} 天
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let element">
                  <span [ngClass]="element.status | statusBadge">
                    {{ element.status | statusDisplay }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="overdueBillColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: overdueBillColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="section-card half-card">
          <mat-card-header>
            <mat-card-title>最近催收记录</mat-card-title>
            <mat-card-subtitle>待处理的催收任务</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recentCollections" class="list-table">
              <ng-container matColumnDef="customerName">
                <th mat-header-cell *matHeaderCellDef>客户名称</th>
                <td mat-cell *matCellDef="let element" class="font-medium">
                  {{ element.customerName }}
                </td>
              </ng-container>

              <ng-container matColumnDef="billNumber">
                <th mat-header-cell *matHeaderCellDef>账单编号</th>
                <td mat-cell *matCellDef="let element">{{ element.billNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="severity">
                <th mat-header-cell *matHeaderCellDef>优先级</th>
                <td mat-cell *matCellDef="let element">
                  <span class="severity-badge" [ngClass]="'severity-' + element.severity">
                    {{ element.severity | statusDisplay }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="channel">
                <th mat-header-cell *matHeaderCellDef>催收渠道</th>
                <td mat-cell *matCellDef="let element">
                  <mat-icon class="channel-icon">{{ getChannelIcon(element.channel) }}</mat-icon>
                  {{ getChannelName(element.channel) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="scheduledDate">
                <th mat-header-cell *matHeaderCellDef>计划日期</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.scheduledDate | formatDate }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="collectionColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: collectionColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .header-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .receivable-card .stat-icon {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .received-card .stat-icon {
      background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
    }

    .overdue-card .stat-icon {
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
    }

    .overdue-count-card .stat-icon {
      background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.54);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.87);
      margin-bottom: 4px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }

    .stat-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .stat-trend.positive {
      color: #388e3c;
    }

    .stat-trend.negative {
      color: #d32f2f;
    }

    .stat-trend.warning {
      color: #f57c00;
    }

    .section-card {
      margin-bottom: 24px;
      border-radius: 12px;
    }

    .section-card mat-card-header {
      padding-bottom: 8px;
    }

    .section-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
    }

    .section-card mat-card-subtitle {
      font-size: 13px;
    }

    .aging-table,
    .trend-table,
    .list-table {
      width: 100%;
    }

    .aging-table th,
    .trend-table th,
    .list-table th {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
      background: rgba(0, 0, 0, 0.02);
    }

    .bracket-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .amount-cell {
      font-weight: 500;
      font-family: 'Roboto Mono', monospace;
    }

    .amount-cell.negative {
      color: #d32f2f;
    }

    .amount-cell.positive {
      color: #388e3c;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .progress-bar {
      height: 8px;
      background: linear-gradient(90deg, #1976d2 0%, #64b5f6 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
      min-width: 4px;
    }

    .progress-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      min-width: 50px;
      text-align: right;
    }

    .match-rate {
      font-weight: 600;
      color: #388e3c;
      font-family: 'Roboto Mono', monospace;
    }

    .recent-records-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .half-card {
      margin-bottom: 0;
    }

    .font-medium {
      font-weight: 500;
    }

    .overdue-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .overdue-badge.level-1 {
      background: #fff3e0;
      color: #e65100;
    }

    .overdue-badge.level-2 {
      background: #ffebee;
      color: #c62828;
    }

    .overdue-badge.level-3 {
      background: #ffcdd2;
      color: #b71c1c;
    }

    .overdue-badge.level-4 {
      background: #d32f2f;
      color: white;
    }

    .severity-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .severity-badge.severity-reminder {
      background: #e3f2fd;
      color: #1565c0;
    }

    .severity-badge.severity-warning {
      background: #fff3e0;
      color: #e65100;
    }

    .severity-badge.severity-urgent {
      background: #ffebee;
      color: #c62828;
    }

    .severity-badge.severity-legal {
      background: #f3e5f5;
      color: #6a1b9a;
    }

    .channel-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 6px;
      vertical-align: middle;
      color: rgba(0, 0, 0, 0.54);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-overdue {
      background: #ffebee;
      color: #c62828;
    }

    .status-pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status-paid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-partial {
      background: #e3f2fd;
      color: #1565c0;
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .recent-records-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .dashboard-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        flex: 1;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: SummaryStats | null = null;
  agingData: AgingItem[] = [];
  monthlyTrendData: MonthlyTrendItem[] = [];
  recentOverdueBills: OverdueBill[] = [];
  recentCollections: CollectionRecord[] = [];

  agingColumns = ['bracket', 'count', 'amount', 'percentage'];
  monthlyColumns = ['period', 'systemBillsTotal', 'bankDepositsTotal', 'totalVariance', 'matchRate'];
  overdueBillColumns = ['billNumber', 'customerName', 'remainingAmount', 'overdueDays', 'status'];
  collectionColumns = ['customerName', 'billNumber', 'severity', 'channel', 'scheduledDate'];

  private totalAgingAmount = 0;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.dashboardService.getOverview().subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.recentOverdueBills = data.recentOverdueBills?.slice(0, 5) || [];
        this.recentCollections = data.pendingCollections?.slice(0, 5) || [];
      },
      error: (error) => {
        console.error('Failed to load overview data:', error);
      }
    });

    this.dashboardService.getAgingReport().subscribe({
      next: (data) => {
        this.agingData = data.filter((item: AgingItem) => 
          item.bracket !== 'Current' && item.amount > 0
        );
        this.totalAgingAmount = this.agingData.reduce((sum, item) => sum + item.amount, 0);
      },
      error: (error) => {
        console.error('Failed to load aging report:', error);
      }
    });

    this.dashboardService.getMonthlyTrend(6).subscribe({
      next: (data) => {
        this.monthlyTrendData = data || [];
      },
      error: (error) => {
        console.error('Failed to load monthly trend:', error);
      }
    });
  }

  getPercentage(amount: number): number {
    if (this.totalAgingAmount === 0) return 0;
    return (amount / this.totalAgingAmount) * 100;
  }

  getOverdueSeverity(days: number): string {
    if (days <= 30) return 'level-1';
    if (days <= 60) return 'level-2';
    if (days <= 90) return 'level-3';
    return 'level-4';
  }

  getChannelIcon(channel: string): string {
    const iconMap: Record<string, string> = {
      'email': 'email',
      'sms': 'sms',
      'phone': 'phone',
      'letter': 'mail',
      'legal': 'gavel'
    };
    return iconMap[channel] || 'notifications';
  }

  getChannelName(channel: string): string {
    const nameMap: Record<string, string> = {
      'email': '邮件',
      'sms': '短信',
      'phone': '电话',
      'letter': '信函',
      'legal': '法务'
    };
    return nameMap[channel] || channel;
  }
}
