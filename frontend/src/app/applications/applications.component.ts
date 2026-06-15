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
import { ApplicationsService } from '../services/applications.service';
import { Application } from '../models/application.model';

@Component({
  selector: 'app-applications',
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
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class ApplicationsComponent implements OnInit {
  applications: Application[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = true;
  statusFilter = '';
  priorityFilter = '';

  displayedColumns: string[] = ['title', 'applicantName', 'accountType', 'status', 'priority', 'responsiblePerson', 'department', 'createdAt'];

  statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'PENDING', label: '待处理' },
    { value: 'APPROVED', label: '已批准' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'REJECTED', label: '已拒绝' },
  ];

  priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  constructor(
    private applicationsService: ApplicationsService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationsService.getAll({
      status: this.statusFilter || undefined,
      priority: this.priorityFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.applications = res.data;
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
    this.loadApplications();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadApplications();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '待处理',
      APPROVED: '已批准',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      REJECTED: '已拒绝',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };
    return map[priority] || priority;
  }

  getAccountTypeLabel(accountType: string): string {
    const map: Record<string, string> = {
      NEW_ACCOUNT: '新建账号',
      MODIFY_ACCOUNT: '修改账号',
      DISABLE_ACCOUNT: '禁用账号',
      ENABLE_ACCOUNT: '启用账号',
    };
    return map[accountType] || accountType;
  }

  getPriorityClass(priority: string): string {
    return 'priority-' + priority.toLowerCase();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/applications', id]);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ApplicationCreateDialogComponent, {
      width: '560px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.applicationsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('申请创建成功', '关闭', { duration: 3000 });
            this.loadApplications();
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
  selector: 'app-application-create-dialog',
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
    <h2 mat-dialog-title>新建账号申请</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>标题</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>申请人</mat-label>
            <input matInput formControlName="applicantName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>账号类型</mat-label>
            <mat-select formControlName="accountType">
              <mat-option value="NEW_ACCOUNT">新建账号</mat-option>
              <mat-option value="MODIFY_ACCOUNT">修改账号</mat-option>
              <mat-option value="DISABLE_ACCOUNT">禁用账号</mat-option>
              <mat-option value="ENABLE_ACCOUNT">启用账号</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>优先级</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="HIGH">高</mat-option>
              <mat-option value="MEDIUM">中</mat-option>
              <mat-option value="LOW">低</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>负责人</mat-label>
            <input matInput formControlName="responsiblePerson" />
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
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>操作人</mat-label>
            <input matInput formControlName="operatorName" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>申请描述</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>申请原因依据</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
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
export class ApplicationCreateDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApplicationCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      applicantName: ['', Validators.required],
      accountType: ['NEW_ACCOUNT', Validators.required],
      priority: ['MEDIUM', Validators.required],
      responsiblePerson: ['', Validators.required],
      department: [''],
      systemName: [''],
      description: [''],
      reason: [''],
      operatorName: [''],
    });
  }

  confirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
