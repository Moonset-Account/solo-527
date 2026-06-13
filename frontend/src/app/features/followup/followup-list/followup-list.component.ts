import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FollowUpService, FollowUpTask } from '../../../core/services/followup.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-followup-list',
  templateUrl: './followup-list.component.html',
  styleUrls: ['./followup-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FollowupListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  displayedColumns: string[] = ['id', 'patientName', 'treatmentType', 'followUpType', 'followUpDate', 'status', 'assignedToName', 'attempts', 'actions'];
  dataSource = new MatTableDataSource<FollowUpTask>([]);
  total = 0;
  page = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  followUpTypeOptions = [
    { value: 'treatment', label: '治疗后' },
    { value: 'postoperative', label: '术后' },
    { value: 'regular', label: '常规' }
  ];

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'no_answer', label: '无人接听' },
    { value: 'cancelled', label: '已取消' }
  ];

  constructor(
    private fb: FormBuilder,
    private followUpService: FollowUpService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      patientName: [''],
      treatmentType: [''],
      followUpType: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadFollowUps();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFollowUps(): void {
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

    this.followUpService.getMyFollowUps(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.total = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadFollowUps();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.loadFollowUps();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadFollowUps();
  }

  onEdit(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onRecordContact(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route, queryParams: { action: 'record' } });
  }

  onGenerateFollowUps(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '生成随访任务',
        message: '确定要根据近期就诊记录自动生成随访任务吗？',
        confirmText: '生成',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.followUpService.generateFollowUps()
            .pipe(takeUntil(this.destroy$))
            .subscribe(response => {
              this.snackBar.open(`已生成 ${response.count} 条随访任务`, '关闭', { duration: 3000 });
              this.loadFollowUps();
            });
        }
      });
  }

  getFollowUpTypeLabel(type: string): string {
    return this.followUpTypeOptions.find(t => t.value === type)?.label || type;
  }
}
