import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationsService } from '../../services/applications.service';
import { ChangeWindowsService } from '../../services/change-windows.service';
import { ProcessingRecordsService } from '../../services/processing-records.service';
import { Application } from '../../models/application.model';
import { ChangeWindow } from '../../models/change-window.model';
import { ProcessingRecord } from '../../models/processing-record.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss'],
})
export class ApplicationDetailComponent implements OnInit {
  application: Application | null = null;
  changeWindows: ChangeWindow[] = [];
  processingRecords: ProcessingRecord[] = [];
  loading = true;
  editMode = false;
  form!: FormGroup;

  displayedChangeWindowColumns: string[] = ['startTime', 'endTime', 'status', 'approvedBy', 'description'];
  displayedRecordColumns: string[] = ['action', 'operatorName', 'previousValue', 'newValue', 'details', 'createdAt'];

  statusOptions = [
    { value: 'PENDING', label: '待处理' },
    { value: 'APPROVED', label: '已批准' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'REJECTED', label: '已拒绝' },
  ];

  priorityOptions = [
    { value: 'HIGH', label: '高' },
    { value: 'MEDIUM', label: '中' },
    { value: 'LOW', label: '低' },
  ];

  private id = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private applicationsService: ApplicationsService,
    private changeWindowsService: ChangeWindowsService,
    private processingRecordsService: ProcessingRecordsService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.loadApplication();
    this.loadChangeWindows();
    this.loadProcessingRecords();
  }

  loadApplication(): void {
    this.loading = true;
    this.applicationsService.getById(this.id).subscribe({
      next: (data) => {
        this.application = data;
        this.buildForm(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('加载申请详情失败', '关闭', { duration: 3000 });
      },
    });
  }

  loadChangeWindows(): void {
    this.changeWindowsService.getByEntity('application', this.id).subscribe({
      next: (data) => {
        this.changeWindows = data;
      },
    });
  }

  loadProcessingRecords(): void {
    this.processingRecordsService.getByEntity('application', this.id).subscribe({
      next: (data) => {
        this.processingRecords = data;
      },
    });
  }

  buildForm(app: Application): void {
    this.form = this.fb.group({
      title: [app.title, Validators.required],
      applicantName: [app.applicantName, Validators.required],
      accountType: [app.accountType, Validators.required],
      status: [app.status, Validators.required],
      priority: [app.priority, Validators.required],
      responsiblePerson: [app.responsiblePerson, Validators.required],
      description: [app.description],
      department: [app.department],
      systemName: [app.systemName],
      changeWindowStart: [app.changeWindowStart],
      changeWindowEnd: [app.changeWindowEnd],
      reason: [app.reason],
      operatorName: [app.operatorName],
    });
  }

  toggleEditMode(): void {
    if (this.editMode && this.application) {
      this.buildForm(this.application);
    }
    this.editMode = !this.editMode;
  }

  save(): void {
    if (this.form.invalid) return;
    const oldResponsible = this.application?.responsiblePerson;
    const newResponsible = this.form.value.responsiblePerson;

    if (oldResponsible && newResponsible && oldResponsible !== newResponsible) {
      this.showResponsibleChangeDialog(newResponsible);
      return;
    }

    this.applicationsService.update(this.id, this.form.value).subscribe({
      next: (updated) => {
        this.application = updated;
        this.editMode = false;
        this.snackBar.open('保存成功', '关闭', { duration: 3000 });
        this.loadProcessingRecords();
      },
      error: () => {
        this.snackBar.open('保存失败', '关闭', { duration: 3000 });
      },
    });
  }

  showResponsibleChangeDialog(newResponsible: string): void {
    const dialogRef = this.dialog.open(ResponsibleChangeDialogComponent, {
      width: '400px',
      data: { newResponsible },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.applicationsService.update(this.id, {
          ...this.form.value,
          responsiblePerson: newResponsible,
        }).subscribe({
          next: (updated) => {
            this.application = updated;
            this.editMode = false;
            this.processingRecordsService.create({
              entityType: 'application',
              entityId: this.id,
              action: '变更负责人',
              operator: '',
              operatorName: result.operatorName,
              details: result.reason,
              previousValue: this.application?.responsiblePerson || '',
              newValue: newResponsible,
            }).subscribe();
            this.snackBar.open('保存成功', '关闭', { duration: 3000 });
            this.loadProcessingRecords();
          },
          error: () => {
            this.snackBar.open('保存失败', '关闭', { duration: 3000 });
          },
        });
      }
    });
  }

  addChangeWindow(): void {
    this.changeWindowsService.create({
      entityType: 'application',
      entityId: this.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'PENDING',
      description: '',
    }).subscribe({
      next: () => {
        this.loadChangeWindows();
        this.snackBar.open('变更窗口已添加', '关闭', { duration: 3000 });
      },
    });
  }

  addProcessingRecord(): void {
    this.processingRecordsService.create({
      entityType: 'application',
      entityId: this.id,
      action: '备注',
      operator: '',
      operatorName: this.form.value.operatorName || '',
      details: '',
      previousValue: '',
      newValue: '',
    }).subscribe({
      next: () => {
        this.loadProcessingRecords();
        this.snackBar.open('处理记录已添加', '关闭', { duration: 3000 });
      },
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '待处理', APPROVED: '已批准', IN_PROGRESS: '进行中',
      COMPLETED: '已完成', REJECTED: '已拒绝',
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

  goBack(): void {
    this.router.navigate(['/applications']);
  }
}

@Component({
  selector: 'app-responsible-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>变更负责人</h2>
    <mat-dialog-content>
      <p>新负责人: <strong>{{ data.newResponsible }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>操作人姓名</mat-label>
        <input matInput [formControl]="operatorNameControl" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>变更原因</mat-label>
        <textarea matInput [formControl]="reasonControl" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="operatorNameControl.invalid || reasonControl.invalid">确认变更</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content p { margin-bottom: 16px; }
  `],
})
export class ResponsibleChangeDialogComponent {
  operatorNameControl = new FormControl('', Validators.required);
  reasonControl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { newResponsible: string },
    private dialogRef: MatDialogRef<ResponsibleChangeDialogComponent>,
  ) {}

  confirm(): void {
    if (this.operatorNameControl.valid && this.reasonControl.valid) {
      this.dialogRef.close({
        operatorName: this.operatorNameControl.value,
        reason: this.reasonControl.value,
      });
    }
  }
}
