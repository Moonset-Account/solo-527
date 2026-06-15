import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FaultsService } from '../services/faults.service';
import { Fault } from '../models/fault.model';

@Component({
  selector: 'app-faults',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './faults.component.html',
  styleUrls: ['./faults.component.scss'],
})
export class FaultsComponent implements OnInit {
  faults: Fault[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = true;
  statusFilter = '';
  severityFilter = '';

  displayedColumns: string[] = ['title', 'reporterName', 'severity', 'status', 'responsiblePerson', 'department', 'systemName', 'createdAt'];

  statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'OPEN', label: '待处理' },
    { value: 'IN_PROGRESS', label: '处理中' },
    { value: 'RESOLVED', label: '已解决' },
    { value: 'CLOSED', label: '已关闭' },
  ];

  severityOptions = [
    { value: '', label: '全部级别' },
    { value: 'CRITICAL', label: '严重' },
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  constructor(
    private faultsService: FaultsService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadFaults();
  }

  loadFaults(): void {
    this.loading = true;
    this.faultsService.getAll({
      status: this.statusFilter || undefined,
      severity: this.severityFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.faults = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadFaults();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadFaults();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: '待处理', IN_PROGRESS: '处理中', RESOLVED: '已解决', CLOSED: '已关闭',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: '严重', HIGH: '高', MEDIUM: '中', LOW: '低',
    };
    return map[severity] || severity;
  }

  getSeverityClass(severity: string): string {
    return 'severity-' + severity.toLowerCase();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/faults', id]);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FaultCreateDialogComponent, {
      width: '560px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.faultsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('故障创建成功', '关闭', { duration: 3000 });
            this.loadFaults();
          },
          error: () => {
            this.snackBar.open('创建失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }
}

@Component({
  selector: 'app-fault-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>新建故障报告</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>标题</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>报告人</mat-label>
            <input matInput formControlName="reporterName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>严重级别</mat-label>
            <mat-select formControlName="severity">
              <mat-option value="CRITICAL">严重</mat-option>
              <mat-option value="HIGH">高</mat-option>
              <mat-option value="MEDIUM">中</mat-option>
              <mat-option value="LOW">低</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>负责人</mat-label>
            <input matInput formControlName="responsiblePerson" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>告警状态</mat-label>
            <mat-select formControlName="alertStatus">
              <mat-option value="ACTIVE">活跃</mat-option>
              <mat-option value="RESOLVED">已解决</mat-option>
              <mat-option value="SUPPRESSED">已抑制</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>部门</mat-label>
            <input matInput formControlName="department" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>系统名称</mat-label>
            <input matInput formControlName="systemName" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>故障描述</mat-label>
          <textarea matInput formControlName="description" rows="4"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="form.invalid">创建</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 0; }
    .form-row { display: flex; gap: 16px; }
    .form-row > mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    mat-dialog-content { padding-top: 8px; }
  `],
})
export class FaultCreateDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FaultCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      reporterName: ['', Validators.required],
      severity: ['MEDIUM', Validators.required],
      responsiblePerson: ['', Validators.required],
      alertStatus: ['ACTIVE', Validators.required],
      department: [''],
      systemName: [''],
      description: [''],
    });
  }

  confirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
