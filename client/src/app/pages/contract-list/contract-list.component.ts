import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Contract, Project } from '@shared/models';
import { ContractService } from '@shared/services/contract.service';
import { ProjectService } from '@shared/services/project.service';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

interface ContractRow {
  contract: Contract;
  projectName: string;
}

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    StatusLabelPipe,
    CurrencyPipe,
  ],
  template: `
    <div class="contract-list-page">
      <div class="page-header">
        <h1>合同管理</h1>
      </div>

      <mat-card>
        <mat-card-content>
          @if (rows.length > 0) {
            <table mat-table [dataSource]="rows" class="contract-table">
              <ng-container matColumnDef="project">
                <th mat-header-cell *matHeaderCellDef>项目名称</th>
                <td mat-cell *matCellDef="let row">{{ row.projectName }}</td>
              </ng-container>
              <ng-container matColumnDef="budget">
                <th mat-header-cell *matHeaderCellDef>关联预算</th>
                <td mat-cell *matCellDef="let row">版本 V{{ row.contract.budgetId }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>状态</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-chip" [ngClass]="row.contract.status">
                    {{ row.contract.status | statusLabel }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="signedAt">
                <th mat-header-cell *matHeaderCellDef>签署时间</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.contract.signedAt ? (row.contract.signedAt | date:'yyyy-MM-dd HH:mm') : '-' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>创建时间</th>
                <td mat-cell *matCellDef="let row">{{ row.contract.createdAt | date:'yyyy-MM-dd' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/admin/contracts', row.contract.id]" matTooltip="查看详情">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          } @else {
            <div class="empty-state">
              <mat-icon>description</mat-icon>
              <p>暂无合同记录</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .contract-list-page { padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1A365D; }
    .contract-table { width: 100%; }
    .status-chip {
      display: inline-block; padding: 4px 12px; border-radius: 16px;
      font-size: 12px; font-weight: 500;
    }
    .status-chip.draft { background: #EDF2F7; color: #718096; }
    .status-chip.sent { background: #FEFCBF; color: #D69E2E; }
    .status-chip.signed { background: #C6F6D5; color: #38A169; }
    .empty-state {
      text-align: center; padding: 48px; color: #A0AEC0;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { margin-top: 12px; font-size: 16px; }

    @media (max-width: 768px) {
      .contract-list-page { padding: 16px; }
    }
  `],
})
export class ContractListComponent implements OnInit {
  rows: ContractRow[] = [];
  displayedColumns: string[] = ['project', 'status', 'signedAt', 'createdAt', 'actions'];

  constructor(
    private contractService: ContractService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        const rows: ContractRow[] = [];
        let pending = projects.length;
        if (pending === 0) { this.rows = []; return; }
        for (const project of projects) {
          this.contractService.getByProject(project.id).subscribe({
            next: (contract) => {
              if (contract) {
                rows.push({ contract, projectName: project.name });
              }
              pending--;
              if (pending === 0) { this.rows = rows; }
            },
            error: () => { pending--; if (pending === 0) { this.rows = rows; } },
          });
        }
      },
      error: () => { this.snackBar.open('加载合同列表失败', '关闭', { duration: 3000 }); },
    });
  }
}
