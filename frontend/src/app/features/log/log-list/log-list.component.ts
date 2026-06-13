import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LogService, OperationLog, ApiRequestLog, ApiRetryLog } from '../../../core/services/log.service';
import { MatSnackBar } from '@angular/material/snack-bar';

type LogTab = 'operations' | 'requests' | 'retries';

@Component({
  selector: 'app-log-list',
  templateUrl: './log-list.component.html',
  styleUrls: ['./log-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  activeTab: LogTab = 'operations';
  private destroy$ = new Subject<void>();

  operationColumns: string[] = ['id', 'operatorName', 'operationType', 'targetType', 'targetId', 'operationTime', 'ip', 'actions'];
  operationDataSource = new MatTableDataSource<OperationLog>([]);
  operationTotal = 0;

  requestColumns: string[] = ['id', 'requestMethod', 'requestUrl', 'statusCode', 'responseTime', 'requestTime', 'userId', 'status', 'actions'];
  requestDataSource = new MatTableDataSource<ApiRequestLog>([]);
  requestTotal = 0;

  retryColumns: string[] = ['id', 'requestLogId', 'retryCount', 'maxRetries', 'lastRetryTime', 'nextRetryTime', 'status', 'actions'];
  retryDataSource = new MatTableDataSource<ApiRetryLog>([]);
  retryTotal = 0;

  page = 1;
  pageSize = 10;

  @ViewChild('operationPaginator') operationPaginator!: MatPaginator;
  @ViewChild('requestPaginator') requestPaginator!: MatPaginator;
  @ViewChild('retryPaginator') retryPaginator!: MatPaginator;

  operationTypeOptions = [
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'query', label: '查询' },
    { value: 'export', label: '导出' },
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' }
  ];

  statusOptions = [
    { value: 'success', label: '成功' },
    { value: 'failed', label: '失败' }
  ];

  retryStatusOptions = [
    { value: 'pending', label: '待重试' },
    { value: 'retrying', label: '重试中' },
    { value: 'success', label: '成功' },
    { value: 'failed', label: '失败' }
  ];

  constructor(
    private fb: FormBuilder,
    private logService: LogService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      operatorName: [''],
      operationType: [''],
      targetType: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(tab: LogTab): void {
    this.activeTab = tab;
    this.page = 1;
    this.loadLogs();
  }

  loadLogs(): void {
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

    if (this.activeTab === 'operations') {
      this.loadOperationLogs(filters);
    } else if (this.activeTab === 'requests') {
      this.loadRequestLogs(filters);
    } else {
      this.loadRetryLogs(filters);
    }
  }

  loadOperationLogs(filters: any): void {
    this.logService.getOperationLogs(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.operationDataSource.data = response.data;
        this.operationTotal = response.total;
      });
  }

  loadRequestLogs(filters: any): void {
    this.logService.getApiRequestLogs(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.requestDataSource.data = response.data;
        this.requestTotal = response.total;
      });
  }

  loadRetryLogs(filters: any): void {
    this.logService.getApiRetryLogs(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.retryDataSource.data = response.data;
        this.retryTotal = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadLogs();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.loadLogs();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  onViewDetail(type: string, id: number): void {
    this.router.navigate(['../', type, id], { relativeTo: this.route });
  }

  onRetry(id: number): void {
    this.logService.retryApiRequest(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('已触发重试', '关闭', { duration: 3000 });
          this.loadLogs();
        },
        error: () => {}
      });
  }

  onExport(): void {
    const filters = this.filterForm.value;
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const logType = this.activeTab === 'operations' ? 'operation' : this.activeTab === 'requests' ? 'api' : 'retry';

    this.logService.exportLogs(logType, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${logType}_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open('导出成功', '关闭', { duration: 3000 });
      });
  }

  getOperationTypeLabel(type: string): string {
    const option = this.operationTypeOptions.find(o => o.value === type);
    return option ? option.label : type;
  }

  getStatusClass(status: string): string {
    return status === 'success' ? 'status-completed' : 'status-cancelled';
  }
}
