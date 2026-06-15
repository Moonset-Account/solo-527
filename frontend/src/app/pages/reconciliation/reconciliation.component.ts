import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReconciliationService } from '../../services/reconciliation.service';
import { Reconciliation } from '../../services/api.config';

@Component({
  selector: 'app-reconciliation',
  template: `
    <div class="reconciliation-container">
      <div class="page-header">
        <h2>对账管理</h2>
        <button mat-raised-button color="primary" (click)="createReconciliation()">
          <mat-icon>add</mat-icon>
          新建对账周期
        </button>
      </div>

      <div class="stats-cards">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>本月对账次数</mat-card-title>
            <mat-icon mat-card-avatar class="stat-icon blue">calendar_month</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ statistics?.monthlyCount || 0 }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>总差异金额</mat-card-title>
            <mat-icon mat-card-avatar class="stat-icon orange">account_balance_wallet</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ statistics?.totalVariance | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>已解决差异</mat-card-title>
            <mat-icon mat-card-avatar class="stat-icon green">check_circle</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ statistics?.reconciledVariance | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>未解决差异</mat-card-title>
            <mat-icon mat-card-avatar class="stat-icon red">error</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ statistics?.unreconciledVariance | formatCurrency }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>对账周期列表</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="reconciliation-table">
              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>对账周期</th>
                <td mat-cell *matCellDef="let element">
                  <div class="period-info">
                    <div class="period-name">{{ element.period }}</div>
                    <div class="period-dates">
                      {{ element.periodStartDate | formatDate }} ~ {{ element.periodEndDate | formatDate }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="systemBillsTotal">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>系统账单总额</th>
                <td mat-cell *matCellDef="let element">{{ element.systemBillsTotal | formatCurrency }}</td>
              </ng-container>

              <ng-container matColumnDef="bankDepositsTotal">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>银行到账总额</th>
                <td mat-cell *matCellDef="let element">{{ element.bankDepositsTotal | formatCurrency }}</td>
              </ng-container>

              <ng-container matColumnDef="totalVariance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>差异总额</th>
                <td mat-cell *matCellDef="let element">
                  <span [class.positive]="element.totalVariance > 0" [class.negative]="element.totalVariance < 0">
                    {{ element.totalVariance | formatCurrency }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="reconciledVariance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>已对账差异</th>
                <td mat-cell *matCellDef="let element">{{ element.reconciledVariance | formatCurrency }}</td>
              </ng-container>

              <ng-container matColumnDef="unreconciledVariance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>未对账差异</th>
                <td mat-cell *matCellDef="let element">
                  <span class="unreconciled">{{ element.unreconciledVariance | formatCurrency }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>状态</th>
                <td mat-cell *matCellDef="let element">
                  <span [class]="element.status | statusBadge">
                    {{ element.status | statusDisplay }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let element">
                  <button mat-button color="primary" (click)="viewDetail(element)">
                    <mat-icon>visibility</mat-icon>
                    查看详情
                  </button>
                  <button 
                    mat-button 
                    color="accent" 
                    *ngIf="element.status === 'draft'"
                    (click)="startReconciliation(element)"
                  >
                    <mat-icon>play_arrow</mat-icon>
                    开始对账
                  </button>
                  <button 
                    mat-button 
                    color="primary" 
                    *ngIf="element.status === 'in_progress'"
                    (click)="confirmComplete(element)"
                  >
                    <mat-icon>check</mat-icon>
                    确认完成
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <mat-paginator 
            [pageSize]="10" 
            [pageSizeOptions]="[10, 20, 50]" 
            showFirstLastButtons
          ></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reconciliation-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      border-radius: 8px;
    }

    .stat-card mat-card-header {
      align-items: center;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .stat-icon.blue {
      background: rgba(25, 118, 210, 0.1);
      color: #1976d2;
    }

    .stat-icon.orange {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .stat-icon.green {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .stat-icon.red {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin-top: 8px;
    }

    .table-card {
      border-radius: 8px;
    }

    .table-container {
      overflow-x: auto;
    }

    .reconciliation-table {
      width: 100%;
      min-width: 1200px;
    }

    .period-info {
      display: flex;
      flex-direction: column;
    }

    .period-name {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .period-dates {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 2px;
    }

    .positive {
      color: #4caf50;
      font-weight: 600;
    }

    .negative {
      color: #f44336;
      font-weight: 600;
    }

    .unreconciled {
      color: #ff9800;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-draft {
      background: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }

    .status-in-progress {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .status-reconciled {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .status-finalized {
      background: rgba(156, 39, 176, 0.1);
      color: #9c27b0;
    }

    ::ng-deep th.mat-header-cell {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
      background: #fafafa;
    }

    ::ng-deep td.mat-cell {
      padding: 12px 16px;
    }

    @media (max-width: 1200px) {
      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .stats-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReconciliationComponent implements OnInit {
  displayedColumns: string[] = [
    'period',
    'systemBillsTotal',
    'bankDepositsTotal',
    'totalVariance',
    'reconciledVariance',
    'unreconciledVariance',
    'status',
    'actions'
  ];

  dataSource = new MatTableDataSource<Reconciliation>([]);
  statistics: any = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private reconciliationService: ReconciliationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadStatistics();
  }

  loadData(): void {
    this.reconciliationService.findAll(1, 50).subscribe(response => {
      this.dataSource.data = response.data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadStatistics(): void {
    this.reconciliationService.getStatistics().subscribe(data => {
      this.statistics = data;
    });
  }

  createReconciliation(): void {
    const period = this.generatePeriod();
    this.reconciliationService.create(period).subscribe(() => {
      this.loadData();
      this.loadStatistics();
    });
  }

  viewDetail(element: Reconciliation): void {
    this.router.navigate(['/reconciliation', element.id]);
  }

  startReconciliation(element: Reconciliation): void {
    this.reconciliationService.updateStatus(element.id, 'in_progress').subscribe(() => {
      this.loadData();
      this.loadStatistics();
    });
  }

  confirmComplete(element: Reconciliation): void {
    this.reconciliationService.updateStatus(element.id, 'reconciled').subscribe(() => {
      this.loadData();
      this.loadStatistics();
    });
  }

  private generatePeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
