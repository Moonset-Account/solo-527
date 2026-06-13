import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RevisitService, RevisitChurn } from '../../../core/services/revisit.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-revisit-list',
  templateUrl: './revisit-list.component.html',
  styleUrls: ['./revisit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevisitListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  displayedColumns: string[] = ['id', 'patientName', 'patientPhone', 'lastVisitDate', 'daysOverdue', 'churnRiskLevel', 'status', 'assignedToName', 'contactAttempts', 'actions'];
  dataSource = new MatTableDataSource<RevisitChurn>([]);
  total = 0;
  page = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  riskLevelOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'critical', label: '严重' }
  ];

  statusOptions = [
    { value: 'identified', label: '已识别' },
    { value: 'contacted', label: '已联系' },
    { value: 'scheduled', label: '已预约' },
    { value: 'visited', label: '已复诊' },
    { value: 'lost', label: '已流失' }
  ];

  constructor(
    private fb: FormBuilder,
    private revisitService: RevisitService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      patientName: [''],
      churnRiskLevel: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadRevisitChurns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRevisitChurns(): void {
    const filters = this.filterForm.value;
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    if (filters.startDate) {
      filters.startDate = new Date(filters.startDate).toISOString().split('T')[0];
    }
    if (filters.endDate) {
      filters.endDate = new Date(filters.endDate).toISOString().split('T')[0];
    }

    this.revisitService.getMyRevisitChurns(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.total = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadRevisitChurns();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.loadRevisitChurns();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRevisitChurns();
  }

  onEdit(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onRecordContact(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route, queryParams: { action: 'record' } });
  }

  onMarkAsVisited(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '标记已复诊',
        message: '确定要将此患者标记为已复诊吗？',
        confirmText: '确认',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.revisitService.markAsVisited(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.snackBar.open('已标记为已复诊', '关闭', { duration: 3000 });
              this.loadRevisitChurns();
            });
        }
      });
  }

  onMarkAsLost(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '标记已流失',
        message: '确定要将此患者标记为已流失吗？',
        confirmText: '确认',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.revisitService.markAsLost(id, '多次联系未成功')
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.snackBar.open('已标记为已流失', '关闭', { duration: 3000 });
              this.loadRevisitChurns();
            });
        }
      });
  }

  onAnalyze(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '复诊流失分析',
        message: '确定要分析近期的复诊流失情况吗？',
        confirmText: '分析',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.revisitService.analyzeChurn()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.snackBar.open('分析完成', '关闭', { duration: 3000 });
              this.loadRevisitChurns();
            });
        }
      });
  }

  getRiskLevelClass(level: string): string {
    const classMap: Record<string, string> = {
      'low': 'status-completed',
      'medium': 'status-confirmed',
      'high': 'status-pending',
      'critical': 'status-cancelled'
    };
    return classMap[level] || 'status-pending';
  }
}
