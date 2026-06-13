import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReminderService, ReminderTask } from '../../../core/services/reminder.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-reminder-list',
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReminderListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  displayedColumns: string[] = ['select', 'id', 'title', 'patientName', 'type', 'priority', 'status', 'assignedToName', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<ReminderTask>([]);
  selection = new SelectionModel<ReminderTask>(true, []);
  total = 0;
  page = 1;
  pageSize = 10;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  typeOptions = [
    { value: 'appointment', label: '预约提醒' },
    { value: 'followup', label: '随访提醒' },
    { value: 'payment', label: '缴费提醒' },
    { value: 'revisit', label: '复诊提醒' }
  ];

  priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' }
  ];

  statusOptions = [
    { value: 'pending', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      title: [''],
      patientName: [''],
      type: [''],
      priority: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadReminders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReminders(): void {
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

    this.reminderService.getMyReminders(this.page, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.dataSource.data = response.data;
        this.total = response.total;
      });
  }

  onSearch(): void {
    this.page = 1;
    this.selection.clear();
    this.loadReminders();
  }

  onReset(): void {
    this.filterForm.reset();
    this.page = 1;
    this.selection.clear();
    this.loadReminders();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.selection.clear();
    this.loadReminders();
  }

  onEdit(id: number): void {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  onComplete(id: number): void {
    this.reminderService.completeReminder(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('任务已完成', '关闭', { duration: 3000 });
        this.loadReminders();
      });
  }

  onSendReminder(id: number): void {
    this.reminderService.sendReminder(id, 'sms')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open('提醒已发送', '关闭', { duration: 3000 });
        this.loadReminders();
      });
  }

  onBatchSend(): void {
    if (this.selection.selected.length === 0) {
      this.snackBar.open('请先选择要发送的任务', '关闭', { duration: 3000 });
      return;
    }

    const ids = this.selection.selected.map(r => r.id);
    this.reminderService.batchSendReminders(ids, 'sms')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.snackBar.open(`已发送 ${ids.length} 条提醒`, '关闭', { duration: 3000 });
        this.selection.clear();
        this.loadReminders();
      });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  getTypeLabel(type: string): string {
    return this.typeOptions.find(t => t.value === type)?.label || type;
  }

  getPriorityLabel(priority: string): string {
    return this.priorityOptions.find(p => p.value === priority)?.label || priority;
  }
}
